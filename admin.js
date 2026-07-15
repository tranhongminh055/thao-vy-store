// admin.js - Admin dashboard: realtime users list via Firestore

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('loggedUser')) || JSON.parse(localStorage.getItem('loggedInUser')) || null;
  } catch (e) { return null; }
}

function ensureAdminOrRedirect() {
  const u = getCurrentUser();
  if (!u || u.role !== 'admin') {
    alert('Bạn không có quyền truy cập trang quản trị, vui lòng liên hệ quản trị viên để được hỗ trợ.');
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Format VND currency
function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

if (!ensureAdminOrRedirect()) {
  // stop further execution
} else {
  const statusEl = document.getElementById('status');
  const statsEl = document.getElementById('stats');
  const tbody = document.querySelector('#usersTable tbody'); // users table body (khởi tạo bảng người dùng)
  let db = null;
  let revenueChart = null;

  statusEl.textContent = 'Đang chờ Firebase...';

  // Wait for firebase to be initialized (compat) with timeout
  function waitForFirebase(timeout = 8000) {
    return new Promise(resolve => {
      if (window.firebase && window.__FIREBASE_INITIALIZED__) return resolve(true);
      const start = Date.now();
      const iv = setInterval(() => {
        if (window.firebase && window.__FIREBASE_INITIALIZED__) {
          clearInterval(iv);
          return resolve(true);
        }
        if (Date.now() - start > timeout) {
          clearInterval(iv);
          return resolve(false);
        }
      }, 150);
    });
  }

  // Initialize realtime listeners (non-blocking)
  function initRealtimeListeners() {
    (async () => {
      const ready = await waitForFirebase(8000);
      if (!ready) {
        console.warn('Firebase not initialized in time; realtime features disabled');
        statusEl.textContent = 'Không thể kết nối tới Firestore (timeout)';
        return;
      }
      try {
        db = firebase.firestore();
        statusEl.textContent = 'Đang kết nối tới Firestore...';

        // orders listener - limited and ordered to avoid loading huge collections
        try {
          db.collection('orders').orderBy('createdAt', 'desc').limit(1000).onSnapshot(snapshot => {
            const orders = [];
            snapshot.forEach(doc => { orders.push(Object.assign({ id: doc.id }, doc.data())); });
            processOrdersAndUpdateChart(orders);
          }, err => {
            console.error('orders snapshot error', err);
          });
        } catch (e) {
          console.warn('Failed to attach orders listener, falling back to unordered limited listener', e);
          try { db.collection('orders').limit(500).onSnapshot(snapshot => { const o = []; snapshot.forEach(d=>o.push(Object.assign({ id: d.id }, d.data()))); processOrdersAndUpdateChart(o); }); } catch(_) {}
        }

        // users listener - limited to avoid overwhelming client
        try {
          db.collection('users').orderBy('email').limit(500).onSnapshot(snapshot => {
            const users = [];
            snapshot.forEach(doc => users.push(Object.assign({ id: doc.id }, doc.data())));

            // Update stats & render
            const total = users.length;
            const admins = users.filter(u => u.role === 'admin').length;
            statsEl.innerHTML = `Số người truy cập: <strong>${total}</strong> • Admins: <strong>${admins}</strong>`;

            tbody.innerHTML = '';
            users.sort((a,b)=> (a.email||'').localeCompare(b.email||''));
            users.forEach(u => {
              const tr = document.createElement('tr');
              const email = document.createElement('td'); email.textContent = u.email || '';
              const name = document.createElement('td'); name.textContent = u.name || '-';
              const roleTd = document.createElement('td');
              const roleSpan = document.createElement('span');
              roleSpan.className = 'role-badge ' + (u.role === 'admin' ? 'role-admin' : 'role-user');
              roleSpan.textContent = u.role || 'user';
              roleTd.appendChild(roleSpan);
              const requestTd = document.createElement('td'); requestTd.textContent = u.requestAdmin ? 'Có' : '—';
              const lastLoginTd = document.createElement('td');
              (function fillLastLogin() {
                try {
                  if (u.lastLogin) {
                    const t = u.lastLogin;
                    if (t && typeof t.toDate === 'function') { const d = t.toDate(); if (!isNaN(d.getTime())) { lastLoginTd.textContent = d.toLocaleString('vi-VN'); return; } }
                    const d2 = new Date(t); if (!isNaN(d2.getTime())) { lastLoginTd.textContent = d2.toLocaleString('vi-VN'); return; }
                  }
                  if (u.loginTime) { const d3 = new Date(u.loginTime); if (!isNaN(d3.getTime())) { lastLoginTd.textContent = d3.toLocaleString('vi-VN'); return; } }
                  if (u.last_login) { const d4 = new Date(u.last_login); if (!isNaN(d4.getTime())) { lastLoginTd.textContent = d4.toLocaleString('vi-VN'); return; } }
                  if (u.last_login_at) { const d5 = new Date(u.last_login_at); if (!isNaN(d5.getTime())) { lastLoginTd.textContent = d5.toLocaleString('vi-VN'); return; } }
                  lastLoginTd.textContent = '-';
                } catch (e) { lastLoginTd.textContent = '-'; }
              })();

              const actions = document.createElement('td'); actions.className = 'users-actions';
              // helper: assign single admin
              const assignSingleAdmin = async (targetUserId) => {
                  try {
                      const batch = db.batch();
                      const allUsersSnapshot = await db.collection('users').get();
                      allUsersSnapshot.forEach(doc => {
                          if (doc.id === targetUserId) {
                              batch.update(doc.ref, { role: 'admin', requestAdmin: false });
                          } else if (doc.data().role === 'admin') {
                              batch.update(doc.ref, { role: 'user' });
                          }
                      });
                      await batch.commit();
                      
                      alert('Đã cấp quyền Admin thành công! Tài khoản của bạn đã bị hạ quyền và sẽ tự động đăng xuất.');
                      localStorage.removeItem('authToken');
                      localStorage.removeItem('loggedUser');
                      localStorage.removeItem('loggedInUser');
                      window.location.href = 'login.html';
                  } catch (e) {
                      alert('❌ Lỗi cấp quyền: ' + e);
                  }
              };

              // buttons
              if (u.requestAdmin && u.role !== 'admin') {
                const btnApprove = document.createElement('button'); btnApprove.className = 'btn btn-primary action-btn'; btnApprove.textContent = 'Phê duyệt yêu cầu';
                btnApprove.onclick = async () => { 
                    if (!confirm(`Phê duyệt quyền admin cho ${u.email} và đánh mất quyền admin của chính bạn?`)) return; 
                    await assignSingleAdmin(u.id);
                };
                actions.appendChild(btnApprove);
              }
              const btnToggle = document.createElement('button'); btnToggle.className = 'btn btn-primary action-btn'; btnToggle.textContent = u.role === 'admin' ? 'Hạ quyền' : 'Cấp admin';
              btnToggle.onclick = async () => { 
                  const newRole = u.role === 'admin' ? 'user' : 'admin'; 
                  if (!confirm(`Thay đổi role của ${u.email} thành ${newRole}${newRole === 'admin' ? ' (bạn sẽ bị mất quyền Admin)' : ''}?`)) return; 
                  if (newRole === 'admin') {
                      await assignSingleAdmin(u.id);
                  } else {
                      try { 
                          await db.collection('users').doc(u.id).set({ role: 'user', requestAdmin: false }, { merge: true }); 
                          alert('Đã hạ quyền tài khoản.'); 
                          const current = getCurrentUser();
                          if (current && (current.email || '').toLowerCase() === u.id) {
                              localStorage.removeItem('loggedUser');
                              window.location.href = 'login.html';
                          }
                      } catch(e){ alert('❌ Lỗi khi cập nhật role: ' + e); } 
                  }
              };
              const btnDelete = document.createElement('button'); btnDelete.className = 'btn btn-danger action-btn'; btnDelete.textContent = 'Xóa'; btnDelete.onclick = () => { if (!confirm('Xóa user ' + (u.email||'') + ' ?')) return; db.collection('users').doc(u.id).delete().then(()=>{ alert('Đã xóa'); }).catch(e=>alert('Lỗi khi xóa: '+e)); };
              actions.appendChild(btnToggle); actions.appendChild(btnDelete);

              tr.appendChild(email); tr.appendChild(name); tr.appendChild(roleTd); tr.appendChild(requestTd); tr.appendChild(lastLoginTd); tr.appendChild(actions);
              tbody.appendChild(tr);
            });

            statusEl.textContent = 'Đã kết nối • Cập nhật thời gian thực đang bật';
          }, err => {
            statusEl.textContent = 'Lỗi kết nối Firestore: ' + err;
          });
        } catch (e) {
          console.warn('Failed to attach users listener', e);
        }

      } catch (e) {
        console.error('Error initializing realtime listeners', e);
      }
    })();
  }

  // start listeners (non-blocking)
  initRealtimeListeners();

  // Hàm xử lý và vẽ biểu đồ dựa trên danh sách đơn + thống kê sản phẩm
  function processOrdersAndUpdateChart(orders) {
    try {
      let totalRevenue = 0;

      // Tính doanh thu theo ngày và đếm sản phẩm
      const revenueByDate = {};
      const productCounts = {};
      const userStats = {}; // Khởi tạo thống kê theo user
      const pendingProofs = []; // Danh sách các đơn chờ duyệt minh chứng
      const approvedProofs = []; // Danh sách các minh chứng đã duyệt
      const cancelledProofs = []; // Danh sách các minh chứng đã hủy

      orders.forEach(order => {
        if (!order) return;
        const orderTotal = getOrderTotal(order);
        if (orderTotal <= 0) return;
        totalRevenue += orderTotal;
          let orderDate = 'Unknown';
          if (order.orderDate) {
            if (typeof order.orderDate === 'string') {
              orderDate = order.orderDate;
            } else if (order.orderDate.toDate) {
              const date = order.orderDate.toDate();
              orderDate = date.toLocaleDateString('vi-VN');
            }
          }
          if (!revenueByDate[orderDate]) revenueByDate[orderDate] = 0;
          revenueByDate[orderDate] += orderTotal;

          // aggregate products in order
          if (Array.isArray(order.products)) {
            order.products.forEach(item => {
              const key = item.name || 'Unknown';
              productCounts[key] = (productCounts[key] || 0) + (item.quantity || 1);
            });
          }

          // aggregate by user
          const userEmail = order.userEmail || (order.customer && order.customer.email) || order.email || 'Khách vãng lai';
          if (!userStats[userEmail]) {
            userStats[userEmail] = { totalOrders: 0, totalAmount: 0 };
          }
          userStats[userEmail].totalOrders += 1;
          userStats[userEmail].totalAmount += orderTotal;
          
          // pending proofs check
          if (order.status === 'pending_payment' && order.paymentProofUrl) {
            pendingProofs.push(order);
          } else if (order.status === 'confirmed' && order.paymentProofUrl) {
            approvedProofs.push(order);
          } else if (order.status === 'cancelled' && order.paymentProofUrl) {
            cancelledProofs.push(order);
          }
      }); // End of orders loop

      const sortedDates = Object.keys(revenueByDate).sort();
      const labels = sortedDates.slice(-30); // Last 30 keys
      const data = labels.map(date => revenueByDate[date]);

      // Cập nhật tổng doanh thu & số đơn
      const totalRevenueEl = document.getElementById('totalRevenue');
      const totalOrdersEl = document.getElementById('totalOrders');
      if (totalRevenueEl) totalRevenueEl.textContent = formatVND(totalRevenue);
      if (totalOrdersEl) totalOrdersEl.textContent = orders.length.toString();

      // Vẽ hoặc cập nhật chart
      const ctx = document.getElementById('revenueChart');
      if (ctx) {
        if (revenueChart) revenueChart.destroy();
        revenueChart = new Chart(ctx, {
          type: 'line',
          data: { labels, datasets: [{
            label: 'Doanh thu (VND)', data, borderColor: '#27ae60',
            backgroundColor: 'rgba(39, 174, 96, 0.1)', tension: 0.3, fill: true
          }]},
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: true, position: 'top' } },
            scales: { y: { beginAtZero: true, ticks: { callback: v=>formatVND(v) } } }
          }
        });
      }

      // cập nhật bảng sản phẩm bán chạy
      const tbody = document.querySelector('#topProductsTable tbody');
      if (tbody) {
        const sortedProducts = Object.entries(productCounts)
          .sort((a,b)=>b[1]-a[1]);
        
        let totalQuantity = sortedProducts.reduce((sum, [_, count]) => sum + count, 0);
        
        tbody.innerHTML = '';
        sortedProducts.forEach(([name, count], index) => {
          const tr = document.createElement('tr');
          
          // Tên sản phẩm
          const td1 = document.createElement('td');
          td1.textContent = name;
          
          // Số lượng
          const td2 = document.createElement('td');
          const quantityDiv = document.createElement('div');
          quantityDiv.className = 'product-quantity';
          quantityDiv.textContent = count;
          td2.appendChild(quantityDiv);
          
          // Tỷ lệ %
          const td3 = document.createElement('td');
          const percent = totalQuantity > 0 ? ((count / totalQuantity) * 100).toFixed(1) : 0;
          const percentSpan = document.createElement('span');
          percentSpan.className = 'product-percent';
          percentSpan.textContent = percent + '%';
          td3.appendChild(percentSpan);
          
          // Xếp hạng
          const td4 = document.createElement('td');
          const rankSpan = document.createElement('span');
          rankSpan.className = 'product-rank rank-' + (index === 0 ? '1' : index === 1 ? '2' : index === 2 ? '3' : 'other');
          if (index === 0) rankSpan.textContent = '🥇';
          else if (index === 1) rankSpan.textContent = '🥈';
          else if (index === 2) rankSpan.textContent = '🥉';
          else rankSpan.textContent = '#' + (index + 1);
          td4.appendChild(rankSpan);
          
          tr.appendChild(td1);
          tr.appendChild(td2);
          tr.appendChild(td3);
          tr.appendChild(td4);
          tbody.appendChild(tr);
        });
      }

      // Cập nhật bảng Mua hàng theo từng user
      const userTbody = document.querySelector('#perUserTable tbody');
      if (userTbody) {
        const sortedUsers = Object.entries(userStats).sort((a,b) => b[1].totalAmount - a[1].totalAmount);
        userTbody.innerHTML = '';
        sortedUsers.forEach(([email, stats]) => {
          const tr = document.createElement('tr');
          const tdEmail = document.createElement('td');
          tdEmail.textContent = email;
          const tdOrders = document.createElement('td');
          tdOrders.textContent = stats.totalOrders;
          tdOrders.style.textAlign = 'center';
          const tdAmount = document.createElement('td');
          tdAmount.textContent = formatVND(stats.totalAmount);
          tdAmount.style.textAlign = 'right';
          tdAmount.style.fontWeight = 'bold';
          tdAmount.style.color = '#27ae60';
          
          tr.appendChild(tdEmail);
          tr.appendChild(tdOrders);
          tr.appendChild(tdAmount);
          userTbody.appendChild(tr);
        });
      }

      // render danh sách chờ duyệt minh chứng
      renderPendingProofs(pendingProofs);

    } catch(e) { console.error('processing orders failed', e); }
  } // End of processOrdersAndUpdateChart

  // Robust parser to extract numeric order total from various field names or product lists
  function getOrderTotal(o){
    try{
      const candidates = [o.total, o.amount, o.totalAmount, o.subtotal, o.price, o.payAmount, o.tongTien];
      for (let v of candidates){
        if (v===undefined || v===null) continue;
        if (typeof v === 'number' && !isNaN(v)) return Number(v);
        if (typeof v === 'string'){
          const cleaned = v.replace(/[^0-9.,-]/g, '').replace(/,/g,'.');
          const parsed = parseFloat(cleaned);
          if (!isNaN(parsed)) return parsed;
        }
      }
      if (Array.isArray(o.products)){
        let s = 0;
        o.products.forEach(p=>{ const q = Number(p.quantity||p.qty||1); const pr = Number(p.price||p.unitPrice||p.amount||0); if (!isNaN(q) && !isNaN(pr)) s += q*pr; });
        if (s>0) return s;
      }
    }catch(e){ console.warn('getOrderTotal parse failed', e); }
    return 0;
  }

  // --- Logic Phê duyệt minh chứng ---
  let currentProofOrder = null;

  function renderPendingProofs(proofs) {
    const tbody = document.querySelector('#proofsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (proofs.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" style="text-align: center; padding: 20px;">Không có đơn hàng nào chờ duyệt.</td>`;
      tbody.appendChild(tr);
      return;
    }

    proofs.forEach(order => {
      const tr = document.createElement('tr');
      
      const orderId = order.orderId || order.id || 'N/A';
      const customerInfo = order.customer ? `${order.customer.name}<br><small>${order.customer.phone}</small>` : (order.userEmail || 'Khách');
      const amount = formatVND(getOrderTotal(order));
      let time = '-';
      if (order.createdAt && order.createdAt.toDate) time = order.createdAt.toDate().toLocaleString('vi-VN');
      else if (order.orderDate) time = order.orderDate;

      tr.innerHTML = `
        <td><strong>${orderId}</strong></td>
        <td>${customerInfo}</td>
        <td style="text-align: right; color: #27ae60; font-weight: bold;">${amount}</td>
        <td style="text-align: center;">${time}</td>
        <td style="text-align: center;">
          <button class="btn btn-primary" onclick="window.viewProof('${order.id}')" style="background:#0d6efd; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Xem minh chứng</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Cập nhật biến global để nút xem dùng
    window.currentPendingProofs = proofs;
    renderApprovedProofs(approvedProofs);
    renderCancelledProofs(cancelledProofs);
  }

  function renderApprovedProofs(proofs) {
    const tbody = document.querySelector('#approvedProofsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (proofs.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" style="text-align: center; padding: 20px;">Không có minh chứng nào đã duyệt.</td>`;
      tbody.appendChild(tr);
      return;
    }

    proofs.forEach(order => {
      const tr = document.createElement('tr');
      
      const orderId = order.orderId || order.id || 'N/A';
      const customerInfo = order.customer ? `${order.customer.name}<br><small>${order.customer.phone}</small>` : (order.userEmail || 'Khách');
      const amount = formatVND(getOrderTotal(order));
      let time = '-';
      if (order.confirmedAt) time = new Date(order.confirmedAt).toLocaleString('vi-VN');
      else if (order.createdAt && order.createdAt.toDate) time = order.createdAt.toDate().toLocaleString('vi-VN');
      else if (order.orderDate) time = order.orderDate;

      tr.innerHTML = `
        <td><strong>${orderId}</strong></td>
        <td>${customerInfo}</td>
        <td style="text-align: right; color: #27ae60; font-weight: bold;">${amount}</td>
        <td style="text-align: center;">${time}</td>
        <td style="text-align: center;">
          <button class="btn btn-primary" onclick="window.viewProofOnly('${order.paymentProofUrl}')" style="background:#28a745; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Xem lại</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderCancelledProofs(proofs) {
    const tbody = document.querySelector('#cancelledProofsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (proofs.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" style="text-align: center; padding: 20px;">Không có minh chứng nào đã hủy.</td>`;
      tbody.appendChild(tr);
      return;
    }

    proofs.forEach(order => {
      const tr = document.createElement('tr');
      
      const orderId = order.orderId || order.id || 'N/A';
      const customerInfo = order.customer ? `${order.customer.name}<br><small>${order.customer.phone}</small>` : (order.userEmail || 'Khách');
      const amount = formatVND(getOrderTotal(order));
      const cancelReason = order.cancelReason || 'Không hợp lệ';

      tr.innerHTML = `
        <td><strong>${orderId}</strong></td>
        <td>${customerInfo}</td>
        <td style="text-align: right; color: #27ae60; font-weight: bold;">${amount}</td>
        <td style="text-align: left; color: #dc3545;">${cancelReason}</td>
        <td style="text-align: center;">
          <button class="btn btn-primary" onclick="window.viewProofOnly('${order.paymentProofUrl}')" style="background:#6c757d; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Xem lại</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  window.viewProof = function(id) {
    const proofs = window.currentPendingProofs || [];
    currentProofOrder = proofs.find(o => o.id === id);
    if (currentProofOrder) {
      document.getElementById('proofImage').src = currentProofOrder.paymentProofUrl;
      document.getElementById('proofModal').style.display = 'flex';
      document.getElementById('proofModal').setAttribute('aria-hidden', 'false');
    }
  };

  window.viewProofOnly = function(url) {
    document.getElementById('proofViewOnlyImage').src = url;
    document.getElementById('proofViewOnlyModal').style.display = 'flex';
    document.getElementById('proofViewOnlyModal').setAttribute('aria-hidden', 'false');
  };

  document.getElementById('proofModalClose').addEventListener('click', () => {
    document.getElementById('proofModal').style.display = 'none';
    currentProofOrder = null;
  });

  const closeViewOnlyBtn1 = document.getElementById('proofViewOnlyModalClose');
  const closeViewOnlyBtn2 = document.getElementById('btnCloseViewOnlyProof');
  if(closeViewOnlyBtn1) closeViewOnlyBtn1.addEventListener('click', () => { document.getElementById('proofViewOnlyModal').style.display = 'none'; });
  if(closeViewOnlyBtn2) closeViewOnlyBtn2.addEventListener('click', () => { document.getElementById('proofViewOnlyModal').style.display = 'none'; });


  document.getElementById('btnApproveProof').addEventListener('click', async () => {
    if (!currentProofOrder) return;
    if (!confirm(`Xác nhận duyệt đơn hàng ${currentProofOrder.orderId || currentProofOrder.id}?`)) return;
    
    try {
      await db.collection('orders').doc(currentProofOrder.id).update({
        status: 'confirmed',
        paymentStatus: 'paid'
      });
      const userEmail = currentProofOrder.userEmail || (currentProofOrder.customer && currentProofOrder.customer.email);
      if (userEmail) {
        await db.collection('users').doc(userEmail).collection('orders').doc(currentProofOrder.id).update({
          status: 'confirmed',
          paymentStatus: 'paid'
        }).catch(e => console.warn('Failed to sync to user orders:', e));
      }
      alert('Đã duyệt đơn hàng thành công!');
      document.getElementById('proofModal').style.display = 'none';
      currentProofOrder = null;
    } catch (e) {
      alert('Lỗi duyệt đơn: ' + e.message);
    }
  });

  document.getElementById('btnRejectProof').addEventListener('click', async () => {
    if (!currentProofOrder) return;
    const reason = prompt('Nhập lý do hủy (VD: Minh chứng giả, sai số tiền...):', 'Minh chứng không hợp lệ');
    if (reason === null) return;
    
    try {
      await db.collection('orders').doc(currentProofOrder.id).update({
        status: 'cancelled',
        cancelReason: reason
      });
      const userEmail = currentProofOrder.userEmail || (currentProofOrder.customer && currentProofOrder.customer.email);
      if (userEmail) {
        await db.collection('users').doc(userEmail).collection('orders').doc(currentProofOrder.id).update({
          status: 'cancelled',
          cancelReason: reason
        }).catch(e => console.warn('Failed to sync to user orders:', e));
      }
      alert('Đã hủy đơn hàng!');
      document.getElementById('proofModal').style.display = 'none';
      currentProofOrder = null;
    } catch (e) {
      alert('Lỗi hủy đơn: ' + e.message);
    }
  });

  // Realtime listeners are initialized by initRealtimeListeners()

  // Show admin detail modal helper
  function showAdminModal(user) {
    try {
      const modal = document.getElementById('adminDetailModal');
      if (!modal) return;
      modal.querySelector('.modal-email').textContent = user.email || '-';
      modal.querySelector('.modal-name').textContent = user.name || '-';
      modal.querySelector('.modal-role').textContent = user.role || '-';
      // reuse last-login detection logic
      let last = '-';
      try {
        if (user.lastLogin && user.lastLogin.toDate) { last = user.lastLogin.toDate().toLocaleString('vi-VN'); }
        else if (user.lastLogin) { const d = new Date(user.lastLogin); if (!isNaN(d.getTime())) last = d.toLocaleString('vi-VN'); }
      } catch(e){}
      if (last === '-' && user.loginTime) { const d = new Date(user.loginTime); if (!isNaN(d.getTime())) last = d.toLocaleString('vi-VN'); }
      if (last === '-' && user.last_login) { const d = new Date(user.last_login); if (!isNaN(d.getTime())) last = d.toLocaleString('vi-VN'); }
      modal.querySelector('.modal-lastlogin').textContent = last;
      modal.querySelector('.modal-request').textContent = user.requestAdmin ? 'Có' : '—';
      const rawEl = modal.querySelector('.modal-raw');
      try { rawEl.textContent = JSON.stringify(user, null, 2); } catch(e){ rawEl.textContent = String(user); }

      // show
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden','false');
      // close handlers
      const closeBtn = document.getElementById('adminModalClose');
      if (closeBtn) closeBtn.onclick = () => { modal.style.display = 'none'; modal.setAttribute('aria-hidden','true'); };
      modal.onclick = (ev) => { if (ev.target === modal) { modal.style.display='none'; modal.setAttribute('aria-hidden','true'); } };
    } catch (e) { console.error('showAdminModal error', e); }
  }

  // Attach click handler to header user-info to show admin popup
  try {
    const headerUserInfo = document.querySelector('.user-info');
    if (headerUserInfo) {
      headerUserInfo.style.cursor = 'pointer';
      headerUserInfo.title = 'Xem thông tin tài khoản';
      headerUserInfo.addEventListener('click', async () => {
        try {
          const local = getCurrentUser();
          if (local && local.email) {
            // Ensure db available
            try {
              if (!db) {
                const ready = await waitForFirebase(8000);
                if (ready) db = firebase.firestore();
                else { showAdminModal(local); return; }
              }
              const doc = await db.collection('users').doc(local.email.toLowerCase()).get();
              if (doc.exists) {
                const data = Object.assign({ id: doc.id }, doc.data());
                showAdminModal(data);
                return;
              }
            } catch (e) {
              console.warn('Failed to fetch user doc for header modal', e);
            }
            // fallback to local data
            showAdminModal(local);
          } else {
            // no local user, just show placeholder
            showAdminModal({ email: '-', name: '-', role: '-', requestAdmin: false });
          }
        } catch (e) { console.error('headerUserInfo click error', e); }
      });
    }
  } catch (e) { /* ignore attach errors */ }

  // Chạy lần đầu nếu muốn
  //loadAndDisplayRevenueChart();

  // Real-time users listener is attached in initRealtimeListeners().

  // Logout handler - moved to header button (btnLogoutHeader)
  // document.getElementById('btnLogout').addEventListener('click', ()=>{
  //   localStorage.removeItem('authToken');
  //   localStorage.removeItem('loggedUser');
  //   localStorage.removeItem('loggedInUser');
  //   window.location.href = 'login.html';
  // });

  // Sidebar navigation behavior: show/hide sections and highlight active link
  function showSection(id) {
    const sections = ['dashboardSection','usersSection','ordersSection','productsSection','settingsSection', 'proofsSection'];
    sections.forEach(s => {
      const el = document.getElementById(s);
      if (!el) return;
      el.style.display = (s === id) ? '' : 'none';
    });
    // when settings section becomes visible, load current values
    if (id === 'settingsSection') {
      if (typeof loadSettings === 'function') loadSettings();
    }
  }

  function setActiveLink(linkEl) {
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    if (linkEl) linkEl.classList.add('active');
  }

  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    a.addEventListener('click', (ev) => {
      const href = a.getAttribute('href') || '';
      // If this is a real page link (points to a .html), allow normal navigation
      if (href && href.endsWith('.html') && href !== '#') {
        // Let browser navigate normally
        return;
      }
      ev.preventDefault();
      const id = a.id || a.getAttribute('href');
      // map link id/href to section ids
      let target = 'dashboardSection';
      if (a.id === 'link-users') target = 'usersSection';
      if (a.id === 'link-orders') target = 'ordersSection';
      if (a.id === 'link-products') target = 'productsSection';
      if (a.id === 'link-settings') target = 'settingsSection';
      if (a.id === 'link-proofs') target = 'proofsSection';
      
      showSection(target);
      setActiveLink(a);
      // scroll main content into view
      const mainContent = document.querySelector('.main-content');
      if (mainContent) mainContent.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Initialize: show dashboard
  showSection('dashboardSection');
  const active = document.querySelector('.sidebar-nav a.active') || document.querySelector('.sidebar-nav a');
  setActiveLink(active);

  // --- Settings elements may not exist anymore (admin.html was refactored).
  // Guard any settings-related wiring so page doesn't throw when elements are absent.
  (function guardSettingsHandlers(){
    const saveBtn = document.getElementById('saveSettingsBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveSettingsSafely);

    const shippingEl = document.getElementById('shippingFee');
    if (shippingEl) {
      const other = document.getElementById('shippingFeeOther');
      shippingEl.addEventListener('change', function(){ if (other) other.style.display = this.value === 'other' ? '' : 'none'; });
    }
    const freeEl = document.getElementById('freeShipThreshold');
    if (freeEl) {
      const otherF = document.getElementById('freeShipOther');
      freeEl.addEventListener('change', function(){ if (otherF) otherF.style.display = this.value === 'other' ? '' : 'none'; });
    }

    async function saveSettingsSafely(){
      try { await saveSettings(); } catch(e){ console.warn('saveSettings not available or failed', e); }
    }
    // Provide a no-op saveSettings/loadSettings to avoid reference errors when settings UI removed
    async function saveSettings() { console.warn('saveSettings called but settings UI not present'); }
    async function loadSettings() { /* no-op when settings not present */ }
  })();

  // --- Doanh thu theo ngày (chi tiết) ---
  document.getElementById('fetchRevenueDayBtn') && document.getElementById('fetchRevenueDayBtn').addEventListener('click', fetchRevenueForDate);

  async function fetchRevenueForDate(){
    try {
      const dateVal = (document.getElementById('revenueDate')||{}).value;
      if (!dateVal) return alert('Chọn ngày cần xem doanh thu');
      if (!db) { await waitForFirebase(5000); if (!db && window.firebase) db = firebase.firestore(); }
      if (!db) return alert('Không thể kết nối Firestore');
      const d = new Date(dateVal + 'T00:00:00');
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0,0);
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23,59,59,999);
      let snap;
      try {
        snap = await db.collection('orders').where('createdAt', '>=', firebase.firestore.Timestamp.fromDate(start)).where('createdAt', '<=', firebase.firestore.Timestamp.fromDate(end)).get();
      } catch(e) {
        // fallback: try query without timestamps (maybe orders use string orderDate)
        snap = await db.collection('orders').get();
      }
      const rows = [];
      let total = 0;
      if (snap && typeof snap.forEach === 'function') {
        snap.forEach(d => {
          const o = d.data();
          // if we fetched all orders fallback, filter by orderDate string
          if (o.createdAt && o.createdAt.toDate) {
            const dt = o.createdAt.toDate();
            if (dt >= start && dt <= end) { const item = Object.assign({ id: d.id }, o); item._parsedTotal = getOrderTotal(o); rows.push(item); total += item._parsedTotal; }
          } else if (o.orderDate) {
            const od = typeof o.orderDate === 'string' ? o.orderDate : (o.orderDate && o.orderDate.toDate ? o.orderDate.toDate().toLocaleDateString('vi-VN') : '');
            const formatted = (new Date(dateVal)).toLocaleDateString('vi-VN');
            if (String(od).indexOf(formatted) !== -1) { const item = Object.assign({ id: d.id }, o); item._parsedTotal = getOrderTotal(o); rows.push(item); total += item._parsedTotal; }
          }
        });
      }
      // render
      document.getElementById('dailyTotal').textContent = formatVND(total);
      const container = document.getElementById('dailyRevenueContainer');
      const tbody = document.querySelector('#dailyRevenueTable tbody');
      if (tbody) {
        tbody.innerHTML = '';
        rows.forEach(r=>{
          const tr = document.createElement('tr');
          const td1 = document.createElement('td'); td1.textContent = r.id || (r.orderId||'-');
          const td2 = document.createElement('td'); td2.textContent = r.userEmail || ((r.customer && r.customer.email) ? r.customer.email : 'Khách vãng lai');
          const td3 = document.createElement('td');
          try { td3.textContent = r.createdAt && r.createdAt.toDate ? r.createdAt.toDate().toLocaleString('vi-VN') : (r.orderDate || '-'); } catch(e){ td3.textContent = '-'; }
          const td4 = document.createElement('td'); td4.textContent = formatVND(r._parsedTotal || r.total || 0); td4.style.textAlign='right';
          tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3); tr.appendChild(td4);
          tbody.appendChild(tr);
        });
      }
      if (container) container.style.display = rows.length ? '' : 'none';
    } catch(e) { console.error('fetchRevenueForDate failed', e); alert('Lỗi khi lấy doanh thu: '+e); }
  }
}
