import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

const NotFound = () => {
  return (
    <div className="page text-center" style={{ padding: "4rem 2rem" }}>
      <div className="success-card card text-center" style={{ maxWidth: "480px", margin: "0 auto" }}>
        <span className="success-check" style={{ background: "var(--info-soft)", color: "var(--info)" }}>
          <Compass size={34} />
        </span>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for does not exist or may have been moved.</p>
        <Link to="/" className="btn btn-primary">
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;