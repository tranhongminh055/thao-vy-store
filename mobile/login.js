// API base URL
const API_BASE_URL = 'https://us-central1-thao-vy-store.cloudfunctions.net';

// Migrate orders from localStorage to Firestore (run after successful login)
async function migrateOrdersToFirestore(userEmail) {
    if (!userEmail || !window.firebase || !window.__FIREBASE_INITIALIZED__) return;
    try {
        const db = firebase.firestore();
        const emailLower = userEmail.toString().toLowerCase();
        const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');

        // Filter orders for this user
        const userOrders = localOrders.filter(o =>
            o.userEmail && o.userEmail.toString().toLowerCase() === emailLower
        );

        if (userOrders.length === 0) return;

        console.log('Migrating ' + userOrders.length + ' orders to Firestore for user: ' + emailLower);

        // Check which orders already exist in Firestore
        for (const order of userOrders) {
            if (!order.orderId) continue;
            const docRef = db.collection('orders').doc(order.orderId);
            const docSnap = await docRef.get();

            // Only sync if not already in Firestore
            if (!docSnap.exists) {
                try {
                    // Write order to Firestore
                    await docRef.set(Object.assign({}, order, {
                        createdAt: order.confirmedAt || order.orderDate || firebase.firestore.FieldValue.serverTimestamp(),
                        userEmail: emailLower
                    }));

                    // Also add reference under users/{email}/orders
                    await db.collection('users').doc(emailLower).collection('orders').doc(order.orderId).set({
                        orderId: order.orderId,
                        status: order.status || 'confirmed',
                        total: order.total || 0,
                        createdAt: order.confirmedAt || order.orderDate || firebase.firestore.FieldValue.serverTimestamp()
                    });

                    console.log('Migrated order: ' + order.orderId);
                } catch (e) {
                    console.warn('Failed to migrate order ' + order.orderId + ':', e);
                }
            }
        }
    } catch (e) {
        console.warn('Order migration error:', e);
    }
}

// Firebase-only login (no localStorage fallback)
async function loginWithFirebase() {
    let email = document.getElementById("loginEmail").value.trim();
    let password = document.getElementById("loginPassword").value.trim();
    let msg = document.getElementById("msg");

    if (email === "" || password === "") {
        msg.textContent = "Vui lòng nhập đầy đủ!";
        return;
    }

    // Check if admin login mode is active
    const adminBtn = document.getElementById('loginAsAdminBtn');
    const adminModeRequired = adminBtn && adminBtn.dataset && adminBtn.dataset.active === '1';

    // Show loading
    msg.textContent = "Đang đăng nhập...";
    try {
        // lưu thông tin đăng nhập tạm thời để sử dụng trong quá trình đăng nhập
        if (window.firebase && window.__FIREBASE_INITIALIZED__ && firebase.auth) {
            try {
                const emailLower = (email || '').toString().toLowerCase();
                const cred = await firebase.auth().signInWithEmailAndPassword(emailLower, password);
                // cơ sở dữ liệu sẽ đọc role và các thông tin khác từ Firestore để đảm bảo tính nhất quán, không phụ thuộc vào token JWT
                try {
                    const db = firebase.firestore();
                    const doc = await db.collection('users').doc(emailLower).get();
                    const userDoc = doc.exists ? (doc.data() || {}) : {};
                    const userObj = { email: emailLower, name: userDoc.name || cred.user.displayName || '', role: userDoc.role || 'user', requestAdmin: userDoc.requestAdmin || false };
                    
                    // Check với admin mode nếu cần thiết
                    if (adminModeRequired && userObj.role !== 'admin') {
                        msg.textContent = 'Bạn không phải quản trị viên. Chỉ có quản trị viên mới được đăng nhập ở chế độ này.';
                        return;
                    }

                    // các id thông tin trong userdoc profile
                    if (userDoc.fullName) userObj.fullName = userDoc.fullName;
                    if (userDoc.gender) userObj.gender = userDoc.gender;
                    if (userDoc.birthday) userObj.birthday = userDoc.birthday;
                    if (userDoc.bankName) userObj.bankName = userDoc.bankName;
                    if (userDoc.bankNumber) userObj.bankNumber = userDoc.bankNumber;
                    if (userDoc.address) userObj.address = userDoc.address;
                    if (userDoc.avatar) userObj.avatar = userDoc.avatar;
                    localStorage.setItem('loggedUser', JSON.stringify(userObj));
                    // Update lastLogin
                    try { await db.collection('users').doc(emailLower).set({ lastLogin: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }); } catch(e){}

                    // (Removed background demote to avoid kicking out admins automatically)

                    // Migrate orders from localStorage to Firestore (for backward compatibility)
                    await migrateOrdersToFirestore(emailLower);

                    // Initialize Firestore sync before redirect
                    if (window.FirestoreSync) {
                        await window.FirestoreSync.initialize(emailLower);
                    }

                    // Redirect based on role
                    if (userObj.role === 'admin') {
                        try { sessionStorage.setItem('seenLogin','1'); } catch(e){}
                        window.location.href = 'admin.html';
                        return;
                    }
                    try { sessionStorage.setItem('seenLogin','1'); } catch(e){}
                    window.location.href = 'index.html';
                    return;
                } catch (e) {
                    console.warn('Failed to read user profile from Firestore', e);
                    // proceed to fallback or API
                }
            } catch (e) {
                console.warn('Firebase Auth signIn failed', e);
                // try API fallback next
            }
        }

        // Try API next (existing Cloud Function login)
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.message === 'Login successful') {
                localStorage.setItem("loggedUser", JSON.stringify(data.user));
                localStorage.setItem("authToken", data.token);
                // Initialize Firestore sync
                if (data.user && data.user.email && window.FirestoreSync) {
                    await window.FirestoreSync.initialize(data.user.email);
                }
                // Đồng bộ voucher với Firestore
                if (data.user.email && window.VoucherStore && window.VoucherStore.syncWithFirestore) {
                    window.VoucherStore.syncWithFirestore(data.user.email);
                }
                try { sessionStorage.setItem('seenLogin','1'); } catch(e){}
                window.location.href = "index.html";
                return;
            }
        }
    } catch (error) {
        console.log('🔄 API not available, using localStorage fallback');
    }

    msg.textContent = "Sai tài khoản, mật khẩu hoặc tài khoản này được đăng ký qua Google/Zalo.";
}

function login() {
    loginWithFirebase();
}

// Toggle admin login button state — safe if element missing
try {
    const adminBtn = document.getElementById('loginAsAdminBtn');
    if (adminBtn) {
        adminBtn.dataset.active = '0';
        adminBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const isActive = this.dataset.active === '1';
            this.dataset.active = isActive ? '0' : '1';
            if (this.dataset.active === '1') {
                this.style.background = '#007bff';
                this.style.color = '#fff';
                this.style.borderColor = '#005fc4';
            } else {
                this.style.background = '#fff';
                this.style.color = '#007bff';
                this.style.borderColor = '#007bff';
            }
        });
    }
} catch (e) { console.warn('Admin login toggle init failed', e); }
