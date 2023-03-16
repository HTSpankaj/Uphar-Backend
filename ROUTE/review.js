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
  res.send("respond with a resource from Review.js");
});

router.post("/addReview", async (req, res) => {  
  const {student_id, teacher_id, text, rating_star} = req.body;
  if (student_id && teacher_id && text && rating_star) {
    const insertData = await supabase.from("review").insert({student_id, teacher_id, text, rating_star, created_at: new Date()}).select("*").maybeSingle();
    res.send(insertData);
  } else {
    res.send({ error: { message: "body parameters incorrect."} });
  }
});

router.get("/getReviewByTeacherId", async (req, res) => { 
  const data = await supabase.from("review").select("*,student_id(photo_url, first_name, last_name, student_id)", {count: "exact"}).eq("teacher_id", req.query.teacher_id);
  res.send(data);
});

module.exports = router;