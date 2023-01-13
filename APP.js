const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const { createClient } = require("@supabase/supabase-js");
const { notEqual } = require("assert"); // why this
var multer = require("multer"); // form data

// Create a single supabase client for interacting with your database
const supabase = createClient(
  "https://vuozzbzdmjgsltgmxrfo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1b3p6YnpkbWpnc2x0Z214cmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3MjgxOTIxMCwiZXhwIjoxOTg4Mzk1MjEwfQ.1Ik1KqQuy8hovFvJW19M-dfVifHgIiLOWlWeQ3D-iNc"
);

const app = express();
app.use(cors());
app.get("/", (req, res) => {
  res.send(" hare krishna");
});

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
//  5
app.post("/teacherLogin", async (req, res) => {
  const post = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({
    email: post.email,
    password: post.password,
  });
  console.log(data);
  res.send(data);
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
  let { data, error } = await supabase.from("teacher").select("*");

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

app.post("/registerationStudent", async (req, res) => {
  const pre = req.body;
  console.log(pre);
  //res.send(pre)
  // let t="";
  const { data, error } = await supabase.auth.admin.createUser({
    email: pre.email,
    password: pre.password,
    email_confirm: true,
  });

  console.log(data);
  //res.send({ data ,error} )// email id already registered
  let err = "";
  try {
    const { insertData, errorData } = await supabase
      .from("student")

      .insert([
        { student_id: data.user.id, email: data.user.email },
        // { some_column: 'otherValue' },
      ]);
  } catch (errorData) {
    err = errorData.toString();
    console.log(err);
  }
  res.send({ data, error, err });
});
// 9
app.post("/studentLogin", async (req, res) => {
  const post = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({
    email: post.email,
    password: post.password,
  });
  console.log(data);
  res.send({ data, error });
});
//11
app.post("/updateStudent", async (req, res) => {
  const d = req.body;
  const updatedata = await supabase
    .from("student")
    .update({ first_name: d.first_name, last_name: d.last_name })
    .eq("student_id", d.student_id);

  //console.log(updatedata)
  res.send(updatedata);
});
// ?
app.get("/getStudent", async (req, res) => {
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
  delete postData['teacher-subject_id'];

  const insertDat = await supabase
    .from("teacher-subject")
    .update(po)
    .eq("teacher-subject_id", po['teacher-subject_id'])
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

  res.send({ adminCount, teacherCount, studentCount });
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
    .select("*,teacher-subject!left(*)")
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

const port = 8080;
app.listen(port, () => console.log(`connecting to  ${port}`));
