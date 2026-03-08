/**
 * OTPModal Component
 * ─────────────────────────────────────────────────────────────────
 * Displays a verification modal for phone OTP.
 * DEV MODE: Shows the backend-provided OTP so developer can test easily.
 * PROD MODE: User receives OTP via SMS (Twilio integration ready).
 */
import React, { useState, useEffect, useRef } from 'react';
import { Clock, RefreshCw } from 'lucide-react';

const OTPModal = ({ phone, devOtp, onVerify, onResend, onClose }) => {
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(60);
    const [error, setError] = useState('');
    const [verifying, setVerifying] = useState(false);
    const inputRef = useRef(null);

    // Auto-focus input on mount
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    // Countdown timer
    useEffect(() => {
        const interval = setInterval(() => {
            setTimer(prev => prev > 0 ? prev - 1 : 0);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleVerify = async () => {
        setError('');
        if (!otp || otp.length < 6) {
            setError('Please enter the complete 6-digit OTP.');
            return;
        }
        setVerifying(true);
        try {
            await onVerify(otp);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Verification failed. Please try again.';
            setError(msg);
        } finally {
            setVerifying(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;
        setOtp('');
        setError('');
        setTimer(60);
        if (onResend) await onResend();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleVerify();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.65)', zIndex: 4000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
            <div className="animate-pop" style={{
                width: '100%', maxWidth: '380px', background: 'white',
                borderRadius: '20px', padding: '2rem', textAlign: 'center',
                boxShadow: '0 25px 50px rgba(0,0,0,0.15)'
            }}>
                {/* Icon */}
                <div style={{
                    background: '#fef2f2', width: '64px', height: '64px',
                    borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', margin: '0 auto 1.25rem auto'
                }}>
                    <Clock size={28} color="var(--primary)" />
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    Verify Your Phone
                </h2>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    Enter the 6-digit code sent to <strong>{phone}</strong>
                </p>

                {/* DEV MODE OTP Display */}
                {devOtp && (
                    <div style={{
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                        borderRadius: '10px', padding: '0.75rem', marginBottom: '1.25rem'
                    }}>
                        <p style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                            🔑 DEV MODE — Your OTP:{' '}
                            <span
                                style={{ fontSize: '1.2rem', letterSpacing: '4px', cursor: 'pointer' }}
                                onClick={() => setOtp(devOtp)}
                                title="Click to auto-fill"
                            >
                                {devOtp}
                            </span>
                            <span style={{ fontSize: '0.7rem', opacity: 0.7 }}> (click to fill)</span>
                        </p>
                    </div>
                )}

                {/* OTP Input */}
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={e => {
                        setError('');
                        setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    }}
                    onKeyDown={handleKeyDown}
                    style={{
                        width: '100%', padding: '1rem',
                        textAlign: 'center', fontSize: '1.75rem',
                        letterSpacing: '10px', fontWeight: 800,
                        borderRadius: '12px',
                        border: error ? '2px solid var(--primary)' : '2px solid #e5e7eb',
                        outline: 'none', marginBottom: '0.75rem',
                        transition: 'border 0.2s',
                        background: '#fafafa'
                    }}
                />

                {/* Error */}
                {error && (
                    <p style={{ color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>
                        {error}
                    </p>
                )}

                {/* Resend Timer */}
                <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: '#888' }}>
                    {timer > 0 ? (
                        <span>Resend OTP in <strong style={{ color: '#333' }}>{timer}s</strong></span>
                    ) : (
                        <button
                            onClick={handleResend}
                            style={{
                                color: 'var(--primary)', fontWeight: 700,
                                background: 'none', border: 'none', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                            }}
                        >
                            <RefreshCw size={14} /> Resend OTP
                        </button>
                    )}
                </div>

                {/* Verify Button */}
                <button
                    onClick={handleVerify}
                    disabled={verifying || otp.length < 6}
                    style={{
                        width: '100%', padding: '1rem',
                        background: otp.length === 6 ? 'var(--primary)' : '#e5e7eb',
                        color: otp.length === 6 ? 'white' : '#999',
                        border: 'none', borderRadius: '12px',
                        fontWeight: 800, fontSize: '1rem', cursor: otp.length === 6 ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s'
                    }}
                >
                    {verifying ? 'Verifying...' : 'Verify & Continue →'}
                </button>

                <button
                    onClick={onClose}
                    style={{
                        marginTop: '1rem', color: '#aaa',
                        fontSize: '0.85rem', background: 'none',
                        border: 'none', cursor: 'pointer'
                    }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default OTPModal;
