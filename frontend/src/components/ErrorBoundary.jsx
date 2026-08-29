import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          background: '#f9fafb',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '3rem',
            maxWidth: '500px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚠️</h1>
            <h2 style={{ color: '#111827', marginBottom: '1rem' }}>Something went wrong</h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem', lineHeight: '1.6' }}>
              An unexpected error occurred. Please try reloading the page.
              If the problem persists, please contact support.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => e.target.style.background = '#4338ca'}
              onMouseOut={(e) => e.target.style.background = '#4f46e5'}
              aria-label="Reload application"
            >
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
