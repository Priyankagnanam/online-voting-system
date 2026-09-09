import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Landmark, Menu, LogIn, UserPlus, ShieldCheck, LogOut, LayoutDashboard, Globe } from "lucide-react";
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
        <span className="navbar-brand-icon">
          <Landmark size={18} />
        </span>
        <Link to="/" className="navbar-brand-link" onClick={closeMenu}>
          Online Voting System
        </Link>
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
        {!user && (
          <>
            <NavLink to="/login" onClick={closeMenu}>
              <LogIn size={16} /> Login
            </NavLink>
            <NavLink to="/register" onClick={closeMenu}>
              <UserPlus size={16} /> Register
            </NavLink>
            <NavLink to="/admin/login" onClick={closeMenu}>
              <ShieldCheck size={16} /> Admin
            </NavLink>
          </>
        )}
        {user && user.role === "voter" && (
          <>
            <span className="navbar-user">
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>Hi, {user.name}</span>
            </span>
            <NavLink to="/dashboard" onClick={closeMenu}>
              <LayoutDashboard size={16} /> Dashboard
            </NavLink>
            <button className="navbar-button" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          </>
        )}
        {user && user.role === "admin" && (
          <>
            <span className="navbar-user">
              <ShieldCheck size={15} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.name || "Administrator"}
              </span>
            </span>
            <NavLink to="/admin/dashboard" onClick={closeMenu}>
              <LayoutDashboard size={16} /> Dashboard
            </NavLink>
            <Link to="/" onClick={closeMenu}>
              <Globe size={16} /> View Site
            </Link>
            <button className="navbar-button" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;