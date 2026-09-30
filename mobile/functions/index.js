const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const {defineSecret} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");
const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const crypto = require("crypto");
const qs = require("qs");

// ===== VNPAY CONFIG =====
const VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE || "DDCUKY4X";
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET || "Y8MTP4YUY509ZCAYLWSGL1VW0AU810TV";
const VNPAY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const VNPAY_RETURN_URL = "https://thao-vy-store.web.app/vnpay-return.html";

// Sắp xếp object theo key (đúng chuẩn VNPay chính thức)
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (let i = 0; i < keys.length; i++) {
    sorted[keys[i]] = obj[keys[i]];
  }
  return sorted;
}

// Define secret for Gemini API key (set via: firebase functions:secrets:set GEMINI_API_KEY)
const geminiKey = defineSecret("GEMINI_API_KEY");

// Initialize Firebase Admin
admin.initializeApp();

setGlobalOptions({ maxInstances: 10 });

// Demo user credentials
const DEMO_EMAIL = "demo@thaovystore.com";
const DEMO_PASSWORD = "demo123";
const DEMO_NAME = "Demo User";

// Gemini model config
const DEFAULT_GEMINI_MODEL = process.env.OPENAI_MODEL || "gemini-2.5-flash";
const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

// Initialize demo user if not exists
async function initializeDemoUser() {
  try {
    const userRef = admin.firestore().collection('users').doc(DEMO_EMAIL);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
      await userRef.set({
        email: DEMO_EMAIL,
        password: hashedPassword,
        name: DEMO_NAME, 
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isDemo: true
      });
      logger.info("Demo user created");
    }
  } catch (error) {
    logger.error("Error initializing demo user:", error);
  }
}

// Call initialization
initializeDemoUser();

// Quick Admin Creation endpoint (for emergency setup)
exports.createAdminQuick = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name, secretKey } = req.body;

    // Security: Check secret key
    const ADMIN_SECRET = 'vy2005admin'; // Simple secret for quick setup
    if (secretKey !== ADMIN_SECRET) {
      logger.warn('Unauthorized admin creation attempt:', email);
      return res.status(403).json({ error: 'Invalid secret key' });
    }

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const emailLower = email.toLowerCase().trim();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create or update admin user
    const userRef = admin.firestore().collection('users').doc(emailLower);
    
    await userRef.set({
      email: emailLower,
      password: hashedPassword,
      name: name,
      role: 'admin',
      isAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    logger.info(`Admin account created: ${emailLower}`);

    res.json({
      success: true,
      message: '✅ Tài khoản admin đã được tạo thành công!',
      email: emailLower,
      name: name,
      role: 'admin'
    });

  } catch (error) {
    logger.error('createAdminQuick error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Register endpoint
exports.register = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name, requestAdmin } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user already exists in Firestore
    const userRef = admin.firestore().collection('users').doc(email);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const emailLower = email.toLowerCase();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Firestore
    await userRef.set({
      email: emailLower,
      password: hashedPassword,
      name,
      role: 'user',
      requestAdmin: requestAdmin ? true : false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isDemo: false
    });

    res.status(201).json({
      message: 'User created successfully',
      user: { email: emailLower, name, role: 'user' }
    });

  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
exports.login = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user from Firestore
    const userRef = admin.firestore().collection('users').doc(email);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userDoc.data();

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session token (simple implementation)
    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');

    // Store session in Firestore
    await admin.firestore().collection('sessions').doc(token).set({
      email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)) // 24 hours
    });

    res.json({
      message: 'Login successful',
      user: {
        email: user.email,
        name: user.name,
        role: user.role || 'user',
        requestAdmin: user.requestAdmin || false,
        isDemo: user.isDemo || false
      },
      token
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user info endpoint
exports.getUser = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.substring(7);

    // Verify session
    const sessionRef = admin.firestore().collection('sessions').doc(token);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const session = sessionDoc.data();

    // Check if session expired
    if (session.expiresAt.toDate() < new Date()) {
      await sessionRef.delete();
      return res.status(401).json({ error: 'Session expired' });
    }

    // Get user data
    const userRef = admin.firestore().collection('users').doc(session.email);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userDoc.data();

    res.json({
      user: {
        email: user.email,
        name: user.name,
        isDemo: user.isDemo || false
      }
    });

  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
exports.logout = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Delete session
      await admin.firestore().collection('sessions').doc(token).delete();
    }

    res.json({ message: 'Logout successful' });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get demo credentials endpoint (for testing)
exports.getDemoCredentials = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.json({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    note: 'Đây là tài khoản demo chung cho tất cả người dùng'
  });
});
// AI Support Chat handler - sử dụng Google Gemini API
async function aiSupportHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Đọc Gemini API key từ Secret Manager
    let apiKey;
    try {
      apiKey = geminiKey.value();
      if (apiKey) logger.info('Using Gemini key from Secret Manager');
    } catch (e) {
      logger.warn('Secret Manager not available, trying env vars:', e.message);
    }

    if (!apiKey) {
      apiKey = process.env.GEMINI_API_KEY || undefined;
      if (apiKey) logger.info('Using Gemini key from environment variables');
    }

    if (!apiKey) {
      logger.error('GEMINI_API_KEY chưa được cấu hình');
      return res.status(503).json({ error: 'Chat không khả dụng: GEMINI_API_KEY chưa được cấu hình trên server.' });
    }

    // Chuyển đổi messages sang định dạng Gemini
    // Lấy system prompt nếu có
    const systemMsg = messages.find(m => m.role === 'system');
    const systemInstruction = systemMsg ? systemMsg.content : 'Bạn là Nữ Hoàng Đỏ, trợ lý tư vấn bánh kem thân thiện của Thảo Vy Store. Hãy trả lời bằng tiếng Việt, ngắn gọn và hữu ích.';

    // Lọc ra các tin nhắn user/assistant (bỏ system)
    const chatMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant');

    // Tìm tin nhắn user cuối cùng để gửi
    const lastUserMsg = [...chatMessages].reverse().find(m => m.role === 'user');
    const userText = lastUserMsg?.content || '';

    if (!userText) {
      return res.status(400).json({ error: 'Không có tin nhắn từ người dùng' });
    }

    // Xây dựng history hợp lệ cho Gemini:
    // - Chỉ lấy các tin TRƯỚC tin nhắn user cuối cùng
    // - Gemini yêu cầu history phải bắt đầu bằng 'user', xen kẽ user/model
    const lastUserIdx = chatMessages.lastIndexOf(lastUserMsg);
    const beforeLast = chatMessages.slice(0, lastUserIdx);

    // Bỏ các tin assistant ở đầu (Gemini không chấp nhận history bắt đầu bằng model)
    let startIdx = 0;
    while (startIdx < beforeLast.length && beforeLast[startIdx].role === 'assistant') {
      startIdx++;
    }
    const validHistory = beforeLast.slice(startIdx);

    // Chuyển sang định dạng Gemini, bỏ qua các cặp không hợp lệ
    const history = [];
    for (const m of validHistory) {
      history.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      });
    }

    // Gọi Gemini API với retry khi bị 429 hoặc fallback khi bị 404
    const genAI = new GoogleGenerativeAI(apiKey);
    let model = genAI.getGenerativeModel({
      model: DEFAULT_GEMINI_MODEL,
      systemInstruction: systemInstruction
    });

    let chat = model.startChat({ history });

    let reply = null;
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await chat.sendMessage(userText);
        reply = result.response.text();
        break; // Thành công, thoát vòng lặp
      } catch (err) {
        lastError = err;
        
        // Handle 404 Not Found (Model không tồn tại hoặc tài khoản không hỗ trợ)
        if (err.status === 404 || (err.message && err.message.includes('404'))) {
          logger.warn(`Model ${DEFAULT_GEMINI_MODEL} không khả dụng (404), fallback sang gemini-2.5-pro`);
          model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
          // gemini-2.5-pro HỖ TRỢ systemInstruction nhưng phòng ngừa ta vẫn khởi tạo lại
          chat = model.startChat({ history, systemInstruction: systemInstruction });
          continue; // Thử lại ngay lập tức với mô hình mới
        }

        const is429 = err.status === 429 || (err.message && err.message.includes('429'));
        const is503 = err.status >= 500 || (err.message && (err.message.includes('503') || err.message.includes('500')));
        
        if ((is429 || is503) && attempt < 2) {
          // Trích xuất retryDelay từ error message nếu có (thường là 13s)
          const delayMatch = err.message && err.message.match(/retry[^\d]*(\d+)/i);
          const waitMs = delayMatch ? parseInt(delayMatch[1]) * 1000 : (attempt + 1) * 3000;
          logger.warn(`Gemini API overloaded (${err.status}), waiting ${waitMs}ms before retry ${attempt + 1}...`);
          await new Promise(r => setTimeout(r, waitMs));
        } else {
          throw err; // Lỗi khác hoặc đã hết lần retry
        }
      }
    }

    if (!reply) throw lastError;

    logger.info('Gemini reply OK');
    res.json({ reply });

  } catch (error) {
    logger.error('AI Support error:', error);
    const is429 = error.status === 429 || (error.message && error.message.includes('429'));
    const is503 = error.status >= 500 || (error.message && (error.message.includes('503') || error.message.includes('500')));
    if (is429 || is503) {
      return res.status(503).json({
        error: 'Máy chủ AI của Google đang bị quá tải hoặc phản hồi chậm. Vui lòng thử lại sau vài giây.',
        details: error.message
      });
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

// Export hai tên function để Firebase Hosting rewrite `/api/support` -> `support`
exports.aiSupport = onRequest({ cors: true, secrets: [geminiKey] }, aiSupportHandler);
exports.support = onRequest({ cors: true, secrets: [geminiKey] }, aiSupportHandler);

// Callable function to assign admin custom claim to a user (by email)
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  // Only allow authenticated callers with admin claim
  if (!context.auth || !context.auth.token || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can assign admin role');
  }

  const targetEmail = data && data.email;
  if (!targetEmail) {
    throw new functions.https.HttpsError('invalid-argument', 'email is required');
  }

  try {
    // Get user by email in Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(targetEmail);
    } catch (e) {
      // If user not found in Auth, try to create a new Firebase Auth user with no password
      userRecord = await admin.auth().createUser({ email: targetEmail });
    }

    // Set custom claim
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });

    // Also persist role in Firestore for convenience
    await admin.firestore().collection('users').doc(targetEmail).set({ role: 'admin' }, { merge: true });

    return { success: true, email: targetEmail };
  } catch (error) {
    logger.error('setAdminClaim error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to set admin claim');
  }
});

// Get all orders from all users for admin
exports.getAllOrders = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.substring(7);

    // Verify session and check if user is admin
    const sessionRef = admin.firestore().collection('sessions').doc(token);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const session = sessionDoc.data();

    // Check if session expired
    if (session.expiresAt.toDate() < new Date()) {
      await sessionRef.delete();
      return res.status(401).json({ error: 'Session expired' });
    }

    // Get user and verify admin role
    const userRef = admin.firestore().collection('users').doc(session.email);
    const userDoc = await userRef.get();

    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get all orders from global orders collection
    const ordersSnapshot = await admin.firestore()
      .collection('orders')
      .orderBy('createdAt', 'desc')
      .get();

    const orders = [];
    ordersSnapshot.forEach(doc => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Return orders with stats
    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
      ordersByDate: {}
    };

    // Group orders by date for analysis
    orders.forEach(order => {
      const date = order.orderDate || order.createdAt;
      if (!stats.ordersByDate[date]) {
        stats.ordersByDate[date] = 0;
      }
      stats.ordersByDate[date]++;
    });

    res.json({
      success: true,
      stats,
      orders,
      exportUrl: '/path/to/export' // Can be implemented later
    });

  } catch (error) {
    logger.error('getAllOrders error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Send stock alert email to admins
exports.sendStockAlert = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { productId, productName, quantity, threshold, alertType } = req.body;

    // Validate required fields
    if (!productId || !productName || !alertType) {
      return res.status(400).json({ error: 'productId, productName, and alertType are required' });
    }

    // Get all admin emails from users collection
    const adminSnapshot = await admin.firestore()
      .collection('users')
      .where('role', '==', 'admin')
      .get();

    if (adminSnapshot.empty) {
      logger.warn('No admin users found to send alerts');
      return res.json({ 
        success: false, 
        message: 'No admin users found'
      });
    }

    const adminEmails = [];
    adminSnapshot.forEach(doc => {
      if (doc.data().email) {
        adminEmails.push(doc.data().email);
      }
    });

    // Create alert log in Firestore for tracking
    const alertRef = admin.firestore().collection('stockAlerts');
    await alertRef.add({
      productId,
      productName,
      quantity,
      threshold,
      alertType, // 'outOfStock' or 'lowStock'
      adminEmails,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      sent: true
    });

    logger.info(`Stock alert created for ${productName}:`, {
      quantity,
      threshold,
      alertType,
      adminEmails
    });

    // Email content based on alert type
    let subject = '';
    let emailBody = '';

    if (alertType === 'outOfStock') {
      subject = `🚨 SẢN PHẨM HẾT HÀNG: ${productName}`;
      emailBody = `
        <h2 style="color: #e74c3c;">⚠️ CẢNH BÁO: SẢN PHẨM HẾT HÀNG</h2>
        <p><strong>Sản phẩm:</strong> ${productName}</p>
        <p><strong>Mã sản phẩm:</strong> ${productId}</p>
        <p><strong>Số lượng hiện tại:</strong> ${quantity}</p>
        <p><strong>Ngày thông báo:</strong> ${new Date().toLocaleString('vi-VN')}</p>
        <p style="color: #e74c3c; font-weight: bold;">⚠️ Sản phẩm này đã hết hàng. Vui lòng cập nhật số lượng ngay!</p>
      `;
    } else if (alertType === 'lowStock') {
      subject = `⚠️ SẢN PHẨM SẮP HẾT: ${productName}`;
      emailBody = `
        <h2 style="color: #f39c12;">⚠️ CẢNH BÁO: SẢN PHẨM SẮP HẾT HÀNG</h2>
        <p><strong>Sản phẩm:</strong> ${productName}</p>
        <p><strong>Mã sản phẩm:</strong> ${productId}</p>
        <p><strong>Số lượng hiện tại:</strong> ${quantity}</p>
        <p><strong>Mức cảnh báo:</strong> ${threshold}</p>
        <p><strong>Ngày thông báo:</strong> ${new Date().toLocaleString('vi-VN')}</p>
        <p style="color: #f39c12; font-weight: bold;">⚠️ Số lượng sản phẩm đã dưới mức cảnh báo. Hãy cân nhắc tái kho hàng!</p>
      `;
    }

    // Log the alert (in production, you would integrate with SendGrid, Firebase Email, or similar service)
    logger.info(`Email Alert Log:`, {
      toAddresses: adminEmails,
      subject,
      alertType,
      product: {
        id: productId,
        name: productName,
        quantity,
        threshold
      }
    });

    // Return success response
    res.json({
      success: true,
      message: `Stock alert sent to ${adminEmails.length} admin(s)`,
      adminsNotified: adminEmails,
      alertData: {
        productId,
        productName,
        quantity,
        threshold,
        alertType
      }
    });

  } catch (error) {
    logger.error('sendStockAlert error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send stock alert', 
      details: error.message 
    });
  }
});

// ===== VNPAY PAYMENT ENDPOINTS =====

// Tạo URL thanh toán VNPay (theo chuẩn VNPay chính thức: sortObject + qs.stringify encode:false)
exports.createVNPayUrl = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { amount, orderInfo, orderId, bankCode } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: "amount phải > 0" });

    const date = new Date();
    const pad = n => String(n).padStart(2, "0");
    const vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
    const createDate = `${vietnamTime.getUTCFullYear()}${pad(vietnamTime.getUTCMonth()+1)}${pad(vietnamTime.getUTCDate())}${pad(vietnamTime.getUTCHours())}${pad(vietnamTime.getUTCMinutes())}${pad(vietnamTime.getUTCSeconds())}`;
    const txnRef = orderId || `TVS${Date.now()}`;

    // Lấy IP client
    let ipAddr = req.headers["x-forwarded-for"] || req.ip || "127.0.0.1";
    if (ipAddr.includes(",")) ipAddr = ipAddr.split(",")[0].trim();
    if (ipAddr.includes("::ffff:")) ipAddr = ipAddr.replace("::ffff:", "");

    // Tự động xác định ReturnUrl
    let returnUrl = VNPAY_RETURN_URL;
    if (req.headers.referer) {
      try {
        const refUrl = new URL(req.headers.referer);
        returnUrl = `${refUrl.origin}/vnpay-return.html`;
      } catch (e) {
        logger.warn("Không thể parse referer header:", e.message);
      }
    } else if (req.headers.origin) {
      returnUrl = `${req.headers.origin}/vnpay-return.html`;
    }

    // Xây dựng params theo chuẩn VNPay
    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = VNPAY_TMN_CODE;
    vnp_Params["vnp_Locale"] = "vn";
    vnp_Params["vnp_CurrCode"] = "VND";
    vnp_Params["vnp_TxnRef"] = txnRef;
    vnp_Params["vnp_OrderInfo"] = orderInfo || `Thanh toan don hang ${txnRef}`;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = String(Math.round(amount) * 100);
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;
    if (bankCode) vnp_Params["vnp_BankCode"] = bankCode;

    // Sắp xếp params theo key
    const sortedParams = sortObject(vnp_Params);
    
    // Tạo chuỗi signData theo chuẩn VNPAY: key=value&key=value
    // Khoảng trắng trong value nên được thay bằng +
    const signData = Object.keys(sortedParams)
      .sort()
      .map(key => `${key}=${sortedParams[key].replace(/ /g, '+')}`)
      .join('&');
    
    // Tạo hash bằng HMAC SHA512
    const hmac = crypto.createHmac("sha512", VNPAY_HASH_SECRET);
    const secureHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    vnp_Params["vnp_SecureHash"] = secureHash;
    
    // Tạo payment URL với encode cho URL params
    const paymentUrl = VNPAY_URL + "?" + qs.stringify(vnp_Params, { encode: true });

    logger.info("VNPAY Debug Info:", {
      TMN_CODE_USED: VNPAY_TMN_CODE,
      signData,
      secureHash,
    });

    // Lưu đơn hàng pending
    try {
      await admin.firestore().collection("pendingPayments").doc(txnRef).set({
        txnRef, amount: Math.round(amount),
        orderInfo: orderInfo || `Thanh toan don hang ${txnRef}`,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) { logger.warn("pendingPayment save failed:", e.message); }

    logger.info(`VNPay URL created: ${txnRef}, amount: ${amount}`);
    return res.json({ success: true, paymentUrl, txnRef });
  } catch (error) {
    logger.error("createVNPayUrl error:", error);
    return res.status(500).json({ error: "Lỗi tạo link thanh toán", details: error.message });
  }
});

// Xác minh kết quả trả về từ VNPay
exports.verifyVNPayReturn = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST")  return res.status(405).json({ error: "Method not allowed" });
  try {
    const vnpParams = req.body.vnp_Params || {};
    const secureHash = vnpParams["vnp_SecureHash"];

    // Xóa hash fields trước khi tính toán lại
    let paramsToVerify = { ...vnpParams };
    delete paramsToVerify["vnp_SecureHash"];
    delete paramsToVerify["vnp_SecureHashType"];

    // Sắp xếp params theo key
    const sortedParams = sortObject(paramsToVerify);
    
    // Tạo chuỗi signData theo chuẩn VNPAY: key=value&key=value
    // Khoảng trắng trong value nên được thay bằng +
    const signData = Object.keys(sortedParams)
      .sort()
      .map(key => `${key}=${sortedParams[key].replace(/ /g, '+')}`)
      .join('&');
    
    // Tạo hash bằng HMAC SHA512
    const hmac = crypto.createHmac("sha512", VNPAY_HASH_SECRET);
    const checkHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (checkHash !== secureHash) {
      return res.json({ success: false, message: "Chữ ký không hợp lệ" });
    }

    const responseCode = vnpParams["vnp_ResponseCode"];
    const txnRef = vnpParams["vnp_TxnRef"];
    const amount = parseInt(vnpParams["vnp_Amount"] || "0") / 100;
    const transactionNo = vnpParams["vnp_TransactionNo"];
    const bankCode = vnpParams["vnp_BankCode"];
    const success = responseCode === "00";

    try {
      await admin.firestore().collection("pendingPayments").doc(txnRef).update({
        status: success ? "paid" : "failed",
        responseCode, transactionNo, bankCode,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) { logger.warn("pendingPayment update failed:", e.message); }

    return res.json({
      success, responseCode, txnRef, amount, transactionNo, bankCode,
      message: success ? "Thanh toán thành công" : `Thanh toán thất bại (mã: ${responseCode})`,
    });
  } catch (error) {
    logger.error("verifyVNPayReturn error:", error);
    return res.status(500).json({ error: "Lỗi xác minh", details: error.message });
  }
});