import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Play,
  CalendarClock,
  CheckCircle,
  UserCheck,
  Vote,
  Clock,
  ArrowRight,
  Inbox,
  XCircle,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

const VoterDashboard = () => {
  const { user } = useAuth();
  const [elections, setElections] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();

    const rawSocketUrl = import.meta.env.VITE_API_URL || "https://voting-backend-zn31.onrender.com";
    const socketUrl = (rawSocketUrl.startsWith('http://') || rawSocketUrl.startsWith('https://'))
      ? rawSocketUrl
      : `https://${rawSocketUrl}`;
    const socket = io(socketUrl, {
      withCredentials: true,
    });

    socket.on("voteCast", () => {
      fetchData();
    });

    socket.on("electionStarted", () => {
      fetchData();
    });

    socket.on("electionEnded", () => {
      fetchData();
    });

    return () => {
      socket.disconnect();
    };
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
      if (err.response?.status === 403) {
        setError(err.response?.data?.error || "Your account has not been approved.");
      } else {
        setError(err.response?.data?.error || "Failed to load data");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading elections..." />;
  if (error) return <ErrorMessage message={error} />;

  const approvalStatus = user?.approvalStatus || "APPROVED";
  const needsApproval = approvalStatus !== "APPROVED";

  if (needsApproval) {
    return (
      <div className="page" style={{ maxWidth: 640, margin: "0 auto" }}>
        <div className="card" style={{ marginTop: "2rem", padding: "2rem 1.75rem" }}>
          <div className="empty-state" style={{ border: "none", background: "transparent", padding: 0 }}>
            <span className="empty-state-icon">
              {approvalStatus === "REJECTED" ? <XCircle size={26} /> : <Clock size={26} />}
            </span>
            <span
              className={`badge ${
                approvalStatus === "REJECTED" ? "badge-danger" : "badge-warning"
              } approval-badge`}
              style={{ marginBottom: "1rem" }}
            >
              {approvalStatus}
            </span>
            <h3>
              {approvalStatus === "REJECTED"
                ? "Your registration has not been approved."
                : "Your registration is awaiting admin approval."}
            </h3>
            <p>
              {approvalStatus === "REJECTED"
                ? "Your registration has not been approved for voting."
                : "Once an administrator approves your account, you will be able to log in and vote."}
            </p>
          </div>
          <div className="approval-track">
            <div className="track-step done">
              <span className="step-dot">&#10003;</span>
              <span className="step-label">Account Created</span>
            </div>
            <div className={`track-step ${approvalStatus === "REJECTED" ? "done" : "active"}`}>
              <span className="step-dot">{approvalStatus === "REJECTED" ? "!" : "2"}</span>
              <span className="step-label">
                {approvalStatus === "REJECTED" ? "Not Approved" : "Admin Approval"}
              </span>
            </div>
          </div>
          {approvalStatus === "REJECTED" && (
            <p className="text-center" style={{ marginTop: "1.25rem" }}>
              <Link to="/" className="btn btn-primary">
                Contact Administrator
              </Link>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="voter-hero">
        <div>
          <span className="status-pill">
            <span className="dot" />
            Election season is live
          </span>
          <h2 style={{ marginTop: "0.9rem" }}>
            {user?.name ? `Welcome, ${user.name.split(" ")[0]}!` : "Welcome!"}
          </h2>
          <p>
            Below are the elections open for voting right now. Select one to review
            candidates and cast your vote.
          </p>
        </div>
      </div>

      {stats && (
        <div className="stats-grid" style={{ marginTop: 0 }}>
          <div className="stat-card">
            <span className="stat-icon stat-icon-primary"><Play size={19} /></span>
            <div className="stat-inner">
              <div className="stat-value">{stats.activeElections}</div>
              <div className="stat-label">Active Elections</div>
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
            <span className="stat-icon stat-icon-success"><CheckCircle size={19} /></span>
            <div className="stat-inner">
              <div className="stat-value">{stats.votedElections}</div>
              <div className="stat-label">Votes Cast</div>
            </div>
          </div>
        </div>
      )}

      <div className="section">
        <h3 className="section-title">
          <Play size={18} /> Active Elections
        </h3>
        {elections.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <span className="empty-state-icon"><Inbox size={24} /></span>
              <h3>No active elections</h3>
              <p>There are no active elections at the moment. Check back later.</p>
            </div>
          </div>
        ) : (
          <div className="election-list">
            {elections.map((election) => (
              <div key={election._id} className="card election-card">
                <h3>{election.title}</h3>
                {election.description && <p>{election.description}</p>}
                <div className="election-meta">
                  <span><UserCheck size={15} /> {election.candidateCount} candidates</span>
                  <span><Vote size={15} /> {election.voteCount} votes cast</span>
                  <span><Clock size={15} /> Ends {new Date(election.endDate).toLocaleDateString()}</span>
                </div>
                <Link to={`/elections/${election._id}`} className="btn btn-primary">
                  View &amp; Vote <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoterDashboard;