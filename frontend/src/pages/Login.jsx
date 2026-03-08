/**
 * Login Page
 * ─────────────────────────────────────────────────────────────────────────────
 * Dual-mode login as requested:
 *   - "Login with Phone" → OTP sent to phone → verify OTP → logged in
 *   - "Login with Email" → email + password form → logged in
 *
 * After login: redirects to Home with a success toast message.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import OTPModal from '../components/OTPModal';
import { Phone, Mail, Lock, ArrowRight, ChevronLeft } from 'lucide-react';

const INPUT_STYLE = {
    width: '100%', padding: '0.875rem 1rem',
    borderRadius: '10px', border: '1.5px solid #e5e7eb',
    outline: 'none', fontSize: '1rem', background: '#fafafa',
    transition: 'border 0.2s'
};

const Login = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore(state => state.setAuth);

    // 'phone' = OTP login mode | 'email' = password login mode
    const [mode, setMode] = useState('phone');

    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [otpData, setOtpData] = useState(null); // { devOtp }

    // ── Phone OTP: Step 1 — Request OTP ───────────────────────────────────
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');

        if (phone.length !== 10) {
            setError('Please enter a valid 10-digit mobile number.');
            return;
        }

        setLoading(true);
        try {
            const fullPhone = `${countryCode}${phone}`;
            const res = await api.post('/auth/login/otp/initiate/', { phone: fullPhone });
            if (res.data.success) {
                setOtpData({ devOtp: res.data.dev_otp, phone: `${countryCode} ${phone}` });
            } else {
                setError(res.data.message || 'Failed to send OTP.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'No account found with this number. Please sign up first.');
        } finally {
            setLoading(false);
        }
    };

    // ── Phone OTP: Step 2 — Verify OTP → Login ────────────────────────────
    const handleVerifyOTP = async (otp) => {
        const fullPhone = `${countryCode}${phone}`;
        const res = await api.post('/auth/login/otp/verify/', { phone: fullPhone, otp });
        if (res.data.success) {
            setAuth(res.data.user, res.data.tokens);
            navigate('/', { state: { toast: res.data.message } });
        } else {
            throw new Error(res.data.message || 'Verification failed.');
        }
    };

    // ── Phone OTP: Resend ─────────────────────────────────────────────────
    const handleResendOTP = async () => {
        try {
            const fullPhone = `${countryCode}${phone}`;
            const res = await api.post('/auth/login/otp/initiate/', { phone: fullPhone });
            if (res.data.success) {
                setOtpData(prev => ({ ...prev, devOtp: res.data.dev_otp }));
            }
        } catch {}
    };

    // ── Email + Password Login ────────────────────────────────────────────
    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }
        if (!password) {
            setError('Please enter your password.');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/login/password/', {
                email: email.trim().toLowerCase(),
                password
            });
            if (res.data.success) {
                setAuth(res.data.user, res.data.tokens);
                navigate('/', { state: { toast: res.data.message } });
            } else {
                setError(res.data.message || 'Login failed.');
            }
        } catch (err) {
            const msg = err.response?.data?.errors?.non_field_errors?.[0]
                || err.response?.data?.message
                || 'Invalid email or password.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '2rem 1rem',
            background: 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)'
        }}>
            <Link to="/" style={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#666', fontWeight: 600, textDecoration: 'none', marginBottom: '1.5rem' }}>
                <ChevronLeft size={18} /> Back to Home
            </Link>
            <div style={{
                width: '100%', maxWidth: '440px', background: 'white',
                borderRadius: '20px', padding: '2.5rem',
                boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '1px solid #f1f1f1'
            }}>
                {/* Brand Logo */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-1px' }}>शridhar</span>
                        <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111', letterSpacing: '-1px' }}>Enterprise</span>
                    </div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111', margin: 0 }}>Welcome Back!</h1>
                    <p style={{ color: '#888', marginTop: '0.3rem', fontSize: '0.9rem' }}>Login to your account</p>
                </div>

                {/* Mode Toggle */}
                <div style={{
                    display: 'flex', background: '#f3f4f6',
                    borderRadius: '12px', padding: '4px', marginBottom: '1.75rem'
                }}>
                    {[
                        { id: 'phone', label: '📱 Phone (OTP)', icon: Phone },
                        { id: 'email', label: '✉️ Email (Password)', icon: Mail },
                    ].map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => { setMode(id); setError(''); }}
                            style={{
                                flex: 1, padding: '0.7rem 0.5rem',
                                borderRadius: '10px', border: 'none',
                                fontWeight: 700, fontSize: '0.85rem',
                                cursor: 'pointer', transition: 'all 0.25s',
                                background: mode === id ? 'white' : 'transparent',
                                color: mode === id ? 'var(--primary)' : '#6b7280',
                                boxShadow: mode === id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Error Banner */}
                {error && (
                    <div style={{
                        background: '#fef2f2', color: '#dc2626',
                        padding: '0.75rem 1rem', borderRadius: '10px',
                        marginBottom: '1.25rem', fontSize: '0.875rem',
                        fontWeight: 600, border: '1px solid #fecaca'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* ── Mode: Phone OTP ─────────────────────────────────────── */}
                {mode === 'phone' && (
                    <form onSubmit={handleSendOTP}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: '#374151' }}>
                                Mobile Number
                            </label>
                            <div style={{ display: 'flex', gap: '0.4rem', width: '100%', alignItems: 'center' }}>
                                <select
                                    value={countryCode}
                                    onChange={e => setCountryCode(e.target.value)}
                                    style={{ 
                                        ...INPUT_STYLE, 
                                        width: '85px', 
                                        flexShrink: 0, 
                                        padding: '0.875rem 0.25rem',
                                        textAlign: 'center',
                                        fontSize: '0.9rem',
                                        fontWeight: 700 
                                    }}
                                >
                                    <option value="+91">🇮🇳 +91</option>
                                    <option value="+1">🇺🇸 +1</option>
                                    <option value="+44">🇬🇧 +44</option>
                                    <option value="+971">🇦🇪 +971</option>
                                    <option value="+61">🇦🇺 +61</option>
                                </select>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="10-digit number"
                                    required
                                    style={{ ...INPUT_STYLE, flex: 1, minWidth: 0 }}
                                />
                            </div>
                            {phone && phone.length !== 10 && (
                                <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                    Must be exactly 10 digits ({phone.length}/10)
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '1rem',
                                background: loading ? '#e5e7eb' : 'var(--primary)',
                                color: loading ? '#999' : 'white',
                                border: 'none', borderRadius: '12px',
                                fontWeight: 800, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Sending OTP...' : '📱 Send OTP →'}
                        </button>
                    </form>
                )}

                {/* ── Mode: Email + Password ──────────────────────────────── */}
                {mode === 'email' && (
                    <form onSubmit={handlePasswordLogin}>
                        <div style={{ marginBottom: '1.1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: '#374151' }}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                style={INPUT_STYLE}
                            />
                        </div>

                        <div style={{ marginBottom: '1.75rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: '#374151' }}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={INPUT_STYLE}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '1rem',
                                background: loading ? '#e5e7eb' : 'var(--primary)',
                                color: loading ? '#999' : 'white',
                                border: 'none', borderRadius: '12px',
                                fontWeight: 800, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                            }}
                        >
                            {loading ? 'Logging in...' : <><span>Login Now</span><ArrowRight size={18} /></>}
                        </button>
                    </form>
                )}

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
                    Don't have an account?{' '}
                    <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                        Sign up free
                    </Link>
                </p>
            </div>

            {/* OTP Modal */}
            {otpData && (
                <OTPModal
                    phone={otpData.phone}
                    devOtp={otpData.devOtp}
                    onVerify={handleVerifyOTP}
                    onResend={handleResendOTP}
                    onClose={() => setOtpData(null)}
                />
            )}
        </div>
    );
};

export default Login;
