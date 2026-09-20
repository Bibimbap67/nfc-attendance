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
              const decoder = new TextDecoder(
                record.encoding
              );

              nfcText = decoder.decode(
                record.data
              );
            }
          }

          console.log("UID:", serialNumber);
          console.log("Data:", nfcText);

          setData(nfcText);
          setStatus("NFC detected!");

          try {
            const response = await fetch(
              "/api/attendace",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  uid: serialNumber,
                  data: nfcText,
                }),
              }
            );

            const responseText =
              await response.text();

            console.log(
              "Vercel response:",
              responseText
            );

            let result;

            try {
              result = JSON.parse(
                responseText
              );
            } catch (error) {
              throw new Error(
                "Server returned invalid JSON: " +
                  responseText
              );
            }

            if (!response.ok) {
              throw new Error(
                `Server error ${response.status}: ${
                  result.message ||
                  "Unknown error"
                }`
              );
            }

            console.log(
              "Attendance saved:",
              result
            );

            setStatus(
              "Attendance sent successfully!"
            );
          } catch (error) {
            console.error(
              "Attendance error:",
              error
            );

            setStatus(
              "Failed to send attendance"
            );

            alert(error.message);
          }
        }
      );
    } catch (error) {
      console.error(
        "NFC error:",
        error
      );

      setStatus("NFC Error");

      alert(
        "NFC error: " +
          error.message
      );
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>📱 NFC Reader</h1>

      <button
        onClick={scanNFC}
        style={{
          padding: "12px 24px",
          fontSize: "18px",
        }}
      >
        Scan NFC
      </button>

      <h2>Status</h2>

      <p>{status}</p>

      <h2>Scanned Student ID</h2>

      <p
        style={{
          fontSize: "30px",
          fontWeight: "bold",
        }}
      >
        {data ||
          "Nothing scanned yet"}
      </p>
    </div>
  );
}

export default Scanner;