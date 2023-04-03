const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
var studentsRouter = require("./ROUTE/student");
var reviewRouter = require("./ROUTE/review");
var commonDataRouter = require("./ROUTE/commonData");
var paymentRouter = require("./ROUTE/payment").router;
var notificationRouter = require("./ROUTE/notification").router;
var orderRouter = require("./ROUTE/order");

const { createClient } = require("@supabase/supabase-js");
const { notEqual } = require("assert"); // why this
var multer = require("multer"); // form data
const addNotificationWhenTeacherAdd = require("./ROUTE/notification").addNotificationWhenTeacherAdd;

// Create a single supabase client for interacting with your database
const supabase = createClient(
  "https://vuozzbzdmjgsltgmxrfo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1b3p6YnpkbWpnc2x0Z214cmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3MjgxOTIxMCwiZXhwIjoxOTg4Mzk1MjEwfQ.1Ik1KqQuy8hovFvJW19M-dfVifHgIiLOWlWeQ3D-iNc"
);

const app = express();
app.use(cors());
app.get("/", (req, res) => {
  res.send({success: true});
});
app.use("/student", studentsRouter);
app.use("/review", reviewRouter);
app.use("/commonData", commonDataRouter);
app.use("/payment", paymentRouter);
app.use("/notification", notificationRouter);
app.use("/order", orderRouter);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); //  form data
//2
// app.use(upload.any());
app.post("/registrationAdmin", async (req, res) => {
  const post = req.body;
  console.log(req.body);

  const createUserResponse = await supabase.auth.admin.createUser({
    email: post.email,
    password: post.password,
    email_confirm: true,
  });
  if (createUserResponse.data.user) {
    const insertData = await supabase
      .from("admin")
      .insert({
        admin_id: createUserResponse.data.user.id,
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
//3
app.post("/updateAdmin", async (req, res) => {
  const d = req.body;
  updateResponse = await supabase
    .from("admin")

    .update({
      first_name: d.first_name,
      last_name: d.last_name,
      status: d.status,
    })
    .select("*")
    .maybeSingle()
    .eq("admin_id", d.admin_id);

  res.send(updateResponse);
});
//4
app.get("/getAdminList", async (req, res) => {
  let data = await supabase
    .from("admin")
    .select("*")
    //.eq()
    .order("first_name", { ascending: true });

  res.send(data);
});

//1
app.post("/adminLogin", async (req, res) => {
  const post = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({
    email: post.email,
    password: post.password,
  });

  if (data.user) {
    const resss = await supabase
      .from("admin")
      .select("*")
      .eq("admin_id", data.user.id)
      .maybeSingle();
    res.send(resss);
  } else {
    res.send({ user: null });
  }
});
//?
app.put("/Update", async (req, res) => {
  const post = req.body;
  const { user, error } = await supabase.auth.updateUser({
    email: "sanjeevyadav05121998@gmail.com",
  });
  //email: post.email
  //password:post.password
  res.send(user);
});

// 6 teacher login
app.post("/registrationTeacher", async (req, res) => {
  const post = req.body;
  
  const createUserResponse = await supabase.auth.admin.createUser({
    email: post.email,
    password: post.password,
    email_confirm: true,
  });
  if (createUserResponse.data.user) {
    const insertData = await supabase.from("teacher").insert({
      first_name: post?.first_name || "",
      last_name: post?.last_name || "",
      phone_number: post?.phone_number || "",
      teacher_id: createUserResponse.data.user.id,
      email: createUserResponse.data.user.email,
      created_at: createUserResponse.data.user.created_at,
      updated_at: createUserResponse.data.user.updated_at,
    }).select("*").maybeSingle();
    //  console.log(created_at)

    if (insertData.data) {
      await addNotificationWhenTeacherAdd(createUserResponse.data.user.email);
    }

    res.send(insertData);
    // please tell this one
  } else {
    res.send({ error: createUserResponse.error });
  }
});
//  5
app.post("/teacherLogin", async (req, res) => {
  const post = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({
    email: post.email,
    password: post.password,
  });

  if (data.user) {
    const getTeacherResponse = await supabase
      .from("teacher")
      .select("*")
      .eq("teacher_id", data.user.id)
      .maybeSingle();
    res.send(getTeacherResponse);
  } else {
    res.send({ user: null });
  }
});

app.post("/passwordChangeTeacher", async (req, res) => {
  const {email, password} = req.body;
  const teacherResponse = await supabase.from("teacher").select("teacher_id").eq("email", email).maybeSingle();

  if (teacherResponse.data && teacherResponse.data?.teacher_id) {
    const updatePassword = await supabase.auth.admin.updateUserById(
      teacherResponse.data.teacher_id,
      { password: password }
    );
    if (updatePassword.data?.user) {
      res.send({success: true});
    } else {
      res.send({ success: false, error: {message: "Something went wrong! Try again"} });
    }
  } else {
    res.send({ success: false, error: {message: "There are no users with the email address you specified. Please try again.."} });
  }
});
//7
app.post("/updateTeacher", async (req, res) => {
  const d = req.body;
  let postData = { ...d };
  delete postData.teacher_id;

  console.log(postData);

  const update = await supabase
    .from("teacher")
    .update(postData)
    .select("*")
    .maybeSingle()
    .eq("teacher_id", d.teacher_id);

  res.send(update);
});
app.get("/getTeacherList", async (req, res) => {
  let { data, error } = await supabase.from("teacher").select("*, review!left(*)");

  res.send(data);
});

// 8  pagination
app.get("/getTeacherListPagination", async (req, res) => {
  let { data, error } = await supabase
    .from("teacher")
    .select("*")
    .range((req.query.pageNo - 1) * 10, req.query.pageNo * 10);
  res.send(data);
});
//  10 student login

app.post("/registrationStudent", async (req, res) => {
  const post = req.body;
  console.log(req.body);

  const createUserResponse = await supabase.auth.admin.createUser({
    email: post.email,
    password: post.password,
    email_confirm: true,
  });
  if (createUserResponse.data.user) {
    const insertData = await supabase
      .from("student")
      .insert({
        student_id: createUserResponse.data.user.id,
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
// 9
app.post("/studentLogin", async (req, res) => {
  const post = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({
    email: post.email,
    password: post.password,
  });

  if (data.user) {
    const getTeacherResponse = await supabase
      .from("student")
      .select("*")
      .eq("student_id", data.user.id)
      .maybeSingle();
    res.send(getTeacherResponse);
  } else {
    res.send({ user: null });
  }
});
//11
app.post("/updateStudent", async (req, res) => {
  const d = req.body;
  let postData = { ...d };
  delete postData.teacher_id;

  console.log(postData);

  const update = await supabase
    .from("student")
    .update(postData)
    .select("*")
    .maybeSingle()
    .eq("student_id", d.teacher_id);

  res.send(update);
});
// ?
app.get("/getStudents", async (req, res) => {
  let { data, error } = await supabase.from("student").select("*");
  res.send(data);
  console.log(data);
});

//   12  pagination
app.get("/getStudentWithPagination", async (req, res) => {
  let { data, error } = await supabase
    .from("student")
    .select("*")
    .range((req.query.pageNo - 1) * 10, req.query.pageNo * 10);
  res.send(data);
});

// 20  review_table

app.post("/addReview", async (req, res) => {
  const po = req.body;
  //res.send({ data ,error} )// email id already registered
  let err = "";
  let insertDat;
  try {
    insertDat = await supabase
      .from("review")

      .insert([
        {
          student_id: po.student_id,
          teacher_id: po.teacher_id,
          text: po.text,
          rating_star: po.rating_star,
          created_at: new Date(),
        },
        // { some_column: 'otherValue' },
      ]);
  } catch (errorData) {
    err = errorData.toString();
    console.log(err);
  }
  console.log(insertDat);
  res.send(insertDat);
});
//  19  get teacher review by created_at
app.get("/getReview", async (req, res) => {
  let { data, error } = await supabase
    .from("review")
    .select("*")
    .order("created_at", { ascending: true })
    .range((req.query.pageNo - 1) * 10, req.query.pageNo * 10);

  res.send(data);
});
// ?
app.post("/deleteR", async (req, res) => {
  const d = req.body;
  const { data, error } = await supabase
    .from("review")
    .delete()
    .eq("review_id", d.review_id);
});
//  14 a) course_table

app.post("/addCourse", async (req, res) => {
  const po = req.body;

  insertDat = await supabase
    .from("course")
    .insert({
      admin_id: po.admin_id,
      title: po.title,
      description: po.description,
      updated_at: new Date(),
    })
    .select("*")
    .maybeSingle();

  res.send(insertDat);
});

app.post("/updateCourseById", async (req, res) => {
  const po = req.body;
  let postData = { ...req.body };
  delete postData.course_id;
  insertDat = await supabase
    .from("course")
    .update(postData)
    .eq("course_id", po.course_id)
    .select("*")
    .maybeSingle();
  res.send(insertDat);
});
app.post("/updateSubjectById", async (req, res) => {
  const po = req.body;
  let postData = { ...req.body };
  delete postData.subject_id;

  insertDat = await supabase
    .from("subject")
    .update(postData)
    .eq("subject_id", po.subject_id)
    .select("*")
    .maybeSingle();
  res.send(insertDat);
});

// 13 a)
app.get("/getAllSubjectCourse", async (req, res) => {
  let { data, error } = await supabase.from("course").select("*");

  res.send(data);
});
// 13 b) get all subject of course
app.get("/getAllSubjectListFromCourse", async (req, res) => {
  //const post=req.body

  let { data, error } = await supabase
    .from("subject")
    .select("*")
    .eq("course_id", req.query.course_id);
  // .range((req.query.pageNo -1)*10,req.query.pageNo*10)
  console.log(data);
  res.send(data);
});
//?

app.post("/subject_Up", async (req, res) => {
  const po = req.body;
  //res.send({ data ,error} )// email id already registered
  let err = "";
  let insertDat;
  try {
    insertDat = await supabase
      .from("subject")

      .insert([
        {
          admin_id: po.admin_id,
          course_id: po.course_id,
          title: po.title,
          description: po.description,
        },
        // { some_column: 'otherValue' },
      ]);
  } catch (errorData) {
    err = errorData.toString();
    console.log(err);
  }
  console.log(insertDat);
  res.send(insertDat);
  //getsubject_id

  // let { data, error } = await supabase
  //   .from('subject')
  //   .select("subject_id")

  //   // Filters
  //   .eq('title', 'radhe')
  //   res.send(data)
  // //})
  // update subject
});
// 16 update subject
app.post("/editSubject", async (req, res) => {
  const post = req.body;
  const data = await supabase
    .from("subject")
    .update({ title: post.title, description: post.description })
    .eq("subject_id", post.subject_id);
  res.send(data);
});
// ?  get subject_id
app.get("/getSub", async (req, res) => {
  let { data, error } = await supabase
    .from("subject")
    .select("subject_id")

    // Filters
    .eq("title", "radhe");
  res.send(data);
});
// 14 b)course_subject_table
app.post("/addSubjectToCourse", async (req, res) => {
  const insertDat = await supabase.from("subject").insert(req.body);
  res.send(insertDat);
});

//  15  teacher-subject table
app.post("/addCourseAndSubjectToTeacher", async (req, res) => {
  const po = req.body;
  const insertDat = await supabase
    .from("teacher-subject")
    .insert(po)
    .select("*")
    .maybeSingle();

  res.send(insertDat);
});

app.post("/UpdateCourseAndSubjectToTeacherById", async (req, res) => {
  const po = req.body;
  let postData = { ...req.body };
  delete postData["teacher-subject_id"];

  const insertDat = await supabase
    .from("teacher-subject")
    .update(po)
    .eq("teacher-subject_id", po["teacher-subject_id"])
    .select("*")
    .maybeSingle();

  res.send(insertDat);
});

//  ? get teacher_subject table
app.get("/getSubTeach", async (req, res) => {
  let { data, error } = await supabase.from("teacher-subject").select("*");
  res.send(data);
  console.log(data);
});
// 17  get teacher by subject
app.get("/getTeacherBySubject", async (req, res) => {
  //const post=req.body
  let data = await supabase
    .from("teacher-subject")
    .select("*")
    .eq("subject_id", req.query.subject_id);
  //.range((req.query.pageNo -1)*10,req.query.pageNo*10)
  //res.send(data)
  console.log(data);
  console.log(data.data.length);
  //console.log(data[0].teacher_id)
  //let b=0;
  let t = [];
  for (let i = 0; i < data.data.length; i++) {
    t.push(data.data[i].teacher_id);

    //.range(0,1)
    //res.send(tun)
  }
  let tun = await supabase.from("teacher").select("*").in("teacher_id", t);
  res.send(tun);
  console.log(tun);
});
//18  get all subject by teacher

app.get("/getSubjectOfTeacher", async (req, res) => {
  const post = req.body;
  let { data, error } = await supabase
    .from("teacher-subject")
    .select("*")
    .eq("teacher_id", req.query.teacher_id)
    .range((req.query.pageNo - 1) * 10, req.query.pageNo * 10);
  //res.send(data)
  console.log(data);
  console.log(data.length);
  let t = [];
  for (let i = 0; i < data.length; i++) {
    t.push(data[i].subject_id);

    //.range(0,1)
    //res.send(tun)
  }
  let tun = await supabase.from("subject").select("*").in("subject_id", t);
  res.send(tun);
  console.log(tun);
});

// 24  booking table

app.post("/addBooking", async (req, res) => {
  const po = req.body;
  //res.send({ data ,error} )// email id already registered
  let err = "";
  let insertDat;
  try {
    insertDat = await supabase
      .from("booking")

      .insert([
        {
          subject_id: po.subject_id,
          teacher_id: po.teacher_id,
          student_id: po.student_id,
          approve_status: po.approve_status,
          payment_id: po.payment_id,
          payment_is_done: po.payment_is_done,
        },
        // { some_column: 'otherValue' },
      ]);
  } catch (errorData) {
    err = errorData.toString();
    console.log(err);
  }
  console.log(insertDat);
  res.send(insertDat);
});
//  21  get booking with pagination
app.get("/getBookingWithPagination", async (req, res) => {
  console.log(req.query.pageNo);
  let { data, error } = await supabase
    .from("booking")
    .select("*")
    .range((req.query.pageNo - 1) * 10, req.query.pageNo * 10);
  res.send(data);
});
// 22 23  get booking with foriegn key
app.get("/getBookingByStudentIdTeacherId", async (req, res) => {
  const post = req.body;

  let { data, error } = await supabase
    .from("booking")
    .select("*")
    .eq("teacher_id", req.query.teacher_id)
    .range((req.query.pageNo - 1) * 10, req.query.pageNo * 10);
  res.send(data);

  const radhe = await supabase
    .from("booking")
    .select("*")
    .eq("student_id", req.query.student_id)
    .range((req.query.pageNo - 1) * 10, req.query.pageNo * 10);
  console.log(radhe);
  //res.send(radhe)
});
//13 ?  get subject_id and insert into course subject table
app.post("/getSub", async (req, res) => {
  let { data, error } = await supabase
    .from("subject")
    .select("subject_id")

    // Filters
    .eq("title", "radhe");
  //res.send(data)
  let err = "";
  let insertDat;
  try {
    insertDat = await supabase
      .from("course-subject")

      .insert([
        { subject_id: data[0].subject_id },
        // { some_column: 'otherValue' },
      ]);
  } catch (errorData) {
    err = errorData.toString();
    console.log(err);
  }
  console.log(insertDat);
  res.send(insertDat);
});

// 25 Admin upload Image
const storage = multer.memoryStorage();
app.post(
  "/adminUploadImage",
  multer({ storage: storage }).single("photo"),
  async (req, res) => {
    const uploadObj = await supabase.storage
      .from("admin")
      .upload(req.body.id + ".webp", req.file.buffer, {
        cacheControl: "3600",
        upsert: true,
      });

    const url = supabase.storage
      .from("admin")
      .getPublicUrl(uploadObj.data.path);
    console.log(url);
    const updatedata = await supabase
      .from("admin")
      .update({
        photo_url: url.data.publicUrl,
      })
      .select("*")
      .maybeSingle()
      .eq("admin_id", req.body.id);

    res.send(updatedata);
  }
);
// 27 student upload Image

app.post(
  "/studentUploadImage",
  multer({ storage: storage }).single("photo"),
  async (req, res) => {
    const uploadObj = await supabase.storage
      .from("student")
      .upload(
        req.body.id + "." + req.file.originalname.split(".")[1],
        req.file.buffer,
        {
          cacheControl: "3600",
          upsert: true,
        }
      );
    const url = supabase.storage
      .from("student")
      .getPublicUrl(req.body.id + "." + req.file.originalname.split(".")[1]);
    const updatedata = await supabase
      .from("student")
      .update({
        photo_url: url.data.publicUrl,
      })
      .eq("student_id", req.body.id);

    res.send(url.data);
    //res.send(data)
  }
);
// 26 teacher upload Image
app.post(
  "/teacherUploadImage",
  multer({ storage: storage }).single("photo"),
  async (req, res) => {
    const uploadObj = await supabase.storage
      .from("teacher")
      .upload(req.body.id + ".webp", req.file.buffer, {
        cacheControl: "3600",
        upsert: true,
      });
    const url = supabase.storage
      .from("teacher")
      .getPublicUrl(uploadObj.data.path);
    const updatedata = await supabase
      .from("teacher")
      .update({
        photo_url: url.data.publicUrl,
      })
      .eq("teacher_id", req.body.id);

    res.send(updatedata);
    //res.send(data)
  }
);
//28 dashboard api for analytics
app.get("/dashboardApiForAnalytics", async (req, res) => {
  //const post=req.body

  const { count: adminCount } = await supabase
    .from("admin")
    .select("*", { count: "exact" });

  const { count: teacherCount } = await supabase
    .from("teacher")
    .select("*", { count: "exact" });

  const { count: studentCount } = await supabase
    .from("student")
    .select("*", { count: "exact" });
  const revenueResponse = await supabase
    .from("subscription-teacher-user")
    .select("*", { count: "exact" });
  let revenue = 0;

  if (revenueResponse.data) {
    revenue = revenueResponse.data.reduce((a, b) => a + b?.total_price || 0, 0);
  }

  res.send({ adminCount, teacherCount, studentCount, revenue });
});
app.get("/dashboardApiForTeacherAnalytics", async (req, res) => {
  //const post=req.body

  const { count: scheduleCount } = await supabase
    .from("schedule")
    .select("*", { count: "exact" })
    .eq("teacher_id", req.query.teacher_id);

  const { count: subscribedStudentCount } = await supabase
    .from("subscription-teacher-user")
    .select("*", { count: "exact" })
    .eq("teacher_id", req.query.teacher_id);

  res.send({ scheduleCount, subscribedStudentCount });
});
//29 30
app.get("/getAdminById", async (req, res) => {
  const data = await supabase
    .from("admin")
    .select("*")
    .eq("admin_id", req.query.admin_id)
    .maybeSingle();

  res.send(data);
});
app.get("/getTeacherById", async (req, res) => {
  const data = await supabase
    .from("teacher")
    .select("*, teacher-subject!left(*, subject_id(*, course_id(*))), schedule!left(*), review!left(*)")
    .eq("teacher_id", req.query.teacher_id)
    .maybeSingle();
  res.send(data);
});

app.get("/getAllCourseWithSubject", async (req, res) => {
  const data = await supabase.from("course").select("*,subject!left(*)");
  res.send(data);
  //.eq("course_id",req.query.course_id)
  // res.send(data)
  //     let t=[];
  //     for(let i=0;i<data.data.length;i++)
  //     {
  //        t.push(data.data[i].course_id)
  //     }
  //     let tun = await supabase
  //     .from('subject')
  //     .select('*')
  //  .in('course_id',t)
  //  res.send(tun)
});

app.get("/getAllActiveCourseWithSubject", async (req, res) => {
  const data = await supabase.from("course").select("*,subject!left(*)").eq("is_course_active", true);
  res.send(data);
});

app.get("/getAllScheduleByTeacherId", async (req, res) => {
  const data = await supabase
    .from("schedule")
    .select("*")
    .eq("teacher_id", req.query.teacher_id);
  res.send(data);
});
app.get("/getAllTeacherSchedules", async (req, res) => {
  const data = await supabase.from("schedule").select("*");
  res.send(data);
});

app.post("/addSchedule", async (req, res) => {
  const insertData = await supabase
    .from("schedule")
    .insert(req.body)
    .select("*")
    .maybeSingle();
  res.send(insertData);
});

app.post("/studentSubscribeToPlan", async (req, res) => {
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
app.get("/getTeacherSubscribersStudentByTeacherId", async (req, res) => {
  const data = await supabase
    .from("subscription-teacher-user")
    .select("*, subscription_plan_id(*), student_id(*), teacher_id(*)")
    .eq("teacher_id", req.query.teacher_id);
  res.send(data);
});
app.get("/getAllTeacherSubscribersStudent", async (req, res) => {
  const data = await supabase
    .from("subscription-teacher-user")
    .select("*, subscription_plan_id(*), student_id(*), teacher_id(*)");
  res.send(data);
});
app.get("/getAllSubscriptions", async (req, res) => {
  const data = await supabase.from("subscription-plan").select("*, course_id(*)");
  res.send(data);
});

app.post("/addSubscriptionPlan", async (req, res) => {
  const insertData = await supabase.from("subscription-plan").insert(req.body).select("*").maybeSingle();
  res.send(insertData);
});

app.post("/updateSubscriptionPlanById", async (req, res) => {
  const d = req.body;
  let postData = { ...d };
  delete postData.subscription_plan_id;

  const update = await supabase
    .from("subscription-plan")
    .update(postData)
    .select("*")
    .maybeSingle()
    .eq("subscription_plan_id", d.subscription_plan_id);

  res.send(update);
});

app.get("/getAllOrdersByTeacherId", async (req, res) => {
  const data = await supabase
    .from("order")
    .select("*, student_id(*)")
    .eq("teacher_id", req.query.teacher_id)
    .order("start_date", { ascending: true });
  res.send(data);
});

app.get("/getAllOrders", async (req, res) => {
  const data = await supabase
    .from("order")
    .select("*, student_id(*), teacher_id(*)")
    .order("start_date", { ascending: true });
  res.send(data);
});

app.get("/getAllTodayOrdersByTeacherId", async (req, res) => {
  const data = await supabase
    .from("order")
    .select("*, student_id(*)")
    .eq("teacher_id", req.query.teacher_id)
    .gte("start_date", new Date().toISOString())
    .lte("end_date", new Date().toISOString())
    .order("start_date", { ascending: true });
  res.send(data);
  // const data = await supabase
  //   .from("order")
  //   .select("*, student_id(*)")
  //   .eq("teacher_id", req.query.teacher_id).gte("start_date", new Date().toISOString()).lte("end_date", new Date().toISOString())
  //   .order("start_date", { ascending: true });
  // res.send(data);

  // select * from "order" where end_date>=date '2023-01-20' AND end_date<=date '2023-01-20' OR start_date<= date '2023-01-20' AND start_date>=date '2023-01-20';
});
app.get("/getAllTodayOrders", async (req, res) => {
  const data = await supabase
    .from("order")
    .select("*, student_id(*), teacher_id(*)")
    .gte("start_date", new Date().toISOString())
    .lte("end_date", new Date().toISOString())
    .order("start_date", { ascending: true });
  res.send(data);
});
app.get("/getTeacherListExceptTeacherId", async (req, res) => {
  const data = await supabase
    .from("teacher")
    .select(
      "*, teacher-subject!left(*, subject_id(*, course_id(*))), schedule!left(*)"
    )
    .neq("teacher_id", req.query.teacher_id);
  res.send(data);
});

app.get("/getBannerImages", async (req, res) => {
  const data = await supabase.storage.from("banner").list();
  if (data.data?.length) {
    let urls = [];
    for (const imageItem of data.data) {
      if (imageItem.name !== ".emptyFolderPlaceholder") {
        urls.push(
          supabase.storage.from("banner").getPublicUrl(imageItem.name).data
            .publicUrl
        );
      }
    }
    res.send({ data: urls });
  } else {
    res.send({ data: [] });
  }
});

app.post("/uploadBannerImages", multer({ storage: storage }).single("photo"), async (req, res) => {
  const uploadObj = await supabase.storage
    .from("banner")
    .upload(uuidv4() + ".webp", req.file.buffer, {
      cacheControl: "3600",
      upsert: true,
    });

  res.send(uploadObj);
});
app.post("/deleteBannerImage", async (req, res) => {
  const {bannerPath} = req.body;
  
  const response = await supabase.storage.from("banner").remove([bannerPath.split("v1/object/public/banner/")[bannerPath.split("v1/object/public/banner/").length - 1]])
  res.send(response);
});

app.post("/transferStudentToOtherTeacher", async (req, res) => {
  const { start_date, end_date, new_teacher_id, order_id, start_time, end_time, new_schedule_id } = req.body;

  const check_bookingResponse = await supabase.rpc("check_booking", {
    startdate: start_date,
    enddate: end_date,
    starttime: start_time,
    endtime: end_time,
    teacherid: new_teacher_id,
  });

  if (check_bookingResponse?.data && check_bookingResponse?.data?.length > 0) {
    res.send({ error: { message: "This slot already booked someone." } });
  } else {
    const updateDataResponse = await supabase
      .from("order")
      .update({ teacher_id: new_teacher_id, schedule_id: new_schedule_id })
      .select("*")
      .maybeSingle()
      .eq("order_id", order_id);
    res.send(updateDataResponse);
  }
});

// app.get("/poc", async (req, res) => {
//   const data = await supabase.rpc('check_booking', {startDate: '2023-01-30', endDate: '2023-01-30'})
//   // const data = await supabase.from("poc").select("*").overlaps("start_date", '2023-01-30').overlaps("start_date", '2023-01-30')
//   res.send(data);
// });

const port = 8080;
app.listen(port, () => console.log(`connecting to  ${port}`));
