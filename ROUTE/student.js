var express = require("express");
var router = express.Router();
var multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://vuozzbzdmjgsltgmxrfo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1b3p6YnpkbWpnc2x0Z214cmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3MjgxOTIxMCwiZXhwIjoxOTg4Mzk1MjEwfQ.1Ik1KqQuy8hovFvJW19M-dfVifHgIiLOWlWeQ3D-iNc"
);
const bodyParser = require("body-parser");
const { addNotificationWhenOrderAdd } = require("./notification");
//var app=express();
router.use(bodyParser.json());
const storage = multer.memoryStorage();

router.get("/", function (req, res, next) {
  res.send("respond with a resource from student.js");
});

router.post("/registrationStudent", async (req, res) => { 
  const post = req.body;
  console.log(req.body);

  const createUserResponse = await supabase.auth.admin.createUser({
    email: post.email,
    password: post.password,
    email_confirm: true,
  });
  if (createUserResponse.data.user) {
    const insertData = await supabase.from("student").insert({
      first_name: post.first_name,
      last_name: post.last_name,
      student_id: createUserResponse.data.user.id,
      email: createUserResponse.data.user.email,
      created_at: createUserResponse.data.user.created_at,
      updated_at: createUserResponse.data.user.updated_at,
    }).select("*").maybeSingle();
    console.log(insertData)
    res.send(insertData);
    // please tell this one
  } else {
    res.send({ error: createUserResponse.error });
  }
});

router.get("/getStudentById", async (req, res) => {
  const data = await supabase.from("student").select("*").eq("student_id", req.query.student_id).maybeSingle();
  res.send(data);
});

router.post("/updateStudent", async (req, res) => {
  const d = req.body;
  let postData = { ...d };
  delete postData.student_id;

  console.log(postData);

  const update = await supabase
    .from("student")
    .update(postData)
    .select("*")
    .maybeSingle()
    .eq("student_id", d.student_id);

  res.send(update);
});

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
router.get("/getAllSubjectByCourseId", async (req, res) => { 
  const data = await supabase.from("course").select("*,subject!left(*)").eq("course_id", req.query.course_id).maybeSingle();
  res.send(data);
});

router.get("/getTeacherList", async (req, res) => { 
  let data = await supabase.from("teacher").select("*");
  res.send(data);
});

router.get("/getTeacherListWithFilter", async (req, res) => { 
  let {selectedLanguage, selectedBoard} = req.query;
  // selectedLanguage = selectedLanguage.split(",");
  // selectedBoard = selectedBoard.split(",");
  console.log({selectedLanguage, selectedBoard});
  let data = await supabase.from("teacher").select("*, review!left(*)").or(`language.cs.{${selectedLanguage}}, board.cs.{${selectedBoard}}`)
  // .contains('language', selectedLanguage)
  // .contains('board', selectedBoard)
  res.send(data);
});

router.get("/getTeachersBySubjectIdWithFilter", async (req, res) => { 
  let {selectedLanguage, selectedBoard} = req.query;
  const data = await supabase.from("teacher-subject").select("*,teacher_id(*, review!left(*)), subject_id(*)").eq("subject_id", req.query.subject_id).or(`language.cs.{${selectedLanguage}}, board.cs.{${selectedBoard}}`, { foreignTable: 'teacher_id' });
  res.send(data);
});

router.get("/getTeacherById", async (req, res) => { 
  const data = await supabase.from("teacher").select("*,teacher-subject!left(*, subject_id(*, course_id(*)))").eq("teacher_id", req.query.teacher_id).maybeSingle();
  res.send(data);
});

router.get("/getScheduleByScheduleId", async (req, res) => { 
  const data = await supabase.from("schedule").select("*, teacher_id(*)").eq("schedule_id", req.query.schedule_id).maybeSingle();
  res.send(data);
});

router.get("/getTeachersBySubjectId", async (req, res) => { 
  const data = await supabase.from("teacher-subject").select("*,teacher_id(*, review!left(*)), subject_id(*)").eq("subject_id", req.query.subject_id);
  res.send(data);
});

router.get("/getAllSubscriptions", async (req, res) => { 
  const data = await supabase.from("subscription-plan").select("*");
  res.send(data);
});

router.get("/getStudentSubscribedToTeacherPlan", async (req, res) => {
  const { teacher_id, student_id } = req.query;
  // console.log("teacher_id => ", teacher_id);
  // console.log("student_id => ", student_id);
  const data = await supabase.from("subscription-plan").select("*, subscription-teacher-user!left(*)").eq("subscription-teacher-user.student_id", student_id).eq("subscription-teacher-user.teacher_id", teacher_id);
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
    res.send({ error: { message: "body parameters incorrect."} });
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
  const { start_date, end_date, start_time, end_time, student_id, teacher_id, schedule_id, group_details, booking_type } = req.body;

  if (start_date && end_date && start_time && end_time && student_id && student_id && teacher_id && schedule_id && group_details && booking_type) {
    const check_bookingResponse = await supabase.rpc("check_booking", {
      startdate: start_date,
      enddate: end_date,
      starttime: start_time,
      endtime: end_time,
      teacherid: teacher_id,
    });

    if (check_bookingResponse?.data && check_bookingResponse?.data?.length > 0) {
      res.send({ error: { message: "This slot already booked someone." } });
    } else {
      const addOrderDataResponse = await supabase.from("order").insert({ start_date, end_date, start_time, end_time, student_id, teacher_id, schedule_id, group_details, booking_type }).select("*").maybeSingle();
      await addNotificationWhenOrderAdd(teacher_id, student_id);
      res.send(addOrderDataResponse);
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

router.post("/checkBookTeacherScheduleSlot", async (req, res) => {
  const { start_date, end_date, start_time, end_time, teacher_id } = req.body;

  if (start_date && end_date && start_time && end_time && teacher_id) {
    const check_bookingResponse = await supabase.rpc("check_booking", {
      startdate: start_date,
      enddate: end_date,
      starttime: start_time,
      endtime: end_time,
      teacherid: teacher_id,
    });

    if (check_bookingResponse?.data && check_bookingResponse?.data?.length > 0) {
      res.send({ success: false, error: { message: "This slot already booked someone." } });
    } else {
      res.send({ success: true, error: null });
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

module.exports = router;