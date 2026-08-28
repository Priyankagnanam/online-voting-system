import { useState, useEffect } from "react";
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

  const getRiskColor = (level) => {
    if (level === "suspicious") return "var(--danger)";
    if (level === "review") return "var(--warning)";
    return "var(--success)";
  };

  if (loading && alerts.length === 0) return <Loading message="Loading security alerts..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="page">
      <h2>Security Alerts</h2>
      <p style={{ marginBottom: "1rem", color: "var(--text-secondary)" }}>
        AI-assisted/rule-based suspicious login detection. Not a production-grade intrusion-detection system.
      </p>

      {alerts.length === 0 ? (
        <div className="card">
          <p>No suspicious activity detected.</p>
        </div>
      ) : (
        <div className="table-container">
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
                  <td>{alert.email}</td>
                  <td>{alert.success ? "Success" : "Failed"}</td>
                  <td>
                    <strong style={{ color: getRiskColor(alert.riskLevel) }}>
                      {alert.riskScore}
                    </strong>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background:
                          alert.riskLevel === "suspicious"
                            ? "#fef2f2"
                            : alert.riskLevel === "review"
                            ? "#fffbeb"
                            : "#f0fdf4",
                        color: getRiskColor(alert.riskLevel),
                      }}
                    >
                      {alert.riskLevel}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.85rem" }}>{alert.ip}</td>
                  <td style={{ fontSize: "0.85rem" }}>
                    {new Date(alert.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
          <button
            className="btn btn-secondary"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span style={{ padding: "0.5rem" }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-secondary"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SecurityAlerts;
