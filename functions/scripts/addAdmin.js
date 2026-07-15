

/**
 * Tạo tài khoản admin trường hợp forgot
 * lệnh Run: node functions/scripts/addAdmin.js
 */

const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const path = require('path');

// Khởi tạo firebase admin SDK với service account key 
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
} catch (error) {
  console.log('Firebase already initialized');
}

const db = admin.firestore();

async function addAdminUser() {
  try {
    console.log('🔄 Đang tạo tài khoản admin...\n');

    const email = 'vynguyen2005@gmail.com';
    const password = '123456';
    const name = 'Admin VyNguyen';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin in Firestore
    await db.collection('users').doc(email).set({
      email: email,
      name: name,
      password: hashedPassword,
      role: 'admin',
      isAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Tài khoản admin đã được tạo!\n');
    console.log('📧 Email: vynguyen2005@gmail.com');
    console.log('🔑 Password: 123456');
    console.log('👤 Role: admin\n');
    console.log('Bây giờ bạn có thể đăng nhập vào admin page');

    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

addAdminUser();
