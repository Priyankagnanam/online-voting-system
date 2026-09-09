import { Link } from "react-router-dom";
import { CheckCircle2, LayoutDashboard, Home } from "lucide-react";

const VoteConfirmation = () => {
  return (
    <div className="page text-center" style={{ padding: "4rem 2rem" }}>
      <div className="success-card card">
        <span className="success-check">
          <CheckCircle2 size={38} />
        </span>
        <h2>Vote Confirmed!</h2>
        <p>
          Your vote has been recorded successfully.
          Thank you for participating in this election.
        </p>
        <div className="vote-review-actions" style={{ justifyContent: "center" }}>
          <Link to="/dashboard" className="btn btn-primary">
            <LayoutDashboard size={17} /> Back to Dashboard
          </Link>
          <Link to="/" className="btn btn-secondary">
            <Home size={17} /> Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VoteConfirmation;