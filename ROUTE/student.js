var express = require("express");
var router = express.Router();
var multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://vuozzbzdmjgsltgmxrfo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1b3p6YnpkbWpnc2x0Z214cmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3MjgxOTIxMCwiZXhwIjoxOTg4Mzk1MjEwfQ.1Ik1KqQuy8hovFvJW19M-dfVifHgIiLOWlWeQ3D-iNc"
);
const bodyParser = require("body-parser");
//var app=express();
router.use(bodyParser.json());

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource from student");
});

module.exports = router;

router.post("/registrationStudent", async (req, res) => { 
  const post = req.body;
  console.log(req.body);

  const createUserResponse = await supabase.auth.admin.createUser({
    email: post.email,
    password: post.password,
    email_confirm: true,
  });
  if (createUserResponse.data.user) {
    const insertData = await supabase
      .from("teacher")
      .insert({
        teacher_id: createUserResponse.data.user.id,
        email: createUserResponse.data.user.email,
        created_at: createUserResponse.data.user.created_at,
        updated_at: createUserResponse.data.user.updated_at,
      })
      .select("*")
      .maybeSingle();
    //  console.log(created_at)
    res.send(insertData);
    // please tell this one
  } else {
    res.send({ error: createUserResponse.error });
  }
});

const storage = multer.memoryStorage();
router.post("/studentUploadImage", multer({ storage: storage }).single("photo"), async (req, res) => { 
    const uploadObj = await supabase.storage
      .from("student")
      .upload(req.body.id + ".webp", req.file.buffer, {
        cacheControl: "3600",
        upsert: true,
      });

    const url = supabase.storage
      .from("student")
      .getPublicUrl(uploadObj.data.path);
    console.log(url);
    const updatedata = await supabase
      .from("student")
      .update({
        photo_url: url.data.publicUrl,
      })
      .select("*")
      .maybeSingle()
      .eq("student_id", req.body.id);

    res.send(updatedata);
  }
);

router.post("/studentLogin", async (req, res) => {  
  const post = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({
    email: post.email,
    password: post.password,
  });

  if (data.user) {
    const resss = await supabase
      .from("student")
      .select("*")
      .eq("student_id", data.user.id)
      .maybeSingle();
    res.send(resss);
  } else {
    res.send({ user: null });
  }
});

router.get("/getAllCourseWithSubject", async (req, res) => { 
  const data = await supabase.from("course").select("*,subject!left(*)");
  res.send(data);
});


router.get("/getTeacherList", async (req, res) => { 
  let data = await supabase.from("teacher").select("*");
  res.send(data);
});

router.get("/getTeacherById", async (req, res) => { 
  const data = await supabase.from("teacher").select("*,teacher-subject!left(*, subject_id(*, course_id(*)))").eq("teacher_id", req.query.teacher_id).maybeSingle();
  res.send(data);
});

router.get("/getAllSubscriptions", async (req, res) => { 
  const data = await supabase.from("subscription-plan").select("*");
  res.send(data);
});


router.post("/studentSubscribeToPlan", async (req, res) => { 
  const {
    teacher_id,
    student_id,
    subscription_plan_id,
    razorpay_payment_id,
    total_price,
  } = req.body;
  console.log({
    teacher_id,
    student_id,
    subscription_plan_id,
    razorpay_payment_id,
    total_price,
  });
  if (
    teacher_id &&
    student_id &&
    subscription_plan_id &&
    razorpay_payment_id &&
    total_price
  ) {
    const insertData = await supabase
      .from("subscription-teacher-user")
      .insert(req.body)
      .select("*")
      .maybeSingle();
    res.send(insertData);
  } else {
    res.send({ error: "body parameters incorrect." });
  }
});


router.get("/getOrderByStudentId", async (req, res) => { 
  const data = await supabase.from("order").select("*").eq("student_id", req.query.student_id);
  res.send(data);
});

router.post("/passwordChangeStudent", async (req, res) => { 
  
  const { email, password } = req.body;
  const studentResponse = await supabase.from("student").select("student_id").eq("email", email).maybeSingle();

  if (studentResponse.data && studentResponse.data?.student_id) {
    const updatePassword = await supabase.auth.admin.updateUserById(
      studentResponse.data.student_id,
      { password: password }
    );
    if (updatePassword.data?.user) {
      res.send({ success: true });
    } else {
      res.send({
        success: false,
        error: { message: "Something went wrong! Try again" },
      });
    }
  } else {
    res.send({
      success: false,
      error: {
        message: "There are no users with the email address you specified. Please try again..",
      },
    });
  }
});

router.post("/bookTeacherScheduleSlot", async (req, res) => {
  const { start_date, end_date, start_time, end_time, student_id, teacher_id, schedule_id } = req.body;

  if (start_date && end_date && start_time && end_time && student_id && student_id && teacher_id, schedule_id) {
    const check_bookingResponse = await supabase.rpc("check_booking", {
      startdate: start_date,
      enddate: end_date,
      teacherid: teacher_id,
    });
    if (check_bookingResponse?.data && check_bookingResponse?.data?.length > 0) {
      res.send({ error: { message: "This slot already booked someone." } });
    } else {
      const updateDataResponse = await supabase.from("order").insert({ start_date, end_date, start_time, end_time, student_id, teacher_id, schedule_id }).select("*").maybeSingle().eq("order_id", order_id);
      res.send(updateDataResponse);
    }
  } else {
    res.send({
      success: false,
      error: {
        message: "Please post body send properly. Please try again..",
      },
    });
  }
});
