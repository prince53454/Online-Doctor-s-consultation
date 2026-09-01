import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F9FAFB',
          padding: '20px',
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{
            maxWidth: 520,
            textAlign: 'center',
            background: 'white',
            borderRadius: 16,
            padding: '48px 32px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>😵</div>
            <h1 style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#1F2937',
              marginBottom: 8
            }}>Something went wrong</h1>
            <p style={{
              color: '#6B7280',
              fontSize: 15,
              lineHeight: 1.6,
              marginBottom: 24
            }}>
              An unexpected error occurred. Our team has been notified.
              Please try again or go back to the home page.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                textAlign: 'left',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 8,
                padding: 12,
                marginBottom: 24,
                fontSize: 12,
                fontFamily: 'monospace',
                color: '#991B1B',
                maxHeight: 200,
                overflow: 'auto'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                  Error Details (Development)
                </summary>
                <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
                  {this.state.error?.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '12px 24px',
                  background: 'white',
                  color: '#4F46E5',
                  border: '2px solid #4F46E5',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #4F46E5, #4338CA)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)'
                }}
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
