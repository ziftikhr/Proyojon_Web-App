import React, { useState } from "react";
import { auth, db } from "../../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa"; 

const Register = () => {
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user", 
    secretKey: "", 
    error: "",
    loading: false,
  });

  const [showPassword, setShowPassword] = useState(false); 
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); 
  const navigate = useNavigate();

  const { name, email, password, confirmPassword, role, secretKey, error, loading } = values;

  const ADMIN_SECRET_KEY = "AK-47_911"; 

  const handleChange = (e) =>
    setValues({ ...values, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setValues({ ...values, error: "All fields are required" });
      return;
    }
    if (password !== confirmPassword) {
      setValues({ ...values, error: "Password must match" });
      return;
    }

    if (role === "admin" && secretKey !== ADMIN_SECRET_KEY) {
      setValues({ ...values, error: "Invalid secret key for admin registration" });
      return;
    }

    setValues({ ...values, error: "", loading: true });

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        name,
        email,
        role, 
        createdAt: Timestamp.fromDate(new Date()),
        isOnline: true,
      });

      setValues({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "user",
        secretKey: "",
        error: "",
        loading: false,
      });

      if (role === "admin") {
        navigate("/admin/dashboard", { replace: true }); 
      } else {
        navigate("/", { replace: true }); 
      }
    } catch (error) {
      setValues({ ...values, error: error.message, loading: false });
    }
  };

  return (
    <form className="shadow rounded p-3 mt-5 form" onSubmit={handleSubmit}>
      <h3 className="text-center mb-3">Create An Account</h3>
      <div className="mb-3">
        <label htmlFor="name" className="form-label">
          Name
        </label>
        <input
          type="text"
          className="form-control"
          name="name"
          value={name}
          onChange={handleChange}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="email" className="form-label">
          Email
        </label>
        <input
          type="email"
          className="form-control"
          name="email"
          value={email}
          onChange={handleChange}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="password" className="form-label">
          Password
        </label>
        <div className="input-group">
          <input
            type={showPassword ? "text" : "password"}
            className="form-control"
            name="password"
            value={password}
            onChange={handleChange}
          />
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
      </div>
      <div className="mb-3">
        <label htmlFor="confirmPassword" className="form-label">
          Confirm Password
        </label>
        <div className="input-group">
          <input
            type={showConfirmPassword ? "text" : "password"}
            className="form-control"
            name="confirmPassword"
            value={confirmPassword}
            onChange={handleChange}
          />
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        {confirmPassword && (
          <p
            style={{
              color: password === confirmPassword ? "green" : "red",
              marginTop: "5px",
            }}
          >
            {password === confirmPassword
              ? "Passwords match"
              : "Passwords do not match"}
          </p>
        )}
      </div>
      <div className="mb-3">
        <label htmlFor="role" className="form-label">
          Account Type
        </label>
        <select
          className="form-select"
          name="role"
          value={role}
          onChange={handleChange}
        >
          <option value="user">Regular User</option>
          <option value="admin">Administrator</option>
        </select>
      </div>
      {role === "admin" && (
        <div className="mb-3">
          <label htmlFor="secretKey" className="form-label">
            Admin Secret Key
          </label>
          <input
            type="password"
            className="form-control"
            name="secretKey"
            value={secretKey}
            onChange={handleChange}
          />
        </div>
      )}
      {error ? <p className="text-center text-danger">{error}</p> : null}
      <div className="text-center mb-3">
        <button className="btn btn-secondary btn-sm" disabled={loading}>
          Register
        </button>
      </div>
    </form>
  );
};

export default Register;