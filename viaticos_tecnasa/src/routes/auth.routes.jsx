import { Routes, Route } from "react-router-dom";
import Login from "../page/auth/Login";

export default function AuthRoutes() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      
    </Routes>
  );
}