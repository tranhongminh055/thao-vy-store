# Hướng dẫn Firebase (Minh hoạ với ThaoVyStore)

## I. Giới thiệu chung

1. Định nghĩa

Firebase là nền tảng phát triển ứng dụng do Google cung cấp, hỗ trợ realtime database, Firestore (NoSQL), Firebase Auth, Storage, Hosting, Cloud Functions, Analytics... Giúp phát triển web/mobile nhanh mà không cần quản lý backend phức tạp.

2. Lý do lựa chọn

- Dễ sử dụng, tích hợp nhanh với Android/Web.
- Không cần xây dựng server riêng (dùng Cloud Functions khi cần).
- Hỗ trợ realtime và sync dữ liệu.
- Có gói miễn phí phù hợp cho sinh viên.
- Được Google phát triển, ổn định.

3. Đặc điểm nổi bật

- Đồng bộ realtime, thân thiện với ứng dụng tương tác.
- Khả năng mở rộng tốt, cơ chế bảo mật qua Rules.
- Mô hình dữ liệu NoSQL linh hoạt.


## II. Cách tạo Project và cấu trúc lưu trữ (Firestore)

1. Tạo Project trên Firebase Console

- Truy cập: https://console.firebase.google.com
- Add Project → đặt tên → Disable/Enable Analytics → Create Project → Continue

2. Khởi tạo Firestore

- Trong Console: Firestore Database → Create database
- Chọn `Test mode` (cho học tập) hoặc `Production` (khi vào thực tế)
- Chọn vị trí server

3. Tạo collection và document (ví dụ `products`)

- Start collection → tên: `products`
- Thêm document fields ví dụ:

```
{
  name: "Bánh kem dâu",
  price: 300000,
  category: "BanhGato",
  tags: ["sale","featured"]
}
```

4. Ví dụ trong ThaoVyStore

- File liên quan: `firebaseInit.js`, `firestore-sync.js`, `login.js`, `auth.js`, `firebase.json`.
- `firebaseInit.js` khởi tạo Firebase SDK (apiKey, projectId, etc) — mở file này để xem cấu hình client.
- `login.js` và `auth.js` minh hoạ việc đọc/ghi `users` collection.


## III. Tìm kiếm (Search) với Firestore (JavaScript)

1. Lấy toàn bộ collection

```js
const db = firebase.firestore();
const snapshot = await db.collection('products').get();
snapshot.forEach(doc => console.log(doc.id, doc.data()));
```

2. Tìm theo điều kiện

- Bằng giá trị:
```js
db.collection('products').where('name', '==', 'Bánh kem dâu').get();
```

- So sánh số:
```js
db.collection('products').where('price', '>', 200000).get();
```

3. Kết hợp, sắp xếp, phân trang

```js
db.collection('products')
  .where('price', '>=', 200000)
  .where('price', '<=', 500000)
  .orderBy('price', 'asc')
  .limit(20)
  .get();
```

4. Lưu ý: Firestore có hạn chế với các query cần `index` và một số phép kết hợp (ví dụ: range + inequality field yêu cầu `orderBy` cùng field). Kiểm tra console để tạo index khi cần.


## IV. Lọc dữ liệu (Filter) — Toán tử chính

- `==`, `>`, `<`, `>=`, `<=`, `!=`, `in`, `array-contains`.
- Ví dụ `array-contains`:
```js
db.collection('products').where('tags', 'array-contains', 'sale').get();
```

- `in` để tìm nhiều giá trị
```js
db.collection('products').where('category', 'in', ['BanhGato','BanhTiramisu']).get();
```

- Kết hợp nhiều `.where()` để tạo bộ lọc phức tạp (nhưng vẫn tuân theo quy tắc index của Firestore).


## V. Minh hoạ cách ThaoVyStore dùng Firebase

1. Khởi tạo Firebase (client)

- Mở file: `firebaseInit.js` (đã có trong repo). Tệp này gọi `firebase.initializeApp(...)` hoặc tương đương và export helper `initializeFirebase()`.
- `index.html`/`login.html` sẽ load `firebaseInit.js` và gọi `initializeFirebase();` trước khi dùng Firestore/Auth.

2. Đăng nhập (Auth)

- `login.js` dùng `firebase.auth().signInWithEmailAndPassword(email, password)` để đăng nhập.
- Sau khi đăng nhập thành công, app đọc profile từ `users` collection và lưu `loggedUser` vào `localStorage` để hiển thị thông tin người dùng.

3. Đồng bộ đơn hàng (example)

- `login.js` có hàm `migrateOrdersToFirestore(userEmail)` — nó đọc `localStorage.orders` và ghi sang `orders` collection trong Firestore nếu chưa có.

4. Ví dụ search/hiển thị sản phẩm (trích ý tưởng cho `index.js`)

```js
// tìm sản phẩm theo tên (simple contains bằng client-side)
const q = db.collection('products').where('name', '==', 'Bánh kem dâu');
const snap = await q.get();
// hiển thị
snap.forEach(doc => {
  const p = doc.data();
  // render vào DOM
});

// Lưu ý: Firestore không hỗ trợ partial text search out-of-the-box
// Với tìm kiếm kiểu 'contains' nên dùng Algolia/Elastic hoặc Atlas Search.
```


## VI. Triển khai Hosting & Functions (ngắn gọn)

1. Firebase Hosting

- Kiểm tra `firebase.json` ở root project — ThaoVyStore đã chứa `hosting` config.
- Deploy hosting:
```bash
firebase deploy --only hosting
```

2. Cloud Functions (nếu dùng API)

- Folder: `functions/` chứa code cloud functions.
- Deploy functions:
```bash
firebase deploy --only functions
```

(Ghi chú: project của bạn có `functions` folder — kiểm tra log nếu deploy functions bị lỗi.)


## VII. Gợi ý thao tác minh hoạ trong Word (yêu cầu của bạn)

- Tôi đã chuẩn hoá nội dung trên thành file Markdown `Firebase_Tutorial_ThaoVyStore.md` (nằm tại root project `WebApp/ThaoVyStore`).
- Nếu bạn muốn file Word (.docx): có thể chuyển Markdown → Word bằng `pandoc` hoặc mở Markdown trong VS Code và chọn 'Export to Word' (với extension), hoặc dán nội dung vào Word.

Pandoc ví dụ:
```bash
pandoc Firebase_Tutorial_ThaoVyStore.md -o Firebase_Tutorial_ThaoVyStore.docx
```


## VIII. Ghi chú/Tiếp theo

- Muốn tôi chỉnh tiếng Việt câu từ cho trang slides (ngắn gọn, trình chiếu), mình sẽ tách các slide và xuất `slides.md` hoặc `presentation.pdf`.
- Muốn tôi tạo ngay file `.docx` từ Markdown trong workspace không? (mất vài giây, dùng `pandoc` nếu có trên máy hoặc em có thể tạo `.docx` cơ bản bằng chuyển đổi server-side). 

---

Tôi đã lưu file hướng dẫn tại: `Firebase_Tutorial_ThaoVyStore.md`.

Bạn muốn tôi:
- Tạo luôn `Firebase_Tutorial_ThaoVyStore.docx` trong workspace, hay
- Chuẩn hoá thành slide ngắn để thuyết trình?