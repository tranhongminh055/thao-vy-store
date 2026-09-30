// Lấy các phần tử cần thiết
const cartItemsContainer = document.querySelector('.cart-items'); // chỉ render sản phẩm
const subtotalElement = document.getElementById('subtotal');
const discountElement = document.getElementById('discount');
const totalElement = document.getElementById('total');
const voucherInput = document.getElementById('voucher-code');
const applyVoucherButton = document.getElementById('apply-voucher');
const toggleVoucherButton = document.getElementById('toggle-voucher-list');
const voucherList = document.getElementById('voucher-list');
const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
const creditCardForm = document.getElementById('credit-card-form');
const bankTransferForm = document.getElementById('bank-transfer-form');
const checkoutButton = document.getElementById('checkout');

// Lắng nghe sự thay đổi voucher từ các thiết bị khác (real-time sync)
window.addEventListener('vouchersUpdated', function(event) {
    console.log('Vouchers updated from another device:', event.detail);
    // Render lại danh sách voucher
    if (typeof renderReceivedVouchers === 'function') {
        renderReceivedVouchers();
    }
});

// Lắng nghe sự thay đổi cart từ các thiết bị khác (real-time sync)
window.addEventListener('cartUpdated', function(event) {
    console.log('Cart updated from another device:', event.detail);
    cart = event.detail.cart || [];
    renderCart();
    updateTotal();
});

// Helper: Lưu cart và tự động sync lên Firestore
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    // Tự động sync nếu FirestoreSync sẵn sàng
    if (window.FirestoreSync && window.FirestoreSync.isInitialized()) {
        window.FirestoreSync.syncNow('cart').catch(e => {
            console.warn('Auto sync cart failed (non-critical):', e);
        });
    }
}

// Helper: Lưu applied voucher và tự động sync
function saveAppliedVoucher(code) {
    localStorage.setItem('appliedVoucher', code);
    if (window.FirestoreSync && window.FirestoreSync.isInitialized()) {
        window.FirestoreSync.syncNow('cart').catch(e => {
            console.warn('Auto sync voucher failed (non-critical):', e);
        });
    }
}

// Hàm chuẩn hóa giá từ LocalStorage
function getPriceNumber(value) {
    if (!value) return 0;
    return parseInt(value.toString().replace(/[^0-9]/g, '')) || 0;
}

// Hàm format VND
function formatVND(number) {
    return number.toLocaleString('vi-VN') + ' VND';
}

// Lấy giỏ hàng từ LocalStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// List of major Vietnamese banks to populate bank-select
const VIETNAM_BANKS = [
    'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)',
    'Ngân hàng TMCP Công Thương Việt Nam (VietinBank)',
    'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)',
    'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)',
    'Ngân hàng TMCP Á Châu (ACB)',
    'Ngân hàng TMCP Quân Đội (MB)',
    'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)',
    'Ngân hàng TMCP Phát triển Nhà TPHCM (HDBank)',
    'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)',
    'Ngân hàng Nông nghiệp và Phát triển Nông thôn (Agribank)',
    'Ngân hàng TMCP Sài Gòn (SCB)',
    'Ngân hàng TMCP Quốc Dân (NCB)',
    'Ngân hàng TMCP Đông Á (DongA Bank)',
    'Ngân hàng TMCP Phương Đông (OCB)',
    'Ngân hàng TMCP Hàng Hải (MSB)',
    'Ngân hàng TMCP Quốc Tế Việt Nam (VIB)',
    'Ngân hàng TMCP Bảo Việt (BaoVietBank)',
    'Ngân hàng TMCP Bưu Điện Liên Việt (LienVietPostBank)'
];

// Hiển thị giỏ hàng
function renderCart() {
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <h2>Giỏ hàng của bạn đang trống</h2>
                <p>Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm.</p>
                <a href="index.html" class="btn-continue-shopping">Tiếp tục mua sắm</a>
            </div>
        `;
        subtotalElement.textContent = '0 VND';
        totalElement.textContent = '0 VND';
        discountElement.textContent = '0 VND';
        return;
    }

    let cartHTML = `
        <div class="cart-header">
            <div>Sản phẩm</div>
            <div>Tên sản phẩm</div>
            <div>Giá</div>
            <div>Số lượng</div>
            <div>Tổng</div>
            <div>Thao tác</div>
        </div>
    `;

    cart.forEach((item, index) => {
        const price = getPriceNumber(item.price);
        cartHTML += `
            <div class="cart-item" data-index="${index}">
                <div class="item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="item-info">
                    <h3>${item.name}</h3>
                </div>
                <div class="item-price">${formatVND(price)}</div>
                <div class="quantity-control">
                    <button class="decrease">-</button>
                    <input type="number" value="${item.quantity}" min="1" class="item-quantity">
                    <button class="increase">+</button>
                </div>
                <div class="item-total">${formatVND(price * item.quantity)}</div>
                <div class="item-remove">
                    <button class="remove-item"><i class="fas fa-trash"></i> Xóa</button>
                </div>
            </div>
        `;
    });

    cartItemsContainer.innerHTML = cartHTML;
    updateTotal();
    // Cập nhật badge số lượng trên header
    if (typeof updateCartCount === 'function') updateCartCount();
}

// Cập nhật tổng tiền
function updateTotal() {
    const subtotal = cart.reduce((total, item) =>
        total + getPriceNumber(item.price) * item.quantity, 0
    );

    subtotalElement.textContent = formatVND(subtotal);

    // Nếu có voucher đã áp dụng, tính lại discount dựa trên subtotal (để giữ % luôn đúng khi thay đổi số lượng)
    const appliedCode = (localStorage.getItem('appliedVoucher') || '').toString().trim().toUpperCase();
    let discount = 0;
    if (appliedCode === 'SALE10') discount = subtotal * 0.1;
    else if (appliedCode === 'SALE20') discount = subtotal * 0.2;
    else if (appliedCode === 'FREESHIP') discount = 50000;
    else {
        // fallback: nếu không có appliedVoucher, dùng giá trị hiện tại trong discountElement
        discount = getPriceNumber(discountElement.textContent);
    }

    discountElement.textContent = formatVND(discount);
    const total = Math.max(subtotal - discount, 0);
    totalElement.textContent = formatVND(total);
}

// Thêm sự kiện sử dụng event delegation (một lần duy nhất)
function setupCartEventDelegation() {
    cartItemsContainer.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        // Tìm cart item parent
        const cartItem = button.closest('.cart-item');
        if (!cartItem) return;

        const index = parseInt(cartItem.getAttribute('data-index'), 10);
        if (isNaN(index)) return;

        // Xử lý nút tăng số lượng
        if (button.classList.contains('increase')) {
            if (cart[index]) {
                cart[index].quantity++;
                saveCart();
                renderCart();
            }
        }
        // Xử lý nút giảm số lượng
        else if (button.classList.contains('decrease')) {
            if (cart[index] && cart[index].quantity > 1) {
                cart[index].quantity--;
                saveCart();
                renderCart();
            }
        }
        // Xử lý nút xóa
        else if (button.classList.contains('remove-item')) {
            cart.splice(index, 1);
            saveCart();
            renderCart();
        }
    });
}

// Khởi tạo event delegation khi DOM đã sẵn sàng
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCartEventDelegation);
} else {
    setupCartEventDelegation();
}

// CLICK voucher từ danh sách
document.querySelectorAll('#voucher-list li[data-voucher]').forEach(voucherItem => {
    voucherItem.addEventListener('click', function () {
        voucherInput.value = this.getAttribute('data-voucher');
        voucherList.classList.add('hidden');
        applyVoucherButton.click();
    });
});

// Toggle danh sách voucher
toggleVoucherButton.addEventListener('click', function () {
    voucherList.classList.toggle('hidden');
});

// Áp dụng voucher
applyVoucherButton.addEventListener('click', function () {
    const code = voucherInput.value.trim().toUpperCase();
    const subtotal = cart.reduce((total, item) =>
        total + getPriceNumber(item.price) * item.quantity, 0
    );

    if (!code) {
        alert('Vui lòng nhập mã voucher!');
        return;
    }

    // Xác định giá trị giảm
    let discount = 0;
    if (code === "SALE10") discount = subtotal * 0.1;
    else if (code === "SALE20") discount = subtotal * 0.2;
    else if (code === "FREESHIP") discount = 50000;
    else {
        alert("Mã voucher không hợp lệ!");
        discountElement.textContent = formatVND(0);
        updateTotal();
        return;
    }

    // Nếu chưa lưu trong VoucherStore thì lưu (không chặn khi đã tồn tại)
    if (window.VoucherStore) {
        if (!window.VoucherStore.hasVoucher(code)) {
            window.VoucherStore.addVoucher(code);
            // send notification about voucher
            try {
                const user = JSON.parse(localStorage.getItem('loggedUser')) || JSON.parse(localStorage.getItem('loggedInUser')) || {};
                const email = (user && user.email) ? user.email.toString().toLowerCase().trim() : null;
                if (email && typeof notifyVoucherReceived === 'function') {
                    notifyVoucherReceived(email, code);
                    if (window.notificationsList && Array.isArray(notificationsList)) {
                        const now = new Date();
                        const tmp = { id: 'temp-' + Date.now(), recipientEmail: email, title: '🎁 Bạn vừa nhận voucher mới', message: `Voucher ${code} đã được thêm vào tài khoản của bạn.`, type: 'promotion', isRead: false, createdAt: now, updatedAt: now, voucherCode: code };
                        notificationsList.unshift(tmp);
                        saveNotificationsLocal(); updateUnreadCount(); updateNotificationBadge(); renderNotifications();
                    }
                }
            } catch(e){console.warn('notifyVoucherReceived error',e);}
        }
    }
    // Lưu voucher đã áp để tái tính sau khi refresh hoặc thay đổi giỏ
    saveAppliedVoucher(code);

    // Áp dụng giảm giá và cập nhật giao diện
    discountElement.textContent = formatVND(discount);
    updateTotal();
    renderReceivedVouchers();
    alert('Áp dụng voucher thành công!');
});

// Áp dụng voucher theo mã (sử dụng từ danh sách voucher đã nhận)
function applyVoucherByCode(code) {
    if (!code) return false;
    code = code.toString().trim().toUpperCase();
    // reflect code into input so user sees which voucher is applied
    if (voucherInput) voucherInput.value = code;
    // show preview
    const previewEl = document.getElementById('voucher-preview');
    if (previewEl) previewEl.textContent = code;
    const subtotal = cart.reduce((total, item) =>
        total + getPriceNumber(item.price) * item.quantity, 0
    );

    let discount = 0; // giá trị giảm mặc định là 0 nếu mã không hợp lệ
    if (code === "SALE10") discount = subtotal * 0.1; //    nếu mã là SALE10 thì giảm 10% trên subtotal
    else if (code === "SALE20") discount = subtotal * 0.2; // nếu mã là sale 20 thì giảm 20% trên subtotal
    else if (code === "FREESHIP") discount = 50000; // nếu mã là FREESHIP thì giảm 50k (giả sử phí ship là 50k)
    else {
        alert('Mã voucher không hợp lệ!');
        return false;
    }

    // Lưu mã đã áp để duy trì trạng thái sau refresh
    saveAppliedVoucher(code);
    discountElement.textContent = formatVND(discount);
    updateTotal();
    renderReceivedVouchers();
    return true;
}

// --- Address & banks dynamic population ---
document.addEventListener('DOMContentLoaded', () => {
    // populate bank-list
    const bankSelect = document.getElementById('bank-list');
    if (bankSelect) {
        VIETNAM_BANKS.forEach(b => {
            const opt = document.createElement('option'); opt.value = b; opt.textContent = b; bankSelect.appendChild(opt);
        });
    }

    // address selects
    const cityEl = document.getElementById('city-select');
    const districtEl = document.getElementById('district-select');
    const wardEl = document.getElementById('ward-select');
    const detailEl = document.getElementById('customer-address');
    const mapEl = document.getElementById('map');

    // Helper: Cập nhật bản đồ dựa trên query địa chỉ
    function setMapQuery(q){ if(!mapEl) return; const src = 'https://www.google.com/maps?q=' + encodeURIComponent(q) + '&output=embed'; mapEl.innerHTML = `<iframe width="100%" height="100%" frameborder="0" style="border:0" src="${src}" allowfullscreen="" loading="lazy"></iframe>`; }

    // load address dataset
    fetch('vn-address.json').then(r=>r.json()).then(data=>{
        // fill cities
        if(cityEl){
            cityEl.innerHTML = '<option value="">Chọn Tỉnh/TP</option>';
            Object.keys(data).forEach(city => { const o = document.createElement('option'); o.value = city; o.textContent = city; cityEl.appendChild(o); });
        }

        function populateDistricts(city){
            districtEl.innerHTML = '<option value="">Chọn Quận/Huyện</option>';
            wardEl.innerHTML = '<option value="">Chọn Phường/Xã</option>';
            if(!city || !data[city]) return;
            Object.keys(data[city]).forEach(dist => { const o = document.createElement('option'); o.value = dist; o.textContent = dist; districtEl.appendChild(o); });
        }

        function populateWards(city, district){
            wardEl.innerHTML = '<option value="">Chọn Phường/Xã</option>';
            if(!city || !district || !data[city] || !data[city][district]) return;
            data[city][district].forEach(w => { const o = document.createElement('option'); o.value = w; o.textContent = w; wardEl.appendChild(o); });
        }

        // restore selection from orderData if present
        let od = {};
        try{ od = JSON.parse(localStorage.getItem('orderData')||'{}'); }catch(e){ od = {}; }
        if(od && od.customer && od.customer.addressStructured){
            const s = od.customer.addressStructured;
            if(s.city) cityEl.value = s.city;
            populateDistricts(s.city);
            if(s.district) districtEl.value = s.district;
            populateWards(s.city, s.district);
            if(s.ward) wardEl.value = s.ward;
            if(detailEl) detailEl.value = s.detail || '';
            // update map
            setMapQuery([s.detail||'', s.ward||'', s.district||'', s.city||''].filter(Boolean).join(', '));
        }

        cityEl && cityEl.addEventListener('change', function(){ populateDistricts(this.value); saveStructuredAddress(); });
        districtEl && districtEl.addEventListener('change', function(){ populateWards(cityEl.value, this.value); saveStructuredAddress(); });
        wardEl && wardEl.addEventListener('change', function(){ saveStructuredAddress(); });
        detailEl && detailEl.addEventListener('input', function(){ saveStructuredAddress(); });

        function saveStructuredAddress(){
            const city = cityEl ? cityEl.value : '';
            const district = districtEl ? districtEl.value : '';
            const ward = wardEl ? wardEl.value : '';
            const detail = detailEl ? detailEl.value.trim() : '';
            const structured = { city, district, ward, detail };
            try{
                const existing = JSON.parse(localStorage.getItem('orderData')||'{}');
                existing.customer = existing.customer || {};
                existing.customer.addressStructured = structured;
                // also set a simple address string
                existing.customer.address = [detail, ward, district, city].filter(Boolean).join(', ');
                localStorage.setItem('orderData', JSON.stringify(existing));
            }catch(e){}
            // update map
            const q = [detail, ward, district, city].filter(Boolean).join(', ');
            if(q) setMapQuery(q);
        }

    }).catch(err=>{ console.warn('Could not load vn-address.json', err); });
});

// Render danh sách voucher đã nhận trong giỏ hàng
function renderReceivedVouchers() {
    const container = document.getElementById('received-voucher-list');
    if (!container || !window.VoucherStore) return;
    const list = window.VoucherStore.getVouchers();
    container.innerHTML = '';
    if (list.length === 0) {
        container.innerHTML = '<li>Chưa có voucher nào</li>';
        return;
    }
    list.forEach(v => {
        const li = document.createElement('li');
        li.textContent = `${v.code}`;

        const applyBtn = document.createElement('button');
        applyBtn.textContent = 'Áp dụng';
        applyBtn.style.marginLeft = '8px';
        applyBtn.addEventListener('click', () => {
            applyVoucherByCode(v.code);
        });

        const btn = document.createElement('button');
        btn.textContent = 'Xóa';
        btn.style.marginLeft = '8px';
        btn.addEventListener('click', () => {
            // Nếu xóa voucher đang áp thì xoá luôn trạng thái applied
            const applied = (localStorage.getItem('appliedVoucher') || '').toString().trim().toUpperCase();
            if (applied === v.code) {
                saveAppliedVoucher('');
                // reset discount
                discountElement.textContent = formatVND(0);
            }
            window.VoucherStore.removeVoucher(v.code);
            renderReceivedVouchers();
            updateTotal();
        });

        // Nếu voucher đang được áp dụng, hiển thị trạng thái
        const appliedCode = (localStorage.getItem('appliedVoucher') || '').toString().trim().toUpperCase();
        if (appliedCode === v.code) {
            const span = document.createElement('span');
            span.textContent = 'Đã áp dụng';
            span.style.marginLeft = '8px';
            li.appendChild(span);
            // ensure input shows the applied voucher
            if (voucherInput) voucherInput.value = v.code;
            const previewEl = document.getElementById('voucher-preview');
            if (previewEl) previewEl.textContent = v.code;
        } else {
            li.appendChild(applyBtn);
        }

        li.appendChild(btn);
        container.appendChild(li);
    });
}

// show voucher preview while typing and try to match received vouchers
if (voucherInput) {
    voucherInput.addEventListener('input', () => {
        const q = voucherInput.value.toString().trim().toUpperCase();
        const previewEl = document.getElementById('voucher-preview');
        if (!previewEl) return;
        if (!q) { previewEl.textContent = ''; return; }

        // search in VoucherStore first
        let found = null;
        if (window.VoucherStore) {
            const vs = window.VoucherStore.getVouchers();
            found = vs.find(v => v.code && v.code.toString().toUpperCase() === q);
        }
        // fallback: search static voucher-list items
        if (!found) {
            const listItems = document.querySelectorAll('#voucher-list li[data-voucher]');
            listItems.forEach(li => {
                if (li.getAttribute('data-voucher') && li.getAttribute('data-voucher').toUpperCase() === q) found = { code: q };
            });
        }

        previewEl.textContent = found ? (found.code || q) : 'Mã chưa xác nhận';
    });
}

// Chọn phương thức thanh toán
paymentMethods.forEach(method => {
    method.addEventListener('change', function () {
        creditCardForm.classList.add('hidden');
        bankTransferForm.classList.add('hidden');

        if (this.value === 'credit-card') creditCardForm.classList.remove('hidden');
        if (this.value === 'bank-transfer') bankTransferForm.classList.remove('hidden');
    });
});

// Chọn tab phương thức thanh toán
function selectPayTab(method) {
    document.getElementById('selected-payment').value = method;
    document.getElementById('tab-qr').classList.toggle('active', method === 'qr');
    document.getElementById('tab-cod').classList.toggle('active', method === 'cod');
    document.getElementById('qr-info-box').style.display = method === 'qr' ? '' : 'none';
    document.getElementById('cod-info-box').style.display = method === 'cod' ? '' : 'none';
}

// Thanh toán
checkoutButton.addEventListener('click', async () => {
    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const address = document.getElementById('customer-address').value.trim();

    if (!name || !phone || !address) {
        alert('Vui lòng nhập đầy đủ thông tin khách hàng!');
        return;
    }

    const subtotal = cart.reduce((t, item) => t + getPriceNumber(item.price) * item.quantity, 0);
    const discount = getPriceNumber(discountElement.textContent);
    const total = Math.max(subtotal - discount, 0);

    if (total <= 0) {
        alert('Giỏ hàng trống hoặc tổng tiền không hợp lệ!');
        return;
    }

    const paymentMethod = document.getElementById('selected-payment').value;
    const orderId = `TVS${Date.now()}`;

    const orderData = {
        orderId,
        orderDate: new Date().toLocaleDateString('vi-VN'),
        confirmTime: '30 phút sau khi đặt hàng',
        deliveryTime: '2-3 ngày làm việc',
        products: cart,
        subtotal, discount, total,
        customer: { name, phone, address },
        payment: { method: paymentMethod },
    };
    
    if (paymentMethod === 'qr') {
        // Mở popup QR
        const qrModal = document.getElementById('qr-payment-modal');
        document.getElementById('qr-amount-text').textContent = formatVND(total);
        qrModal.style.display = 'flex';
        
        // Reset file input
        const fileInput = document.getElementById('payment-proof-input');
        const previewImg = document.getElementById('proof-preview-img');
        const previewContainer = document.getElementById('proof-preview-container');
        fileInput.value = '';
        previewImg.src = '';
        previewContainer.style.display = 'none';

        // Gắn orderData hiện tại vào global để xử lý lúc submit modal
        window.currentOrderData = orderData;
    } else {
        localStorage.setItem('orderData', JSON.stringify(orderData));
        // COD — chuyển thẳng đến trang xác nhận
        window.location.href = 'hoadonxacnhan.html';
    }
});

// Setup QR Modal logic
document.getElementById('close-qr-modal').addEventListener('click', () => {
    document.getElementById('qr-payment-modal').style.display = 'none';
});

document.getElementById('payment-proof-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('proof-preview-img').src = e.target.result;
            document.getElementById('proof-preview-container').style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
});

document.getElementById('submit-qr-payment').addEventListener('click', async () => {
    const fileInput = document.getElementById('payment-proof-input');
    const file = fileInput.files[0];
    if (!file) {
        alert('Vui lòng upload minh chứng chuyển khoản!');
        return;
    }
    
    const submitBtn = document.getElementById('submit-qr-payment');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Đang tải lên...';
    submitBtn.disabled = true;

    // Nén ảnh bằng Canvas để tránh vượt quá dung lượng 1MB của Firestore
    const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.5) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height *= maxWidth / width));
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width *= maxHeight / height));
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = err => reject(err);
            };
            reader.onerror = err => reject(err);
        });
    };

    try {
        const orderData = window.currentOrderData;
        
        // Nén ảnh sang base64 thay vì lưu lên Firebase Storage để tránh lỗi quota
        const base64Url = await compressImage(file);
        
        // Gắn URL minh chứng và trạng thái chờ duyệt vào orderData
        orderData.paymentProofUrl = base64Url;
        orderData.status = 'pending_payment';
        
        // Lưu thông tin đơn hàng và chuyển trang xác nhận
        localStorage.setItem('orderData', JSON.stringify(orderData));
        window.location.href = 'hoadonxacnhan.html';
        
    } catch (err) {
        console.error('Upload proof error:', err);
        alert('Lỗi tải lên minh chứng: ' + (err.message || err));
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Sync customer info edits to localStorage.orderData so confirmation page sees latest values
(function syncCartCustomerToOrder(){
    const nameEl = document.getElementById('customer-name');
    const phoneEl = document.getElementById('customer-phone');
    const addrEl = document.getElementById('customer-address');
    function saveOrderDataPartial(){
        try{
            const raw = localStorage.getItem('orderData');
            const od = raw ? JSON.parse(raw) : {};
            od.customer = od.customer || {};
            if(nameEl) od.customer.name = nameEl.value.trim();
            if(phoneEl) od.customer.phone = phoneEl.value.trim();
            if(addrEl) od.customer.address = addrEl.value.trim();
            localStorage.setItem('orderData', JSON.stringify(od));
        }catch(e){/* ignore */}
    }
    [nameEl, phoneEl, addrEl].forEach(el=>{ if(!el) return; el.addEventListener('input', saveOrderDataPartial); });
})();

// Render giỏ hàng khi tải trang
renderCart();

// Prefill customer and payment fields from orderData (used for reorder flow)
function prefillOrderData(){
    try{
        const od = JSON.parse(localStorage.getItem('orderData')||'{}');
        if(!od) return;
        // customer
        if(od.customer){
            const nameEl = document.getElementById('customer-name');
            const phoneEl = document.getElementById('customer-phone');
            const addrEl = document.getElementById('customer-address');
            if(nameEl && od.customer.name) nameEl.value = od.customer.name;
            if(phoneEl && od.customer.phone) phoneEl.value = od.customer.phone;
            if(addrEl && od.customer.address) addrEl.value = od.customer.address;
        }
        // payment
        if(od.payment && od.payment.method){
            const method = od.payment.method;
            const pmRadio = document.querySelector('input[name="payment-method"][value="'+method+'"]');
            if(pmRadio){ pmRadio.checked = true; pmRadio.dispatchEvent(new Event('change')); }
            const d = od.payment.details || {};
            if(method === 'credit-card'){
                const cardNumEl = document.getElementById('card-number');
                const cardHolderEl = document.getElementById('card-holder');
                const expiryEl = document.getElementById('expiry-date');
                if(cardNumEl && d.cardNumber) cardNumEl.value = d.cardNumber;
                if(cardHolderEl && d.cardHolder) cardHolderEl.value = d.cardHolder;
                if(expiryEl && d.expiry) expiryEl.value = d.expiry;
            } else if(method === 'bank-transfer'){
                const bankSelect = document.getElementById('bank-list');
                const accNumEl = document.getElementById('bank-account-number');
                const accNameEl = document.getElementById('bank-account-name');
                if(bankSelect && d.bank) bankSelect.value = d.bank;
                if(accNumEl && d.accountNumber) accNumEl.value = d.accountNumber;
                if(accNameEl && d.accountName) accNameEl.value = d.accountName || '';
                const noteEl = document.getElementById('bank-account-note');
                if(noteEl && d.note) noteEl.value = d.note || '';
            }
        }
    }catch(e){/* ignore */}
}

// Try to prefill before user interacts
prefillOrderData();

// Render voucher đã nhận khi tải trang
renderReceivedVouchers();

// Render khi tải trang
renderCart();

// Nếu muốn khởi tạo giỏ hàng mẫu, hãy sử dụng đoạn này một lần duy nhất hoặc khi cần reset giỏ hàng:
// const sampleCart = [
//     {
//         name: "Áo thun nam",
//         quantity: 2,
//         price: 150000,
//         image: "path/to/image1.jpg",
//     },
//     {
//         name: "Quần jeans nữ",
//         quantity: 1,
//         price: 350000,
//         image: "path/to/image2.jpg",
//     },
// ];
// localStorage.setItem('cart', JSON.stringify(sampleCart));