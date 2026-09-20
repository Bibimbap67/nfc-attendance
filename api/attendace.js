import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed",
    });
  }

  try {
    const { uid, data } = req.body;

    if (!uid || !data) {
      return res.status(400).json({
        message: "UID and student ID are required",
      });
    }

    const { data: attendance, error } = await supabase
      .from("attendance")
      .insert([
        {
          uid: uid,
          student_id: data,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error);

      return res.status(500).json({
        message: "Failed to save attendance",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      attendance,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
}