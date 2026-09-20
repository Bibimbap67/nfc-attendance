import React, {
  useEffect,
  useState,
} from "react";

import { supabase } from "./supabaseClient";

import "./App.css";

function App() {
  const [nfcData, setNfcData] = useState(null);

  const [connection, setConnection] =
    useState("Connecting...");

  useEffect(() => {
    const loadLatestAttendance = async () => {
      const { data, error } = await supabase
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

        (payload) => {
          console.log(
            "New attendance:",
            payload.new
          );

          setNfcData(payload.new);
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

        <h2>Latest Attendance</h2>

        {nfcData ? (
          <>

            <p className="label">
              Student ID
            </p>

            <p className="student-id">
              {nfcData.student_id}
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