const { VNPay, ProductCode, VnpLocale } = require('vnpay');

try {
  const vnpay = new VNPay({
    tmnCode: 'DDCUKY4X',
    secureSecret: 'Y8MTP4YUY509ZCAYLWSGL1VW0AU810TV',
    vnpayHost: 'https://sandbox.vnpayment.vn',
  });

  const paymentUrl = vnpay.buildPaymentUrl({
    vnp_Amount: 100000,
    vnp_IpAddr: '127.0.0.1',
    vnp_TxnRef: 'TVS123456789',
    vnp_OrderInfo: 'Thanh toan don hang TVS123456789',
    vnp_OrderType: ProductCode.Other,
    vnp_ReturnUrl: 'https://thao-vy-store.web.app/vnpay-return.html',
    vnp_Locale: VnpLocale.VN,
    vnp_CreateDate: '20260705195324',
  });

  console.log("Success! Generated paymentUrl:", paymentUrl);
} catch (error) {
  console.error("Error using vnpay library:", error);
}
