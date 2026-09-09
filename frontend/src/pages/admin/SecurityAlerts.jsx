import { useState, useEffect } from "react";
import { ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../services/api";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";

const SecurityAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAlerts();
  }, [page]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/security-alerts?page=${page}`);
      setAlerts(data.alerts);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (level) => {
    if (level === "suspicious") return "badge-danger";
    if (level === "review") return "badge-warning";
    return "badge-success";
  };

  if (loading && alerts.length === 0) return <Loading message="Loading security alerts..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Security Alerts</h2>
          <p className="page-subtitle">
            AI-assisted / rule-based suspicious login detection. Not a production-grade
            intrusion-detection system.
          </p>
        </div>
        <span className="chip">
          <ShieldAlert size={14} /> {alerts.length} on this page
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-state-icon"><ShieldAlert size={24} /></span>
            <h3>No suspicious activity</h3>
            <p>No suspicious login attempts have been detected.</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Risk Score</th>
                  <th>Risk Level</th>
                  <th>IP</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert._id}>
                    <td style={{ fontWeight: 600 }}>{alert.email}</td>
                    <td>
                      <span className={`badge ${alert.success ? "badge-active" : "badge-danger"}`}>
                        {alert.success ? "Success" : "Failed"}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontFeatureSettings: "'tnum'" }}>{alert.riskScore}</strong>
                    </td>
                    <td>
                      <span className={`badge ${getRiskBadge(alert.riskLevel)}`}>
                        {alert.riskLevel}
                      </span>
                    </td>
                    <td className="table-muted">{alert.ip}</td>
                    <td className="table-muted">{new Date(alert.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft size={15} /> Previous
          </button>
          <span className="pagination-info">Page {page} of {totalPages}</span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SecurityAlerts;