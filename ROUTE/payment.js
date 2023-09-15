var express = require("express");
var Razorpay = require("razorpay");
var router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://vuozzbzdmjgsltgmxrfo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1b3p6YnpkbWpnc2x0Z214cmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3MjgxOTIxMCwiZXhwIjoxOTg4Mzk1MjEwfQ.1Ik1KqQuy8hovFvJW19M-dfVifHgIiLOWlWeQ3D-iNc"
);
const bodyParser = require("body-parser");
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const razorpayConfig = require('../configs/razorpayConfig').config;
const phonepeConfig = require('../configs/phonepeConfig').config;
const { v4: uuidv4 } = require('uuid');
var SHA256 = require("crypto-js/sha256");
const { default: axios } = require("axios");
const sdk = require('api')('@phonepe-docs/v1#3dxznuf1gljiezluv');

//* instances
var razorpayInstance = new Razorpay({
  key_id: razorpayConfig.RAZORPAY_KEY,
  key_secret: razorpayConfig.RAZORPAY_Key_SECRET,
});

router.get("/", function (req, res, next) {
  res.send("respond with a resource from payment.js");
});


router.post("/razorpayCreateOrderId", async (req, res) => {
  let { amount } = { ...req.body };
  var options = {
    amount: amount,  // amount in the smallest currency unit
    currency: "INR",
    receipt: "order_rcptid_11"
  };
  razorpayInstance.orders.create(options, function (err, order) {
    if (order) {
      res.send({ success: true, ...order });
    } else {
      res.send({ success: false, ...err });
    }
  });

});

router.post("/phonepe-pay-api", async (req, res) => {
// router.get("/phonepe-pay-api", async (req, res) => {

  const { mobileNumber, amount } = req.body;

  let _merchantTransactionId = uuidv4();
  _merchantTransactionId = _merchantTransactionId?.replace(/-/g, "_") || "";

  let _merchantUserId = uuidv4();
  _merchantUserId = _merchantUserId?.replace(/-/g, "_") || "";

  let postData = {
    merchantId: phonepeConfig.merchantId,
    merchantTransactionId: _merchantTransactionId,
    amount: (amount || 1) * 100,
    merchantUserId: phonepeConfig.merchantUserId,
    // redirectUrl: "http://localhost:8080/payment/phonepe-redirectUrl-api",
    redirectUrl: `${req.protocol}://${req.get('host')}/payment/phonepe-redirectUrl-api`,
    redirectMode: "POST",
    // callbackUrl: "http://localhost:8080/payment/phonepe-callbackUrl-api",
    callbackUrl: `${req.protocol}://${req.get('host')}/payment/phonepe-callbackUrl-api`,
    mobileNumber: mobileNumber,
    paymentInstrument: {
      "type": "PAY_PAGE"
    },
    param1: "Pata"
  }
  const jsonToBase64Payload = jsonToBase64(postData);
  let X_VERIFY_string = SHA256(jsonToBase64Payload + "/pg/v1/pay" + phonepeConfig.saltKey) + "###" + phonepeConfig.saltIndex;


  // let headers = new HttpHeaders();
  // headers = headers.set('accept', 'application/json').set('Content-Type', 'application/json').set("X-VERIFY", X_VERIFY_string);
  let headers = {
    accept: 'application/json',
    'Content-Type': 'application/json',
    'X-VERIFY': X_VERIFY_string
  }

  // console.log("postData => ", postData);
  // console.log("jsonToBase64Payload => ", jsonToBase64Payload);
  // console.log("X_VERIFY_string => ", X_VERIFY_string);

  // return this.http.post('https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay', { request: jsonToBase64Payload }, { headers: headers }).toPromise();

  try {
    // const payApiResponse = await axios.post("https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay", { request: jsonToBase64Payload }, { headers })
    const payApiResponse = await axios.post("https://api.phonepe.com/apis/hermes/pg/v1/pay", { request: jsonToBase64Payload }, { headers })
    // console.log("payApiResponse => ", payApiResponse);
    res.status(200).json({success: true, response: payApiResponse?.data})
  } catch (error) {
    console.error("error => ", error?.response?.data);
    console.error("error status => ", error?.response?.status);
    res.status(500).json({success: false, response: error?.response?.data});
  }

  // sdk.payApi1(
  //   { request: jsonToBase64Payload },
  //   { 'x-verify': X_VERIFY_string }
  // ).then(({ data }) => {
  //   console.log(data);
  //   res.status(200).json({success: true, response: payApiResponse?.data})
  // }).catch(err => {
  //   console.error(err);
  //   res.status(500).json({success: false, response: err});
  // });
});

router.post("/phonepe-callbackUrl-api", async (req, res) => {
  const postBody = req.body;

  console.log("callbackUrl postBody", postBody);
  res.status(500).json({success: false, postBody});
})


// ? =>  https://developer.phonepe.com/v1/reference/check-status-api-1
router.post("/phonepe-redirectUrl-api", async (req, res) => {
  const postBody = req.body;

  console.log(postBody);

  let X_VERIFY_string = SHA256(`pg/v1/status/${postBody?.merchantId}/${postBody?.transactionId}` + phonepeConfig.saltKey) + "###" + phonepeConfig.saltKey;
  let headers = {
    accept: 'application/json',
    'Content-Type': 'application/json',
    'X-VERIFY': X_VERIFY_string,
    'X-MERCHANT-ID': postBody?.merchantId
  }
  try {
    // const payApiResponse = await axios.post(`https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${postBody?.merchantId}/${postBody?.transactionId}`, { request: jsonToBase64Payload }, { headers })
    const payApiResponse = await axios.get(`https://api.phonepe.com/apis/hermes/pg/v1/status/${postBody?.merchantId}/${postBody?.transactionId}`, { headers })
    
    console.log("payApiResponse => ", payApiResponse.data);
    res.status(200).json({success: true, response: payApiResponse?.data})
  } catch (error) {
    // console.error("error => ", error);
    console.error("error => ", error?.response?.data);
    console.error("error status => ", error?.response?.status);
    
    res.render('PhonePe/phonepeRedirect/phonepeErrorRedirect', { title: 'Bizorclass Payment Failure' , amount: (postBody?.amount / 100) || 0});
    // res.status(500).json({success: false, error: error?.response?.data});
  }
})

function refundRequest(payment_id, amount) {
  return new Promise((resolve, reject) => {
    razorpayInstance.payments.refund(payment_id, { "amount": amount * 100, "speed": "normal" }).then(refundResponse => {
      console.log("refundResponse  =>  ", refundResponse);
      resolve(refundResponse);
    }).catch(error => {
      console.log("refundResponseError  =>  ", error);
      reject({ ...error, message: error?.error?.description });
    })
  })

}

module.exports = { router, refundRequest };

//* JSON to Base64:
function jsonToBase64(object) {
  const json = JSON.stringify(object);
  return Buffer.from(json).toString("base64");
}