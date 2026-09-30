const crypto = require("crypto");
const qs = require("qs");

// Option 1: URLSearchParams
function vnpayBuildSearchParams(data) {
  const params = new URLSearchParams();
  const sortedKeys = Object.keys(data).sort();
  for (const key of sortedKeys) {
    if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
      params.append(key, String(data[key]));
    }
  }
  return params;
}

// Option 2: qs + sortObject
const sortObject = (obj) => {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
};

// Params simulation
const amount = 500000;
const txnRef = `TVS${Date.now()}`;
const createDate = "20260705195324";
const returnUrl = "https://thao-vy-store.web.app/vnpay-return.html";
const ipAddr = "127.0.0.1";
const VNPAY_TMN_CODE = "DDCUKY4X";
const VNPAY_HASH_SECRET = "Y8MTP4YUY509ZCAYLWSGL1VW0AU810TV";

const params = {};
params["vnp_Version"] = "2.1.0";
params["vnp_Command"] = "pay";
params["vnp_TmnCode"] = VNPAY_TMN_CODE;
params["vnp_Locale"] = "vn";
params["vnp_CurrCode"] = "VND";
params["vnp_TxnRef"] = txnRef;
params["vnp_OrderInfo"] = `Thanh toan don hang ${txnRef} - ThaoVy Store`;
params["vnp_OrderType"] = "other";
params["vnp_Amount"] = String(Math.round(amount) * 100);
params["vnp_ReturnUrl"] = returnUrl;
params["vnp_IpAddr"] = ipAddr;
params["vnp_CreateDate"] = createDate;

// Compute 1: URLSearchParams
const sp = vnpayBuildSearchParams(params);
const signData1 = sp.toString();

// Compute 2: qs + sortObject
const sorted = sortObject(params);
const signData2 = qs.stringify(sorted, { encode: false });

console.log("signData1 (URLSearchParams):", signData1);
console.log("signData2 (qs):             ", signData2);
console.log("Match?:", signData1 === signData2);
