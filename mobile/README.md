# Thao-Vy-Store---Shop-Banh (Cake Store)

Website bán bánh sử dụng Firebase làm backend ứng dụng web .

    ## Tính năng

    - 🧁 Danh mục bánh: Bánh 2010, Bánh Gato, Bánh Tiramisu
    - 👤 Hệ thống tài khoản user với API backend
    - 🛒 Giỏ hàng và thanh toán
    - 📱 Responsive design
    - 🔐 Authentication với Firebase Functions

    ## API User Authentication

    Website sử dụng Firebase Functions cho authentication 

    ### Fallback System
    Nếu Firebase Functions chưa được deploy (do yêu cầu Blaze plan), hệ thống sẽ tự động fallback về localStorage để đảm bảo website vẫn hoạt động.

    ### API Endpoints (khi deploy)
    - `POST /register` - Đăng ký user mới
    - `POST /login` - Đăng nhập
    - `GET /getUser` - Lấy thông tin user (cần token)
    - `POST /logout` - Đăng xuất
    - `GET /getDemoCredentials` - Lấy thông tin tài khoản demo

    ### Deploy API (yêu cầu Blaze plan)

    ```bash
    cd functions
    npm install
    firebase deploy --only functions
    ```

    **Lưu ý**: Firebase Functions yêu cầu upgrade lên Blaze plan (pay-as-you-go) để deploy. Nếu chưa muốn upgrade, hệ thống sẽ hoạt động với localStorage.

    Chi tiết xem `API_DEPLOY_GUIDE.md`

    ## Deploy với Firebase Hosting

    1. Install Firebase CLI:

    ```bash
    npm install -g firebase-tools
    ```

    2. Login và chọn project:

    ```bash
    firebase login
    firebase use --add your-firebase-project-id
    ```

    3. Deploy:

    ```bash
    firebase deploy --only hosting
    ```

    Notes:
    - Thay `YOUR_FIREBASE_APP` trong các file HTML bằng domain Firebase thực tế
    - Cập nhật `API_BASE_URL` trong file JavaScript với URL Functions thực tế