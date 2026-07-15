document.addEventListener("DOMContentLoaded", () => {
    // load user from localStorage
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('loggedUser')) || JSON.parse(localStorage.getItem('loggedInUser'));
    } catch (e) { user = null; } // neu ko co tt da dang nhap se thieets lap null



    // Nếu chưa login thì đưa về trang đăng nhập
    if (!user) {
        alert('Bạn cần đăng nhập!'); // thong bao neu user chua dang nhap
        location.href = 'login.html'; // neu chua dang nhap se chuyen user den location login.html
        return;
    }

    // Đồng bộ voucher với Firestore
    if (user.email && window.VoucherStore && window.VoucherStore.syncWithFirestore) { // truy cap vao csdl de xem user do da co voucher nhan 
        window.VoucherStore.syncWithFirestore(user.email); // mac dinh dong bo voucher khi user da ap ma chua 
    }

    // helper to persist to both keys used in project
    function persistUser(u) {
        localStorage.setItem('loggedUser', JSON.stringify(u));
        localStorage.setItem('loggedInUser', JSON.stringify(u));
        // Also update the central `users` array if the user exists there, so changes persist after re-login
        try {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            if (u && u.email) {
                const targetEmail = u.email.toString().trim().toLowerCase();
                const idx = users.findIndex(x => (x.email || '').toString().trim().toLowerCase() === targetEmail);
                if (idx >= 0) {
                    users[idx] = Object.assign({}, users[idx], u);
                } else {
                    // if not found, add to users
                    users.push(u);
                }
                localStorage.setItem('users', JSON.stringify(users));
            }
        } catch (e) {
            // ignore
        }
        // Sync profile to Firestore
        syncProfileToFirestore(u);
    }

    // Sync profile data to Firestore (for multi-device access)

    // cac truong luu thong tin bao gom (neu user nhap full name se luu lai tren csdl )
    function syncProfileToFirestore(u) {
        if (!u || !u.email) return;
        try {
            if (window.firebase && window.__FIREBASE_INITIALIZED__) {
                const db = firebase.firestore();
                const emailLower = (u.email || '').toString().toLowerCase();
                const profileData = {
                    fullName: u.fullName || u.name || '',
                    name: u.name || '',
                    gender: u.gender || '',
                    birthday: u.birthday || '',
                    bankName: u.bankName || '',
                    bankNumber: u.bankNumber || '',
                    address: u.address || {},
                    avatar: u.avatar || '',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp() // cap nhat neu nguoi dung thay doi avatar moi
                };
                // Write to Firestore under users/{email}/profile
                db.collection('users').doc(emailLower).set(profileData, { merge: true }).catch(e => { // khi nguoi dung nhap het tt tin vao bam luu thi taon bo tt se duoc dua len csdl va nam trong truong user
                    console.warn('Failed to sync profile to Firestore:', e); // neu nhu dong bo that bai luu that bai se dua ra warning trong tab console chuot phai chon kiem tr chon console de xem log loi
                });
            }
        } catch (e) {
            console.warn('Firestore sync error:', e);
        }
    }

    // Đồng bộ dữ liệu từ LocalStorage lên trang (sau khi bam luu lva load lai trang thi tt se tu firestore csdl duoc dong bo len va hien thi len trang )
    document.getElementById('fullName').value = user.fullName || user.name || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('gender').value = user.gender || 'Nam';
    document.getElementById('birthday').value = user.birthday || '';
    document.getElementById('displayName').innerText = user.fullName || user.name || 'User'; 

    // Bank
    const bankNameEl = document.getElementById('bankName');
    if (user.bankNumber) document.getElementById('bankNumber').value = user.bankNumber;

    // Populate Vietnamese banks list
    const vnBanks = [
        'Vietcombank', 'VietinBank', 'BIDV', 'Techcombank', 'VPBank', 'MB Bank', 'ACB', 'Sacombank',
        'HSBC VN', 'TPBank', 'VIB', 'SCB', 'Eximbank', 'HDBank', 'SHB', 'SeABank', 'OCB', 'MSB',
        'PVcomBank', 'Bac A Bank', 'LienVietPostBank', 'Agribank', 'OceanBank', 'ABBANK'
    ];

    if (bankNameEl) {
        // fill options
        vnBanks.forEach(b => {
            const opt = document.createElement('option'); opt.value = b; opt.textContent = b; bankNameEl.appendChild(opt);
        });
        // set current value if exists
        if (user.bankName) bankNameEl.value = user.bankName;
    }

    // Avatar
    if (user.avatar) document.getElementById('avatarPreview').src = user.avatar;

    // Address structure: will be loaded from vn-address.json (province -> district -> ward)
    const cityEl = document.getElementById('city');
    const districtEl = document.getElementById('district');
    const wardEl = document.getElementById('ward');
    const detailEl = document.getElementById('addressDetail');

    let citiesData = null;

    function populateCitiesFromData() {
        cityEl.innerHTML = '<option value="">Chọn tỉnh/thành</option>';
        Object.keys(citiesData).forEach(c => {
            const opt = document.createElement('option'); opt.value = c; opt.textContent = c; cityEl.appendChild(opt);
        });
    }

    function populateDistrictsFromData(city) {
        districtEl.innerHTML = '<option value="">Chọn quận/huyện</option>';
        wardEl.innerHTML = '<option value="">Chọn phường/xã</option>';
        if (!city || !citiesData || !citiesData[city]) return;
        Object.keys(citiesData[city]).forEach(d => {
            const opt = document.createElement('option'); opt.value = d; opt.textContent = d; districtEl.appendChild(opt);
        });
    }

    function populateWardsFromData(city, district) {
        wardEl.innerHTML = '<option value="">Chọn phường/xã</option>';
        if (!city || !district || !citiesData || !citiesData[city] || !citiesData[city][district]) return;
        citiesData[city][district].forEach(w => {
            const opt = document.createElement('option'); opt.value = w; opt.textContent = w; wardEl.appendChild(opt);
        });
    }

    // Try to load vn-address.json; fallback to a minimal built-in set if fetch fails
    fetch('vn-address.json').then(r => {
        if (!r.ok) throw new Error('Network');
        return r.json();
    }).then(json => {
        citiesData = json;
        populateCitiesFromData();

        // If user already has address, preselect
        if (user.address && typeof user.address === 'object') {
            if (user.address.city) cityEl.value = user.address.city;
            populateDistrictsFromData(user.address.city);
            if (user.address.district) districtEl.value = user.address.district;
            populateWardsFromData(user.address.city, user.address.district);
            if (user.address.ward) wardEl.value = user.address.ward;
            if (user.address.detail) detailEl.value = user.address.detail;
        }
    }).catch(() => {
        // fallback minimal data
        citiesData = {
            'Đà Nẵng': { 'Hải Châu': ['Thuận Phước','Thạch Thang'], 'Sơn Trà': ['An Hải Bắc','An Hải Đông'] },
            'Hà Nội': { 'Ba Đình': ['Phúc Xá','Trúc Bạch'], 'Hoàn Kiếm': ['Hàng Trống'] },
            'Hồ Chí Minh': { 'Quận 1': ['Bến Nghé','Bến Thành'] }
        };
        populateCitiesFromData();
        // preselect fallback if user.address exists
        if (user.address && typeof user.address === 'object') {
            if (user.address.city) cityEl.value = user.address.city;
            populateDistrictsFromData(user.address.city);
            if (user.address.district) districtEl.value = user.address.district;
            populateWardsFromData(user.address.city, user.address.district);
            if (user.address.ward) wardEl.value = user.address.ward;
            if (user.address.detail) detailEl.value = user.address.detail;
        }
    });

    cityEl.addEventListener('change', () => {
        populateDistrictsFromData(cityEl.value);
    });

    districtEl.addEventListener('change', () => {
        populateWardsFromData(cityEl.value, districtEl.value);
    });

    // --- Auto-save listeners (debounced) ---
    function debounce(fn, wait = 400) {
        let t;
        return function (...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    const saveProfileDebounced = debounce(() => {
        user.fullName = document.getElementById('fullName').value.trim();
        user.gender = document.getElementById('gender').value;
        user.birthday = document.getElementById('birthday').value;
        persistUser(user);
        document.getElementById('displayName').innerText = user.fullName || user.name || 'User';
    }, 500);

    document.getElementById('fullName').addEventListener('input', saveProfileDebounced);
    document.getElementById('gender').addEventListener('change', saveProfileDebounced);
    document.getElementById('birthday').addEventListener('change', saveProfileDebounced);

    // Bank auto-save
    const saveBankDebounced = debounce(() => {
        user.bankName = (bankNameEl && bankNameEl.value) ? bankNameEl.value.trim() : '';
        user.bankNumber = document.getElementById('bankNumber').value.trim();
        persistUser(user);
    }, 500);
    if (bankNameEl) bankNameEl.addEventListener('change', saveBankDebounced);
    document.getElementById('bankNumber').addEventListener('input', saveBankDebounced);
    document.getElementById('bankNumber').addEventListener('input', saveBankDebounced);

    // Address selects auto-save
    cityEl.addEventListener('change', () => {
        populateDistrictsFromData(cityEl.value);
        user.address = user.address || {};
        user.address.city = cityEl.value || '';
        // reset dependent fields
        user.address.district = '';
        user.address.ward = '';
        persistUser(user);
    });

    districtEl.addEventListener('change', () => {
        populateWardsFromData(cityEl.value, districtEl.value);
        user.address = user.address || {};
        user.address.district = districtEl.value || '';
        user.address.ward = '';
        persistUser(user);
    });

    wardEl.addEventListener('change', () => {
        user.address = user.address || {};
        user.address.ward = wardEl.value || '';
        persistUser(user);
    });

    detailEl.addEventListener('input', debounce(() => {
        user.address = user.address || {};
        user.address.detail = detailEl.value.trim() || '';
        persistUser(user);
    }, 500));

    // Chuyển tab khi bam vao menu ben trai de hien thi noi dung tuong ung voi tab do va an noi dung cac tab con lai
    document.querySelectorAll('.account-menu li').forEach(li => {
        li.addEventListener('click', () => {
            document.querySelectorAll('.account-menu li').forEach(i => i.classList.remove('active'));
            li.classList.add('active');

            document.querySelectorAll('.content-box').forEach(box => box.classList.add('hidden'));
            document.getElementById(li.dataset.section).classList.remove('hidden');
        });
    });

    // Lưu hồ sơ (doc nhung thong tin ma user da nhap vao va luu lai len csdl)
    document.getElementById('saveProfile').onclick = () => { // khi bam luu thi thong tin se duoc cap nhat lai tren csdl va dong bo len trang
        user.fullName = document.getElementById('fullName').value;
        user.gender = document.getElementById('gender').value;
        user.birthday = document.getElementById('birthday').value;
        persistUser(user);
        document.getElementById('displayName').innerText = user.fullName; // ten bi thay doi se duoc cap nhat lai tren trang
        alert('Đã lưu hồ sơ!');// thong bao da luu ho so 
        // send notification about profile update
        if (typeof notifyProfileUpdated === 'function') {
            notifyProfileUpdated(user.email);
            if (window.notificationsList && Array.isArray(notificationsList)) {
                const now = new Date();
                const tmp = { id: 'temp-' + Date.now(), recipientEmail: user.email, title: '📝 Hồ sơ đã được cập nhật', message: 'Bạn vừa cập nhật thông tin tài khoản của mình.', type: 'system', isRead: false, createdAt: now, updatedAt: now };
                notificationsList.unshift(tmp);
                saveNotificationsLocal(); updateUnreadCount(); updateNotificationBadge(); renderNotifications();
            }
        }
    };
    // Lưu thông tin ngân hàng
    document.getElementById('saveBank').onclick = () => {
        user.bankName = document.getElementById('bankName').value.trim(); // bankname = ten tk ngan hang
        user.bankNumber = document.getElementById('bankNumber').value.trim(); // banknumber = so tk ngan hang
        persistUser(user); // get du lieu nguoi dung da nhap
        alert('Đã lưu ngân hàng!'); // thong bao da luu thong tin ngan hang
        if (typeof notifyProfileUpdated === 'function') {
            notifyProfileUpdated(user.email);
            if (window.notificationsList && Array.isArray(notificationsList)) {
                const now = new Date();
                const tmp = { id: 'temp-' + Date.now(), recipientEmail: user.email, title: '📝 Hồ sơ đã được cập nhật', message: 'Bạn vừa cập nhật thông tin tài khoản của mình.', type: 'system', isRead: false, createdAt: now, updatedAt: now };
                notificationsList.unshift(tmp);
                saveNotificationsLocal(); updateUnreadCount(); updateNotificationBadge(); renderNotifications();
            }
        }
    };

    // Lưu địa chỉ
    document.getElementById('saveAddress').onclick = () => {
        user.address = {
            city: cityEl.value || '', // city = tinh thanh no se lay gia tri la city khi nguoi dung nhap ko dung dinh dang dia chi thi se ko cho luu thay doi
            district: districtEl.value || '', // district = quan huyen
            ward: wardEl.value || '', // ward = phuong xa 
            detail: detailEl.value.trim() || '' // detail = dia chi chi tiet (so nha, ten duong, ap, thon...) se duoc nhap vao o input co id la addressDetail va luu lai tren csdl khi bam luu dia chi
        };
        persistUser(user);
        alert('Đã lưu địa chỉ!'); // thong bao da luu dia chi
        if (typeof notifyProfileUpdated === 'function') {
            notifyProfileUpdated(user.email);
            if (window.notificationsList && Array.isArray(notificationsList)) {
                const now = new Date();
                const tmp = { id: 'temp-' + Date.now(), recipientEmail: user.email, title: '📝 Hồ sơ đã được cập nhật', message: 'Bạn vừa cập nhật thông tin tài khoản của mình.', type: 'system', isRead: false, createdAt: now, updatedAt: now };
                notificationsList.unshift(tmp);
                saveNotificationsLocal(); updateUnreadCount(); updateNotificationBadge(); renderNotifications();
            }
        }
    };

    // Đổi mật khẩu
    document.getElementById('changePass').onclick = () => {
        const oldPass = document.getElementById('oldPass').value;
        const newPass = document.getElementById('newPass').value;
        const confirmPass = document.getElementById('confirmPass').value;
        
        // Kiểm tra người dùng đăng nhập bằng email/password hay OAuth
        if (!user.password) {
            alert('❌ Tài khoản này đăng nhập qua Google/Facebook.\n\nBạn không thể đổi mật khẩu tại đây. Vui lòng dùng tùy chọn "Quên mật khẩu" trên trang đăng nhập hoặc đăng xuất rồi đăng nhập bằng email/mật khẩu để đổi mật khẩu.');
            return;
        }

        // Kiểm tra mật khẩu cũ
        if (!oldPass) {
            alert('⚠️ Vui lòng nhập mật khẩu cũ!');
            return;
        }
        
        if (oldPass !== user.password) {
            alert('❌ Mật khẩu cũ không chính xác!');
            return;
        }

        // Kiểm tra mật khẩu mới
        if (!newPass) {
            alert('⚠️ Vui lòng nhập mật khẩu mới!');
            return;
        }

        // Kiểm tra độ dài mật khẩu mới
        if (newPass.length < 6) {
            alert('❌ Mật khẩu phải có tối thiểu 6 ký tự!');
            return;
        }

        // Kiểm tra mật khẩu mới khác mật khẩu cũ
        if (newPass === oldPass) {
            alert('⚠️ Mật khẩu mới phải khác mật khẩu cũ!');
            return;
        }

        // Kiểm tra xác nhận mật khẩu
        if (!confirmPass) {
            alert('⚠️ Vui lòng xác nhận mật khẩu mới!');
            return;
        }

        if (newPass !== confirmPass) {
            alert('❌ Mật khẩu xác nhận không khớp!');
            return;
        }

        // Tất cả kiểm tra đã pass, bắt đầu đổi mật khẩu
        const currentUser = firebase.auth().currentUser;
        
        if (!currentUser) {
            alert('❌ Lỗi: Không tìm thấy người dùng hiện tại. Vui lòng đăng nhập lại.');
            return;
        }

        // Hiển thị loading
        document.getElementById('changePass').disabled = true;
        document.getElementById('changePass').textContent = 'Đang xử lý...';

        // Cập nhật mật khẩu trên Firebase Auth
        currentUser.updatePassword(newPass)
            .then(() => {
                // Cập nhật mật khẩu trong localStorage
                user.password = newPass;
                persistUser(user);
                
                // Xóa các field input
                document.getElementById('oldPass').value = '';
                document.getElementById('newPass').value = '';
                document.getElementById('confirmPass').value = '';
                
                // Khôi phục nút
                document.getElementById('changePass').disabled = false;
                document.getElementById('changePass').textContent = 'Đổi mật khẩu';
                
                alert('✅ Đổi mật khẩu thành công!\n\nMật khẩu mới sẽ được sử dụng khi đăng nhập lần tới.');
                if (typeof notifyProfileUpdated === 'function') {
                    notifyProfileUpdated(user.email);
                    if (window.notificationsList && Array.isArray(notificationsList)) {
                        const now = new Date();
                        const tmp = { id: 'temp-' + Date.now(), recipientEmail: user.email, title: '📝 Hồ sơ đã được cập nhật', message: 'Bạn vừa cập nhật thông tin tài khoản của mình.', type: 'system', isRead: false, createdAt: now, updatedAt: now };
                        notificationsList.unshift(tmp);
                        saveNotificationsLocal(); updateUnreadCount(); updateNotificationBadge(); renderNotifications();
                    }
                }
            })
            .catch(error => {
                // Khôi phục nút
                document.getElementById('changePass').disabled = false;
                document.getElementById('changePass').textContent = 'Đổi mật khẩu';
                
                console.error('Lỗi đổi mật khẩu:', error);
                
                // Xử lý các lỗi cụ thể từ Firebase
                if (error.code === 'auth/requires-recent-login') {
                    alert('❌ Yêu cầu xác thực lại.\n\nVui lòng đăng xuất rồi đăng nhập lại, sau đó thử đổi mật khẩu.');
                } else if (error.code === 'auth/weak-password') {
                    alert('❌ Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.');
                } else {
                    alert('❌ Lỗi khi đổi mật khẩu: ' + (error.message || 'Vui lòng thử lại'));
                }
            });
    };

    // Upload avatar
    document.getElementById('avatarUpload').addEventListener('change', (e) => { // doan code de khi bam upload no se mo thu vien len
        const file = e.target.files && e.target.files[0]; // neu bam vao se mo thu vien len va nguoi dung chon 1 file anh de upload lam avatar thi se lay file do de xu ly neu nhu ko chon file nao thi se ko xu ly gi ca
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            document.getElementById('avatarPreview').src = reader.result;
            user.avatar = reader.result;
            persistUser(user);
        };
        reader.readAsDataURL(file); // doc file anh duoc chon va chuyen doi no sang dang base64( base64 la dang du lieu text la no se lay duong dan thu muc luu anh do va dua vao truong thong tin csdl) sau do load nguoc lai va hien thi len trang
    });

    // Mặc định mở tab Hồ sơ de khi bam vao icon nguoi dung se chuyen den account de nguoi dung biet minh can dang nhap
    const defaultTab = document.querySelector('.account-menu li[data-section="profileSection"]');
    if (defaultTab) defaultTab.click();

    // Gắn sự kiện cho nút đăng xuất de khi bam vao se xuat ra thong bao xac nhan neu nhu bam ok thi moi thuc hien logout neu bam cancel thi se o lai trang account
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Bạn chắc chắn muốn đăng xuất?')) {
                logout();
            }
        });
    }
});
