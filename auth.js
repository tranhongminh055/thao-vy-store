// API base URL - temporarily using localStorage fallback
const API_BASE_URL = 'https://us-central1-thao-vy-store.cloudfunctions.net';

// Check if user is logged in
function isLoggedIn() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('loggedUser');
    return token && user;
}

// Get current user
function getCurrentUser() {
    try {
        const user = JSON.parse(localStorage.getItem('loggedUser'));
        return user;
    } catch (e) {
        return null;
    }
}

// Utility: redirect non-admins away from admin.html
if (location.pathname && location.pathname.toLowerCase().endsWith('admin.html')) {
    try {
        const u = getCurrentUser();
        if (!u || u.role !== 'admin') {
            alert('Bạn cần quyền admin để truy cập trang này.');
            window.location.href = 'login.html';
        }
    } catch (e) {}
}

// Logout function with fallback
async function logout() {
    console.log('🔴 logout() called');
    
    // Unsubscribe from all Firestore listeners
    if (window.FirestoreSync) {
        try {
            window.FirestoreSync.unsubscribeAll();
        } catch (e) {
            console.warn('Error unsubscribing Firestore listeners:', e);
        }
    }

    const token = localStorage.getItem('authToken');

    if (token) {
        try {
            // Try API logout first
            console.log('📡 Trying API logout...');
            await fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
        } catch (error) {
            console.log('API logout failed, proceeding with localStorage cleanup', error);
        }
    }

    // Clear local storage (always do this)
    console.log('🗑️ Clearing localStorage');
    localStorage.removeItem('authToken');
    localStorage.removeItem('loggedUser');
    localStorage.removeItem('loggedInUser');

    // Redirect to login page
    console.log('↩️ Redirecting to login.html');
    window.location.href = 'login.html';
}

// Refresh user data from API
async function refreshUserData() {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/getUser`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });

        const data = await response.json();

        if (data.user) {
            localStorage.setItem('loggedUser', JSON.stringify(data.user));
            return true;
        } else {
            // Token invalid, logout
            logout();
            return false;
        }
    } catch (error) {
        console.error('Refresh user data error:', error);
        return false;
    }
}

// Auto-login with demo account (for demo purposes)
async function autoLoginDemo() {
    try {
        // Get demo credentials
        const demoResponse = await fetch(`${API_BASE_URL}/getDemoCredentials`);
        const demoData = await demoResponse.json();

        // Login with demo credentials
        const loginResponse = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: demoData.email,
                password: demoData.password
            })
        });

        const loginData = await loginResponse.json();

        if (loginData.message === 'Login successful') {
            localStorage.setItem('loggedUser', JSON.stringify(loginData.user));
            localStorage.setItem('authToken', loginData.token);
            return true;
        }
    } catch (error) {
        console.error('Auto login demo error:', error);
    }
    return false;
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if we need to show login/logout buttons
    const logoutBtn = document.getElementById('logoutBtn');
    const loginBtn = document.getElementById('loginBtn');

    if (isLoggedIn()) {
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (loginBtn) loginBtn.style.display = 'none';
    } else {
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'inline-block';
    }

    // Show user email and admin badge if present
    try {
        const user = getCurrentUser();
        const userEmailEl = document.getElementById('userEmail');
        if (userEmailEl) {
            if (user && user.email) {
                userEmailEl.innerText = user.email + (user.role === 'admin' ? ' (Admin)' : '');
            } else {
                userEmailEl.innerText = 'Đăng nhập';
            }
        }
    } catch (e) {
        console.warn('Unable to set userEmail badge', e);
    }

    // Add logout button listener
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }

    // Header account click: show user popup for logged-in users
    try {
        const accountAnchors = document.querySelectorAll('.header-account a');
        accountAnchors.forEach(a => {
            a.addEventListener('click', function (ev) {
                const user = getCurrentUser();
                // If user is logged in, prevent navigation and show popup
                if (user && user.email) {
                    ev.preventDefault();
                    // Create popup if needed and show
                    showUserPopup(user, a);
                } else {
                    // Not logged in: follow link (go to login/account page)
                    // allow default behavior
                }
            });
        });
    } catch (e) {
        console.warn('Header account popup init failed', e);
    }
});


// --- User popup helpers ---
function createUserPopup() {
    if (document.getElementById('userPopup')) return document.getElementById('userPopup');
    const el = document.createElement('div');
    el.id = 'userPopup';
    el.className = 'user-popup';
    el.style.display = 'none';
    el.innerHTML = `
        <div class="up-row">
            <img class="avatar" src="Logo/màu kem hồng minh họa thức ăn Sticker tròn.png" alt="avatar">
            <div style="flex:1">
                <div class="up-name">ユーザー</div>
                <div class="up-email">email@example.com</div>
                <div class="up-role">Member</div>
            </div>
        </div>
        <div class="up-actions">
            <button class="btn btn-profile">Hồ sơ</button>
            <button class="btn btn-logout">Đăng xuất</button>
        </div>
    `;
    document.body.appendChild(el);

    // Close when clicking profile / logout
    el.querySelector('.btn-profile').addEventListener('click', function() {
        hideUserPopup();
        window.location.href = 'account.html';
    });
    el.querySelector('.btn-logout').addEventListener('click', function() {
        hideUserPopup();
        logout();
    });

    // click outside to close
    setTimeout(()=>{
        document.addEventListener('click', function docClick(e){
            const popup = document.getElementById('userPopup');
            if (!popup) return;
            if (popup.style.display === 'none') return;
            if (!popup.contains(e.target) && !e.target.closest('.header-account')) {
                hideUserPopup();
            }
        });
        // close on ESC
        document.addEventListener('keydown', function(ev){ if(ev.key==='Escape') hideUserPopup(); });
    }, 50);

    return el;
}

function showUserPopup(user, anchorEl) {
    const popup = createUserPopup();
    // populate
    try {
        popup.querySelector('.up-name').innerText = user.name || user.email || 'User';
        popup.querySelector('.up-email').innerText = user.email || '';
        popup.querySelector('.up-role').innerText = (user.role && user.role.toUpperCase()) || 'USER';
        if (user.avatar) {
            const img = popup.querySelector('img.avatar');
            img.src = user.avatar;
        }
    } catch(e){console.warn('Populate user popup failed', e);}

    // Position near header-account anchor if possible
    try {
        const rect = anchorEl.getBoundingClientRect();
        popup.style.display = 'block';
        // Place to the right of the anchor, adjusted for viewport
        const right = window.innerWidth - rect.right + 10;
        popup.style.right = (right>10? right+'px' : '18px');
        popup.style.top = (rect.bottom + 8) + 'px';
    } catch(e){ popup.style.display = 'block'; }
}

function hideUserPopup() {
    const p = document.getElementById('userPopup');
    if (p) p.style.display = 'none';
}

// Helper to check admin status
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}
