const { VNPay } = require('vnpay');

const vnpay = new VNPay({
  tmnCode: 'DDCUKY4X',
  secureSecret: 'Y8MTP4YUY509ZCAYLWSGL1VW0AU810TV',
  vnpayHost: 'https://sandbox.vnpayment.vn',
});

// Create parameters including return status
const params = {
  vnp_Amount: '10000000',
  vnp_Command: 'pay',
  vnp_CreateDate: '20260705195324',
  vnp_CurrCode: 'VND',
  vnp_IpAddr: '127.0.0.1',
  vnp_Locale: 'vn',
  vnp_OrderInfo: 'Thanh toan don hang TVS123456789',
  vnp_OrderType: 'other',
  vnp_ReturnUrl: 'https://thao-vy-store.web.app/vnpay-return.html',
  vnp_TmnCode: 'DDCUKY4X',
  vnp_TxnRef: 'TVS123456789',
  vnp_Version: '2.1.0',
  vnp_ResponseCode: '00',
  vnp_TransactionNo: '14082260',
  vnp_BankCode: 'NCB',
  vnp_TransactionStatus: '00'
};

// We will compute the signature for all these return parameters
// Note: In VNPay, the return signature is computed on all vnp_ parameters except vnp_SecureHash and vnp_SecureHashType.
const sortedParams = {};
Object.keys(params).sort().forEach(key => {
  sortedParams[key] = params[key];
});

// Use the library's internal method if possible, or build it manually
const qs = require('qs');
const crypto = require('crypto');
const signData = qs.stringify(sortedParams, { encode: false });
const secureHash = crypto.createHmac("sha512", "Y8MTP4YUY509ZCAYLWSGL1VW0AU810TV").update(Buffer.from(signData, "utf-8")).digest("hex");

params['vnp_SecureHash'] = secureHash;

const verification = vnpay.verifyReturnUrl(params);
console.log("Verification Result:", verification);
console.log("Raw ResponseCode from params:", params.vnp_ResponseCode);
console.log("Raw TxnRef from params:", params.vnp_TxnRef);
console.log("Raw Amount from params:", params.vnp_Amount);
