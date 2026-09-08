import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import ErrorMessage from "../components/ErrorMessage";

const VerifyOTP = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/auth/verify-otp", { email, otp, purpose: "verification" });
      setSuccess("Email verified! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setError("");
    setResending(true);
    try {
      const { data } = await api.post("/auth/resend-otp", { email });
      setSuccess(data.message);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <h2>Verify OTP</h2>
      <p>Enter the 6-digit code sent to your email.</p>
      <ErrorMessage message={error} />
      {success && <div className="success-message">{success}</div>}
      <form onSubmit={handleVerify}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>OTP Code</label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength={6}
            placeholder="123456"
          />
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Verifying..." : "Verify"}
        </button>
        <button
          type="button"
          className="btn"
          style={{ width: "100%", marginTop: "0.5rem" }}
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? "Sending..." : "Resend OTP"}
        </button>
      </form>
      <p style={{ marginTop: "1rem", textAlign: "center" }}>
        Already verified? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default VerifyOTP;
