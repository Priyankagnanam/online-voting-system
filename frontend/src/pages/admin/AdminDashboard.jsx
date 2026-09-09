import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CalendarClock,
  UserCheck,
  Vote,
  Play,
  ClipboardCheck,
  ShieldAlert,
  ArrowRight,
  LayoutDashboard,
  Clock,
  XCircle,
} from "lucide-react";
import api from "../../services/api";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/admin/dashboard");
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} />;

  const quickActions = [
    { to: "/admin/elections", icon: CalendarClock, label: "Elections", desc: "Manage elections" },
    { to: "/admin/candidates", icon: UserCheck, label: "Candidates", desc: "Manage candidates" },
    { to: "/admin/voters", icon: Users, label: "Voters", desc: "Manage voters" },
    { to: "/admin/approved-voters", icon: ClipboardCheck, label: "Eligibility List", desc: "Pre-approved voters" },
    { to: "/admin/results", icon: Vote, label: "Results", desc: "View results" },
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h2>Admin Dashboard</h2>
          <p className="page-subtitle">Overview of your election platform.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon stat-icon-primary"><Users size={19} /></span>
          <div className="stat-inner">
            <div className="stat-value">{stats.totalVoters}</div>
            <div className="stat-label">Total Voters</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon stat-icon-info"><CalendarClock size={19} /></span>
          <div className="stat-inner">
            <div className="stat-value">{stats.totalElections}</div>
            <div className="stat-label">Total Elections</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon stat-icon-warning"><UserCheck size={19} /></span>
          <div className="stat-inner">
            <div className="stat-value">{stats.totalCandidates}</div>
            <div className="stat-label">Total Candidates</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon stat-icon-success"><Vote size={19} /></span>
          <div className="stat-inner">
            <div className="stat-value">{stats.totalVotes}</div>
            <div className="stat-label">Total Votes</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon stat-icon-danger"><Play size={19} /></span>
          <div className="stat-inner">
            <div className="stat-value">{stats.activeElections}</div>
            <div className="stat-label">Active Elections</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon stat-icon-success"><UserCheck size={19} /></span>
          <div className="stat-inner">
            <div className="stat-value">{stats.approvedVoters ?? stats.totalApprovedVoters ?? 0}</div>
            <div className="stat-label">Approved Voters</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon stat-icon-warning"><Clock size={19} /></span>
          <div className="stat-inner">
            <div className="stat-value">{stats.pendingApprovals || 0}</div>
            <div className="stat-label">Pending Approvals</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon stat-icon-danger"><XCircle size={19} /></span>
          <div className="stat-inner">
            <div className="stat-value">{stats.rejectedVoters || 0}</div>
            <div className="stat-label">Rejected Voters</div>
          </div>
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">
          <LayoutDashboard size={18} /> Quick Actions
        </h3>
        <div className="stats-grid">
          {quickActions.map(({ to, icon: Icon, label, desc }) => (
            <Link key={to} to={to} className="stat-card stat-card-link">
              <span className="stat-icon stat-icon-primary"><Icon size={19} /></span>
              <div className="stat-inner">
                <div className="stat-value" style={{ fontSize: "1.05rem" }}>{label}</div>
                <div className="stat-label">{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {stats.security.suspiciousCount > 0 && (
        <div className="card" style={{ borderColor: "#fecaca", background: "var(--danger-soft)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", flexWrap: "wrap" }}>
            <span className="stat-icon stat-icon-danger"><ShieldAlert size={20} /></span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ color: "var(--danger)", marginBottom: 0 }}>Security Alert</h3>
              <p style={{ marginBottom: 0, color: "var(--danger)" }}>
                {stats.security.suspiciousCount} suspicious login attempt(s) detected.
              </p>
            </div>
            <Link to="/admin/security-alerts" className="btn btn-danger">
              View Alerts <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;