// Hàm gửi thông báo (Notification Helper)
// Sử dụng trong các tình huống: đặt hàng, thanh toán, giao hàng, khuyến mãi...

/**
 * Gửi thông báo khi khách hàng đặt hàng
 * @param {string} userEmail - Email người dùng
 * @param {string} orderId - ID đơn hàng
 * @param {number} totalPrice - Tổng giá trị đơn hàng
 */
async function notifyOrderCreated(userEmail, orderId, totalPrice) {
    try {
        console.log('notifyOrderCreated called with', userEmail, orderId, totalPrice);
        if (!userEmail) {
            console.warn('notifyOrderCreated: recipient email is empty, skipping');
            return;
        }
        if (!window.firebase || !window.__FIREBASE_INITIALIZED__) {
            console.warn('Firebase chưa khởi tạo');
            return;
        }

        const db = firebase.firestore();
        
        await db.collection('notifications').add({
            recipientEmail: userEmail,
            title: '✅ Đơn hàng được xác nhận',
            message: `Đơn hàng #${orderId} của bạn đã được nhận. Tổng tiền: ${formatVND(totalPrice)}`,
            type: 'order',
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            orderId: orderId
        });

        console.log('✅ Đã gửi thông báo đặt hàng cho:', userEmail);
    } catch (e) {
        console.error('Lỗi gửi thông báo đặt hàng:', e);
    }
}

/**
 * Gửi thông báo thanh toán thành công
 * @param {string} userEmail - Email người dùng
 * @param {string} orderId - ID đơn hàng
 * @param {number} amount - Số tiền thanh toán
 */
async function notifyPaymentSuccess(userEmail, orderId, amount) {
    try {
        if (!window.firebase || !window.__FIREBASE_INITIALIZED__) {
            console.warn('Firebase chưa khởi tạo');
            return;
        }

        const db = firebase.firestore();
        
        await db.collection('notifications').add({
            recipientEmail: userEmail,
            title: '💳 Thanh toán thành công',
            message: `Thanh toán ${formatVND(amount)} cho đơn hàng #${orderId} đã hoàn tất.`,
            type: 'payment',
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            orderId: orderId
        });

        console.log('✅ Đã gửi thông báo thanh toán cho:', userEmail);
    } catch (e) {
        console.error('Lỗi gửi thông báo thanh toán:', e);
    }
}

/**
 * Gửi thông báo cập nhật trạng thái giao hàng
 * @param {string} userEmail - Email người dùng
 * @param {string} orderId - ID đơn hàng
 * @param {string} status - Trạng thái giao hàng (pending, confirmed, shipped, delivered)
 */
async function notifyDeliveryStatus(userEmail, orderId, status) {
    try {
        if (!window.firebase || !window.__FIREBASE_INITIALIZED__) {
            console.warn('Firebase chưa khởi tạo');
            return;
        }

        const db = firebase.firestore();
        
        const statusMessages = {
            'pending': { title: '⏳ Đơn hàng đang chờ xác nhận', icon: '⏳' },
            'confirmed': { title: '✅ Đơn hàng được xác nhận', icon: '✅' },
            'shipped': { title: '🚚 Đơn hàng đang giao', icon: '🚚' },
            'delivered': { title: '📦 Đã nhận hàng', icon: '📦' },
            'cancelled': { title: '❌ Đơn hàng bị hủy', icon: '❌' }
        };

        const statusInfo = statusMessages[status] || { title: '📦 Cập nhật đơn hàng', icon: '📦' };

        await db.collection('notifications').add({
            recipientEmail: userEmail,
            title: statusInfo.title,
            message: `${statusInfo.icon} Đơn hàng #${orderId} có cập nhật trạng thái mới.`,
            type: 'delivery',
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            orderId: orderId,
            status: status
        });

        console.log('✅ Đã gửi thông báo giao hàng cho:', userEmail);
    } catch (e) {
        console.error('Lỗi gửi thông báo giao hàng:', e);
    }
}

/**
 * Gửi thông báo khuyến mãi
 * @param {string} userEmail - Email người dùng
 * @param {string} promotionTitle - Tiêu đề khuyến mãi
 * @param {string} promotionMessage - Mô tả khuyến mãi
 */
async function notifyPromotion(userEmail, promotionTitle, promotionMessage) {
    try {
        if (!window.firebase || !window.__FIREBASE_INITIALIZED__) {
            console.warn('Firebase chưa khởi tạo');
            return;
        }

        const db = firebase.firestore();
        
        await db.collection('notifications').add({
            recipientEmail: userEmail,
            title: '🎉 ' + promotionTitle,
            message: promotionMessage,
            type: 'promotion',
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('✅ Đã gửi thông báo khuyến mãi cho:', userEmail);
    } catch (e) {
        console.error('Lỗi gửi thông báo khuyến mãi:', e);
    }
}

/**
 * Gửi thông báo cảnh báo kho
 * @param {string} productName - Tên sản phẩm
 * @param {number} quantity - Số lượng còn lại
 */
async function notifyLowStock(productName, quantity) {
    try {
        if (!window.firebase || !window.__FIREBASE_INITIALIZED__) {
            console.warn('Firebase chưa khởi tạo');
            return;
        }

        const db = firebase.firestore();
        
        // Gửi thông báo cho tất cả admin
        const adminsSnapshot = await db.collection('users').where('role', '==', 'admin').get();
        
        adminsSnapshot.forEach(async doc => {
            const admin = doc.data();
            if (admin.email) {
                await db.collection('notifications').add({
                    recipientEmail: admin.email,
                    title: '⚠️ Cảnh báo việc hết hàng',
                    message: `Sản phẩm "${productName}" chỉ còn ${quantity} chiếc. Vui lòng bổ sung kho.`,
                    type: 'warning',
                    isRead: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    productName: productName,
                    quantity: quantity
                });
            }
        });

        console.log('✅ Đã gửi thông báo cảnh báo kho cho các admin');
    } catch (e) {
        console.error('Lỗi gửi thông báo cảnh báo kho:', e);
    }
}

/**
 * Gửi thông báo hệ thống toàn cầu cho tất cả người dùng
 * @param {string} title - Tiêu đề thông báo
 * @param {string} message - Nội dung thông báo
 * @param {string} type - Loại thông báo (system, warning, promotion, etc.)
 */
async function broadcastNotification(title, message, type = 'system') {
    try {
        if (!window.firebase || !window.__FIREBASE_INITIALIZED__) {
            console.warn('Firebase chưa khởi tạo');
            return;
        }

        const db = firebase.firestore();
        
        // Lấy tất cả người dùng
        const usersSnapshot = await db.collection('users').get();
        
        usersSnapshot.forEach(async doc => {
            const user = doc.data();
            if (user.email) {
                await db.collection('notifications').add({
                    recipientEmail: user.email,
                    title: title,
                    message: message,
                    type: type,
                    isRead: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        });

        console.log('✅ Đã gửi thông báo hệ thống cho tất cả người dùng');
    } catch (e) {
        console.error('Lỗi gửi thông báo hệ thống:', e);
    }
}

// Gửi thông báo khi thông tin tài khoản người dùng thay đổi
async function notifyProfileUpdated(userEmail) {
    try {
        console.log('notifyProfileUpdated called for', userEmail);
        if (!userEmail) {
            console.warn('notifyProfileUpdated: recipient email empty');
            return;
        }
        if (!window.firebase || !window.__FIREBASE_INITIALIZED__) {
            console.warn('Firebase chưa khởi tạo');
            return;
        }
        const db = firebase.firestore();
        await db.collection('notifications').add({
            recipientEmail: userEmail,
            title: '📝 Hồ sơ đã được cập nhật',
            message: 'Bạn vừa cập nhật thông tin tài khoản của mình.',
            type: 'system',
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log('✅ Đã gửi thông báo cập nhật hồ sơ cho:', userEmail);
    } catch (e) {
        console.error('Lỗi gửi thông báo cập nhật hồ sơ:', e);
    }
}

// Gửi thông báo khi người dùng nhận được voucher mới
async function notifyVoucherReceived(userEmail, voucherCode) {
    try {
        console.log('notifyVoucherReceived called', userEmail, voucherCode);
        if (!userEmail) {
            console.warn('notifyVoucherReceived: recipient email empty');
            return;
        }
        if (!window.firebase || !window.__FIREBASE_INITIALIZED__) {
            console.warn('Firebase chưa khởi tạo');
            return;
        }
        const db = firebase.firestore();
        await db.collection('notifications').add({
            recipientEmail: userEmail,
            title: '🎁 Bạn vừa nhận voucher mới',
            message: `Voucher ${voucherCode} đã được thêm vào tài khoản của bạn.`,
            type: 'promotion',
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            voucherCode: voucherCode
        });
        console.log('✅ Đã gửi thông báo voucher cho:', userEmail);
    } catch (e) {
        console.error('Lỗi gửi thông báo voucher:', e);
    }
}

/**
 * Định dạng số tiền sang VND
 * @param {number} amount - Số tiền
 * @returns {string} Chuỗi định dạng VND
 */
function formatVND(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Export các hàm để sử dụng
// Có thể gọi từ checkout.js, orders.js, admin.js, v.v.
