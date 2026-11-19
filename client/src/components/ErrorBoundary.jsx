// src/components/ErrorBoundary.jsx
// Catches any uncaught React rendering error and displays a branded error screen
// instead of a blank white/cream page.

import React from 'react';
import Logo from './Logo';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          backgroundColor: '#F2EEE6',
          color: '#0A0A0A',
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          padding: '24px 16px',
          boxSizing: 'border-box',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E3DED2',
            borderRadius: '20px',
            padding: '36px clamp(20px, 5vw, 36px)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.06)',
            textAlign: 'center',
          }}>
            <div style={{ display: 'inline-flex', marginBottom: '20px' }}>
              <Logo href="/" />
            </div>

            <h1 style={{
              fontSize: '22px',
              fontWeight: 700,
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
            }}>
              Screen Loading Error
            </h1>

            <p style={{
              color: '#6B675F',
              fontSize: '14px',
              margin: '0 0 20px',
              lineHeight: 1.5,
            }}>
              An unexpected error occurred while rendering this interface.
            </p>

            {this.state.error && (
              <div style={{
                backgroundColor: '#FBEBED',
                color: '#EC4F5F',
                padding: '12px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                textAlign: 'left',
                margin: '0 0 20px',
                wordBreak: 'break-word',
                maxHeight: '120px',
                overflowY: 'auto',
              }}>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  flex: 1,
                  height: '46px',
                  borderRadius: '999px',
                  backgroundColor: '#0A0A0A',
                  color: '#F2EEE6',
                  fontWeight: 600,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                ↻ Reload Page
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  flex: 1,
                  height: '46px',
                  borderRadius: '999px',
                  backgroundColor: '#FFFFFF',
                  color: '#0A0A0A',
                  border: '1px solid #E3DED2',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Return Home
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

