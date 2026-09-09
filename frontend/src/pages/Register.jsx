import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Eye, EyeOff, ShieldCheck } from "lucide-react";
import api from "../services/api";
import ErrorMessage from "../components/ErrorMessage";
import AuthLayout from "../components/AuthLayout";

const Register = () => {
  const [name, setName] = useState("");
  const [regulationNumber, setRegulationNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/register", {
        name,
        rollNumber: regulationNumber,
        email,
        password,
      });
      const emailFailed = data.emailStatus && data.emailStatus.ok === false;
      setSuccess(
        emailFailed
          ? "Account created, but we could not deliver the verification email right now. Use 'Resend OTP' on the next screen or try again shortly."
          : "Registration successful! We've sent a verification code to your email. Your account will be active after admin approval."
      );
      setTimeout(() => navigate("/verify-otp", { state: { email } }), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Voter Registration"
      subtitle="Create your voting account. You'll verify your email with a one-time code."
    >
      <ErrorMessage message={error} />
      {success && <div className="success-message">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            placeholder="John Doe"
          />
        </div>
        <div className="form-group">
          <label>Voter ID Number</label>
          <input
            type="text"
            value={regulationNumber}
            onChange={(e) => setRegulationNumber(e.target.value.toUpperCase())}
            required
            placeholder="Enter your Voter ID"
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <div className="password-wrap">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <p className="field-hint">At least 8 characters.</p>
        </div>
        <button className="btn btn-primary btn-block" disabled={loading}>
          <UserPlus size={17} />
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      <p className="auth-footer">
        Already have an account? <Link to="/login">Login</Link>
      </p>
      <p className="info-message" style={{ marginTop: "1.1rem", marginBottom: 0, padding: "0.7rem 0.9rem" }}>
        <ShieldCheck size={16} />
        <span>After email verification, your account is reviewed by an administrator before voting is enabled.</span>
      </p>
    </AuthLayout>
  );
};

export default Register;