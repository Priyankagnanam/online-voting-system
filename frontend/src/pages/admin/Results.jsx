import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { BarChart3, Trophy, Inbox } from "lucide-react";
import api from "../../services/api";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";

const Results = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResults();

    const rawSocketUrl = import.meta.env.VITE_API_URL || "https://voting-backend-zn31.onrender.com";
    const socketUrl = (rawSocketUrl.startsWith('http://') || rawSocketUrl.startsWith('https://'))
      ? rawSocketUrl
      : `https://${rawSocketUrl}`;
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
      <div className="page-header">
        <div>
          <h2>Election Results</h2>
          <p className="page-subtitle">Live vote counts and candidate statistics.</p>
        </div>
        <span className="chip">
          <BarChart3 size={14} /> Live
        </span>
      </div>

      {results.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-state-icon"><Inbox size={24} /></span>
            <h3>No elections found</h3>
            <p>Results will appear here once elections are created.</p>
          </div>
        </div>
      ) : (
        results.map((result) => (
          <div key={result.election._id} className="card result-card">
            <div className="result-header">
              <h3>{result.election.title}</h3>
              <span className={`badge badge-${result.election.status}`}>{result.election.status}</span>
            </div>
            <p className="result-total">Total votes: {result.totalVotes}</p>
            {result.candidates.length > 0 ? (
              <div>
                {result.candidates.map((candidate, index) => {
                  const percentage = result.totalVotes > 0
                    ? ((candidate.voteCount / result.totalVotes) * 100).toFixed(1)
                    : 0;
                  const isWinner = index === 0 && result.totalVotes > 0;
                  return (
                    <div key={candidate.id} className="result-row">
                      <div className="result-row-head">
                        <span>
                          {isWinner && (
                            <span className="result-winner">
                              <Trophy size={15} />
                            </span>
                          )}
                          <strong>{candidate.name}</strong>
                          <span className="table-muted"> ({candidate.party})</span>
                        </span>
                        <span className="result-count">
                          {candidate.voteCount} votes ({percentage}%)
                        </span>
                      </div>
                      <div className="result-bar">
                        <div
                          className="result-bar-fill"
                          style={{
                            background: index === 0 ? "var(--primary)" : "var(--text-muted)",
                            width: `${percentage}%`,
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