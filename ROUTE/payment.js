var express = require("express");
var Razorpay = require("razorpay");
var router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://vuozzbzdmjgsltgmxrfo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1b3p6YnpkbWpnc2x0Z214cmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3MjgxOTIxMCwiZXhwIjoxOTg4Mzk1MjEwfQ.1Ik1KqQuy8hovFvJW19M-dfVifHgIiLOWlWeQ3D-iNc"
);
const bodyParser = require("body-parser");
const razorpayConfig = require('../configs/razorpayConfig').config;
router.use(bodyParser.json());

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
  razorpayInstance.orders.create(options, function(err, order) {
    if (order) {
      res.send({success: true, ...order});
    } else {
      res.send({success: false, ...err});
    }
  });
  
});

function refundRequest(payment_id, amount) {
  return new Promise((resolve, reject) => {
    razorpayInstance.payments.refund(payment_id,{ "amount": amount*100, "speed": "normal" }).then(refundResponse => {
      console.log("refundResponse  =>  ", refundResponse);
      resolve(refundResponse);
    }).catch(error => {
      console.log("refundResponseError  =>  ", error);
      reject({...error, message: error?.error?.description});
    })   
  })
  
}

module.exports = { router, refundRequest };