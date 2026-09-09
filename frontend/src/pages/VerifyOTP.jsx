import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, RefreshCw, MailCheck } from "lucide-react";
import api from "../services/api";
import ErrorMessage from "../components/ErrorMessage";
import AuthLayout from "../components/AuthLayout";

const COOLDOWN_SECONDS = 60;

const VerifyOTP = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const otpInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
  };

  const handleBoxFocus = (index) => {
    const input = otpInputRef.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(index, index);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/auth/verify-otp", { email, otp, purpose: "verification" });
      setSuccess("Email verified! You can log in after admin approval.");
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
      setSuccess(
        data.emailStatus && data.emailStatus.ok === false
          ? "We could not deliver the OTP email right now. Please try again in a moment."
          : data.message
      );
      setCooldown(COOLDOWN_SECONDS);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  const filled = otp.split("");

  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle="Enter the 6-digit code we sent to your email to activate your account."
    >
      <ErrorMessage message={error} />
      {success && (
        <div className="success-message" style={{ alignItems: "center" }}>
          <MailCheck size={18} />
          <span>{success}</span>
        </div>
      )}
      <form onSubmit={handleVerify} noValidate>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </div>
        <div className="form-group mb-0">
          <label>OTP Code</label>
          <div className="otp-wrap">
            <input
              ref={otpInputRef}
              className="otp-hidden-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={handleChange}
              maxLength={6}
              aria-label="Enter 6-digit OTP code"
            />
            <div className="otp-boxes">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className={`otp-box ${filled[i] ? "filled" : ""} ${
                    otp.length === i ? "active" : ""
                  }`}
                  onClick={() => handleBoxFocus(otp.length >= 6 ? 5 : Math.min(i, otp.length))}
                >
                  {filled[i] || ""}
                </div>
              ))}
            </div>
          </div>
          <p className="otp-note">If you haven't received it, check after a moment and try again.</p>
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading || otp.length !== 6}
        >
          <ShieldCheck size={17} />
          {loading ? "Verifying..." : "Verify & Continue"}
        </button>
        <div className="resend-row">
          <span>Didn't get the code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
          >
            <RefreshCw size={13} className={resending ? "loading-spin" : ""} />
            &nbsp;{resending
              ? "Sending..."
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend OTP"}
          </button>
        </div>
      </form>
      <p className="auth-footer">
        Already verified? <Link to="/login">Login</Link>
      </p>
      <p className="table-muted text-center" style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>
        Didn't receive it? Check your Spam / Promotions folder — the sender is
        gpriyanka17052006@gmail.com (subject "Verify Your Email").
      </p>
    </AuthLayout>
  );
};

export default VerifyOTP;