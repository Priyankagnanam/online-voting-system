import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="page home-page">
      <h1>Online Voting System</h1>
      <p style={{ fontSize: "1.15rem", maxWidth: "600px", margin: "0 auto 2rem" }}>
        A secure and transparent platform for conducting elections.
        Register, verify your identity, and cast your vote with confidence.
      </p>

      {!user ? (
        <div className="home-actions">
          <Link to="/register" className="btn btn-primary">Register as Voter</Link>
          <Link to="/login" className="btn btn-secondary">Voter Login</Link>
          <Link to="/admin/login" className="btn btn-secondary">Admin Login</Link>
        </div>
      ) : user.role === "admin" ? (
        <div className="home-actions">
          <Link to="/admin/dashboard" className="btn btn-primary">Admin Dashboard</Link>
        </div>
      ) : (
        <div className="home-actions">
          <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
        </div>
      )}

      <div className="features-grid" style={{ marginTop: "3rem" }}>
        <div className="card feature-card">
          <h3>Secure Voting</h3>
          <p>JWT authentication, bcrypt password hashing, and server-side vote validation.</p>
        </div>
        <div className="card feature-card">
          <h3>One Vote Per Voter</h3>
          <p>Database-level enforcement ensures each voter can only vote once per election.</p>
        </div>
        <div className="card feature-card">
          <h3>Real-Time Results</h3>
          <p>View election results with live vote counts and candidate statistics.</p>
        </div>
        <div className="card feature-card">
          <h3>Security Monitoring</h3>
          <p>AI-assisted risk detection flags suspicious login attempts for admin review.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
