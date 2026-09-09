import { Link } from "react-router-dom";
import {
  ShieldCheck,
  UserPlus,
  LogIn,
  ArrowRight,
  Users,
  Lock,
  Vote,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Encrypted & Verified",
    text: "Your data, our priority",
  },
  {
    icon: Users,
    title: "One Vote Per Voter",
    text: "Fair and equal for all",
  },
  {
    icon: Lock,
    title: "Transparent Results",
    text: "Builds trust in democracy",
  },
];

const Home = () => {
  return (
    <div className="page home-page page-bg">
      <div className="hero">
        <div className="hero-shield" aria-hidden="true">
          <ShieldCheck size={70} strokeWidth={1.4} />
          <span className="hero-shield-badge">
            <Vote size={22} />
          </span>
        </div>

        <div className="hero-badge">
          <ShieldCheck size={14} />
          Secure • Transparent • Fair
        </div>

        <h1>
          Online <span className="accent">Voting System</span>
        </h1>

        <p className="hero-lead">
          A secure and transparent platform for conducting elections. Register,
          verify your identity, and cast your vote with confidence.
        </p>

        <div className="hero-cta">
          <Link to="/register" className="btn btn-primary">
            <UserPlus size={17} /> Register as Voter <ArrowRight size={16} />
          </Link>
          <Link to="/login" className="btn btn-outline">
            <LogIn size={17} /> Voter Login <ArrowRight size={16} />
          </Link>
          <Link to="/admin/login" className="btn btn-ghost">
            <ShieldCheck size={17} /> Admin Login <ArrowRight size={16} />
          </Link>
        </div>

        <div className="feature-row">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="feature-item">
              <span className="fi-icon">
                <Icon size={21} />
              </span>
              <span>
                <b>{title}</b>
                <small>{text}</small>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;