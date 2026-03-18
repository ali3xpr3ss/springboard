import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import App from "./App";
import "./index.css";
import { ApplicantCabinet } from "./pages/ApplicantCabinet";
import { CabinetLayout } from "./pages/CabinetPage";
import { CuratorCabinet } from "./pages/CuratorCabinet";
import { EmployerCabinet } from "./pages/EmployerCabinet";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cabinet" element={<CabinetLayout />}>
          <Route path="applicant" element={<ApplicantCabinet />} />
          <Route path="employer" element={<EmployerCabinet />} />
          <Route path="curator" element={<CuratorCabinet />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);

