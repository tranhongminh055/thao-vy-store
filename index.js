// Danh sách sản phẩm mẫu
const products = [
    "Bánh 2010 Đặc Biệt",
    "Bánh Gato Pháp",
    "Bánh Tiramisu Ý",
    "Bánh Sinh Nhật",
    "Bánh Cupcake",
    "Bánh Mousse",
    "Bánh Tart",
    "Bánh Bông Lan",
    "Bánh Kem Dâu",
    "Bánh Flan",
    "Bánh Bánh Mì",
    "Bánh Su Kem"
];

// Lấy các phần tử DOM
const searchInput = document.getElementById('search-input');
const suggestionsList = document.getElementById('search-suggestions');

// Xử lý sự kiện nhập liệu
searchInput.addEventListener('input', function () {
    const query = searchInput.value.trim().toLowerCase();

    // Nếu không có nội dung tìm kiếm, ẩn danh sách gợi ý
    if (!query) {
        suggestionsList.style.display = 'none';
        // Phục hồi hiển thị toàn bộ sản phẩm khi xóa ô tìm kiếm
        clearSearchResults();
        return;
    }

    // Lọc danh sách sản phẩm dựa trên từ khóa
    const suggestions = products.filter(product =>
        product.toLowerCase().includes(query)
    );

    // Hiển thị danh sách gợi ý
    renderSuggestions(suggestions);
});

// Hàm hiển thị danh sách gợi ý
function renderSuggestions(suggestions) {
    // Xóa danh sách gợi ý cũ
    suggestionsList.innerHTML = '';

    // Nếu không có gợi ý, ẩn danh sách
    if (suggestions.length === 0) {
        suggestionsList.style.display = 'none';
        return;
    }

    // Tạo danh sách gợi ý mới
    suggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion;

        // Xử lý sự kiện khi nhấn vào gợi ý
        li.addEventListener('click', function () {
                searchInput.value = suggestion; // Điền gợi ý vào thanh tìm kiếm
                suggestionsList.style.display = 'none'; // Ẩn danh sách gợi ý
                // Hiển thị kết quả tìm kiếm tương ứng
                showSearchResults(suggestion);
        });

        suggestionsList.appendChild(li);
    });

    // Hiển thị danh sách gợi ý
    suggestionsList.style.display = 'block';
}

// Ẩn danh sách gợi ý khi nhấn ra ngoài
document.addEventListener('click', function (event) {
    if (!searchInput.contains(event.target) && !suggestionsList.contains(event.target)) {
        suggestionsList.style.display = 'none';
    }
});

// Xử lý khi nhấn Enter trong ô tìm kiếm
searchInput.addEventListener('keydown', function(e){
    if (e.key === 'Enter') {
        e.preventDefault();
        const q = searchInput.value.trim();
        if (!q) return;
        suggestionsList.style.display = 'none';
        showSearchResults(q);
    }
});

// Hiển thị kết quả tìm kiếm: lọc các .product-card
function showSearchResults(query) {
    const q = query.trim().toLowerCase();
    const cards = document.querySelectorAll('.product-card');
    let found = 0;
    cards.forEach(card => {
        const titleEl = card.querySelector('h3');
        const title = titleEl ? titleEl.textContent.trim().toLowerCase() : '';
        if (title.includes(q)) {
            card.style.display = '';
            found++;
        } else {
            card.style.display = 'none';
        }
    });

    // Nếu có kết quả, cuộn đến phần sản phẩm và làm nổi bật ngắn
    const productsSection = document.querySelector('.products');
    if (found > 0 && productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // thêm hiệu ứng nhấp nháy cho phần tử đầu tiên khớp
        const first = document.querySelector('.product-card[style*=display]:not([style*="display: none"])') || document.querySelector('.product-card');
        if (first) {
            first.classList.add('search-result-highlight');
            setTimeout(() => first.classList.remove('search-result-highlight'), 1600);
        }
    } else {
        alert('Không tìm thấy sản phẩm phù hợp.');
    }
}

// Hàm phục hồi danh sách sản phẩm (khi xóa tìm kiếm)
function clearSearchResults() {
    document.querySelectorAll('.product-card').forEach(card => card.style.display = '');
}

// --- News detail: khi bấm vào một mục trong danh sách tin, hiển thị chi tiết và cuộn tới đó ---
document.addEventListener('DOMContentLoaded', () => {
    const newsItems = document.querySelectorAll('.news-item');
    const detail = document.getElementById('news-detail');
    const detailTitle = document.getElementById('news-detail-title');
    const detailBody = document.getElementById('news-detail-body');
    const closeBtn = document.getElementById('close-news-detail');

    if (!newsItems.length || !detail) return;

    newsItems.forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            // If an explicit data-url is provided, open it; otherwise search the title on Google
            const link = item.getAttribute('data-url');
            if (link) {
                window.open(link, '_blank');
                return;
            }
            const titleEl = item.querySelector('.news-info h3');
            const title = titleEl ? titleEl.textContent.trim() : '';
            if (!title) return;
            const query = encodeURIComponent(title);
            const searchUrl = `https://www.google.com/search?q=${query}`;
            window.open(searchUrl, '_blank');
        });
    });

    if (closeBtn) closeBtn.addEventListener('click', () => {
        detail.classList.add('hidden');
        window.scrollTo({ top: detail.offsetTop - 40, behavior: 'smooth' });
    });
});

// Lấy các nút "Mua ngay"
// Note: Các trang khác (banh-gato.html, banh-2010.html, v.v.) có inline event listeners riêng
// nên không cần setup ở đây. Nếu dùng, sẽ thêm sản phẩm 2 lần (1 từ index.js + 1 từ product-detail.html)

// Lấy giỏ hàng từ hoặc khởi tạo giỏ hàng trống
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Cập nhật số lượng sản phẩm trong giỏ hàng (hiển thị trên icon giỏ hàng)
function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
}

// Cập nhật số lượng sản phẩm khi tải trang
updateCartCount();

// Đồng bộ voucher khi page tải
document.addEventListener('DOMContentLoaded', () => {
    try {
        const user = JSON.parse(localStorage.getItem('loggedUser') || localStorage.getItem('loggedInUser'));
        if (user && user.email && window.VoucherStore && window.VoucherStore.syncWithFirestore) {
            window.VoucherStore.syncWithFirestore(user.email);
            console.log('Vouchers synced with Firestore for user:', user.email);
        }
    } catch (e) {
        console.warn('Failed to sync vouchers on page load:', e);
    }
});

// Xử lý nút 'Nhận mã giảm giá' trên trang khuyến mãi
document.querySelectorAll('button[data-voucher]').forEach(btn => {
    btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-voucher');
        if (!code) return;
        if (!window.VoucherStore) {
            alert('Không thể lưu voucher (VoucherStore không khả dụng).');
            return;
        }
        const res = window.VoucherStore.addVoucher(code);
        if (!res.added) {
            if (res.reason === 'exists') alert('Voucher đã tồn tại!');
            else alert('Không thể nhận voucher.');
        } else {
            alert('Đã nhận voucher: ' + code);
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
    });
});

// --- RANDOM STAR RATINGS ---
// If a product-card has no explicit .product-rating, insert one with a random
// score between 4.0 and 5.0 when the DOM content is ready. This affects all
// pages that load index.js (most category pages) and will also work if new
// cards are added dynamically.
function addRandomRatings() {
    // card-level ratings
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        if (card.querySelector('.product-rating')) return; // skip existing
        const score = (Math.random() + 4).toFixed(1);
        const full = Math.floor(score);
        const half = score - full >= 0.5;
        let stars = '⭐'.repeat(full) + (half ? '⭐' : '');
        if (stars.length < 5) stars += '☆'.repeat(5 - stars.length);
        const div = document.createElement('div');
        div.className = 'product-rating';
        div.innerHTML = `${stars} <span>(${score}/5)</span>`;
        const priceEl = card.querySelector('.price');
        if (priceEl) card.insertBefore(div, priceEl);
        else card.appendChild(div);
    });

    // section-level (category) ratings
    document.querySelectorAll('.products').forEach(section => {
        if (section.querySelector('.section-rating')) return;
        const score = (Math.random() + 4).toFixed(1);
        const full = Math.floor(score);
        const half = score - full >= 0.5;
        let stars = '⭐'.repeat(full) + (half ? '⭐' : '');
        if (stars.length < 5) stars += '☆'.repeat(5 - stars.length);
        const div = document.createElement('div');
        div.className = 'section-rating';
        div.style.fontSize = '16px';
        div.style.color = '#ffc107';
        div.style.margin = '0 0 12px 0';
        div.innerHTML = `${stars} <span>(${score}/5 tổng)</span>`;
        section.insertBefore(div, section.firstChild);
    });
}

document.addEventListener('DOMContentLoaded', addRandomRatings);


// load chat.js automatically if index.js is included
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!document.querySelector('script[src="chat.js"]')) {
            const s = document.createElement('script');
            s.src = 'chat.js';
            document.body.appendChild(s);
        }
        
        // Load products from Firestore dynamically
        setTimeout(loadProductsFromFirestore, 500); // Wait a bit for firebase to init
    });
}

// Hàm tải sản phẩm từ Firestore và hiển thị lên danh sách sản phẩm trang khách hàng
async function loadProductsFromFirestore() {
    if (!window.firebase || !window.firebase.firestore) {
        console.warn('Firebase chưa sẵn sàng, thử lại sau...');
        setTimeout(loadProductsFromFirestore, 1000);
        return;
    }
    
    const db = firebase.firestore();
    try {
        const snapshot = await db.collection('products').get();
        if (snapshot.empty) return;
        
        const firestoreProducts = [];
        snapshot.forEach(doc => {
            firestoreProducts.push(doc.data());
        });
        
        // Update global products array for search
        firestoreProducts.forEach(p => {
            if (p.name && !products.includes(p.name)) {
                products.push(p.name);
            }
        });
        
        // Find product containers on the page
        const productLists = document.querySelectorAll('.product-list');
        if (productLists.length === 0) return;
        
        // Determine category from URL if we are on a category page
        const path = window.location.pathname.toLowerCase();
        let categoryFilter = null;
        if (path.includes('banh-2010')) categoryFilter = 'banh-2010';
        else if (path.includes('banh-gato')) categoryFilter = 'banh-gato';
        else if (path.includes('banh-tiramisu')) categoryFilter = 'banh-tiramisu';
        else if (path.includes('banh-sinh-nhat')) categoryFilter = 'banh-sinh-nhat';
        else if (path.includes('banh-cupcake')) categoryFilter = 'banh-cupcake';
        
        productLists.forEach(list => {
            // Lấy danh sách tên sản phẩm tĩnh đã có để không hiển thị trùng
            const existingNames = Array.from(list.querySelectorAll('.product-card h3')).map(h3 => h3.textContent.trim().toLowerCase());
            
            firestoreProducts.forEach(p => {
                if (!p.name) return;
                
                // Kiểm tra category nếu đang ở trang danh mục
                if (categoryFilter && p.category !== categoryFilter) return;
                
                // Nếu trang chủ (index), ta có thể hiển thị tuỳ ý.
                // Tránh trùng lặp
                if (existingNames.includes(p.name.toLowerCase().trim())) return;
                
                // Nếu sản phẩm đã hết hàng (quantity <= 0), có thể làm mờ hoặc ẩn đi tuỳ logic, ở đây vẫn hiển thị
                
                // Thêm vào giao diện
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <img src="${p.image || 'Logo/màu kem hồng minh họa thức ăn Sticker tròn.png'}" alt="${p.name}">
                    <h3>${p.name}</h3>
                    <div class="product-rating">⭐⭐⭐⭐⭐ <span>(5.0/5)</span></div>
                    <div class="price">250.000đ</div>
                    <button class="add-to-cart">Mua ngay</button>
                `;
                
                // Gắn sự kiện click "Mua ngay"
                card.querySelector('.add-to-cart').addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const product = {
                        id: p.id || ('prod_' + Date.now()),
                        name: p.name,
                        price: 250000,
                        image: p.image || 'Logo/màu kem hồng minh họa thức ăn Sticker tròn.png',
                        sku: 'SKU-' + (p.id || Date.now()),
                        category: p.category || 'Bánh kem',
                        description: 'Sản phẩm tươi ngon, vừa được thêm mới.',
                        sizes: ['16cm', '18cm', '20cm']
                    };
                    sessionStorage.setItem('selectedProduct', JSON.stringify(product));
                    window.location.href = 'product-detail.html';
                });
                
                list.appendChild(card);
            });
        });
        
        console.log('✅ Đã tải và thêm các sản phẩm mới từ Firebase vào giao diện.');
        
    } catch (e) {
        console.warn('Lỗi tải sản phẩm từ Firestore:', e);
    }
}