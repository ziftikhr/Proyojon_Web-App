import { signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth";
import { auth, db } from "../firebaseConfig";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import logo from "../assets/logo.png";

import "../styles/Navbar.css";


const Navbar = () => {
  const { user, userData } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSignout = async () => {
    // update user doc
    await updateDoc(doc(db, "users", user.uid), {
      isOnline: false,
    });
    // logout
    await signOut(auth);
    // navigate to login
    navigate("/auth/login");
  };

  return (
    <nav className="navbar navbar-expand-md bg-light navbar-light sticky-top shadow-sm">
      <div className="container">
      <Link className="navbar-brand d-flex align-items-center" to="/">
  <img
    src={logo}
    alt="Proyojon Logo"
    style={{ height: "40px", marginRight: "10px" }}
  />
  <span style={{ fontFamily: "Poppins", fontWeight: "bold", fontSize: "24px" }}>
  Proyojon
</span>
</Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            {user ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to={`/profile/${user.uid}`}>
                    Profile
                  </Link>
                </li>
                <li className="nav-item">
                    <Link to="/chat" className="nav-link">
                      Chat
                    </Link>
                 </li>
                <li className="nav-item">
                  <Link className="nav-link" to={`/sell`}>
                    Post
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to={`/favorites`}>
                    My Favorites
                  </Link>
                </li>
                {/* Admin Dashboard Link */}
                {userData && userData.role === "admin" && (
                  <li className="nav-item">
                    <Link className="nav-link" to={`/admin/dashboard`}>
                      Admin Dashboard
                    </Link>
                  </li>
                )}
                <li className="nav-item" style={{height: "40px"}}>
                  <button className="btn btn-secondary btn-sm" onClick={handleSignout}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M5 8a.5.5 0 0 1 .5-.5h5.793l-2.147-2.146a.5.5 0 0 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L11.293 8.5H5.5A.5.5 0 0 1 5 8z" />
                      <path d="M3 0h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3z" />
                    </svg>
                    LOGOUT
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item" style={{height: "40px"}}>
                  <Link className="btn btn-secondary btn-sm" to="/auth/register">
                    Register
                  </Link>
                </li>
                <li className="nav-item" style={{height: "40px"}}>
                  <Link className="btn btn-secondary btn-sm" to="/auth/login">
                    Login
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;