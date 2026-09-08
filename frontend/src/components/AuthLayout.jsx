const AuthLayout = ({ title, subtitle, children, bullets }) => {
  const features =
    bullets || [
      "Secure, secret and verifiable elections",
      "One registered voter, one vote",
      "OTP-verified voter identity",
    ];

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <div className="auth-brand-logo">OV</div>
        <h1>Online Voting System</h1>
        <p>
          Conduct trusted, transparent and secure elections for communities,
          organizations and institutions.
        </p>
        <ul>
          {features.map((feature, i) => (
            <li key={i}>{feature}</li>
          ))}
        </ul>
      </div>
      <div className="auth-card">
        <h2>{title}</h2>
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;