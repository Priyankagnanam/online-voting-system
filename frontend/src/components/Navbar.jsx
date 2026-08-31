import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" onClick={closeMenu}>Online Voting System</Link>
        {user && (
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            &#9776;
          </button>
        )}
      </div>
      <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
        {!user && (
          <>
            <Link to="/login" onClick={closeMenu}>Login</Link>
            <Link to="/register" onClick={closeMenu}>Register</Link>
            <Link to="/admin/login" onClick={closeMenu}>Admin</Link>
          </>
        )}
        {user && user.role === "voter" && (
          <>
            <span className="navbar-user">Hi, {user.name}</span>
            <Link to="/dashboard" onClick={closeMenu}>Dashboard</Link>
            <button onClick={handleLogout}>Logout</button>
          </>
        )}
        {user && user.role === "admin" && (
          <>
            <span className="navbar-user">Admin</span>
            <Link to="/admin/dashboard" onClick={closeMenu}>Dashboard</Link>
            <Link to="/admin/elections" onClick={closeMenu}>Elections</Link>
            <Link to="/admin/candidates" onClick={closeMenu}>Candidates</Link>
            <Link to="/admin/voters" onClick={closeMenu}>Voters</Link>
            <Link to="/admin/approved-voters" onClick={closeMenu}>Approved List</Link>
            <Link to="/admin/results" onClick={closeMenu}>Results</Link>
            <Link to="/admin/security-alerts" onClick={closeMenu}>Alerts</Link>
            <button onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
