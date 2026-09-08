import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import ErrorMessage from "../components/ErrorMessage";
import AuthLayout from "../components/AuthLayout";

const Register = () => {
  const [name, setName] = useState("");
  const [regulationNumber, setRegulationNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      await api.post("/auth/register", {
        name,
        rollNumber: regulationNumber,
        email,
        password,
      });
      setSuccess("Registration successful! We've sent a verification code to your email.");
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
            placeholder="Enter your Voter ID / Registration number"
          />
        </div>
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
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      <p className="auth-footer">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </AuthLayout>
  );
};

export default Register;