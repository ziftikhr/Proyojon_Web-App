import React, { useContext } from "react";
import { AuthContext } from "../context/auth";
import { Navigate, Outlet } from "react-router-dom";
import Loading from "./Loading";

const AdminRoute = () => {
  const { user, userData, loading } = useContext(AuthContext);
  
  if (loading) {
    return <Loading />;
  }
  
  if (!user) {
    return <Navigate to="/auth/login" />;
  }
  
  if (userData && userData.role !== 'admin') {
    return <Navigate to="/" />;
  }
  
  return <Outlet />;
};

export default AdminRoute;