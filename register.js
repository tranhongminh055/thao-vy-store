// API base URL
const API_BASE_URL = 'https://us-central1-thao-vy-store.cloudfunctions.net';

// Firebase-only registration (no localStorage fallback)
async function registerWithFirebase() {
    let name = document.getElementById("regName").value.trim();
    let email = document.getElementById("regEmail").value.trim();
    let password = document.getElementById("regPassword").value.trim();
    let passwordConfirm = document.getElementById("regPasswordConfirm").value.trim();
    let msg = document.getElementById("msg");

    // Basic validations
    if (name.length < 2) {
        msg.textContent = "Họ tên phải có ít nhất 2 kí tự.";
        return;
    }

    if (email === "") {
        msg.textContent = "Vui lòng nhập email.";
        return;
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
        msg.textContent = "Email không đúng định dạng (ví dụ: user@example.com).";
        return;
    }

    if (password !== passwordConfirm) {
        msg.textContent = "Mật khẩu và xác nhận không khớp.";
        return;
    }

    if (password.length < 6) {
        msg.textContent = "Mật khẩu phải có ít nhất 6 kí tự.";
        return;
    }

    // Show loading
    msg.textContent = "Đang đăng ký...";
    // determine requestAdmin from button
    const adminBtn = document.getElementById('registerAsAdminBtn');
    const requestAdmin = adminBtn && adminBtn.dataset && adminBtn.dataset.active === '1';
    try {
        // If Firebase Auth is available, prefer creating a Firebase Auth user
        if (window.firebase && window.__FIREBASE_INITIALIZED__ && firebase.auth) {
            try {
                const emailLower = email.toLowerCase();
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(emailLower, password);
                // Update profile displayName
                try { await userCredential.user.updateProfile({ displayName: name }); } catch (e) {}

                // Persist user doc with requestAdmin flag
                try {
                    const db = firebase.firestore();
                    await db.collection('users').doc(emailLower).set({
                        name,
                        email: emailLower,
                        role: 'user',
                        requestAdmin: requestAdmin ? true : false,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                } catch (e) {
                    console.warn('Failed to write user doc', e);
                }

                if (requestAdmin) {
                    msg.textContent = "Yêu cầu admin đã được gửi! Quản trị viên sẽ xem xét.";
                } else {
                    msg.textContent = "Đăng ký thành công! Chuyển hướng...";
                }
                setTimeout(() => { window.location.href = 'login.html'; }, 900);
                return;
            } catch (e) {
                console.warn('Firebase Auth register failed', e);
                // fallthrough to try API or localStorage fallback
            }
        }

        // Try API first as before
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email: email.toLowerCase(), password, requestAdmin })
        });
        if (response.ok) {
            const data = await response.json();
            if (data.message === 'User created successfully') {
                msg.textContent = "Đăng ký thành công! Chuyển hướng...";
                setTimeout(() => { window.location.href = 'login.html'; }, 900);
                return;
            }
        }
    } catch (error) {
        console.log('🔄 Firebase registration failed');
        msg.textContent = "Lỗi đăng ký. Vui lòng thử lại.";
        return;
    }
}

function register() {
    registerWithFirebase();
}

// Toggle admin button state (visual) — safe if element missing
try {
    const adminBtn = document.getElementById('registerAsAdminBtn');
    if (adminBtn) {
        adminBtn.dataset.active = '0';
        adminBtn.addEventListener('click', function () {
            const isActive = this.dataset.active === '1';
            this.dataset.active = isActive ? '0' : '1';
            if (this.dataset.active === '1') {
                this.style.background = '#28a745';
                this.style.color = '#fff';
                this.style.borderColor = '#1e7e34';
            } else {
                this.style.background = '#fff';
                this.style.color = '#28a745';
                this.style.borderColor = '#28a745';
            }
        });
    }
} catch (e) { console.warn('Admin toggle init failed', e); }
