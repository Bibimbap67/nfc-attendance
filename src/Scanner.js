/* global NDEFReader */

import React, { useState } from "react";

function Scanner() {
  const [status, setStatus] = useState("Ready");
  const [data, setData] = useState("");

  const scanNFC = async () => {
    try {
      const ndef = new NDEFReader();

      await ndef.scan();

      setStatus("Waiting for NFC tag...");

      ndef.addEventListener(
        "reading",
        async ({ serialNumber, message }) => {
          let nfcText = "";

          for (const record of message.records) {
            if (record.recordType === "text") {
              const decoder = new TextDecoder(record.encoding);

              nfcText = decoder.decode(record.data);
            }
          }

          console.log("UID:", serialNumber);
          console.log("Data:", nfcText);

          setData(nfcText);
          setStatus("NFC detected!");

          try {
            const response = await fetch("/api/attendance", {
              method: "POST",

              headers: {
                "Content-Type": "application/json",
              },

              body: JSON.stringify({
                uid: serialNumber,
                data: nfcText,
              }),
            });

            const result = await response.json();

            if (!response.ok) {
              throw new Error(
                result.message || "Failed to send attendance"
              );
            }

            console.log(
              "Attendance sent:",
              result
            );

            setStatus("Attendance sent successfully!");
          } catch (error) {
            console.error(error);

            setStatus("Failed to send attendance");

            alert(
              "Failed to send attendance: " +
                error.message
            );
          }
        }
      );
    } catch (error) {
      console.error(error);

      setStatus("NFC Error");

      alert(
        "NFC error: " +
          error.message
      );
    }
  };

  return (
    <div style={styles.container}>
      <h1>📱 NFC Reader</h1>

      <button
        style={styles.button}
        onClick={scanNFC}
      >
        Scan NFC
      </button>

      <h2>Status</h2>

      <p>{status}</p>

      <h2>Scanned Student ID</h2>

      <p style={styles.data}>
        {data || "Nothing scanned yet"}
      </p>
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
  },

  button: {
    padding: "12px 24px",
    fontSize: "18px",
    cursor: "pointer",
  },

  data: {
    fontSize: "30px",
    fontWeight: "bold",
  },
};

export default Scanner;