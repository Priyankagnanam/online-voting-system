import { Link } from "react-router-dom";

const VoteConfirmation = () => {
  return (
    <div className="page" style={{ textAlign: "center", padding: "4rem 2rem" }}>
      <div className="card" style={{ maxWidth: "500px", margin: "0 auto" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>&#10003;</div>
        <h2>Vote Confirmed!</h2>
        <p style={{ marginBottom: "1.5rem" }}>
          Your vote has been recorded successfully. Thank you for participating!
        </p>
        <Link to="/dashboard" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default VoteConfirmation;
