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

module.exports = router;