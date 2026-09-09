import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  UserCheck,
  Vote,
  Clock,
  CheckCircle,
  Users,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
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

  const isSelectable = !hasVoted && election.status === "active";

  return (
    <div className="page">
      <div className="election-head">
        <h2>
          {election.title}
          <span className={`badge badge-${election.status}`}>{election.status}</span>
        </h2>
        {election.description && <p className="page-subtitle">{election.description}</p>}
      </div>

      <div className="info-grid">
        <div className="info-card">
          <span className="stat-icon stat-icon-info"><Users size={19} /></span>
          <div>
            <div className="info-card-value">{candidates.length}</div>
            <div className="info-card-label">Candidates</div>
          </div>
        </div>
        <div className="info-card">
          <span className="stat-icon stat-icon-primary"><Vote size={19} /></span>
          <div>
            <div className="info-card-value">{voteCount}</div>
            <div className="info-card-label">Votes Cast</div>
          </div>
        </div>
        <div className="info-card">
          <span className="stat-icon stat-icon-success"><CheckCircle size={19} /></span>
          <div>
            <div className="info-card-value">
              <span className="badge badge-active">Status</span>
            </div>
            <div className="info-card-label" style={{ textTransform: "capitalize" }}>{election.status}</div>
          </div>
        </div>
        <div className="info-card">
          <span className="stat-icon stat-icon-warning"><Clock size={19} /></span>
          <div>
            <div className="info-card-value" style={{ fontSize: "0.92rem" }}>
              {new Date(election.endDate).toLocaleDateString()}
            </div>
            <div className="info-card-label">Ends</div>
          </div>
        </div>
      </div>

      {hasVoted && (
        <div className="success-message">
          <CheckCircle size={17} />
          <span>You have already voted in this election.</span>
        </div>
      )}

      <div className="section">
        <h3 className="section-title">
          <UserCheck size={18} /> Candidates
        </h3>
        {candidates.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <span className="empty-state-icon"><Users size={24} /></span>
              <h3>No candidates yet</h3>
              <p>No candidates have been added to this election yet.</p>
            </div>
          </div>
        ) : (
          <div className="candidate-list">
            {candidates.map((candidate) => {
              const selected = selectedCandidate?._id === candidate._id;
              return (
                <div
                  key={candidate._id}
                  className={`card candidate-card ${selected ? "selected" : ""} ${!isSelectable ? "candidate-disabled" : ""}`}
                  onClick={() => {
                    if (isSelectable) {
                      setSelectedCandidate(candidate);
                    }
                  }}
                  role={isSelectable ? "button" : undefined}
                  tabIndex={isSelectable ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (isSelectable && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      setSelectedCandidate(candidate);
                    }
                  }}
                >
                  <span className="candidate-radio">&#10003;</span>
                  <div className="candidate-card-top">
                    <span className="candidate-avatar">
                      {candidate.name?.charAt(0).toUpperCase() || "?"}
                    </span>
                    <div>
                      <p className="candidate-name">{candidate.name}</p>
                      <p className="candidate-party">{candidate.party}</p>
                    </div>
                  </div>
                  {candidate.description && (
                    <p className="candidate-desc">{candidate.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!hasVoted && election.status === "active" && selectedCandidate && (
        <div className="vote-review">
          <div className="vote-review-info">
            <span className="stat-icon stat-icon-primary">
              <ShieldCheck size={19} />
            </span>
            <div className="vote-review-text">
              <strong>You selected: {selectedCandidate.name}</strong>
              <span>{selectedCandidate.party}</span>
            </div>
          </div>
          <div className="vote-review-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedCandidate(null)}
            >
              Change
            </button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Cast Vote <ArrowRight size={16} />
            </button>
          </div>
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