/**
 * Quản lý sản phẩm và tồn kho
 * Hiển thị bảng tất cả sản phẩm và cho phép cập nhật số lượng
 */

// Danh sách sản phẩm 
const DEFAULT_PRODUCTS = [
  // Từ index.html - Sản phẩm nổi bật
  { id: 'banh-2010-dac-biet', name: 'Bánh 2010 Đặc Biệt', category: 'banh-2010', quantity: 40, threshold: 5 },
  { id: 'banh-gato-phap', name: 'Bánh Gato Pháp', category: 'banh-gato', quantity: 30, threshold: 5 },
  { id: 'banh-tiramisu-y', name: 'Bánh Tiramisu Ý', category: 'banh-tiramisu', quantity: 25, threshold: 5 },
  { id: 'banh-sinh-nhat', name: 'Bánh Sinh Nhật', category: 'banh-sinh-nhat', quantity: 35, threshold: 5 },
  { id: 'banh-cupcake', name: 'Bánh Cupcake', category: 'banh-cupcake', quantity: 50, threshold: 8 },
  { id: 'banh-mousse', name: 'Bánh Mousse', category: 'banh-gato', quantity: 20, threshold: 5 },
  { id: 'banh-tart', name: 'Bánh Tart', category: 'banh-2010', quantity: 45, threshold: 8 },
  { id: 'banh-bong-lan', name: 'Bánh Bông Lan', category: 'banh-gato', quantity: 38, threshold: 6 },

  // Bánh 2010 (8 sản phẩm)
  { id: 'banh-2010-classic', name: 'Bánh 2010 Classic', category: 'banh-2010', quantity: 40, threshold: 5 },
  { id: 'banh-2010-premium', name: 'Bánh 2010 Premium', category: 'banh-2010', quantity: 35, threshold: 5 },
  { id: 'banh-2010-deluxe', name: 'Bánh 2010 Deluxe', category: 'banh-2010', quantity: 30, threshold: 5 },
  { id: 'banh-2010-special', name: 'Bánh 2010 Special', category: 'banh-2010', quantity: 35, threshold: 5 },
  { id: 'banh-2010-signature', name: 'Bánh 2010 Signature', category: 'banh-2010', quantity: 28, threshold: 4 },
  { id: 'banh-2010-royal', name: 'Bánh 2010 Royal', category: 'banh-2010', quantity: 25, threshold: 4 },
  { id: 'banh-2010-elegant', name: 'Bánh 2010 Elegant', category: 'banh-2010', quantity: 32, threshold: 5 },
  { id: 'banh-2010-supreme', name: 'Bánh 2010 Supreme', category: 'banh-2010', quantity: 29, threshold: 4 },

  // Bánh Cupcake (9 sản phẩm)
  { id: 'cupcake-vanilla', name: 'Cupcake Vanilla', category: 'banh-cupcake', quantity: 60, threshold: 10 },
  { id: 'cupcake-chocolate', name: 'Cupcake Chocolate', category: 'banh-cupcake', quantity: 55, threshold: 10 },
  { id: 'cupcake-strawberry', name: 'Cupcake Strawberry', category: 'banh-cupcake', quantity: 50, threshold: 8 },
  { id: 'cupcake-lemon', name: 'Cupcake Lemon', category: 'banh-cupcake', quantity: 52, threshold: 9 },
  { id: 'cupcake-red-velvet', name: 'Cupcake Red Velvet', category: 'banh-cupcake', quantity: 48, threshold: 8 },
  { id: 'cupcake-caramel', name: 'Cupcake Caramel', category: 'banh-cupcake', quantity: 54, threshold: 9 },
  { id: 'cupcake-matcha', name: 'Cupcake Matcha', category: 'banh-cupcake', quantity: 50, threshold: 8 },
  { id: 'cupcake-blueberry', name: 'Cupcake Blueberry', category: 'banh-cupcake', quantity: 51, threshold: 9 },
  { id: 'cupcake-coconut', name: 'Cupcake Coconut', category: 'banh-cupcake', quantity: 53, threshold: 9 },

  // Bánh Gato (8 sản phẩm)
  { id: 'gato-vanilla', name: 'Gato Vanilla', category: 'banh-gato', quantity: 30, threshold: 5 },
  { id: 'gato-chocolate', name: 'Gato Chocolate', category: 'banh-gato', quantity: 28, threshold: 5 },
  { id: 'gato-strawberry', name: 'Gato Strawberry', category: 'banh-gato', quantity: 32, threshold: 5 },
  { id: 'gato-matcha', name: 'Gato Matcha', category: 'banh-gato', quantity: 25, threshold: 4 },
  { id: 'gato-red-velvet', name: 'Gato Red Velvet', category: 'banh-gato', quantity: 23, threshold: 4 },
  { id: 'gato-caramel', name: 'Gato Caramel', category: 'banh-gato', quantity: 27, threshold: 4 },
  { id: 'gato-coffee', name: 'Gato Coffee', category: 'banh-gato', quantity: 29, threshold: 5 },
  { id: 'gato-lemon', name: 'Gato Lemon', category: 'banh-gato', quantity: 31, threshold: 5 },

  // Bánh Sinh Nhật (8 sản phẩm)
  { id: 'banh-sinh-nhat-trai-cay', name: 'Bánh Sinh Nhật Trái Cây', category: 'banh-sinh-nhat', quantity: 35, threshold: 5 },
  { id: 'banh-sinh-nhat-socola', name: 'Bánh Sinh Nhật Socola', category: 'banh-sinh-nhat', quantity: 30, threshold: 5 },
  { id: 'banh-sinh-nhat-dau-tay', name: 'Bánh Sinh Nhật Dâu Tây', category: 'banh-sinh-nhat', quantity: 32, threshold: 5 },
  { id: 'banh-sinh-nhat-vanilla', name: 'Bánh Sinh Nhật Vanilla', category: 'banh-sinh-nhat', quantity: 36, threshold: 5 },
  { id: 'banh-sinh-nhat-matcha', name: 'Bánh Sinh Nhật Matcha', category: 'banh-sinh-nhat', quantity: 27, threshold: 4 },
  { id: 'banh-sinh-nhat-red-velvet', name: 'Bánh Sinh Nhật Red Velvet', category: 'banh-sinh-nhat', quantity: 25, threshold: 4 },
  { id: 'banh-sinh-nhat-caramel', name: 'Bánh Sinh Nhật Caramel', category: 'banh-sinh-nhat', quantity: 29, threshold: 5 },
  { id: 'banh-sinh-nhat-coffee', name: 'Bánh Sinh Nhật Coffee', category: 'banh-sinh-nhat', quantity: 33, threshold: 5 },

  // Bánh Tiramisu (9 sản phẩm)
  { id: 'banh-tiramisu-classic', name: 'Bánh Tiramisu Classic', category: 'banh-tiramisu', quantity: 40, threshold: 6 },
  { id: 'banh-tiramisu-chocolate', name: 'Bánh Tiramisu Chocolate', category: 'banh-tiramisu', quantity: 35, threshold: 5 },
  { id: 'banh-tiramisu-strawberry', name: 'Bánh Tiramisu Strawberry', category: 'banh-tiramisu', quantity: 30, threshold: 5 },
  { id: 'banh-tiramisu-caramel', name: 'Bánh Tiramisu Caramel', category: 'banh-tiramisu', quantity: 38, threshold: 6 },
  { id: 'banh-tiramisu-mini', name: 'Bánh Tiramisu Mini', category: 'banh-tiramisu', quantity: 60, threshold: 10 },
  { id: 'banh-tiramisu-large', name: 'Bánh Tiramisu Large', category: 'banh-tiramisu', quantity: 20, threshold: 3 },
  { id: 'banh-tiramisu-vegan', name: 'Bánh Tiramisu Vegan', category: 'banh-tiramisu', quantity: 25, threshold: 4 },
  { id: 'banh-tiramisu-coffee', name: 'Bánh Tiramisu Coffee', category: 'banh-tiramisu', quantity: 42, threshold: 6 },
  { id: 'banh-tiramisu-almond', name: 'Bánh Tiramisu Almond', category: 'banh-tiramisu', quantity: 37, threshold: 5 }
];

let productsData = [...DEFAULT_PRODUCTS];
let currentAdminEmail = null;

// Initialize sản phẩm
async function initializeProducts() {
  try {
    // Lấy email admin hiện tại
    try {
      const user = JSON.parse(localStorage.getItem('loggedUser')) || JSON.parse(localStorage.getItem('loggedInUser'));
      currentAdminEmail = user?.email || 'admin@example.com';
    } catch (e) {
      currentAdminEmail = 'admin@example.com';
    }

    // Lấy sản phẩm từ Firestore 
    if (window.firebase && window.__FIREBASE_INITIALIZED__) {
      try {
        const db = firebase.firestore();
        const snapshot = await db.collection('products').get();
        
        console.log('🔍 Kiểm tra Firestore - Số sản phẩm:', snapshot.size);
        
        //  lấy từ Firestore
        if (!snapshot.empty && snapshot.size >= DEFAULT_PRODUCTS.length) {
          const firestoreProducts = [];
          snapshot.forEach(doc => {
            firestoreProducts.push({
              id: doc.id,
              ...doc.data()
            });
          });
          productsData = firestoreProducts;
          console.log('✅ Đã tải sản phẩm từ Firestore:', productsData.length, 'sản phẩm');
        } else {
          // Firestore trống hoặc không đủ, khởi tạo từ DEFAULT_PRODUCTS
          console.warn('⚠️ Firestore chưa có đủ sản phẩm, đang khởi tạo...');
          await initializeFirestoreProducts();
          productsData = [...DEFAULT_PRODUCTS];
        }
      } catch (e) {
        console.warn('Failed to load products from Firestore, using defaults:', e);
        productsData = [...DEFAULT_PRODUCTS];
      }
    } else {
      productsData = [...DEFAULT_PRODUCTS];
    }

    displayProducts();
    setupSearch();
    setupInputListeners();
    setupExportButton();
    setupImportButton();
    setupDownloadTemplateButton();
    setupAddProductButton();
    setupModalEvents();
  } catch (error) {
    console.error('Error initializing products:', error);
  }
}

// Khởi tạo Firestore collection với DEFAULT_PRODUCTS
async function initializeFirestoreProducts() {
  try {
    if (!window.firebase || !window.__FIREBASE_INITIALIZED__) {
      console.warn('Firebase chưa khởi tạo');
      return;
    }
    
    const db = firebase.firestore();
    
    // Xóa sản phẩm cũ (nếu có)
    const existingSnapshot = await db.collection('products').get();
    if (existingSnapshot.size > 0) {
      const batch = db.batch();
      existingSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log('✅ Đã xóa sản phẩm cũ');
    }
    
    // Thêm sản phẩm mới
    const batch = db.batch();
    
    DEFAULT_PRODUCTS.forEach(product => {
      const docRef = db.collection('products').doc(product.id);
      batch.set(docRef, {
        id: product.id,
        name: product.name,
        category: product.category,
        quantity: product.quantity,
        threshold: product.threshold,
        image: product.image || `Banh2010/02184eb178f039f01c5662b61e3f2675.jpg`, // url sản phẩm
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
    console.log('✅ Đã khởi tạo', DEFAULT_PRODUCTS.length, 'sản phẩm vào Firestore');
  } catch (error) {
    console.warn('Failed to initialize Firestore products:', error);
  }
}

// Hiển thị bảng sản phẩm
function displayProducts(filter = '') {
  const tbody = document.querySelector('#productsInventoryTable tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  // Lọc sản phẩm
  let filtered = productsData;
  if (filter) {
    filtered = productsData.filter(p => 
      p.name.toLowerCase().includes(filter.toLowerCase())
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;">Không có sản phẩm</td></tr>';
    return;
  }

  // Hiển thị từng sản phẩm
  filtered.forEach(product => {
    const tr = document.createElement('tr');
    
    // Xác định trạng thái dựa trên tồn kho
    let statusClass = 'status-ok';
    let statusText = '✅ Còn hàng';
    if (product.quantity <= 0) {
      statusClass = 'status-danger';
      statusText = '❌ Hết hàng';
      tr.classList.add('stock-danger');
    } else if (product.quantity <= product.threshold) {
      statusClass = 'status-warning';
      statusText = '⚠️ Cảnh báo';
      tr.classList.add('stock-warning');
    }

    tr.innerHTML = `
      <td><strong>${product.name}</strong></td>
      <td style="text-align:center;">${product.quantity || 0}</td>
      <td style="text-align:center;">${product.threshold || 0}</td>
      <td style="text-align:center;">
        <span class="status-badge ${statusClass}">${statusText}</span>
      </td>
      <td style="text-align:center;">
        <button class="btn-import-row btn-edit-product" data-id="${product.id}">Cập nhật</button>
      </td>
    `;
    
    tbody.appendChild(tr);
  });

  // Attach delegated click handler for edit buttons (only once)
  try {
    const tbodyEl = document.querySelector('#productsInventoryTable tbody');
    if (tbodyEl && !tbodyEl._hasEditHandler) {
      tbodyEl.addEventListener('click', (ev) => {
        const btn = ev.target.closest && ev.target.closest('.btn-edit-product');
        if (btn) {
          const id = btn.getAttribute('data-id');
          console.log('Edit button clicked for', id);
          importProductRow(id);
        }
      });
      tbodyEl._hasEditHandler = true;
    }
  } catch(e) { console.warn('Failed to attach edit handler', e); }
}

// Lưu cập nhật sản phẩm
async function saveProductInventory(productId) {
  try {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    const quantityInput = document.querySelector(`input[data-id="${productId}"][data-field="quantity"]`);
    const thresholdInput = document.querySelector(`input[data-id="${productId}"][data-field="threshold"]`);

    if (!quantityInput || !thresholdInput) return;

    const newQuantity = parseInt(quantityInput.value) || 0;
    const newThreshold = parseInt(thresholdInput.value) || 0;

    const oldQuantity = product.quantity;
    product.quantity = newQuantity;
    product.threshold = newThreshold;

    // Lưu vào Firestore nếu có
    if (window.firebase && window.__FIREBASE_INITIALIZED__) {
      try {
        const db = firebase.firestore();
        await db.collection('products').doc(productId).set({
          name: product.name,
          quantity: newQuantity,
          threshold: newThreshold,
          category: product.category,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedBy: currentAdminEmail
        }, { merge: true });
      } catch (e) {
        console.warn('Failed to save to Firestore');
      }
    }

    // Kiểm tra nếu đã hết hàng → gửi email cảnh báo
    if (oldQuantity > 0 && newQuantity <= 0) {
      await sendOutOfStockAlert(product);
    } else if (oldQuantity > newThreshold && newQuantity <= newThreshold) {
      await sendLowStockAlert(product);
    }

    alert('✅ Đã lưu ' + product.name);
    displayProducts();

  } catch (error) {
    console.error('Error saving product:', error);
    alert('❌ Lỗi khi lưu: ' + error.message);
    displayProducts();
  }
}

// Gửi email cảnh báo hết hàng
async function sendOutOfStockAlert(product) {
  try {
    const response = await fetch('https://us-central1-thao-vy-store.cloudfunctions.net/sendStockAlert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        productName: product.name,
        quantity: product.quantity,
        threshold: product.threshold,
        alertType: 'outOfStock'
      })
    });

    const data = await response.json();
    if (response.ok && data.success) {
      console.log('✅ Email cảnh báo hết hàng đã gửi:', data.message);
    } else {
      console.warn('Failed to send stock alert:', data.message || 'Unknown error');
    }
  } catch (error) {
    console.warn('Failed to send stock alert email:', error);
  }
}

// Gửi email cảnh báo số lượng thấp
async function sendLowStockAlert(product) {
  try {
    const response = await fetch('https://us-central1-thao-vy-store.cloudfunctions.net/sendStockAlert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        productName: product.name,
        quantity: product.quantity,
        threshold: product.threshold,
        alertType: 'lowStock'
      })
    });

    const data = await response.json();
    if (response.ok && data.success) {
      console.log('✅ Email cảnh báo số lượng thấp đã gửi:', data.message);
    } else {
      console.warn('Failed to send low stock alert:', data.message || 'Unknown error');
    }
  } catch (error) {
    console.warn('Failed to send low stock alert email:', error);
  }
}

// Tải lại sản phẩm (hủy thay đổi)
function reloadProducts() {
  displayProducts();
}

// Setup input event listeners cho cập nhật real-time
function setupInputListeners() {
  // Lắng nghe thay đổi trên các input số lượng và ngưỡng
  document.addEventListener('input', (e) => {
    if (e.target.classList.contains('qty-input') || e.target.classList.contains('threshold-input')) {
      const productId = e.target.dataset.id;
      const product = productsData.find(p => p.id === productId);
      if (!product) return;

      // Cập nhật giá trị tạm thời
      const quantity = parseInt(document.querySelector(`input[data-id="${productId}"][data-field="quantity"]`).value) || 0;
      const threshold = parseInt(document.querySelector(`input[data-id="${productId}"][data-field="threshold"]`).value) || 0;

      // Cập nhật trạng thái real-time
      const statusBadge = e.target.closest('tr').querySelector('.status-badge');
      if (statusBadge) {
        let statusClass = 'status-ok';
        let statusText = '✅ Còn hàng';
        if (quantity <= 0) {
          statusClass = 'status-danger';
          statusText = '❌ Hết hàng';
        } else if (quantity <= threshold) {
          statusClass = 'status-warning';
          statusText = '⚠️ Cảnh báo';
        }
        
        statusBadge.className = `status-badge ${statusClass}`;
        statusBadge.textContent = statusText;
      }
    }
  });
}

// Setup search input (graceful: tạo input nếu không tồn tại)
function setupSearch() {
  try {
    let searchInput = document.getElementById('productSearch');
    // Nếu không có input trên trang, tạo một thanh tìm kiếm đơn giản ở trên bảng
    if (!searchInput) {
      const ordersSection = document.getElementById('ordersSection');
      if (ordersSection) {
        const wrapper = document.createElement('div');
        wrapper.style.margin = '12px 0';
        wrapper.innerHTML = `
          <input id="productSearch" placeholder="Tìm sản phẩm..." style="padding:8px;width:300px;border:1px solid #ccc;border-radius:4px;"> 
          <button id="clearProductSearch" style="margin-left:8px;padding:8px;border-radius:4px;">Xóa</button>
        `;
        // chèn trước bảng productsInventoryTable
        const tableWrapper = ordersSection.querySelector('div[style*="overflow-x:auto"]');
        if (tableWrapper && tableWrapper.parentNode) tableWrapper.parentNode.insertBefore(wrapper, tableWrapper);
        searchInput = document.getElementById('productSearch');
      }
    }

    if (!searchInput) return;

    let debounceTimer = null;
    searchInput.addEventListener('input', (e) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        displayProducts(searchInput.value.trim());
      }, 200);
    });

    const clearBtn = document.getElementById('clearProductSearch');
    if (clearBtn) clearBtn.addEventListener('click', () => { if (searchInput) { searchInput.value = ''; displayProducts(); } });
  } catch (e) {
    console.warn('setupSearch init failed', e);
  }
}

// Setup import button and hidden file input (graceful if elements missing)
function setupImportButton() {
  try {
    const importBtn = document.getElementById('importExcelBtn') || document.getElementById('importBtn');
    let fileInput = document.getElementById('importFileInput');

    if (!fileInput) {
      // tạo file input ẩn để tái sử dụng
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'importFileInput';
      fileInput.accept = '.xlsx,.xls,.csv';
      fileInput.style.display = 'none';
      fileInput.addEventListener('change', handleFileSelect);
      document.body.appendChild(fileInput);
    } else {
      fileInput.addEventListener('change', handleFileSelect);
    }

    if (importBtn) {
      importBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
      });
    }
  } catch (e) {
    console.warn('setupImportButton failed', e);
  }
}

// Xuất Excel
function exportToExcel(filter = '') {
  try {
    // Lọc sản phẩm nếu có filter
    let filteredData = productsData;
    if (filter) {
      filteredData = productsData.filter(p => 
        p.name.toLowerCase().includes(filter.toLowerCase())
      );
    }

    // Chuẩn bị dữ liệu
    const data = filteredData.map(product => {
      let statusText = 'Còn hàng';
      if (product.quantity <= 0) {
        statusText = 'Hết hàng';
      }

      return {
        'Tên sản phẩm': product.name,
        'Danh mục': product.category,
        'Số lượng nhập': product.quantity,
        'Trạng thái': statusText,
        'Ngày cập nhật': new Date().toLocaleString('vi-VN')
      };
    });

    // Tạo worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Tự động điều chỉnh độ rộng cột
    const colWidths = [
      { wch: 30 }, // Tên sản phẩm
      { wch: 15 }, // Danh mục
      { wch: 18 }, // Số lượng
      { wch: 12 }, // Trạng thái
      { wch: 15 }  // Ngày cập nhật
    ];
    ws['!cols'] = colWidths;

    // Tạo workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách sản phẩm');

    // Tạo tên file với timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `danh-sach-san-pham-${timestamp}.xlsx`;

    // Xuất file
    XLSX.writeFile(wb, filename);

    alert(`✅ Đã xuất file Excel thành công!\n📊 Số sản phẩm: ${data.length}\n📁 Tên file: ${filename}${filter ? '\n🔍 Đã áp dụng bộ lọc: "' + filter + '"' : ''}`);
  } catch (error) {
    console.error('Lỗi xuất Excel:', error);
    alert('❌ Có lỗi xảy ra khi xuất Excel. Vui lòng thử lại.');
  }
}

// Setup nút xuất Excel
function setupExportButton() {
  const exportBtn = document.getElementById('exportExcelBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const searchInput = document.getElementById('productSearch');
      const filter = searchInput ? searchInput.value : '';
      exportToExcel(filter);
    });
  }
}

// Tải file mẫu Excel
function downloadTemplate() {
  try {
    // Dữ liệu mẫu
    const sampleData = [
      {
        'Tên sản phẩm': 'Bánh sinh nhật mẫu',
        'Danh mục': 'banh-sinh-nhat',
        'Số lượng nhập': 50
      },
      {
        'Tên sản phẩm': 'Bánh gato mẫu',
        'Danh mục': 'banh-gato',
        'Số lượng nhập': 30
      }
    ];

    // Tạo worksheet
    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Tự động điều chỉnh độ rộng cột
    const colWidths = [
      { wch: 25 }, // Tên sản phẩm
      { wch: 15 }, // Danh mục
      { wch: 18 }, // Số lượng
    ];
    ws['!cols'] = colWidths;

    // Tạo workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mẫu nhập sản phẩm');

    // Xuất file
    XLSX.writeFile(wb, 'mau-nhap-san-pham.xlsx');

    alert('✅ Đã tải file mẫu!\n📁 Tên file: mau-nhap-san-pham.xlsx\n\nHướng dẫn:\n- Điền thông tin sản phẩm vào các cột\n- Có thể xóa dữ liệu mẫu\n- Chỉ cần cột "Tên sản phẩm", các cột khác tùy chọn\n- Lưu file và sử dụng nút "Nhập Excel"');

  } catch (error) {
    console.error('Lỗi tạo file mẫu:', error);
    alert('❌ Có lỗi khi tạo file mẫu');
  }
}

// Setup nút tải file mẫu
function setupDownloadTemplateButton() {
  const downloadBtn = document.getElementById('downloadTemplateBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadTemplate);
  }
}

// Setup nút thêm sản phẩm
function setupAddProductButton() {
  const addBtn = document.getElementById('addProductBtn');
  if (addBtn) {
    addBtn.addEventListener('click', showAddProductModal);
  }
}

// Setup nút xuất
function setupExportButton() {
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', showExportOptions);
  }
}

// Hiển thị modal thêm sản phẩm
function showAddProductModal() {
  const modal = document.getElementById('addProductModal');
  const form = document.getElementById('addProductForm');
  
  // Reset form
  form.reset();
  
  // Reset edit ID
  modal._editProductId = null;
  
  // Reset title và button
  const modalHeader = modal.querySelector('.modal-header h3');
  modalHeader.textContent = '➕ Thêm sản phẩm mới';
  const submitBtn = modal.querySelector('form button[type="submit"]');
  submitBtn.textContent = '✅ Thêm sản phẩm';
  
  modal.style.display = 'block';
  
  // Focus vào input tên sản phẩm
  setTimeout(() => {
    document.getElementById('newProductName').focus();
  }, 100);
  // clear image preview
  const previewImg = document.getElementById('newProductImagePreviewImg');
  if (previewImg) { previewImg.src = ''; previewImg.style.display = 'none'; }
  const fileInput = document.getElementById('newProductImage'); if (fileInput) fileInput.value = '';
}

// Xử lý thêm sản phẩm mới
async function handleAddProduct(event) {
  event.preventDefault();
  
  const modal = document.getElementById('addProductModal');
  const editProductId = modal._editProductId;
  const submitBtn = modal.querySelector('form button[type="submit"]');
  const origSubmitText = submitBtn ? submitBtn.textContent : null;
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ Đang xử lý...'; }
  
  const name = document.getElementById('newProductName').value.trim();
  const category = document.getElementById('newProductCategory').value;
  const quantity = parseInt(document.getElementById('newProductQuantity').value) || 0;
  
  if (!name) {
    alert('❌ Vui lòng nhập tên sản phẩm');
    return;
  }
  
  try {
    if (editProductId) {
      // Cập nhật sản phẩm đã tồn tại
      const product = productsData.find(p => p.id === editProductId);
      if (!product) {
        alert('❌ Không tìm thấy sản phẩm');
        return;
      }
      
      product.name = name;
      product.category = category || 'uncategorized';
      product.quantity = quantity;
      
      // Cập nhật Firestore
      if (window.firebase && window.__FIREBASE_INITIALIZED__) {
        const db = firebase.firestore();
        // If image selected, upload first (handle CORS/errors gracefully)
        const imgFile = document.getElementById('newProductImage')?.files?.[0];
        let imageUrl = '';
        if (imgFile) {
          const res = await uploadProductImage(imgFile);
          if (res.error) {
            console.warn('Image upload failed:', res.error);
            alert('Không thể upload ảnh (CORS/permission). Ảnh sẽ không được cập nhật.\nXem hướng dẫn: CORS_README.md');
          } else {
            imageUrl = res.url;
          }
        }
        const updateData = { name: name, category: category || 'uncategorized', quantity: quantity };
        if (imageUrl) updateData.image = imageUrl;
        await db.collection('products').doc(editProductId).update(updateData);
      }
      
      alert(`✅ Đã cập nhật sản phẩm "${name}" thành công!`);
    } else {
      // Thêm sản phẩm mới
      const existingProduct = productsData.find(p => p.name.toLowerCase() === name.toLowerCase());
      if (existingProduct) {
        alert('❌ Sản phẩm với tên này đã tồn tại');
        return;
      }
      
      const newProduct = {
        id: generateProductId(name),
        name: name,
        category: category || 'uncategorized',
        quantity: quantity,
        threshold: 5 // Default threshold
      };
      productsData.unshift(newProduct);
      
      // Lưu vào Firestore
      if (window.firebase && window.__FIREBASE_INITIALIZED__) {
        const imgFile = document.getElementById('newProductImage')?.files?.[0];
        if (imgFile) {
          const res = await uploadProductImage(imgFile);
          if (res.error) {
            console.warn('Image upload failed:', res.error);
            alert('Không thể upload ảnh (CORS/permission). Sản phẩm sẽ được tạo mà không có ảnh.\nXem hướng dẫn: CORS_README.md');
          } else {
            newProduct.image = res.url;
          }
        }
        const db = firebase.firestore();
        await db.collection('products').doc(newProduct.id).set(newProduct);
      }
      
      alert(`✅ Đã thêm sản phẩm "${name}" thành công!`);
    }
    
    // Đóng modal, reset và refresh bảng
    modal.style.display = 'none';
    modal._editProductId = null;
    document.getElementById('addProductForm').reset();
    const modalHeader = modal.querySelector('.modal-header h3');
    modalHeader.textContent = '➕ Thêm sản phẩm mới';
    const submitBtn = modal.querySelector('form button[type="submit"]');
    submitBtn.textContent = '✅ Thêm sản phẩm';
    displayProducts();
    
  } catch (error) {
    console.error('Lỗi xử lý sản phẩm:', error);
    alert('❌ Có lỗi xảy ra. Vui lòng thử lại.');
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = origSubmitText || '✅ Thêm sản phẩm'; }
  }
}

// Hiển thị tùy chọn xuất
function showExportOptions() {
  // Tạo dropdown menu tạm thời
  const exportBtn = document.getElementById('exportBtn');
  const rect = exportBtn.getBoundingClientRect();
  
  // Tạo dropdown element
  const dropdown = document.createElement('div');
  dropdown.id = 'exportDropdown';
  dropdown.style.cssText = `
    position: absolute;
    top: ${rect.bottom + 5}px;
    left: ${rect.left}px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 6px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 1001;
    min-width: 150px;
  `;
  
  dropdown.innerHTML = `
    <div style="padding: 10px; cursor: pointer; border-bottom: 1px solid #eee;" onclick="exportToExcel()">
      📊 Xuất Excel
    </div>
    <div style="padding: 10px; cursor: pointer; border-bottom: 1px solid #eee;" onclick="exportToCSV()">
      📄 Xuất CSV
    </div>
    <div style="padding: 10px; cursor: pointer;" onclick="exportToJSON()">
      📋 Xuất JSON
    </div>
  `;
  
  document.body.appendChild(dropdown);
  
  // Đóng dropdown khi click outside
  function closeDropdown(event) {
    if (!dropdown.contains(event.target) && event.target !== exportBtn) {
      document.body.removeChild(dropdown);
      document.removeEventListener('click', closeDropdown);
    }
  }
  
  setTimeout(() => {
    document.addEventListener('click', closeDropdown);
  }, 100);
}

// Xuất CSV
function exportToCSV() {
  try {
    const searchInput = document.getElementById('productSearch');
    const filter = searchInput ? searchInput.value : '';
    
    let filteredData = productsData;
    if (filter) {
      filteredData = productsData.filter(p => 
        p.name.toLowerCase().includes(filter.toLowerCase())
      );
    }
    
    const csvContent = filteredData.map(product => {
      let statusText = 'Còn hàng';
      if (product.quantity <= 0) {
        statusText = 'Hết hàng';
      }
      
      return `"${product.name}","${product.category}","${product.quantity}","${statusText}"`;
    }).join('\n');
    
    const header = '"Tên sản phẩm","Danh mục","Số lượng nhập","Trạng thái"';
    const fullContent = header + '\n' + csvContent;
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `danh-sach-san-pham-${timestamp}.csv`;
    
    downloadFile(fullContent, filename, 'text/csv');
    
    alert(`✅ Đã xuất file CSV thành công!\n📊 Số sản phẩm: ${filteredData.length}\n📁 Tên file: ${filename}${filter ? '\n🔍 Đã áp dụng bộ lọc: "' + filter + '"' : ''}`);
    
  } catch (error) {
    console.error('Lỗi xuất CSV:', error);
    alert('❌ Có lỗi khi xuất CSV');
  }
}

// Xuất JSON
function exportToJSON() {
  try {
    const searchInput = document.getElementById('productSearch');
    const filter = searchInput ? searchInput.value : '';
    
    let filteredData = productsData;
    if (filter) {
      filteredData = productsData.filter(p => 
        p.name.toLowerCase().includes(filter.toLowerCase())
      );
    }
    
    const jsonContent = JSON.stringify(filteredData, null, 2);
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `danh-sach-san-pham-${timestamp}.json`;
    
    downloadFile(jsonContent, filename, 'application/json');
    
    alert(`✅ Đã xuất file JSON thành công!\n📊 Số sản phẩm: ${filteredData.length}\n📁 Tên file: ${filename}${filter ? '\n🔍 Đã áp dụng bộ lọc: "' + filter + '"' : ''}`);
    
  } catch (error) {
    console.error('Lỗi xuất JSON:', error);
    alert('❌ Có lỗi khi xuất JSON');
  }
}

// Hàm helper để tải file
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

// Nhập dữ liệu cho sản phẩm
function importProductRow(productId) {
  const product = productsData.find(p => p.id === productId);
  if (!product) {
    alert('❌ Không tìm thấy sản phẩm');
    return;
  }
  
  // Hiển thị modal với dữ liệu sản phẩm
  const modal = document.getElementById('addProductModal');
  if (!modal) { console.error('addProductModal not found in DOM'); return; }
  const nameEl = document.getElementById('newProductName'); if (nameEl) nameEl.value = product.name; else console.warn('newProductName missing');
  const catEl = document.getElementById('newProductCategory'); if (catEl) catEl.value = product.category || '';
  const qtyEl = document.getElementById('newProductQuantity'); if (qtyEl) qtyEl.value = product.quantity || 0;
  const thrEl = document.getElementById('newProductThreshold'); if (thrEl) thrEl.value = product.threshold || 0;
  
  // Thay đổi tiêu đề modal
  const modalHeader = modal.querySelector('.modal-header h3');
  modalHeader.textContent = `✏️ Cập nhật: ${product.name}`;
  
  // Thay đổi button
  const submitBtn = modal.querySelector('form button[type="submit"]');
  submitBtn.textContent = '💾 Cập nhật sản phẩm';
  
  // Gán product ID để xử lý trong submit
  modal._editProductId = productId;
  
  // Set image preview if available
  const previewImg = document.getElementById('newProductImagePreviewImg');
  const fileInput = document.getElementById('newProductImage');
  if (product.image && previewImg) {
    previewImg.src = product.image;
    previewImg.style.display = 'block';
  } else if (previewImg) {
    previewImg.src = '';
    previewImg.style.display = 'none';
  }
  if (fileInput) fileInput.value = '';

  modal.style.display = 'block';
}

// Xuất sản phẩm thành CSV
function exportProductRow(productId) {
  const product = productsData.find(p => p.id === productId);
  if (!product) {
    alert('❌ Không tìm thấy sản phẩm');
    return;
  }
  
  let statusText = 'Còn hàng';
  if (product.quantity <= 0) {
    statusText = 'Hết hàng';
  } else if (product.quantity <= product.threshold) {
    statusText = 'Sắp hết';
  }
  
  const csvContent = `"Tên sản phẩm","Danh mục","Số lượng nhập","Trạng thái"\n"${product.name}","${product.category}","${product.quantity}","${statusText}"`;
  
  const filename = `${product.name.replace(/\s+/g, '-')}.csv`;
  downloadFile(csvContent, filename, 'text/csv');
  
  alert(`✅ Đã xuất sản phẩm "${product.name}" thành CSV`);
}

// Xuất sản phẩm thành Excel
function exportProductRowExcel(productId) {
  const product = productsData.find(p => p.id === productId);
  if (!product) {
    alert('❌ Không tìm thấy sản phẩm');
    return;
  }
  
  let statusText = 'Còn hàng';
  if (product.quantity <= 0) {
    statusText = 'Hết hàng';
  } else if (product.quantity <= product.threshold) {
    statusText = 'Sắp hết';
  }
  
  const data = [{
    'Tên sản phẩm': product.name,
    'Danh mục': product.category,
    'Số lượng hiện tại': product.quantity,
    'Ngưỡng cảnh báo': product.threshold,
    'Trạng thái': statusText,
    'Ngày xuất': new Date().toLocaleString('vi-VN')
  }];
  
  const ws = XLSX.utils.json_to_sheet(data);
  const colWidths = [
    { wch: 25 },
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
    { wch: 12 },
    { wch: 20 }
  ];
  ws['!cols'] = colWidths;
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sản phẩm');
  
  const filename = `${product.name.replace(/\s+/g, '-')}.xlsx`;
  XLSX.writeFile(wb, filename);
  
  alert(`✅ Đã xuất sản phẩm "${product.name}" thành Excel`);
}

// Xử lý chọn file
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                       'application/vnd.ms-excel', 
                       'text/csv'];
  
  if (!allowedTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
    alert('❌ Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV (.csv)');
    return;
  }
  
  importFromExcel(file);
}

// Đọc file Excel
function importFromExcel(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, {type: 'array'});
      
      // Lấy sheet đầu tiên
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Chuyển thành JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
      
      if (jsonData.length < 2) {
        alert('❌ File không có dữ liệu hoặc định dạng không đúng');
        return;
      }
      
      // Xử lý dữ liệu
      const headers = jsonData[0];
      const rows = jsonData.slice(1);
      
      processImportData(headers, rows);
      
    } catch (error) {
      console.error('Lỗi đọc file:', error);
      alert('❌ Có lỗi khi đọc file. Vui lòng kiểm tra định dạng file.');
    }
  };
  
  reader.readAsArrayBuffer(file);
}

// Xử lý dữ liệu import
function processImportData(headers, rows) {
  const importData = [];
  const errors = [];
  
  // Mapping các cột có thể có
  const columnMapping = {
    'Tên sản phẩm': ['tên sản phẩm', 'ten san pham', 'name', 'product name'],
    'Danh mục': ['danh mục', 'category', 'loai'],
    'Số lượng hiện tại': ['số lượng hiện tại', 'so luong', 'quantity', 'số lượng'],
    /* ngưỡng cảnh báo removed */
  };
  
  // Tìm vị trí các cột
  const columnIndex = {};
  headers.forEach((header, index) => {
    const headerLower = header.toLowerCase().trim();
    for (const [key, aliases] of Object.entries(columnMapping)) {
      if (aliases.some(alias => headerLower.includes(alias))) {
        columnIndex[key] = index;
        break;
      }
    }
  });
  
  // Kiểm tra cột bắt buộc
  if (!columnIndex['Tên sản phẩm']) {
    alert('❌ File phải có cột "Tên sản phẩm"');
    return;
  }
  
  rows.forEach((row, rowIndex) => {
    const productName = row[columnIndex['Tên sản phẩm']];
    if (!productName || productName.toString().trim() === '') {
      errors.push(`Dòng ${rowIndex + 2}: Thiếu tên sản phẩm`);
      return;
    }
    
    const product = {
      name: productName.toString().trim(),
      category: columnIndex['Danh mục'] !== undefined ? (row[columnIndex['Danh mục']] || '').toString().trim() : '',
      quantity: columnIndex['Số lượng hiện tại'] !== undefined ? parseInt(row[columnIndex['Số lượng hiện tại']]) || 0 : 0
    };
    
    importData.push(product);
  });
  
  if (errors.length > 0) {
    alert(`❌ Có lỗi trong dữ liệu:\n${errors.join('\n')}`);
    return;
  }
  
  if (importData.length === 0) {
    alert('❌ Không có dữ liệu hợp lệ để nhập');
    return;
  }
  
  showImportPreview(importData);
}

// Hiển thị preview import
function showImportPreview(importData) {
  const modal = document.getElementById('importModal');
  const previewDiv = document.getElementById('importPreview');
  
  let html = `<p><strong>Tổng số sản phẩm sẽ được xử lý: ${importData.length}</strong></p>`;
  html += '<table>';
  html += '<thead><tr><th>Tên sản phẩm</th><th>Danh mục</th><th>Số lượng</th><th>Trạng thái</th></tr></thead>';
  html += '<tbody>';
  
  importData.forEach(product => {
    // Kiểm tra sản phẩm đã tồn tại
    const existingProduct = productsData.find(p => p.name.toLowerCase() === product.name.toLowerCase());
    const status = existingProduct ? 'Cập nhật' : 'Thêm mới';
    const statusColor = existingProduct ? '#ffc107' : '#28a745';
    
    html += `<tr>
      <td>${product.name}</td>
      <td>${product.category || 'Chưa phân loại'}</td>
      <td>${product.quantity}</td>
      <td style="color: ${statusColor}; font-weight: bold;">${status}</td>
    </tr>`;
  });
  
  html += '</tbody></table>';
  html += '<p style="color: #666; font-size: 12px; margin-top: 10px;">* Sản phẩm có tên trùng sẽ được cập nhật thông tin</p>';
  
  previewDiv.innerHTML = html;
  modal.style.display = 'block';
  
  // Store import data for confirmation
  modal._importData = importData;
}

// Xác nhận import
async function confirmImport() {
  const modal = document.getElementById('importModal');
  const importData = modal._importData;
  
  if (!importData) return;
  
  try {
    let updatedCount = 0;
    let addedCount = 0;
    
    for (const product of importData) {
      // Tìm sản phẩm đã tồn tại
      const existingIndex = productsData.findIndex(p => p.name.toLowerCase() === product.name.toLowerCase());
      
      if (existingIndex >= 0) {
        // Cập nhật sản phẩm hiện có
        const existingProduct = productsData[existingIndex];
        existingProduct.quantity = product.quantity;
        existingProduct.threshold = product.threshold;
        if (product.category) existingProduct.category = product.category;
        
        // Cập nhật Firestore
        if (window.firebase && window.__FIREBASE_INITIALIZED__) {
          const db = firebase.firestore();
          await db.collection('products').doc(existingProduct.id).update({
            quantity: existingProduct.quantity,
            threshold: existingProduct.threshold,
            category: existingProduct.category
          });
        }
        
        updatedCount++;
      } else {
        // Thêm sản phẩm mới
        const newProduct = {
          id: generateProductId(product.name),
          name: product.name,
          category: product.category || 'uncategorized',
          quantity: product.quantity,
          threshold: product.threshold
        };
        
        productsData.push(newProduct);
        
        // Thêm vào Firestore
        if (window.firebase && window.__FIREBASE_INITIALIZED__) {
          const db = firebase.firestore();
          await db.collection('products').doc(newProduct.id).set(newProduct);
        }
        
        addedCount++;
      }
    }
    
    // Đóng modal
    modal.style.display = 'none';
    
    // Refresh bảng
    displayProducts();
    
    // Reset file input
    const fileInput = document.getElementById('importFileInput');
    if (fileInput) fileInput.value = '';
    
    alert(`✅ Nhập dữ liệu thành công!\n📊 Đã thêm: ${addedCount} sản phẩm\n🔄 Đã cập nhật: ${updatedCount} sản phẩm`);
    
  } catch (error) {
    console.error('Lỗi import:', error);
    alert('❌ Có lỗi xảy ra khi nhập dữ liệu. Vui lòng thử lại.');
  }
}

// Tạo ID cho sản phẩm mới
function generateProductId(productName) {
  const baseId = productName.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  let id = baseId;
  let counter = 1;
  
  while (productsData.some(p => p.id === id)) {
    id = `${baseId}-${counter}`;
    counter++;
  }
  
  return id;
}

// Upload product image to Firebase Storage. Returns { url, error }.
async function uploadProductImage(file) {
  if (!file) return { url: '', error: null };
  if (!(window.firebase && window.__FIREBASE_INITIALIZED__ && firebase.storage)) {
    return { url: '', error: 'Firebase Storage not available' };
  }

  try {
    const storageRef = firebase.storage().ref();
    const safeName = file.name.replace(/[^a-z0-9\.\-\_]/gi, '_');
    const path = 'product-images/' + Date.now() + '_' + safeName;
    const ref = storageRef.child(path);
    const snapshot = await ref.put(file);
    const url = await snapshot.ref.getDownloadURL();
    return { url, error: null };
  } catch (e) {
    console.warn('Upload product image failed', e && e.message ? e.message : e);
    return { url: '', error: (e && e.message) || String(e) };
  }
}

// Setup modal events
function setupModalEvents() {
  // Import modal
  const importModal = document.getElementById('importModal');
  const importCloseBtn = importModal.querySelector('.close');
  const cancelImportBtn = document.getElementById('cancelImportBtn');
  const confirmImportBtn = document.getElementById('confirmImportBtn');
  
  importCloseBtn.addEventListener('click', () => {
    importModal.style.display = 'none';
  });
  
  cancelImportBtn.addEventListener('click', () => {
    importModal.style.display = 'none';
  });
  
  confirmImportBtn.addEventListener('click', confirmImport);
  
  // Add product modal
  const addProductModal = document.getElementById('addProductModal');
  const addProductCloseBtn = addProductModal.querySelector('.close');
  const cancelAddProductBtn = document.getElementById('cancelAddProductBtn');
  const addProductForm = document.getElementById('addProductForm');
  
  addProductCloseBtn.addEventListener('click', () => {
    addProductModal.style.display = 'none';
    addProductModal._editProductId = null;
    addProductForm.reset();
    const modalHeader = addProductModal.querySelector('.modal-header h3');
    modalHeader.textContent = '➕ Thêm sản phẩm mới';
    const submitBtn = addProductModal.querySelector('form button[type="submit"]');
    submitBtn.textContent = '✅ Thêm sản phẩm';
  });
  
  cancelAddProductBtn.addEventListener('click', () => {
    addProductModal.style.display = 'none';
    addProductModal._editProductId = null;
    addProductForm.reset();
    const modalHeader = addProductModal.querySelector('.modal-header h3');
    modalHeader.textContent = '➕ Thêm sản phẩm mới';
    const submitBtn = addProductModal.querySelector('form button[type="submit"]');
    submitBtn.textContent = '✅ Thêm sản phẩm';
  });
  
  addProductForm.addEventListener('submit', handleAddProduct);

  // Image preview and upload handling in add product modal
  try {
    const imgInput = document.getElementById('newProductImage');
    const previewImg = document.getElementById('newProductImagePreviewImg');
    if (imgInput) {
      imgInput.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (f && previewImg) {
          const url = URL.createObjectURL(f);
          previewImg.src = url;
          previewImg.style.display = 'block';
        } else if (previewImg) {
          previewImg.src = '';
          previewImg.style.display = 'none';
        }
      });
    }
  } catch(e) { console.warn('Image preview init failed', e); }
  
  // Đóng modal khi click outside
  window.addEventListener('click', (event) => {
    if (event.target === importModal) {
      importModal.style.display = 'none';
    }
    if (event.target === addProductModal) {
      addProductModal.style.display = 'none';
      addProductModal._editProductId = null;
      addProductForm.reset();
      const modalHeader = addProductModal.querySelector('.modal-header h3');
      modalHeader.textContent = '➕ Thêm sản phẩm mới';
      const submitBtn = addProductModal.querySelector('form button[type="submit"]');
      submitBtn.textContent = '✅ Thêm sản phẩm';
    }
  });
}

window.productManager = {
  initialize: initializeProducts,
  display: displayProducts,
  save: saveProductInventory,
  reload: reloadProducts,
  export: exportToExcel,
  exportCSV: exportToCSV,
  exportJSON: exportToJSON,
  import: importFromExcel,
  downloadTemplate: downloadTemplate,
  addProduct: showAddProductModal
};

// Xuất Excel có kẻ bảng đẹp
function exportToExcelBeautiful() {
  const tableContent = productsData.map(p => {
    let statusText = 'Còn hàng';
    if (p.quantity <= 0) {
      statusText = 'Hết hàng';
    } else if (p.quantity <= p.threshold) {
      statusText = 'Cảnh báo';
    }
    return `
    <tr>
      <td style="border: 1px solid #000; padding: 5px;">${p.name}</td>
      <td style="border: 1px solid #000; padding: 5px;">${p.category}</td>
      <td style="border: 1px solid #000; padding: 5px; text-align: center;">${p.quantity}</td>
      <td style="border: 1px solid #000; padding: 5px; text-align: center;">${p.threshold}</td>
      <td style="border: 1px solid #000; padding: 5px; text-align: center;">${statusText}</td>
    </tr>
  `}).join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>San Pham</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
        th { border: 1px solid #000; background-color: #4CAF50; color: white; padding: 8px; font-weight: bold; text-align: center; }
        td { border: 1px solid #000; padding: 8px; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>
            <th colspan="5" style="font-size: 18px; padding: 15px; border: none; background-color: white; color: black; text-align: center;">DANH SÁCH SẢN PHẨM & TỒN KHO</th>
          </tr>
          <tr>
            <th>Tên sản phẩm</th>
            <th>Danh mục</th>
            <th>Số lượng tồn</th>
            <th>Ngưỡng tối thiểu</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          ${tableContent}
        </tbody>
      </table>
    </body>
    </html>
  `;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  a.download = `DanhSachSanPham_${timestamp}.xls`;
  a.click();
  URL.revokeObjectURL(url);
  alert('✅ Đã xuất file Excel thành công!');
}

// Debug function: Kiểm tra auth state và token claims tự động
async function debugAuthState() {
  console.log('🔐 === DEBUGGING AUTH STATE ===');
  try {
    const user = firebase.auth().currentUser;
    if (!user) {
      console.warn('❌ Chưa đăng nhập! Vui lòng đăng nhập trước.');
      return;
    }
    console.log('✅ User đã đăng nhập:', user.email);
    console.log('   UID:', user.uid);
    
    // Ép refresh token
    console.log('🔄 Đang refresh token...');
    await user.getIdToken(true);
    
    // Lấy token result + claims
    const tokenResult = await user.getIdTokenResult();
    console.log('✅ Token refreshed. Claims:', tokenResult.claims);
    
    if (tokenResult.claims?.admin === true) {
      console.log('✨ ADMIN CLAIM FOUND! admin = true');
    } else {
      console.warn('⚠️  NO ADMIN CLAIM! admin claim is missing or false');
      console.warn('   Upload sẽ bị FAIL vì rules chỉ cho admin ghi.');
    }
  } catch (err) {
    console.error('❌ Error debugging auth:', err.message);
  }
  console.log('🔐 === END DEBUG ===\n');
}

// Khởi tạo ngay hoặc khi document ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    debugAuthState();
    initializeProducts();
  });
} else {
  // DOM đã sẵn sàng, khởi tạo ngay
  setTimeout(() => {
    debugAuthState();
    initializeProducts();
  }, 100);
}
