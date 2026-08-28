import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import ConfirmationModal from "../components/ConfirmationModal";

const ElectionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [voteCount, setVoteCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchElection();
  }, [id]);

  const fetchElection = async () => {
    try {
      const { data } = await api.get(`/voter/elections/${id}`);
      setElection(data.election);
      setCandidates(data.candidates);
      setVoteCount(data.voteCount);
      setHasVoted(data.hasVoted);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load election");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    setVoting(true);
    try {
      await api.post("/votes", {
        electionId: id,
        candidateId: selectedCandidate._id,
      });
      setShowModal(false);
      navigate("/vote-confirmation");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to cast vote");
      setShowModal(false);
    } finally {
      setVoting(false);
    }
  };

  if (loading) return <Loading message="Loading election..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!election) return <ErrorMessage message="Election not found" />;

  return (
    <div className="page">
      <h2>{election.title}</h2>
      {election.description && <p>{election.description}</p>}

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{candidates.length}</h3>
            <p>Candidates</p>
          </div>
          <div className="stat-card">
            <h3>{voteCount}</h3>
            <p>Votes Cast</p>
          </div>
          <div className="stat-card">
            <h3>
              <span className={`badge badge-${election.status}`}>{election.status}</span>
            </h3>
            <p>Status</p>
          </div>
        </div>
      </div>

      {hasVoted && (
        <div className="success-message">
          You have already voted in this election.
        </div>
      )}

      <h3>Candidates</h3>
      <div className="candidate-list">
        {candidates.map((candidate) => (
          <div
            key={candidate._id}
            className={`card candidate-card ${selectedCandidate?._id === candidate._id ? "selected" : ""}`}
            onClick={() => {
              if (!hasVoted && election.status === "active") {
                setSelectedCandidate(candidate);
              }
            }}
            style={{
              cursor: hasVoted || election.status !== "active" ? "default" : "pointer",
              border:
                selectedCandidate?._id === candidate._id
                  ? "2px solid var(--primary)"
                  : "1px solid var(--border)",
            }}
          >
            <h3>{candidate.name}</h3>
            <p style={{ color: "var(--primary)", fontWeight: 500 }}>{candidate.party}</p>
            {candidate.description && <p>{candidate.description}</p>}
          </div>
        ))}
      </div>

      {candidates.length === 0 && (
        <div className="card">
          <p>No candidates have been added to this election yet.</p>
        </div>
      )}

      {!hasVoted && election.status === "active" && selectedCandidate && (
        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <p>You selected: <strong>{selectedCandidate.name}</strong> ({selectedCandidate.party})</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            style={{ marginTop: "0.5rem" }}
          >
            Cast Vote
          </button>
        </div>
      )}

      <ConfirmationModal
        isOpen={showModal}
        title="Confirm Your Vote"
        message={`Are you sure you want to vote for ${selectedCandidate?.name}? This action cannot be undone.`}
        onConfirm={handleVote}
        onCancel={() => setShowModal(false)}
      />

      {voting && <Loading message="Casting your vote..." />}
    </div>
  );
};

export default ElectionDetails;
