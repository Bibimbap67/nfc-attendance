import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import Scanner from "./Scanner";

const root = ReactDOM.createRoot(
  document.getElementById("root")
);

const isScanner =
  window.location.pathname === "/scanner";

root.render(
  <React.StrictMode>
    {isScanner ? <Scanner /> : <App />}
  </React.StrictMode>
);