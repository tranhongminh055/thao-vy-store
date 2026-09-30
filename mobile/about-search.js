// Product data (shared with index.js)
const ABOUT_PRODUCTS = [
  { name: 'Bánh 2010 Đặc Biệt', image: 'Banh2010/02184eb178f039f01c5662b61e3f2675.jpg', price: '200.000đ' },
  { name: 'Bánh Gato Pháp', image: 'BanhGato/548542206da9dcd8577f04e76ada4cd8.jpg', price: '250.000đ' },
  { name: 'Bánh Tiramisu Ý', image: 'BanhTiramisu/0642cb051f2d34a90e2aab923e584992.jpg', price: '300.000đ' },
  { name: 'Bánh Sinh Nhật', image: 'Banh2010/3475e744a44eb25637d64b4a8d8ef1e0.jpg', price: '350.000đ' },
  { name: 'Bánh Cupcake', image: 'BanhGato/6007dbd10612fce21d1d3c1fadc13d1a.jpg', price: '150.000đ' },
  { name: 'Bánh Mousse', image: 'BanhTiramisu/1a2b4a325a77f16c9737acaad4a3a790.jpg', price: '400.000đ' },
  { name: 'Bánh Tart', image: 'Banh2010/4afe8a7289e24896acca32364a4fb563.jpg', price: '180.000đ' },
  { name: 'Bánh Bông Lan', image: 'BanhGato/91ae9ed4caf4ba014729106d0e6910e6.jpg', price: '120.000đ' },
  { name: 'Bánh Kem Dâu', image: 'BanhTiramisu/67e554b4c0ed564475e4b146cdb354f8.jpg', price: '300.000đ' },
  { name: 'Bánh Flan', image: 'Banh2010/77f000ee15da8bc67e9949b2e0c7b635.jpg', price: '80.000đ' }
];

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('search-input');
  const btn = document.getElementById('search-btn');
  const suggestions = document.getElementById('search-suggestions');
  const resultsWrap = document.getElementById('search-results');
  const resultsGrid = document.getElementById('searchProducts');

  function renderSuggestions(list) {
    suggestions.innerHTML = '';
    if (!list.length) { suggestions.style.display = 'none'; return; }
    list.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.name;
      li.addEventListener('click', () => {
        input.value = item.name;
        suggestions.style.display = 'none';
        showResults(item.name);
      });
      suggestions.appendChild(li);
    });
    suggestions.style.display = 'block';
  }

  function showResults(query) {
    const q = query.trim().toLowerCase();
    const matches = ABOUT_PRODUCTS.filter(p => p.name.toLowerCase().includes(q));
    resultsGrid.innerHTML = '';
    if (!matches.length) {
      resultsGrid.innerHTML = '<div class="muted">Không tìm thấy sản phẩm phù hợp.</div>';
      resultsWrap.classList.remove('hidden');
      return;
    }
    matches.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${p.image}" alt="${p.name}">
        <h3>${p.name}</h3>
        <div class="price">${p.price}</div>
        <button class="add-to-cart">Mua ngay</button>
      `;
      // attach add-to-cart behavior similar to index.js
      card.querySelector('.add-to-cart').addEventListener('click', () => {
        let cart = JSON.parse(localStorage.getItem('cart')||'[]');
        const existing = cart.find(i=>i.name===p.name);
        if (existing) existing.quantity+=1; else cart.push({ name: p.name, price: parseInt(p.price.replace(/[^0-9]/g,'')) || 0, image: p.image, quantity:1 });
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount && updateCartCount();
        alert('Đã thêm '+p.name+' vào giỏ hàng');
      });
      resultsGrid.appendChild(card);
    });
    resultsWrap.classList.remove('hidden');
    // scroll to results
    resultsWrap.scrollIntoView({ behavior: 'smooth' });
  }

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { suggestions.style.display='none'; resultsWrap.classList.add('hidden'); clearSearchResults && clearSearchResults(); return; }
    const filtered = ABOUT_PRODUCTS.filter(p => p.name.toLowerCase().includes(q));
    renderSuggestions(filtered.slice(0,8));
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); showResults(input.value); suggestions.style.display='none'; }
  });

  // Button click (magnifier)
  if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); showResults(input.value); suggestions.style.display = 'none'; });

  document.addEventListener('click', (ev) => {
    if (!input.contains(ev.target) && !suggestions.contains(ev.target)) suggestions.style.display='none';
  });
});
