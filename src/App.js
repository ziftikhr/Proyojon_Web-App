import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Home from "./pages/Home";
import AuthProvider from "./context/auth";
import ForgotPassword from "./pages/auth/ForgetPassword";
import ResetPassword from "./pages/auth/ResetPassword";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;