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
  LayoutDashboard,
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
      <div className="page">
        <div className="card" style={{ maxWidth: 560, margin: "3rem auto" }}>
          <div className="empty-state">
            <span className="empty-state-icon">
              {approvalStatus === "REJECTED" ? <XCircle size={24} /> : <Clock size={24} />}
            </span>
            <span className={`badge ${approvalStatus === "REJECTED" ? "badge-danger" : "badge-warning"} approval-badge`}>
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
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <span className="hero-mark" style={{ width: 48, height: 48, borderRadius: 14, marginBottom: 0 }}>
            <LayoutDashboard size={22} />
          </span>
          <div>
            <h2>{user?.name ? `Welcome, ${user.name.split(" ")[0]}` : "Voter Dashboard"}</h2>
            <p>Your elections and voting overview.</p>
          </div>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
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