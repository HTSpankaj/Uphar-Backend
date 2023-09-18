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
const instamojoConfig = require('../configs/instamojoConfig').config;
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

  const { teacher_id, student_id, start_date, end_date, start_time, end_time, schedule_id, booking_type, group_details, address, course_id, latitude, longitude, subscription_plan_id, total_price } = req.body;
  // teacher_id
  // student_id
  // start_date
  // end_date
  // start_time
  // end_time
  // schedule_id
  // booking_type
  // group_details
  // address
  // course_id
  // latitude
  // longitude
  // subscription_plan_id
  // total_price
  //! cancel_status, cancel_reason, razorpay_refund_id, refund_status,
  //! pay_api_postbody, pay_api_response

  if (teacher_id && student_id && start_date && end_date && start_time && end_time && schedule_id && booking_type && group_details && address && course_id && latitude && longitude && subscription_plan_id && total_price) {

    try {
      const transactionInsertResponse = await supabase.from("transaction").insert({ teacher_id, student_id, start_date, end_date, start_time, end_time, schedule_id, booking_type, group_details, address, course_id, latitude, longitude, subscription_plan_id, total_price }).select('*').maybeSingle();
      if (transactionInsertResponse?.data) {

        let postData = {
          merchantId: phonepeConfig.merchantId,
          merchantTransactionId: transactionInsertResponse.data?.transaction_id,
          amount: transactionInsertResponse?.data?.total_price * 100,
          merchantUserId: phonepeConfig.merchantUserId,
          redirectUrl: `${req.protocol}://${req.get('host')}/payment/phonepe-redirectUrl-api`,
          redirectMode: "POST",
          callbackUrl: `${req.protocol}://${req.get('host')}/payment/phonepe-callbackUrl-api`,
          paymentInstrument: {
            "type": "PAY_PAGE"
          }
        }
        const jsonToBase64Payload = jsonToBase64(postData);
        let X_VERIFY_string = SHA256(jsonToBase64Payload + "/pg/v1/pay" + phonepeConfig.saltKey) + "###" + phonepeConfig.saltIndex;

        let headers = {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'X-VERIFY': X_VERIFY_string
        }

        try {
          const payApiResponse = await axios.post(`${phonepeConfig.phonePeBaseURL}/pg/v1/pay`, { request: jsonToBase64Payload }, { headers })
          // console.log("payApiResponse => ", payApiResponse);
          const transactionUpdateResponse = await supabase.from("transaction").update({ pay_api_postbody: postData, pay_api_response: payApiResponse?.data }).eq("transaction_id", transactionInsertResponse.data?.transaction_id)

          res.status(200).json({ success: true, response: payApiResponse?.data })
        } catch (error) {
          console.error("error => ", error?.response?.data);
          console.error("error status => ", error?.response?.status);
          res.status(500).json({ success: false, response: error?.response?.data });
        }
      } else {
        throw transactionInsertResponse?.error
      }
    } catch (error) {
      console.log("error => ", error);
      res.status(500).json({ success: false, error });
    }
  } else {
    res.status(500).json({ success: false, error: "Invalid post body." });
  }
});

router.post("/phonepe-callbackUrl-api", async (req, res) => {
  const postBody = req.body;

  console.log("callbackUrl postBody", postBody);
  res.status(500).json({ success: false, postBody });
})


// ? =>  https://developer.phonepe.com/v1/reference/check-status-api-1
router.post("/phonepe-redirectUrl-api", async (req, res) => {
  const postBody = req.body;

  console.log(postBody);

  let X_VERIFY_string = SHA256(`pg/v1/status/${postBody?.merchantId}/${postBody?.transactionId}` + phonepeConfig.saltKey).toString() + "###" + phonepeConfig.saltIndex;

  let headers = {
    accept: 'application/json',
    'Content-Type': 'application/json',
    'X-VERIFY': X_VERIFY_string,
    'X-MERCHANT-ID': postBody?.merchantId
  }
  try {
    const payApiResponse = await axios.get(`${phonepeConfig.phonePeBaseURL}/pg/v1/status/${postBody?.merchantId}/${postBody?.transactionId}`, { headers })

    console.log("payApiResponse => ", payApiResponse.data);
    // res.status(200).json({success: true, response: payApiResponse?.data})
    res.render('PhonePe/phonepeRedirect/phonepeSuccessRedirect', { title: 'Bizorclass Payment Success', amount: (postBody?.amount / 100) || 0, merchantTransactionId: payApiResponse.data?.data?.merchantTransactionId });
  } catch (error) {
    // console.error("error => ", error);
    console.error("error => ", error?.response?.data);
    console.error("error status => ", error?.response?.status);

    res.render('PhonePe/phonepeRedirect/phonepeErrorRedirect', { title: 'Bizorclass Payment Failure', amount: (postBody?.amount / 100) || 0 });
    // res.status(500).json({success: false, error: error?.response?.data});
  }
})

//* Instamojo
router.post("/create-instamojo-payment-request", async (req, res) => {

  const { amount, studentName, email, phoneNumber } = req.body;

  if (amount && studentName && email && phoneNumber) {
    const encodedParams = new URLSearchParams();
    encodedParams.set('grant_type', 'client_credentials');
    encodedParams.set('client_id', instamojoConfig.clientId);
    encodedParams.set('client_secret', instamojoConfig.clientSecret);

    console.log("encodedParams", encodedParams);

    const options = {
      method: 'POST',
      url: `${instamojoConfig.instaMojoBaseURL}/oauth2/token/`,
      headers: {
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: encodedParams,
    };

    axios.request(options).then((generateAccessTokenResponse) => {
      console.log("generateAccessTokenResponse => ", generateAccessTokenResponse);
      if (generateAccessTokenResponse.data?.access_token) {
        const encodedParams = new URLSearchParams();
        encodedParams.set('allow_repeated_payments', 'false');
        encodedParams.set('send_email', 'false');
        encodedParams.set('purpose', 'Book Schedule');
        encodedParams.set('amount', amount);
        encodedParams.set('buyer_name', studentName);
        encodedParams.set('email', email);
        encodedParams.set('phone', phoneNumber);

        const options = {
          method: 'POST',
          url: `${instamojoConfig.instaMojoBaseURL}/v2/payment_requests/`,
          headers: {
            accept: 'application/json',
            Authorization: `bearer ${generateAccessTokenResponse.data?.access_token}`,
            'content-type': 'application/x-www-form-urlencoded'
          },
          data: encodedParams,
        };
        
        axios.request(options).then((createPaymentRequest) => {
          console.log(createPaymentRequest.data);
          res.status(200).json({ success: true, data: createPaymentRequest.data });
        }).catch((createPaymentError) => {
          console.error(createPaymentError?.response?.data);
          res.status(500).json({ success: false, error: createPaymentError?.response?.data });
        });
      } else {
        res.status(500).json({ success: false, error: "something went wrong please try again." });
      }
    }).catch((error) => {
      console.error(error?.response?.data);
      res.status(500).json({ success: false, error: error?.response?.data });
    });
  } else {
    res.status(500).json({ success: false, error: "Invalid post body." });
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