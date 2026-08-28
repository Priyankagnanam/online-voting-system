import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

const VoterDashboard = () => {
  const [elections, setElections] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [electionsRes, statsRes] = await Promise.all([
        api.get("/voter/active-elections"),
        api.get("/voter/stats"),
      ]);
      setElections(electionsRes.data.elections);
      setStats(statsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading elections..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="dashboard">
      <h2>Voter Dashboard</h2>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{stats.activeElections}</h3>
            <p>Active Elections</p>
          </div>
          <div className="stat-card">
            <h3>{stats.totalElections}</h3>
            <p>Total Elections</p>
          </div>
          <div className="stat-card">
            <h3>{stats.votedElections}</h3>
            <p>Votes Cast</p>
          </div>
        </div>
      )}

      <h3>Active Elections</h3>
      {elections.length === 0 ? (
        <div className="card">
          <p>No active elections at the moment. Check back later.</p>
        </div>
      ) : (
        <div className="election-list">
          {elections.map((election) => (
            <div key={election._id} className="card election-card">
              <h3>{election.title}</h3>
              {election.description && <p>{election.description}</p>}
              <div className="election-meta">
                <span>{election.candidateCount} candidates</span>
                <span>{election.voteCount} votes cast</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Ends: {new Date(election.endDate).toLocaleDateString()}
              </p>
              <Link
                to={`/elections/${election._id}`}
                className="btn btn-primary"
                style={{ marginTop: "0.75rem", display: "inline-block", textDecoration: "none" }}
              >
                View & Vote
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VoterDashboard;
