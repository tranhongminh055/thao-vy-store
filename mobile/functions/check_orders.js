const admin = require("firebase-admin");

// Khởi tạo app
admin.initializeApp();
const db = admin.firestore();

async function checkOrders() {
  console.log("Checking orders with paymentProofUrl...");
  try {
    const snapshot = await db.collection("orders").get();
    let hasProofs = 0;
    let total = 0;
    snapshot.forEach(doc => {
      total++;
      const data = doc.data();
      if (data.paymentProofUrl) {
        hasProofs++;
        console.log(`Order ${doc.id}: status=${data.status}, paymentStatus=${data.paymentStatus}, paymentProofUrl=${data.paymentProofUrl}`);
      }
    });
    console.log(`Total orders: ${total}, with proofs: ${hasProofs}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

checkOrders();
