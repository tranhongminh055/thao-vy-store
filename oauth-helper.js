// oauth-helper.js - Helper functions for Google

// ============================================================================
// GOOGLE OAUTH HELPER
// ============================================================================

const GoogleOAuth = {
  // CLIENT_ID 
  CLIENT_ID: '10027270244-50mh0qt5pt2pvh93qlvoojk9n82r0096.apps.googleusercontent.com',
  
  /**
   * Initialize Google Sign-In
   * @param {Function} callback - Callback function khi user đăng nhập
   */
  init: function(callback) {
    if (!window.google) {
      console.error('Google SDK chưa được load');
      return;
    }

    // Kiểm tra origin để hỗ trợ debug lỗi "origin_mismatch"
    try {
      const origin = location.origin;
      const commonAllowed = [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:3000',
        'https://thao-vy-store.web.app',
        'https://thao-vy-store.firebaseapp.com'
      ];

      // Nếu origin hiện tại không nằm trong danh sách commonAllowed, hiển thị cảnh báo
      if (!commonAllowed.includes(origin)) {
        const msg = `Google OAuth: Current origin (${origin}) may not be registered in Google Cloud Console. If you see an "origin_mismatch" error, add this exact origin to "Authorized JavaScript origins" for client ID: ${this.CLIENT_ID}`;
        console.warn(msg);

        // Insert small non-blocking banner on the page to help discover the needed origin
        if (typeof document !== 'undefined' && !document.getElementById('google-origin-warning')) {
          const div = document.createElement('div');
          div.id = 'google-origin-warning';
          div.style.position = 'fixed';
          div.style.right = '12px';
          div.style.bottom = '12px';
          div.style.zIndex = '9999';
          div.style.background = '#fff3cd';
          div.style.border = '1px solid #ffeeba';
          div.style.color = '#856404';
          div.style.padding = '10px 12px';
          div.style.borderRadius = '6px';
          div.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
          div.style.fontSize = '13px';
          div.textContent = `Register origin in Google Cloud Console: ${origin}`;

          const btn = document.createElement('button');
          btn.textContent = 'Dismiss';
          btn.style.marginLeft = '8px';
          btn.style.cursor = 'pointer';
          btn.onclick = () => div.remove();
          div.appendChild(btn);
          document.body.appendChild(div);
        }
      }
    } catch (e) {
      console.warn('Origin check failed', e);
    }
// Khởi tạo Google Sign-In với client ID và callback function
    google.accounts.id.initialize({
      client_id: this.CLIENT_ID,
      callback: callback
    });
  },

  /**
   * Parse JWT token để lấy thông tin user
   * @param {string} token - JWT token
   * @returns {Object} Decoded user data
   */
  parseToken: function(token) {
    try {
      // JWT token có cấu trúc 3 phần: header.payload.signature, chúng ta cần phần payload để lấy thông tin user
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      // Nếu có lỗi trong quá trình parse token, log lỗi và trả về null
      console.error('Lỗi parse JWT:', e);
      return null;
    }
  },

  /**
   * Format user data từ Google
   * @param {Object} googleData - Raw data từ Google
   * @returns {Object} Formatted user object
   */
  // Hàm này sẽ chuyển đổi dữ liệu thô từ Google thành một đối tượng user chuẩn mà ứng dụng của chúng ta có thể sử dụng
  formatUserData: function(googleData) {
    return {
      email: googleData.email,
      name: googleData.name,
      picture: googleData.picture,
      provider: 'google',
      providerId: googleData.sub,
      loginTime: new Date().toISOString()
    };
  },

  /**
   * Save user 
   * @param {Object} userData - User data to save
   * @returns {Promise<void>}
   */
  saveUser: async function(userData) {
    try {
      // Ensure role exists (default to 'user')
      userData.role = userData.role || 'user';

      localStorage.setItem('loggedUser', JSON.stringify(userData));
      localStorage.setItem('loggedInUser', JSON.stringify(userData));

      // Lưu vào danh sách user, 
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const existingUserIndex = users.findIndex(u => (u.email || '').toLowerCase() === (userData.email || '').toLowerCase());
      if (existingUserIndex === -1) {
        users.push(userData);
      } else {
        // merge but keep existing role if it was 'admin'
        const existing = users[existingUserIndex];
        users[existingUserIndex] = Object.assign({}, existing, userData);
        if (existing.role === 'admin') users[existingUserIndex].role = 'admin';
      }
      localStorage.setItem('users', JSON.stringify(users));
      
      // Đông bộ lên Firestore nếu client SDK đã được khởi tạo
      if (window.firebase && window.__FIREBASE_INITIALIZED__) {
        try {
          const db = firebase.firestore(); // Sử dụng Firestore để lưu thông tin user, với doc ID là email (hoặc providerId nếu email không có)
          const docId = (userData.email || userData.providerId || ('user_' + Date.now())).toString().toLowerCase(); // đảm bảo docId là string và lowercase để tránh lỗi khi lưu vào Firestore
          const firestoreData = Object.assign({}, userData, { // đảm bảo có trường email trong Firestore để dễ dàng truy vấn, nếu email không có thì dùng providerId hoặc fallback sang user_timestamp
            email: docId,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp() // lưu thời gian đăng nhập cuối cùng để có thể quản lý user tốt hơn trong Firestore
          });
          await db.collection('users').doc(docId).set(firestoreData, { merge: true }); // Sử dụng merge để không ghi đè dữ liệu nếu user đã tồn tại
          console.log('✅ User synced to Firestore:', docId);
        } catch (e) {
          console.warn('❌ Firestore saveUser failed:', e); // Log lỗi nhưng không làm gián đoạn trải nghiệm người dùng nếu có lỗi khi lưu lên Firestore
        }
      } else {
        console.warn('⚠️ Firebase not initialized yet, skipping Firestore sync'); // Nếu Firebase chưa được khởi tạo, log cảnh báo nhưng không làm gián đoạn trải nghiệm người dùng
      }
    } catch (e) {
      console.error('❌ Lỗi save user:', e); // Log lỗi nếu có lỗi trong quá trình lưu user, nhưng không làm gián đoạn trải nghiệm người dùng
    }
  }
};

// ============================================================================
// ZALO OAUTH HELPER
// ============================================================================

const ZaloOAuth = {
  // ⚠️ THAY ĐỔI APP_ID ở đây
  APP_ID: 'YOUR_ZALO_APP_ID', // Thay bằng App ID của bạn
  
  /**
   * Initialize Zalo SDK
   */
  init: function() {
    if (!window.ZaloSDK) {
      console.error('Zalo SDK chưa được load');
      return;
    }

    ZaloSDK.init({
      appId: this.APP_ID
    });
  },

  /**
   * Setup Zalo login event listener
   * @param {Function} callback - Callback function khi login thành công
   */
  onLogin: function(callback) {
    ZaloSDK.Event.listen('auth.login', function(response) {
      if (response.isSuc) {
        ZaloSDK.api('me', 'GET', {access_token: response.accessToken}, function(res) {
          if (res.isSuc) {
            callback({
              success: true,
              data: res.data,
              accessToken: response.accessToken
            });
          } else {
            callback({
              success: false,
              error: res.error || 'Lỗi khi lấy thông tin user'
            });
          }
        });
      } else {
        callback({
          success: false,
          error: response.message || 'Đăng nhập thất bại'
        });
      }
    });
  },

  /**
   * Format user data từ Zalo
   * @param {Object} zaloData - Raw data từ Zalo
   * @param {string} accessToken - Access token
   * @returns {Object} Formatted user object
   */
  formatUserData: function(zaloData, accessToken) {
    return {
      email: zaloData.email || 'user_zalo_' + zaloData.id + '@zalo.me',
      name: zaloData.name,
      picture: zaloData.picture?.data?.url || '',
      provider: 'zalo',
      providerId: zaloData.id,
      accessToken: accessToken,
      loginTime: new Date().toISOString()
    };
  },

  /**
   * Save user to localStorage
   * @param {Object} userData - User data to save
   * @returns {Promise<void>}
   */
  saveUser: async function(userData) {
    try {
      // Ensure role exists (default to 'user')
      userData.role = userData.role || 'user';

      localStorage.setItem('loggedUser', JSON.stringify(userData));
      localStorage.setItem('loggedInUser', JSON.stringify(userData));

      // Lưu vào danh sách user, preserving existing role if present
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const existingUserIndex = users.findIndex(u => (u.email || '').toLowerCase() === (userData.email || '').toLowerCase());
      if (existingUserIndex === -1) {
        users.push(userData);
      } else {
        const existing = users[existingUserIndex];
        users[existingUserIndex] = Object.assign({}, existing, userData);
        if (existing.role === 'admin') users[existingUserIndex].role = 'admin';
      }
      localStorage.setItem('users', JSON.stringify(users));
      
      // Sync to Firestore if client SDK is available
      if (window.firebase && window.__FIREBASE_INITIALIZED__) {
        try {
          const db = firebase.firestore();
          const docId = (userData.email || userData.providerId || ('user_' + Date.now())).toString().toLowerCase();
          const firestoreData = Object.assign({}, userData, { 
            email: docId,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
          });
          await db.collection('users').doc(docId).set(firestoreData, { merge: true });
          console.log('✅ User synced to Firestore:', docId);
        } catch (e) {
          console.warn('❌ Firestore saveUser failed:', e);
        }
      } else {
        console.warn('⚠️ Firebase not initialized yet, skipping Firestore sync');
      }
    } catch (e) {
      console.error('❌ Lỗi save user:', e);
    }
  },

  /**
   * Logout từ Zalo
   */
  logout: function(callback) {
    ZaloSDK.Event.listen('auth.logout', function(response) {
      if (callback) callback(true);
    });
    ZaloSDK.logout();
  }
};

// ============================================================================
// HELPER FUNCTION - Universal Logout
// ============================================================================

function logoutUser() {
  try {
    localStorage.removeItem('loggedUser');
    localStorage.removeItem('loggedInUser');
    
    // Logout từ Google
    if (window.google) {
      google.accounts.id.disableAutoSelect();
    }
    
    // Logout từ Zalo
    if (window.ZaloSDK) {
      ZaloOAuth.logout();
    }
    
    alert('Đã đăng xuất');
    window.location.href = 'index.html';
  } catch (e) {
    console.error('Lỗi logout:', e);
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GoogleOAuth, ZaloOAuth, logoutUser };
}
