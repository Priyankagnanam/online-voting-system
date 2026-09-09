import { Link } from "react-router-dom";
import {
  Landmark,
  ShieldCheck,
  UserCheck,
  BarChart3,
  Radar,
  LogIn,
  UserPlus,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Secure Voting",
    text: "JWT authentication, encrypted passwords, and server-side vote validation.",
  },
  {
    icon: UserCheck,
    title: "One Vote Per Voter",
    text: "Database-level enforcement ensures each voter can only vote once per election.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Results",
    text: "View election results with live vote counts and candidate statistics.",
  },
  {
    icon: Radar,
    title: "Security Monitoring",
    text: "Risk detection flags suspicious login attempts for admin review.",
  },
];

const Home = () => {
  return (
    <div className="page home-page">
      <div className="hero">
        <span className="hero-mark">
          <Landmark size={32} />
        </span>
        <div className="hero-badge">
          <CheckCircle2 size={14} />
          Trusted &amp; Transparent
        </div>
        <h1>Online Voting System</h1>
        <p className="hero-lead">
          A secure and transparent platform for conducting elections.
          Register, verify your identity, and cast your vote with confidence.
        </p>

        <div className="hero-cta">
          <Link to="/register" className="btn btn-primary">
            <UserPlus size={17} /> Register as Voter
          </Link>
          <Link to="/login" className="btn btn-secondary">
            <LogIn size={17} /> Voter Login
          </Link>
          <Link to="/admin/login" className="btn btn-outline">
            <ShieldCheck size={17} /> Admin Login
          </Link>
        </div>

        <div className="trust-row">
          <span className="trust-item">
            <ShieldCheck size={16} /> Encrypted &amp; verified
          </span>
          <span className="trust-item">
            <UserCheck size={16} /> One vote per voter
          </span>
          <span className="trust-item">
            <BarChart3 size={16} /> Transparent results
          </span>
        </div>
      </div>

      <div className="features-grid">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card feature-card">
            <span className="feature-icon">
              <Icon size={22} />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;