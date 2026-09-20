import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: "NFC UID is required",
      });
    }

    // Find the student using the NFC UID
    const {
      data: student,
      error: studentError,
    } = await supabase
      .from("students")
      .select("*")
      .eq("uid", uid)
      .single();

    if (studentError || !student) {
      return res.status(404).json({
        success: false,
        message: "Student not found for this NFC card",
      });
    }

    // Save attendance
    const {
      data: attendance,
      error: attendanceError,
    } = await supabase
      .from("attendace")
      .insert([
        {
          uid: student.uid,
          student_id: student.student_id,
        },
      ])
      .select()
      .single();

    if (attendanceError) {
      console.error(
        "Attendance error:",
        attendanceError
      );

      return res.status(500).json({
        success: false,
        message: attendanceError.message,
      });
    }

    return res.status(200).json({
      success: true,
      student: student,
      attendance: attendance,
    });
  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}