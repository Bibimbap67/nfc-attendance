import React, {
  useEffect,
  useState,
} from "react";

import { supabase } from "./supabaseClient";

import "./App.css";

function App() {
  const [nfcData, setNfcData] = useState(null);
  const [student, setStudent] = useState(null);
  const [connection, setConnection] =
    useState("Connecting...");

  const loadStudent = async (studentId) => {
    const {
      data,
      error,
    } = await supabase
      .from("students")
      .select("*")
      .eq("student_id", studentId)
      .single();

    if (error) {
      console.error(
        "Student lookup error:",
        error
      );

      return;
    }

    setStudent(data);
  };

  useEffect(() => {
    const loadLatestAttendance = async () => {
      const {
        data,
        error,
      } = await supabase
        .from("attendace")
        .select("*")
        .order("scanned_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(error);

        setConnection("Database Error");

        return;
      }

      if (data) {
        setNfcData(data);

        await loadStudent(
          data.student_id
        );
      }

      setConnection("Connected");
    };

    loadLatestAttendance();

    const channel = supabase
      .channel("attendace-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "attendace",
        },
        async (payload) => {
          console.log(
            "New attendance:",
            payload.new
          );

          setNfcData(payload.new);

          await loadStudent(
            payload.new.student_id
          );
        }
      )
      .subscribe((status) => {
        console.log(
          "Realtime status:",
          status
        );

        if (status === "SUBSCRIBED") {
          setConnection("Connected");
        }

        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT"
        ) {
          setConnection("Realtime Error");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="app">

      <h1>NFC Attendance Display</h1>

      <p>
        Supabase:{" "}
        <strong>{connection}</strong>
      </p>

      <div className="card">

        {student ? (
          <>
            {student.image && (
              <img
                src={student.image}
                alt={student.name}
                className="student-photo"
              />
            )}

            <h2>{student.name}</h2>

            <p className="student-id">
              {student.student_id}
            </p>

            <p>
              <strong>Course:</strong>{" "}
              {student.course}
            </p>

            <p>
              <strong>Year:</strong>{" "}
              {student.year}
            </p>

            <p>
              <strong>UID:</strong>{" "}
              {nfcData.uid}
            </p>

            <p>
              <strong>Time:</strong>{" "}
              {new Date(
                nfcData.scanned_at
              ).toLocaleString()}
            </p>

            <div className="attendance-status">
              ✓ Attendance Recorded
            </div>
          </>
        ) : (
          <p>
            No NFC card scanned yet.
          </p>
        )}

      </div>

    </div>
  );
}

export default App;