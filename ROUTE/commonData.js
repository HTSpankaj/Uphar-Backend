var express = require("express");
var router = express.Router();
var multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://vuozzbzdmjgsltgmxrfo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1b3p6YnpkbWpnc2x0Z214cmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3MjgxOTIxMCwiZXhwIjoxOTg4Mzk1MjEwfQ.1Ik1KqQuy8hovFvJW19M-dfVifHgIiLOWlWeQ3D-iNc"
);
const bodyParser = require("body-parser");
router.use(bodyParser.json());
const storage = multer.memoryStorage();

const twilio = require('twilio');
const accountSid = 'AC3900352c18df0b274177df76560abf22'; // Your Account SID from www.twilio.com/console
const authToken = '18346dda8f1d6a7be797460322cf7c06'; // Your Auth Token from www.twilio.com/console

const client = require('twilio')(accountSid, authToken)

router.get("/", function (req, res, next) {
  res.send("respond with a resource from commonData.js");
});

router.get("/getHowToUseData", async (req, res) => {
  const data = await supabase.from("common-data").select("how_to_use").eq("id", 1).maybeSingle();
  res.send(data);
});

router.get("/getHelpData", async (req, res) => {
  const data = await supabase.from("common-data").select("help").eq("id", 1).maybeSingle();
  res.send(data);
});

router.get("/getTermsAndConditionsData", async (req, res) => {
  const data = await supabase.from("common-data").select("terms_and_conditions").eq("id", 1).maybeSingle();
  res.send(data);
});

router.post("/updateCommonData", async (req, res) => {
  let postData = { ...req.body };
  const data = await supabase.from("common-data").update(postData).select("*").eq("id", 1).maybeSingle();
  res.send(data);
});

router.post("/uploadEditorImage", multer({ storage: storage }).single("photo"), async (req, res) => {
  supabase.storage.from("editor-images").upload(req.body.file_name, req.file.buffer).then(imgRes=> {
    if(imgRes.data) {
      // console.log("==> ", supabase.storage.from("editor-images").getPublicUrl(imgRes.data.path).data.publicUrl);
      res.send({default: supabase.storage.from("editor-images").getPublicUrl(imgRes.data.path).data.publicUrl})
    } else {
      res.send(imgRes?.error?.message)
    }
  })
});

router.post("/sendOTP", async (req, res) => {
  let postData = { ...req.body };
  // const data = await supabase.from("common-data").update(postData).select("*").eq("id", 1).maybeSingle();
  // res.send(data);
  try {
    var otp = Math.floor(1000 + Math.random() * 9000);
    const twilioClientResponse = await client.messages.create({...postData, body:`Dear user, use this One Time Password ${otp} to verify your number from Bizorclass.`, from: "+15618232622"});
    res.send({ success: true, data: twilioClientResponse, otp });
            
  } catch (error) {
    console.log("Twilio error => ", error);
    res.send({ success: false, error });
  }
});


module.exports = router;