import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import App from "./app";

const rootElement = document.getElementById("root");
if (rootElement) {
  if (!window.location.hash) {
    window.location.hash = "#/";
  }
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <HashRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/:filename" element={<App />} />
        </Routes>
      </HashRouter>
    </React.StrictMode>
  );
}
