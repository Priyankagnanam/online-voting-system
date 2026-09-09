import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, RefreshCw } from "lucide-react";
import api from "../services/api";
import ErrorMessage from "../components/ErrorMessage";
import AuthLayout from "../components/AuthLayout";

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
    <AuthLayout
      title="Verify Your Email"
      subtitle="Enter the 6-digit code we sent to your email to activate your account."
    >
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
            inputMode="numeric"
          />
        </div>
        <button className="btn btn-primary btn-block" disabled={loading}>
          <ShieldCheck size={17} />
          {loading ? "Verifying..." : "Verify"}
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-block"
          style={{ marginTop: "0.6rem" }}
          onClick={handleResend}
          disabled={resending}
        >
          <RefreshCw size={15} className={resending ? "loading-spin" : ""} />
          {resending ? "Sending..." : "Resend OTP"}
        </button>
      </form>
      <p className="auth-footer">
        Already verified? <Link to="/login">Login</Link>
      </p>
    </AuthLayout>
  );
};

export default VerifyOTP;
