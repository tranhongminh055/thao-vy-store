// stores.js - quản lý danh sách chi nhánh và tương tác bản đồ
const STORES = [
  { id: 'dn', name: 'ThaoVyStore - Đà Nẵng', city: 'Đà Nẵng', address: '123 Nguyễn Văn Linh, Q. Hải Châu', hours: '9:00 - 21:00', phone: '090-111-0001', q: 'ThaoVyStore Đà Nẵng' },
  { id: 'hn', name: 'ThaoVyStore - Hà Nội', city: 'Hà Nội', address: '45 Hoàng Hoa Thám, Ba Đình', hours: '9:00 - 21:00', phone: '090-111-0002', q: 'ThaoVyStore Hà Nội' },
  { id: 'hcm', name: 'ThaoVyStore - Hồ Chí Minh', city: 'Hồ Chí Minh', address: '210 Lê Lợi, Q.1', hours: '9:00 - 22:00', phone: '090-111-0003', q: 'ThaoVyStore Hồ Chí Minh' },
  { id: 'hp', name: 'ThaoVyStore - Hải Phòng', city: 'Hải Phòng', address: '88 Trần Phú, Ngô Quyền', hours: '9:00 - 20:00', phone: '090-111-0004', q: 'ThaoVyStore Hải Phòng' }
];
// chức năng hiển thị danh sách chi nhánh và tương tác bản đồ
function renderStores(list) {
  const container = document.getElementById('storesContainer');
  // xóa nội dung cũ trước khi render lại
  container.innerHTML = '';
  list.forEach(s => {
    // tạo thẻ div cho mỗi chi nhánh và gắn dữ liệu vào dataset để dễ truy cập khi click
    const el = document.createElement('div');
    // class 'store-card' để định dạng, dataset.q để lưu query tìm kiếm bản đồ, dataset.id để lưu id chi nhánh
    el.className = 'store-card';

    el.dataset.q = s.q; // lưu query tìm kiếm bản đồ vào dataset để dễ truy cập khi click
    el.dataset.id = s.id; //  lưu id chi nhánh vào dataset để dễ truy cập khi click
    // nội dung hiển thị tên, thành phố, địa chỉ, giờ mở cửa và hotline
    el.innerHTML = `
      <div class="meta">
        <h4>${s.name} <span class="badge">${s.city}</span></h4> <!
        <p>${s.address}</p>
        <p>${s.hours} • ${s.phone}</p>
      </div>`; 
    el.addEventListener('click', () => selectStore(s.id));
    // thêm thẻ vào container
    container.appendChild(el);
  });
}
// chức năng khi click vào chi nhánh sẽ cập nhật bản đồ và thông tin chi nhánh
function selectStore(id) {
  const store = STORES.find(s => s.id === id); // tìm chi nhánh theo id
  if (!store) return;
  // update map and details
  const q = encodeURIComponent(store.q);
  // update map src theo tìm kiếm
  document.getElementById('mapFrame').src = `https://www.google.com/maps?q=${q}&output=embed`;
  // cập nhật thông tin chi nhánh
  document.getElementById('map-title').innerText = store.name;
  // cập nhật chi tiết chi nhánh
  document.getElementById('branchAddress').innerText = 'Địa chỉ: ' + store.address;
  // cập nhật giờ mở cửa và hotline
  document.getElementById('branchHours').innerText = 'Giờ mở cửa: ' + store.hours;
  // cập nhật hotline
  document.getElementById('branchPhone').innerText = 'Hotline: ' + store.phone;
  // highlight selected card
  document.querySelectorAll('.store-card').forEach(c => c.classList.remove('selected'));
  const selected = document.querySelector(`.store-card[data-id="${id}"]`);
  if (selected) selected.classList.add('selected');
}
// khi trang đã tải xong, render danh sách chi nhánh và thiết lập sự kiện cho input filter
document.addEventListener('DOMContentLoaded', () => { // DOMcONTENTLOADED để đảm bảo DOM đã sẵn sàng trước khi thao tác
  renderStores(STORES); // hiển thị tất cả chi nhánh ban đầu
  // tuỳ chọn: chọn chi nhánh đầu tiên khi load trang
  if (STORES.length) selectStore(STORES[0].id);

  // input filter vào danh sách chi nhánh
  const filter = document.getElementById('filter-input');
  filter.addEventListener('input', () => {
    // lọc theo tên, thành phố, địa chỉ
    const q = filter.value.trim().toLowerCase();
    // nếu query rỗng thì hiển thị tất cả
    if (!q) return renderStores(STORES);
    // lọc danh sách chi nhánh theo query (truy vấn toàn bộ thông tin để tìm kiếm)
    const filtered = STORES.filter(s => (s.name + ' ' + s.city + ' ' + s.address).toLowerCase().includes(q));
    renderStores(filtered); // RENDER lại danh sách chi nhánh đã lọc theo query (RENDER LÀ VIỆC HIỂN THỊ LẠI DANH SÁCH CHI NHÁNH THEO KẾT QUẢ LỌC)
  });
});
