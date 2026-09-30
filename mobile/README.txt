HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY WEBSITE
1.	Yêu cầu hệ thống:
o	Node.js (phiên bản mới nhất hoặc LTS).
o	Firebase CLI (cài đặt bằng lệnh: npm install -g firebase-tools).
o	Tài khoản Firebase đã được tạo và cấu hình.
2.	Tải mã nguồn:
o	Tải mã nguồn từ repository về máy tính của bạn.
o	Giải nén file zip (nếu cần) và mở thư mục dự án trong Visual Studio Code hoặc IDE bạn sử dụng.
3.	Cài đặt các dependencies:
o	Mở terminal và điều hướng đến thư mục ThaoVyStore.
o	Chạy lệnh: npm install

Lệnh này sẽ cài đặt tất cả các package cần thiết được liệt kê trong file package.json.
4.	Cấu hình Firebase:
o	Đăng nhập vào Firebase bằng lệnh: firebase login
o	Liên kết dự án với Firebase: firebase use:[id dự án của bạn]
Chọn các dịch vụ cần thiết như Hosting, Firestore, và Functions.
5.	Cấu hình Firebase trong mã nguồn:
o	Mở file firebaseInit.js trong thư mục ThaoVyStore.
o	Thay thế các thông tin cấu hình Firebase bằng thông tin từ dự án Firebase của bạn (API Key, Auth Domain, Project ID, v.v.).
6.	Triển khai Firestore Rules:
o	Điều hướng đến thư mục functions.
o	Chạy lệnh:  firebase deploy --only firestore:rules
7.	Triển khai Firebase Hosting:
o	Điều hướng đến thư mục ThaoVyStore.
o	Chạy lệnh: firebase deploy --only hosting
8.	Triển khai Firebase Functions (Backend):
o	Điều hướng đến thư mục functions.
o	Chạy lệnh: firebase deploy --only functions
9.	Truy cập website:
o	Sau khi triển khai thành công, bạn sẽ nhận được URL của website từ Firebase Hosting.
o	Mở trình duyệt và truy cập vào URL đó để kiểm tra website.
10.	Lưu ý:
o	Đảm bảo rằng bạn đã cấu hình đúng các thông tin trong Firebase Console (Firestore, Authentication, Hosting, v.v.).
o	Nếu có bất kỳ lỗi nào, kiểm tra lại cấu hình trong file firebase.json và firebaseInit.js.


