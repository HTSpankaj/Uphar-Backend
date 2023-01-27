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

router.get("/", function (req, res, next) {
  res.send("respond with a resource from notification.js");
});

router.get("/getAdminNotificationByAdminId", async (req, res) => {
  const { admin_id, page } = req.query;
  const limit = 10;

  const fromRange = page * limit - limit;
  const toRange = page * limit - 1;

  const data = await supabase.from("admin-notification").select("*", { count: "exact" }).eq("admin_id", admin_id).order("created_at", { ascending: false }).range(fromRange, toRange);
  res.send(data);
});

router.get("/getTeacherNotificationByTeacherId", async (req, res) => {
  const { teacher_id, page } = req.query;
  const limit = 10;

  const fromRange = page * limit - limit;
  const toRange = page * limit - 1;

  const data = await supabase.from("teacher-notification").select("*", { count: "exact" }).eq("teacher_id", teacher_id).order("created_at", { ascending: false }).range(fromRange, toRange);
  res.send(data);
});

router.get("/getStudentNotificationByStudentId", async (req, res) => {
  const { student_id, page } = req.query;
  const limit = 10;

  const fromRange = page * limit - limit;
  const toRange = page * limit - 1;

  const data = await supabase.from("student-notification").select("*", { count: "exact" }).eq("student_id", student_id).order("created_at", { ascending: false }).range(fromRange, toRange);
  res.send(data);
});

//* mark as read apis
router.post("/markReadAllAdminNotificationByAdminId", async (req, res) => {
  const { admin_id } = req.body;
  await supabase.from("admin-notification").update({is_read: true}).eq("admin_id", admin_id).eq("is_read", false);
  res.send({success: true});
});

router.post("/markReadAllTeacherNotificationByTeacherId", async (req, res) => {
  const { teacher_id } = req.body;
  await supabase.from("teacher-notification").update({is_read: true}).eq("teacher_id", teacher_id).eq("is_read", false);
  res.send({success: true});
});

router.post("/markReadAllStudentNotificationByStudentId", async (req, res) => {
  const { student_id } = req.body;
  await supabase.from("student-notification").update({is_read: true}).eq("student_id", student_id).eq("is_read", false);
  res.send({success: true});
});

///* methods
async function addNotificationWhenTeacherAdd(teacher_email) {
  const getAllAdminsResponse = await supabase.from("admin").select("admin_id");
  // console.log(getAllAdminsResponse);
  if (getAllAdminsResponse.data && getAllAdminsResponse.data?.length) {
    getAllAdminsResponse.data.forEach(async adminItem => {
      await supabase.from("admin-notification").insert({admin_id: adminItem.admin_id, text: `${teacher_email} added as a new teacher recently.`, title: "New Teacher Added"})
    });
  }
}

async function addNotificationWhenOrderAdd(teacherId, studentId) {
  const getAllAdminsResponse = await supabase.from("admin").select("admin_id");
  const teacherResponse = await supabase.from("teacher").select('*').eq("teacher_id", teacherId).maybeSingle();
  const studentResponse = await supabase.from("student").select('*').eq("student_id", studentId).maybeSingle()

  // console.log(getAllAdminsResponse);
  if (getAllAdminsResponse.data && getAllAdminsResponse.data?.length) {
    getAllAdminsResponse.data.forEach(async adminItem => {
      await supabase.from("admin-notification").insert({admin_id: adminItem.admin_id, text: `${teacherResponse?.data?.email} class schedule with student ${studentResponse?.data?.email}.`, title: "New Class Schedule Added"})
    });
  }
  await supabase.from("teacher-notification").insert({teacher_id: teacherId, text: `New class schedule with student ${studentResponse?.data?.email}.`, title: "New Class Schedule Added"});
  await supabase.from("student-notification").insert({student_id: studentId, text: `New class schedule with teacher ${teacherResponse?.data?.email}.`, title: "New Class Schedule Added"});
}
module.exports = { router, addNotificationWhenTeacherAdd, addNotificationWhenOrderAdd };