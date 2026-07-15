const fetch = require('node-fetch'); // Wait, does the project have node-fetch? 
// Or we can just use the global fetch (Node.js 18+ has native fetch!)

async function test() {
  const payload = {
    amount: 100000,
    orderInfo: "Thanh toan don hang TVS123456789 - ThaoVy Store",
    orderId: "TVS123456789",
    bankCode: "NCB"
  };

  try {
    const resp = await fetch('https://createvnpayurl-gxhdltzhga-uc.a.run.app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await resp.json();
    console.log("Response from Cloud Function:", data);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
