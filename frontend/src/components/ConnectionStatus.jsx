import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function ConnectionStatus() {
    const [status, setStatus] = useState('checking') // 'checking' | 'connected' | 'disconnected'
    const [showBanner, setShowBanner] = useState(false)

    useEffect(() => {
        const checkConnection = async () => {
            try {
                // Try to ping the backend
                await api.get('/health/', { timeout: 5000 })
                setStatus('connected')
                setShowBanner(false)
            } catch (error) {
                console.error('Backend connection failed:', error)
                setStatus('disconnected')
                setShowBanner(true)
            }
        }

        // Check immediately
        checkConnection()

        // Check every 30 seconds
        const interval = setInterval(checkConnection, 30000)

        return () => clearInterval(interval)
    }, [])

    if (!showBanner) return null

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            padding: '12px 20px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            animation: 'slideDown 0.3s ease-out'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <div>
                    <strong>Backend Connection Lost</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
                        Cannot connect to the backend server at http://localhost:8000. Please ensure the backend is running.
                    </p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '8px 16px',
                        background: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '6px',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                    }}
                >
                    Retry
                </button>
            </div>
            <style>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
        </div>
    )
}
