import React from 'react'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)
        this.state = { hasError: true, error, errorInfo }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '20px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                }}>
                    <div style={{
                        maxWidth: '600px',
                        padding: '40px',
                        background: 'var(--bg-card)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        textAlign: 'center'
                    }}>
                        <h1 style={{ fontSize: '2rem', marginBottom: '16px', color: 'var(--accent-red)' }}>
                            ⚠️ Something went wrong
                        </h1>
                        <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>
                            The application encountered an error. Please try refreshing the page.
                        </p>
                        <details style={{ textAlign: 'left', marginBottom: '24px' }}>
                            <summary style={{ cursor: 'pointer', marginBottom: '12px', fontWeight: 'bold' }}>
                                Error Details
                            </summary>
                            <pre style={{
                                background: 'var(--bg-secondary)',
                                padding: '12px',
                                borderRadius: '8px',
                                overflow: 'auto',
                                fontSize: '0.85rem',
                                color: 'var(--accent-red)'
                            }}>
                                {this.state.error && this.state.error.toString()}
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '12px 24px',
                                background: 'var(--accent-blue)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '1rem'
                            }}
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
