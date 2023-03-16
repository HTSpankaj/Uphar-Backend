var express = require("express");
var router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://vuozzbzdmjgsltgmxrfo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1b3p6YnpkbWpnc2x0Z214cmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3MjgxOTIxMCwiZXhwIjoxOTg4Mzk1MjEwfQ.1Ik1KqQuy8hovFvJW19M-dfVifHgIiLOWlWeQ3D-iNc"
);
const bodyParser = require("body-parser");
router.use(bodyParser.json());

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

module.exports = router;