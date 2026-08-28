const NotFound = () => {
  return (
    <div className="page" style={{ textAlign: "center", padding: "4rem 2rem" }}>
      <h1 style={{ fontSize: "4rem", marginBottom: "0.5rem" }}>404</h1>
      <h2>Page Not Found</h2>
      <p style={{ marginBottom: "1.5rem" }}>The page you are looking for does not exist.</p>
      <a href="/" className="btn btn-primary">Go Home</a>
    </div>
  );
};

export default NotFound;
