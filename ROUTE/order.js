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
  res.send("respond with a resource from order.js");
});


router.get("/getAllOngoingOrder", async (req, res) => {
  const data = await supabase.from("order").select("*, teacher_id(*), change-teacher-request!left(*)").eq("cancel_status", false).gte("end_date", new Date().toISOString().split("T")[0]);
  res.send(data);
});

router.get("/getAllHistoryOrder", async (req, res) => {
  const data = await supabase.from("order").select("*, teacher_id(*)")
  // .lt("end_date", new Date().toISOString().split("T")[0])
  .or(`cancel_status.eq.true,end_date.lt.${new Date().toISOString().split("T")[0]}`);
  res.send(data);
});

// "order_id",
// "old_teacher_id",
// "old_start_date",
// "old_end_date",
// "old_start_time",
// "old_end_time",
// "old_schedule_id",
// "new_teacher_id",
// "new_start_date",
// "new_end_date",
// "new_start_time",
// "new_end_time",
// "new_schedule_id",
router.post("/sendChangeRequest", async (req, res) => {
  let { order_id, old_teacher_id, old_start_date, old_end_date, old_start_time, old_end_time, old_schedule_id, new_teacher_id, new_start_date, new_end_date, new_start_time, new_end_time, new_schedule_id } = { ...req.body };
  if (order_id && old_teacher_id && old_start_date && old_end_date && old_start_time && old_end_time && old_schedule_id && new_teacher_id && new_start_date && new_end_date && new_start_time && new_end_time && new_schedule_id) {
    const check_bookingResponse = await supabase.rpc("check_booking", {
      startdate: new_start_date,
      enddate: new_end_date,
      starttime: new_start_time,
      endtime: new_end_time,
      teacherid: new_teacher_id,
    });

    if (check_bookingResponse?.data && check_bookingResponse?.data?.length > 0) {
      res.send({success: false, error: { message: "This slot already booked someone." } });
    } else {
      const addOrderDataResponse = await supabase.from("change-teacher-request").insert({ order_id, old_teacher_id, old_start_date, old_end_date, old_start_time, old_end_time, old_schedule_id, new_teacher_id, new_start_date, new_end_date, new_start_time, new_end_time, new_schedule_id }).select("*").maybeSingle();
      res.send({success: false, ...addOrderDataResponse });
    }
  } else {
    res.send({success: false, error: {message: "Invalid data pass."}});
  }
});

router.get("/getAllTransferTeacherRequest", async (req, res) => { 
  const data = await supabase.from("change-teacher-request").select("*, order_id(*, student_id(*)), new_teacher_id(*), old_teacher_id(*)").order("created_at", {ascending: false}).eq("request_status", "pending");
  res.send(data);
});

router.post("/acceptTransferTeacherRequest", async (req, res) => {
  let { change_teacher_request_id } = { ...req.body };
  
  // let { change_teacher_request_id, teacher_id, start_date, end_date, start_time, end_time, schedule_id, order_id } = { ...req.body };
  // if (change_teacher_request_id && teacher_id && start_date && end_date && start_time && end_time && schedule_id && order_id) {
  if (change_teacher_request_id) {
    // try {
    //   const data = await supabase.from("change-teacher-request").update({request_status: "accept"}).eq("change_teacher_request_id", change_teacher_request_id).select("*, order_id(*, student_id(*)), new_teacher_id(*), old_teacher_id(*)").maybeSingle();
    //   let postObject = {
    //     teacher_id: teacher_id,
    //     start_date: start_date,
    //     end_date: end_date,
    //     start_time: start_time,
    //     end_time: end_time,
    //     schedule_id: schedule_id,
    //   }
    //   res.send(data);
    // } catch (error) {
    //   res.send(error);
    // }
    const data = await supabase.from("change-teacher-request").update({request_status: "accept"}).eq("change_teacher_request_id", change_teacher_request_id).select("*, order_id(*, student_id(*)), new_teacher_id(*), old_teacher_id(*)").maybeSingle();
  } else {
    res.send({error: {message: "Invalid data pass."}});
  }
});

router.post("/rejectTransferTeacherRequest", async (req, res) => {
  let { change_teacher_request_id } = { ...req.body };
  if (change_teacher_request_id) {
    const data = await supabase.from("change-teacher-request").update({request_status: "reject"}).eq("change_teacher_request_id", change_teacher_request_id).select("*, order_id(*, student_id(*)), new_teacher_id(*), old_teacher_id(*)").maybeSingle();
    res.send(data);
  } else {
    res.send({error: {message: "Invalid data pass."}});
  }
});

module.exports = router;