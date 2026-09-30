// Hệ thống thông báo (Notification System)
// Xử lý hiển thị, gửi và quản lý thông báo theo thời gian thực

let notificationsList = [];
let unreadCount = 0;

// Khởi tạo hệ thống thông báo
function initNotifications() {
  try {
    // Lấy thông báo từ localStorage nếu có
    const saved = localStorage.getItem('notifications');
    if (saved) {
      notificationsList = JSON.parse(saved);
      updateUnreadCount();
    }

    // Lắng nghe thông báo realtime từ Firestore nếu user đã đăng nhập
    const user = getCurrentUser();
    if (user && window.firebase && window.__FIREBASE_INITIALIZED__) {
      setupNotificationListener(user.email);
    }

    // Cập nhật UI
    updateNotificationBadge();
  } catch (e) {
    console.error('Lỗi khởi tạo thông báo:', e);
  }
}

// Lấy thông tin user hiện tại
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('loggedUser')) || 
           JSON.parse(localStorage.getItem('loggedInUser')) || 
           null;
  } catch (e) {
    return null;
  }
}

// Thiết lập listener realtime từ Firestore
function setupNotificationListener(userEmail) {
  try {
    if (!userEmail) return;
    // always compare lowercase trimmed emails to avoid mismatches
    userEmail = userEmail.toString().toLowerCase().trim();

    const db = firebase.firestore();
    
    // Lắng nghe thông báo cho user hiện tại
    const query = db.collection('notifications')
      .where('recipientEmail', '==', userEmail);

    // attempt ordered listener
    query.orderBy('createdAt', 'desc').limit(50) // chỉ lấy 50 thông báo mới nhất (giới hạn để tối ưu hiệu suất)
      .onSnapshot(snapshot => {
        console.log('notification listener received', snapshot.size, 'docs'); // log số lượng thông báo nhận được từ Firestore để debug
        const newNotifications = []; // tạo mảng mới để lưu thông báo mới nhận được từ Firestore
        snapshot.forEach(doc => { // duyệt qua từng document trong snapshot và thêm vào mảng newNotifications với id và dữ liệu của document
          newNotifications.push({ // push thông báo mới vào mảng newNotifications với id và dữ liệu của document
            id: doc.id,
            ...doc.data()
          });
        });
        notificationsList = newNotifications; // cập nhật danh sách thông báo với mảng mới nhận được từ Firestore
        saveNotificationsLocal(); // lưu thông báo để có thể truy cập nhanh mà không cần gọi lại Firestore
        updateUnreadCount(); // cập nhật số lượng thông báo chưa đọc dựa trên danh sách mới
        updateNotificationBadge(); // cập nhật badge thông báo trên icon để phản ánh số lượng thông báo chưa đọc
      }, err => {
        console.error('Lỗi lắng nghe thông báo (ordered):', err);
        /*
         * Firestore requires a composite index when you combine a where() filter with
         * an orderBy() on a different field. the error message will include a link to the
         * console where you can create the index automatically. To avoid the warning
         * appearing in production you can:
         *   1. Visit the URL shown in the error and click "Create Index".
         *   2. Add an index entry to `firestore.indexes.json` (see project root) and
         *      run `firebase deploy --only firestore:indexes`.
         *
         * The JSON below has the needed index:
         * {
         *   "collectionGroup": "notifications",
         *   "queryScope": "COLLECTION",
         *   "fields": [
         *     { "fieldPath": "recipientEmail", "mode": "ASCENDING" },
         *     { "fieldPath": "createdAt", "mode": "DESCENDING" }
         *   ]
         * }
         *
         * Until the index exists we fall back to the unordered listener so that users
         * still receive updates, albeit unsorted.
         */
        if (err && err.message && err.message.includes('requires an index')) {
          console.warn('Falling back to unordered query');
          // try simple listener without orderBy to bypass missing index
          query.limit(50).onSnapshot(snap2 => { // truy vấn không có orderBy để tránh lỗi thiếu index, vẫn giới hạn 50 thông báo để tối ưu hiệu suất
            const list = []; // tạo mảng mới để lưu thông báo nhận được từ Firestore
            snap2.forEach(doc => list.push({ id: doc.id, ...doc.data() })); // duyệt qua từng document trong snapshot và thêm vào mảng list với id và dữ liệu của document
            notificationsList = list; // cập nhật danh sách thông báo với mảng mới nhận được từ Firestore
            saveNotificationsLocal(); // lưu thông báo để có thể truy cập nhanh mà không cần gọi lại Firestore
            updateUnreadCount(); // cập nhật số lượng thông báo chưa đọc dựa trên danh sách mới
            updateNotificationBadge(); // cập nhật badge thông báo trên icon để phản ánh số lượng thông báo chưa đọc
          }, err2 => {
            console.error('Fallback listener failed:', err2);
          });
        }
      });
  } catch (e) {
    console.error('Lỗi thiết lập listener thông báo:', e);
  }
}

// Cập nhật số lượng chưa đọc
function updateUnreadCount() {
  unreadCount = notificationsList.filter(n => !n.isRead).length; // tính số lượng thông báo chưa đọc bằng cách lọc danh sách thông báo và đếm những thông báo có isRead là false
}

// Cập nhật badge thông báo trên icon
function updateNotificationBadge() {
  const badge = document.getElementById('notification-badge');
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

// Hiển thị dropdown thông báo
function toggleNotificationDropdown() {
  const dropdown = document.getElementById('notification-dropdown');
  if (!dropdown) return;
  
  dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  
  // Render thông báo
  if (dropdown.style.display === 'block') {
    renderNotifications();
  }
}

// Render danh sách thông báo
function renderNotifications() {
  const container = document.getElementById('notificationsList');
  if (!container) return;

  container.innerHTML = '';

  if (notificationsList.length === 0) {
    container.innerHTML = '<div class="notification-empty">Không có thông báo nào</div>';
    return;
  }

  notificationsList.forEach((notification, index) => {
    const div = document.createElement('div');
    div.className = `notification-item ${notification.isRead ? 'read' : 'unread'}`;
    div.style.cursor = 'pointer';
    
    // Định dạng thời gian
    let timeStr = 'Vừa xong';
    if (notification.createdAt) {
      const time = notification.createdAt.toDate ? 
                   notification.createdAt.toDate() : 
                   new Date(notification.createdAt);
      timeStr = formatTimeAgo(time);
    }

    div.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon" style="font-size: 20px; color: ${notification.type === 'order' ? '#27ae60' : notification.type === 'warning' ? '#e74c3c' : '#3498db'};">
          ${getNotificationIcon(notification.type)}
        </div>
        <div class="notification-message">
          <p class="notification-title">${notification.title}</p>
          <p class="notification-body">${notification.message}</p>
          <span class="notification-time">${timeStr}</span>
        </div>
      </div>
      <button class="btn-close-notification" onclick="deleteNotification('${notification.id}', event)">×</button>
    `;

    div.onclick = (e) => {
      if (!e.target.closest('.btn-close-notification')) {
        markAsRead(notification.id);
      }
    };

    container.appendChild(div);
  });
}

// Lấy icon dựa trên loại thông báo
function getNotificationIcon(type) {
  const icons = {
    'order': '',
    'payment': '',
    'delivery': '',
    'promotion': '',
    'system': '',
    'warning': '',
    'default': ''
  };
  return icons[type] || icons['default'];
}

// Định dạng thời gian (ví dụ: "2 phút trước")
function formatTimeAgo(date) { // chức năng định dạng thời gian để hiển thị "vừa xong", "x phút trước", "x giờ trước", "x ngày trước" hoặc
  const now = new Date(); // lấy thời gian hiện tại
  const diffMs = now - date; // tính hiệu số thời gian giữa hiện tại và thời gian của thông báo
  const diffMins = Math.floor(diffMs / 60000); // tính số phút đã trôi qua bằng cách chia hiệu số thời gian cho 60000 (số ms trong một phút)
  const diffHours = Math.floor(diffMs / 3600000); // tính số giờ đã trôi qua bằng cách chia hiệu số thời gian cho 3600000 (số ms trong một giờ)
  const diffDays = Math.floor(diffMs / 86400000); //  tính số ngày đã trôi qua bằng cách chia hiệu số thời gian cho 86400000 (số ms trong một ngày)

  if (diffMins < 1) return 'Vừa xong'; // nếu thời gian trôi qua nhỏ hơn 1 phút thì hiển thị "vừa xong"
  if (diffMins < 60) return `${diffMins} phút trước`; // nếu thời gian trôi qua nhỏ hơn 60 phút thì hiển thị "x phút trước"
  if (diffHours < 24) return `${diffHours} giờ trước`; // nếu thời gian trôi qua nhỏ hơn 24 giờ thì hiển thị "x giờ trước"
  if (diffDays < 7) return `${diffDays} ngày trước`; // nếu thời gian trôi qua nhỏ hơn 7 ngày thì hiển thị "x ngày trước"
  
  return date.toLocaleDateString('vi-VN'); // thời gian dưới chuỗi dạng ngày tháng năm nếu đã lâu (hơn 7 ngày) để hiển thị ngày cụ thể của thông báo
}

// Đánh dấu thông báo là đã đọc
async function markAsRead(notificationId) { // đồng bộ đánh dấu thông báo là đã đọc cả trên local và Firestore (nếu có) để đảm bảo dữ liệu nhất quán giữa client và server
  try {
    const notification = notificationsList.find(n => n.id === notificationId); // tìm thông báo theo id trong danh sách local
    if (!notification || notification.isRead) return; // nếu không tìm thấy thông báo hoặc đã là đã đọc thì không làm gì

    notification.isRead = true;
    
    // Cập nhật Firestore nếu có
    if (window.firebase && window.__FIREBASE_INITIALIZED__) {
      const db = firebase.firestore(); // lấy instance Firestore
      await db.collection('notifications').doc(notificationId).update({ isRead: true }); // cập nhật trường isRead của thông báo trong Firestore để đánh dấu là đã đọc
    }

    saveNotificationsLocal(); // lưu thông báo đã cập nhật vào localStorage để có thể truy cập nhanh mà không cần gọi lại Firestore
    updateUnreadCount(); // cập nhật số lượng thông báo chưa đọc dựa trên danh sách đã cập nhật
    updateNotificationBadge(); // cập nhật badge thông báo trên icon để phản ánh số lượng thông báo chưa đọc sau khi đã đánh dấu là đã đọc
    renderNotifications(); // cập nhật lại giao diện danh sách thông báo để phản ánh trạng thái đã đọc của thông báo
  } catch (e) {
    console.error('Lỗi đánh dấu là đã đọc:', e);
  }
}

// Xóa thông báo
async function deleteNotification(notificationId, event) {
  event.stopPropagation();
  
  try {
    // Xóa khỏi danh sách local
    notificationsList = notificationsList.filter(n => n.id !== notificationId);
    
    // Xóa từ Firestore nếu có
    if (window.firebase && window.__FIREBASE_INITIALIZED__) {
      const db = firebase.firestore();
      await db.collection('notifications').doc(notificationId).delete();
    }

    saveNotificationsLocal();
    updateUnreadCount();
    updateNotificationBadge();
    renderNotifications();
  } catch (e) {
    console.error('Lỗi xóa thông báo:', e);
  }
}

// Đánh dấu tất cả là đã đọc
async function markAllAsRead() {
  try {
    for (let notification of notificationsList) {
      if (!notification.isRead) {
        notification.isRead = true;
        
        if (window.firebase && window.__FIREBASE_INITIALIZED__) {
          const db = firebase.firestore();
          await db.collection('notifications').doc(notification.id).update({ isRead: true });
        }
      }
    }

    saveNotificationsLocal();
    updateUnreadCount();
    updateNotificationBadge();
    renderNotifications();
  } catch (e) {
    console.error('Lỗi đánh dấu tất cả:', e);
  }
}

// Lưu thông báo vào localStorage
function saveNotificationsLocal() {
  try {
    localStorage.setItem('notifications', JSON.stringify(notificationsList));
  } catch (e) {
    console.error('Lỗi lưu thông báo:', e);
  }
}

// Gửi thông báo (từ backend)
async function sendNotification(userId, title, message, type = 'default') {
  try {
    if (!window.firebase || !window.__FIREBASE_INITIALIZED__) {
      console.warn('Firebase chưa khởi tạo');
      return;
    }

    const db = firebase.firestore();
    const user = getCurrentUser();
    
    if (!user) {
      console.warn('User chưa đăng nhập');
      return;
    }

    // Lưu thông báo vào Firestore
    await db.collection('notifications').add({
      recipientEmail: user.email,
      recipientId: userId,
      title: title,
      message: message,
      type: type, // 'order', 'payment', 'delivery', 'promotion', 'system', 'warning'
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Đã gửi thông báo:', title);
  } catch (e) {
    console.error('Lỗi gửi thông báo:', e);
  }
}

// Xóa tất cả thông báo
async function clearAllNotifications() {
  if (!confirm('Bạn muốn xóa tất cả thông báo?')) return;
  
  try {
    for (let notification of notificationsList) {
      if (window.firebase && window.__FIREBASE_INITIALIZED__) {
        const db = firebase.firestore();
        await db.collection('notifications').doc(notification.id).delete();
      }
    }

    notificationsList = [];
    saveNotificationsLocal();
    updateUnreadCount();
    updateNotificationBadge();
    renderNotifications();
  } catch (e) {
    console.error('Lỗi xóa tất cả thông báo:', e);
  }
}

// Đóng dropdown khi click ra ngoài
document.addEventListener('click', function(event) {
  const notificationIcon = document.getElementById('notification-icon');
  const dropdown = document.getElementById('notification-dropdown');
  
  if (dropdown && notificationIcon && 
      !dropdown.contains(event.target) && 
      !notificationIcon.contains(event.target)) {
    dropdown.style.display = 'none';
  }
});

// Khởi tạo khi trang load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotifications);
} else {
  initNotifications();
}
