const crypto = require("crypto");
const qs = require("qs");

const VNPAY_TMN_CODE = "DDCUKY4X";
const VNPAY_HASH_SECRET = "Y8MTP4YUY509ZCAYLWSGL1VW0AU810TV";
const VNPAY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

// Hàm sortObject đúng chuẩn VNPay (không encode)
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (let i = 0; i < keys.length; i++) {
    sorted[keys[i]] = obj[keys[i]];
  }
  return sorted;
}

const date = new Date();
const pad = n => String(n).padStart(2, "0");
const vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
const createDate = `${vietnamTime.getUTCFullYear()}${pad(vietnamTime.getUTCMonth()+1)}${pad(vietnamTime.getUTCDate())}${pad(vietnamTime.getUTCHours())}${pad(vietnamTime.getUTCMinutes())}${pad(vietnamTime.getUTCSeconds())}`;

let vnp_Params = {};
vnp_Params["vnp_Version"] = "2.1.0";
vnp_Params["vnp_Command"] = "pay";
vnp_Params["vnp_TmnCode"] = VNPAY_TMN_CODE;
vnp_Params["vnp_Locale"] = "vn";
vnp_Params["vnp_CurrCode"] = "VND";
vnp_Params["vnp_TxnRef"] = "DBGTEST" + Date.now();
vnp_Params["vnp_OrderInfo"] = "Test thanh toan";
vnp_Params["vnp_OrderType"] = "other";
vnp_Params["vnp_Amount"] = String(100000 * 100);
vnp_Params["vnp_ReturnUrl"] = "https://thao-vy-store.web.app/vnpay-return.html";
vnp_Params["vnp_IpAddr"] = "127.0.0.1";
vnp_Params["vnp_CreateDate"] = createDate;
vnp_Params["vnp_BankCode"] = "NCB";

console.log("=== BEFORE sortObject ===");
console.log(JSON.stringify(vnp_Params, null, 2));

vnp_Params = sortObject(vnp_Params);

console.log("\n=== AFTER sortObject ===");
console.log(JSON.stringify(vnp_Params, null, 2));

const signData = qs.stringify(vnp_Params, { encode: false });
console.log("\n=== signData ===");
console.log(signData);

const hmac = crypto.createHmac("sha512", VNPAY_HASH_SECRET);
const secureHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
console.log("\n=== secureHash ===");
console.log(secureHash);

vnp_Params["vnp_SecureHash"] = secureHash;
const paymentUrl = VNPAY_URL + "?" + qs.stringify(vnp_Params, { encode: false });
console.log("\n=== FULL PAYMENT URL ===");
console.log(paymentUrl);
