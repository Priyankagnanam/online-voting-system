import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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

  return (
    <div className="dashboard">
      <h2>Admin Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.totalVoters}</h3>
          <p>Total Voters</p>
        </div>
        <div className="stat-card">
          <h3>{stats.totalElections}</h3>
          <p>Total Elections</p>
        </div>
        <div className="stat-card">
          <h3>{stats.totalCandidates}</h3>
          <p>Total Candidates</p>
        </div>
        <div className="stat-card">
          <h3>{stats.totalVotes}</h3>
          <p>Total Votes</p>
        </div>
        <div className="stat-card">
          <h3>{stats.activeElections}</h3>
          <p>Active Elections</p>
        </div>
        <div className="stat-card">
          <h3>{stats.totalApprovedVoters || 0}</h3>
          <p>Approved Voters</p>
        </div>
      </div>

      <h3>Quick Actions</h3>
      <div className="stats-grid">
        <Link to="/admin/elections" className="stat-card" style={{ textDecoration: "none" }}>
          <h3>Elections</h3>
          <p>Manage elections</p>
        </Link>
        <Link to="/admin/candidates" className="stat-card" style={{ textDecoration: "none" }}>
          <h3>Candidates</h3>
          <p>Manage candidates</p>
        </Link>
        <Link to="/admin/voters" className="stat-card" style={{ textDecoration: "none" }}>
          <h3>Voters</h3>
          <p>Manage voters</p>
        </Link>
        <Link to="/admin/approved-voters" className="stat-card" style={{ textDecoration: "none" }}>
          <h3>Pre-Approval</h3>
          <p>Manage approved list</p>
        </Link>
        <Link to="/admin/results" className="stat-card" style={{ textDecoration: "none" }}>
          <h3>Results</h3>
          <p>View results</p>
        </Link>
      </div>

      {stats.security.suspiciousCount > 0 && (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <h3 style={{ color: "var(--danger)" }}>Security Alert</h3>
          <p>{stats.security.suspiciousCount} suspicious login attempts detected.</p>
          <Link to="/admin/security-alerts" className="btn btn-danger" style={{ marginTop: "0.5rem", display: "inline-block", textDecoration: "none" }}>
            View Alerts
          </Link>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
