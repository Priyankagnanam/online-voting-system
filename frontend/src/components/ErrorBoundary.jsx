import { Component } from "react";
import { AlertTriangle } from "lucide-react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="auth-shell" style={{ minHeight: "100vh", alignItems: "center" }}>
          <div className="success-card card" style={{ maxWidth: "540px", margin: "0 auto" }}>
            <span className="success-check" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
              <AlertTriangle size={34} />
            </span>
            <h2>Something went wrong</h2>
            <p>
              An unexpected error occurred. Please try reloading the page.
              If the problem persists, please contact support.
            </p>
            <button className="btn btn-primary" onClick={this.handleReload} aria-label="Reload application">
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;