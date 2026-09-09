import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarClock,
  UserCheck,
  Users,
  ClipboardCheck,
  BarChart3,
  ShieldAlert,
  LogOut,
  Landmark,
  UserCog,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/elections", icon: CalendarClock, label: "Elections" },
  { to: "/admin/candidates", icon: UserCheck, label: "Candidates" },
  { to: "/admin/voters", icon: Users, label: "Voters" },
  { to: "/admin/approved-voters", icon: ClipboardCheck, label: "Eligibility List" },
  { to: "/admin/results", icon: BarChart3, label: "Results" },
  { to: "/admin/security-alerts", icon: ShieldAlert, label: "Security Alerts" },
];

const AdminLayout = ({ children }) => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="brand">
          <Landmark size={22} />
          <span>
            Online Voting System
            <em style={{ display: "block", fontStyle: "normal", fontSize: "0.72rem", fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>
              Administration Panel
            </em>
          </span>
        </div>
        <div className="admin-nav-heading">Manage</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
        <div className="admin-sidebar-spacer" />
        <div className="admin-sidebar-footer">
          <div className="navbar-user" style={{ marginBottom: "0.6rem", maxWidth: "100%" }}>
            <UserCog size={15} />
            <span>{user?.name || "Administrator"}</span>
          </div>
          <button
            className="btn btn-ghost btn-block"
            style={{ justifyContent: "center", color: "var(--danger)" }}
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
};

export default AdminLayout;