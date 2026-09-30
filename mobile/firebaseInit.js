// Firebase cấu hình và kết nối dự án với cơ sở dữ liệu firebase
const firebaseConfig = {
  apiKey: "AIzaSyBLE1v4CecJzwXu7Ost4cQAispy-tU0bOs", // api key của chatbot model
  authDomain: "thao-vy-store.firebaseapp.com",// domain của firebase hosting
  projectId: "thao-vy-store",// tên dự án trên firebase
  storageBucket: "thao-vy-store.firebasestorage.app", // bucket lưu trữ file trên firebase
  messagingSenderId: "286529155045", // id gửi tin nhắn của firebase
  appId: "1:286529155045:web:76fabec55bdcfbe614090c",// id ứng dụng trên firebase
  measurementId: "G-SQH3EQEE08"// id đo lường của firebase analytics
};

// Initialize Firebase when called
function initializeFirebase() {
  if (window.firebase && !window.__FIREBASE_INITIALIZED__) { // Kiểm tra nếu firebase đã được tải nhưng chưa khởi tạo
    try {
      firebase.initializeApp(firebaseConfig);// Khởi tạo firebase với cấu hình đã định nghĩa
      window.__FIREBASE_INITIALIZED__ = true; // Đánh dấu rằng firebase đã được khởi tạo để tránh khởi tạo lại nhiều lần
      console.log('Firebase initialized successfully'); // Log thành công khi firebase được khởi tạo
      return true;
    } catch (e) {
      console.warn('Firebase initialization error:', e); // Log lỗi nếu có vấn đề trong quá trình khởi tạo firebase xem trong console f12 của trình duyệt
      return false;
    }
  }
  return window.__FIREBASE_INITIALIZED__ || false;
}

// Make firebaseConfig available globally
window.firebaseConfig = firebaseConfig;
window.initializeFirebase = initializeFirebase;
