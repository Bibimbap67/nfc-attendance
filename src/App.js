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

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);


  // =========================
  // LOAD STUDENT
  // =========================

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


  // =========================
  // DELETE ATTENDANCE
  // =========================

  const deleteAttendance = async () => {

    if (!nfcData) {
      return;
    }

    setDeleting(true);

    try {

      const response = await fetch(
        "/api/attendace",
        {
          method: "DELETE",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            id: nfcData.id,
          }),
        }
      );


      const responseText =
        await response.text();


      let result;

      try {

        result =
          JSON.parse(responseText);

      } catch (error) {

        throw new Error(
          "Server returned invalid JSON: " +
          responseText
        );

      }


      if (!response.ok) {

        throw new Error(
          result.message ||
          "Failed to delete attendance"
        );

      }


      console.log(
        "Attendance deleted:",
        result
      );


      // Remove card from screen
      setNfcData(null);

      setStudent(null);

      setShowDeleteConfirm(false);


    } catch (error) {

      console.error(
        "Delete error:",
        error
      );

      alert(
        "Failed to delete attendance: " +
        error.message
      );

    } finally {

      setDeleting(false);

    }
  };


  // =========================
  // SUPABASE REALTIME
  // =========================

  useEffect(() => {

    const loadLatestAttendance =
      async () => {

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

          setConnection(
            "Database Error"
          );

          return;

        }


        if (data) {

          setNfcData(data);

          await loadStudent(
            data.student_id
          );

        }


        setConnection(
          "Connected"
        );

      };


    loadLatestAttendance();


    const channel = supabase
      .channel(
        "attendace-changes"
      )
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


          setNfcData(
            payload.new
          );


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


        if (
          status === "SUBSCRIBED"
        ) {

          setConnection(
            "Connected"
          );

        }


        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT"
        ) {

          setConnection(
            "Realtime Error"
          );

        }

      });


    return () => {

      supabase.removeChannel(
        channel
      );

    };

  }, []);


  // =========================
  // UI
  // =========================

  return (

    <div className="app">

      <h1>
        NFC Attendance Display
      </h1>


      <p>
        Supabase:{" "}
        <strong>
          {connection}
        </strong>
      </p>


      <div className="card">

        {student && nfcData ? (

          <>

            {/* DELETE BUTTON */}

            <button
              className="delete-button"
              onClick={() =>
                setShowDeleteConfirm(true)
              }
              disabled={deleting}
              title="Delete attendance"
            >
              🗑️
            </button>


            {/* STUDENT PHOTO */}

            {student.image && (

              <img
                src={student.image}
                alt={student.name}
                className="student-photo"
              />

            )}


            {/* STUDENT NAME */}

            <h2>
              {student.name}
            </h2>


            {/* STUDENT ID */}

            <p className="student-id">
              {student.student_id}
            </p>


            <p>
              <strong>
                Course:
              </strong>{" "}
              {student.course}
            </p>


            <p>
              <strong>
                Year:
              </strong>{" "}
              {student.year}
            </p>


            <p>
              <strong>
                UID:
              </strong>{" "}
              {nfcData.uid}
            </p>


            <p>
              <strong>
                Time:
              </strong>{" "}
              {new Date(
                nfcData.scanned_at
              ).toLocaleString()}
            </p>


            <div className="attendance-status">
              ✓ Attendance Recorded
            </div>


            {/* DELETE CONFIRMATION */}

            {showDeleteConfirm && (

              <div className="delete-confirm">

                <h3>
                  Delete Attendance?
                </h3>

                <p>
                  Are you sure you want to
                  delete this attendance
                  record?
                </p>


                <div className="confirm-buttons">

                  <button
                    className="cancel-button"
                    onClick={() =>
                      setShowDeleteConfirm(
                        false
                      )
                    }
                    disabled={deleting}
                  >
                    Cancel
                  </button>


                  <button
                    className="confirm-delete-button"
                    onClick={
                      deleteAttendance
                    }
                    disabled={deleting}
                  >
                    {deleting
                      ? "Deleting..."
                      : "Delete"}
                  </button>

                </div>

              </div>

            )}

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