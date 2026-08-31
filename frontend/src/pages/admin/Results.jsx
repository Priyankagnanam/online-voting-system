import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import api from "../../services/api";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";

const Results = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResults();

    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const socket = io(socketUrl, {
      withCredentials: true,
    });

    socket.on("voteCast", () => {
      fetchResults();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchResults = async () => {
    try {
      const { data } = await api.get("/admin/results");
      setResults(data.results);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading results..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="page">
      <h2>Election Results</h2>

      {results.length === 0 ? (
        <div className="card"><p>No elections found.</p></div>
      ) : (
        results.map((result) => (
          <div key={result.election._id} className="card" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3>{result.election.title}</h3>
              <span className={`badge badge-${result.election.status}`}>{result.election.status}</span>
            </div>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Total votes: {result.totalVotes}
            </p>
            {result.candidates.length > 0 ? (
              <div>
                {result.candidates.map((candidate, index) => {
                  const percentage = result.totalVotes > 0
                    ? ((candidate.voteCount / result.totalVotes) * 100).toFixed(1)
                    : 0;
                  return (
                    <div key={candidate.id} style={{ marginBottom: "0.75rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                        <span>
                          {index === 0 && result.totalVotes > 0 && (
                            <span style={{ color: "var(--warning)", marginRight: "0.3rem" }}>&#9733;</span>
                          )}
                          <strong>{candidate.name}</strong> ({candidate.party})
                        </span>
                        <span>{candidate.voteCount} votes ({percentage}%)</span>
                      </div>
                      <div style={{ background: "var(--border)", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
                        <div
                          style={{
                            background: index === 0 ? "var(--primary)" : "var(--text-secondary)",
                            height: "100%",
                            width: `${percentage}%`,
                            transition: "width 0.3s",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No candidates in this election.</p>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Results;
