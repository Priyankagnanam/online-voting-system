import { Link } from "react-router-dom";
import { ShieldCheck, CheckCircle2, ArrowLeft } from "lucide-react";

const AuthLayout = ({ title, subtitle, children, bullets }) => {
  const features =
    bullets ||
    [
      "Secure, secret and verifiable elections",
      "One registered voter, one vote",
      "OTP-verified voter identity",
    ];

  return (
    <div className="auth-shell page-bg">
      <div className="auth-visual">
        <div className="brand">
          <ShieldCheck size={22} />
          <span>
            VoteSecure
            <em style={{ display: "block", fontStyle: "normal", fontSize: "0.68rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.02em" }}>
              Online Voting System
            </em>
          </span>
        </div>
        <div className="auth-visual-inner">
          <h2>
            Trusted digital democracy, <span>built for everyone.</span>
          </h2>
          <p>
            Conduct trusted, transparent and secure elections for communities,
            organizations and institutions — from your desk or on the go.
          </p>
          <ul>
            {features.map((feature, i) => (
              <li key={i}>
                <CheckCircle2 size={18} />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-card">
          <Link to="/" className="back-link">
            <ArrowLeft size={14} />
            Back to Home
          </Link>
          <h2>{title}</h2>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;