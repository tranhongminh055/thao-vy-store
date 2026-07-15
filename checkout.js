// checkout.js: render cart summary, handle order submission
document.addEventListener('DOMContentLoaded', () => {
  console.log('checkout.js loaded');
  const cart = JSON.parse(localStorage.getItem('cart')||'[]');
  const orderItemsEl = document.getElementById('orderItems');
  const orderTotalEl = document.getElementById('orderTotal');

  function renderCart() {
    const cart = JSON.parse(localStorage.getItem('cart')||'[]');
    if (!cart.length) { orderItemsEl.innerHTML = 'Không có sản phẩm.'; orderTotalEl.innerText = '0đ'; return; }
    orderItemsEl.innerHTML = '';
    let total = 0;
    cart.forEach(it => {
      const item = document.createElement('div');
      item.className = 'item';
      item.innerHTML = `<img src="${it.image||'src/giay nam dep.jfif'}" alt="${it.name}"><div><strong>${it.name}</strong><div class="muted">Số lượng: ${it.quantity}</div></div><div style="margin-left:auto">${(it.price||0).toLocaleString()}đ</div>`;
      orderItemsEl.appendChild(item);
      total += (Number(it.price)||0) * (Number(it.quantity)||1);
    });
    orderTotalEl.innerText = total.toLocaleString() + 'đ';
  }

  renderCart();

  const checkoutFormEl = document.getElementById('checkoutForm');
  if (checkoutFormEl) {
    checkoutFormEl.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const name = document.getElementById('shipName').value.trim();
      const phone = document.getElementById('shipPhone').value.trim();
      const email = document.getElementById('shipEmail').value.trim();
      const address = document.getElementById('shipAddress').value.trim();
      const delivery = document.querySelector('input[name="delivery"]:checked').value;
      const payment = document.querySelector('input[name="payment"]:checked').value;
      if (!name || !phone || !address) { alert('Vui lòng điền đầy đủ thông tin giao hàng.'); return; }
      
      // Get cart items
      const cartItems = JSON.parse(localStorage.getItem('cart')||'[]');
      const subtotal = cartItems.reduce((sum, it) => sum + ((Number(it.price)||0) * (Number(it.quantity)||1)), 0);
      
      // Get logged-in user email
      let userEmail = null;
      try {
        const user = JSON.parse(localStorage.getItem('loggedUser')) || JSON.parse(localStorage.getItem('loggedInUser'));
        userEmail = (user && user.email) ? user.email.toString().toLowerCase().trim() : email.toLowerCase().trim();
      } catch (e) {
        userEmail = email.toLowerCase().trim();
      }
      
      // Create order with correct schema (for both localStorage and Firestore)
      const orderId = 'ORD' + Date.now();
      const order = {
        orderId: orderId,
        id: orderId, // Legacy field for backward compatibility
        status: 'confirmed',
        customer: {
          name: name,
          phone: phone,
          email: email,
          address: address
        },
        // Legacy fields for backward compatibility
        name: name,
        phone: phone,
        email: email,
        address: address,
        
        // Maps
        delivery: delivery,
        payment: payment,
        products: cartItems, // Use 'products' instead of 'items' for Firestore schema
        items: cartItems, // Keep for backward compatibility
        
        // Pricing
        subtotal: subtotal,
        discount: 0,
        total: subtotal,
        
        // Timestamps & user info
        userEmail: userEmail,
        orderDate: new Date().toLocaleString('vi-VN'),
        confirmedAt: new Date().toISOString(),
        createdAt: Date.now()
      };
      
      // Save to localStorage orders
      const orders = JSON.parse(localStorage.getItem('orders')||'[]');
      orders.push(order);
      localStorage.setItem('orders', JSON.stringify(orders));
      
      // Auto-sync to Firestore if available
      if (window.firebase && window.__FIREBASE_INITIALIZED__ && userEmail) {
        try {
          const db = firebase.firestore();
          // Save to global orders collection
          db.collection('orders').doc(orderId).set(order, { merge: true })
            .catch(e => console.warn('Failed to sync order to Firestore:', e));
          // Also save under user's orders for quick user-scoped queries
          db.collection('users').doc(userEmail).collection('orders').doc(orderId).set({
            orderId: orderId,
            status: 'confirmed',
            total: subtotal,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true })
            .catch(e => console.warn('Failed to sync order ref to Firestore:', e));
          
          // Cập nhật tồn kho sản phẩm (chờ hoàn tất)
          await updateProductInventory(db, cartItems);
        } catch (e) {
          console.warn('Firestore sync error:', e);
        }
      }
      
      // Clear cart
      localStorage.setItem('cart','[]');
      if (window.updateCartCount) updateCartCount();
      
      // Gửi thông báo đơn hàng đặt thành công
      console.log('About to notify order created for', userEmail);
      if (typeof notifyOrderCreated === 'function') {
        notifyOrderCreated(userEmail, orderId, subtotal);
        // also update UI immediately so user sees notification without reload
        if (window.notificationsList && Array.isArray(notificationsList)) {
          const now = new Date();
          const copy = {
            id: 'temp-' + Date.now(),
            recipientEmail: userEmail,
            title: '✅ Đơn hàng được xác nhận',
            message: `Đơn hàng #${orderId} của bạn đã được nhận. Tổng tiền: ${subtotal.toLocaleString()}đ`,
            type: 'order',
            isRead: false,
            createdAt: now,
            updatedAt: now,
            orderId: orderId
          };
          notificationsList.unshift(copy);
          saveNotificationsLocal();
          updateUnreadCount();
          updateNotificationBadge();
          renderNotifications();
        }
      } else {
        console.warn('notifyOrderCreated is not defined');
      }
      
      alert('Đặt hàng thành công — Mã đơn: ' + orderId);
      renderCart();
      e.target.reset();
    });
  }
});

// Hàm cập nhật tồn kho sản phẩm khi có đơn hàng mới
async function updateProductInventory(db, cartItems) {
  try {
    console.log('🛒 Bắt đầu cập nhật tồn kho cho', cartItems.length, 'sản phẩm');
    
    // Debug: Hiển thị sản phẩm trong giỏ hàng
    cartItems.forEach((item, idx) => {
      console.log(`  [${idx}] Tên: "${item.name}" | Số lượng: ${item.quantity}`);
    });
    
    // Lấy tất cả sản phẩm trong Firestore để so sánh
    const allProducts = await db.collection('products').get();
    console.log('📦 Firestore có', allProducts.size, 'sản phẩm');
    
    const batch = db.batch();
    let updatedCount = 0;
    
    // Duyệt qua từng sản phẩm trong giỏ hàng
    for (const item of cartItems) {
      if (!item.name) {
        console.warn('⚠️ Sản phẩm không có tên, bỏ qua');
        continue;
      }
      
      console.log(`\n🔍 Tìm kiếm sản phẩm: "${item.name}"`);
      
      // Tìm sản phẩm trong Firestore
      let found = false;
      allProducts.forEach(doc => {
        const docName = doc.data().name;
        console.log(`   So sánh với: "${docName}"`);
        
        if (docName && docName.toLowerCase().trim() === item.name.toLowerCase().trim()) {
          found = true;
          const currentQuantity = doc.data().quantity || 0;
          const newQuantity = Math.max(0, currentQuantity - (item.quantity || 1));
          
          batch.update(doc.ref, {
            quantity: newQuantity,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`   ✅ Tìm thấy! Cập nhật: ${currentQuantity} → ${newQuantity}`);
          updatedCount++;
        }
      });
      
      if (!found) {
        console.warn(`   ❌ KHÔNG TÌM THẤY sản phẩm "${item.name}" trong Firestore`);
      }
    }
    
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`\n✅ Đã cập nhật ${updatedCount}/${cartItems.length} sản phẩm thành công`);
    } else {
      console.warn('⚠️ Không có sản phẩm nào được cập nhật!');
    }
    
  } catch (error) {
    console.error('❌ Lỗi cập nhật tồn kho:', error);
  }
}
