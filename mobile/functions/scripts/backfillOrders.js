/**
 * Backfill orders từ backup hoặc manual input vào Firestore
 * Usage: node scripts/backfillOrders.js orders.json
 */

const admin = require('firebase-admin');

async function main() {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    }

    const db = admin.firestore();

    // load thông tin order lưu trong database dưới dạng json (có thể xem trực tiếp trong console log của trình duyệt)
    const orders = [
      {
        "orderId": "#278615187",
        "orderDate": "2/23/2026",
        "confirmTime": "30 phút sau khi đặt hàng",
        "status": "confirmed",
        "userEmail": "nhattran7923@gmail.com",
        "customer": { "name": "quân nhật", "phone": "0385439652", "address": "k16 phan bội châu" },
        "payment": { "method": "cash-on-delivery" },
        "products": [{ "name": "Bánh Tiramisu Ý", "price": 300000, "quantity": 2 }],
        "subtotal": 600000,
        "discount": 50000,
        "total": 550000,
        "confirmedAt": "2026-02-23T10:45:00.000Z"
      },
      {
        "orderId": "#859484773",
        "orderDate": "2/23/2026",
        "confirmTime": "30 phút sau khi đặt hàng",
        "status": "confirmed",
        "userEmail": "nhattran7923@gmail.com",
        "customer": { "name": "quân nhật", "phone": "0385439652", "address": "k16 phan bội châu" },
        "payment": { "method": "cash-on-delivery" },
        "products": [{ "name": "Bánh Tiramisu Ý", "price": 300000, "quantity": 3 }],
        "subtotal": 900000,
        "discount": 50000,
        "total": 850000,
        "confirmedAt": "2026-02-23T11:11:23.151Z"
      }
    ];

    console.log('Backfilling ' + orders.length + ' orders to Firestore...');

    for (const order of orders) {
      if (!order.orderId || !order.userEmail) {
        console.warn('Skipping order with missing orderId or userEmail:', order);
        continue;
      }

      const userEmail = order.userEmail.toString().toLowerCase();
      const orderId = order.orderId;

      try {
        // Write to orders collection
        await db.collection('orders').doc(orderId).set(
          Object.assign({}, order, {
            userEmail: userEmail,
            createdAt: order.confirmedAt || firebase.firestore.FieldValue.serverTimestamp()
          }),
          { merge: true }
        );

        // Write to users/{email}/orders subcollection
        await db.collection('users').doc(userEmail).collection('orders').doc(orderId).set({
          orderId: orderId,
          status: order.status || 'confirmed',
          total: order.total || 0,
          createdAt: order.confirmedAt || admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log('✅ Backfilled order:', orderId, 'for user:', userEmail);
      } catch (e) {
        console.error('❌ Failed to backfill order ' + orderId + ':', e.message);
      }
    }

    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
