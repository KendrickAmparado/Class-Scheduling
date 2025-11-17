import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faRefresh, faHome } from '@fortawesome/free-solid-svg-icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Generate unique error ID for tracking
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Log error to Sentry or error tracking service
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          errorBoundary: true,
          errorId,
        },
      });
    }

    this.setState({
      error,
      errorInfo,
      errorId,
    });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorId } = this.state;
      const { fallback: Fallback, showDetails = false } = this.props;

      // Use custom fallback if provided
      if (Fallback) {
        return <Fallback error={error} resetError={this.handleReset} />;
      }

      // Default error UI
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 50%, #f97316 100%)',
          padding: '20px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            textAlign: 'center',
          }}>
            <FontAwesomeIcon 
              icon={faExclamationTriangle} 
              style={{ 
                fontSize: '64px', 
                color: '#ef4444',
                marginBottom: '20px'
              }} 
            />
            
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '12px',
            }}>
              Something went wrong
            </h1>
            
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              marginBottom: '30px',
              lineHeight: '1.6',
            }}>
              We're sorry, but something unexpected happened. Our team has been notified and is working on a fix.
            </p>

            {errorId && (
              <p style={{
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '30px',
                fontFamily: 'monospace',
              }}>
                Error ID: {errorId}
              </p>
            )}

            {showDetails && process.env.NODE_ENV === 'development' && error && (
              <details style={{
                textAlign: 'left',
                marginBottom: '30px',
                padding: '20px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '10px',
                }}>
                  Error Details (Development Only)
                </summary>
                <pre style={{
                  fontSize: '12px',
                  color: '#ef4444',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {error.toString()}
                  {errorInfo && errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 44, 99, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <FontAwesomeIcon icon={faRefresh} />
                Try Again
              </button>

              <button
                onClick={this.handleReload}
                style={{
                  padding: '12px 24px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                }}
              >
                <FontAwesomeIcon icon={faRefresh} />
                Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '12px 24px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                }}
              >
                <FontAwesomeIcon icon={faHome} />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

