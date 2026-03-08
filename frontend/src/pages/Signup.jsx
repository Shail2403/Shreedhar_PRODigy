/**
 * Signup Page
 * ─────────────────────────────────────────────────────────────────────────────
 * Strict OTP-first flow:
 *   1. User fills form → POST /auth/signup/initiate/ → backend generates OTP
 *   2. OTP Modal shows real backend OTP (dev mode: displayed on screen)
 *   3. User enters OTP → POST /auth/signup/verify/ → account created → redirect home
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import OTPModal from '../components/OTPModal';
import { ChevronLeft } from 'lucide-react';

const INPUT_STYLE = {
    width: '100%', padding: '0.875rem 1rem',
    borderRadius: '10px', border: '1.5px solid #e5e7eb',
    outline: 'none', fontSize: '1rem', transition: 'border 0.2s',
    background: '#fafafa'
};

const LABEL_STYLE = {
    display: 'block', fontSize: '0.85rem',
    fontWeight: 700, marginBottom: '0.4rem', color: '#374151'
};

const Signup = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore(state => state.setAuth);

    const [form, setForm] = useState({
        full_name: '',
        phone: '',
        email: '',
        password: '',
        country_code: '+91',
        is_india: true
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpData, setOtpData] = useState(null); // { devOtp, phone }

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            // Allow only digits, max 10
            setForm(p => ({ ...p, phone: value.replace(/\D/g, '').slice(0, 10) }));
        } else if (name === 'country_code') {
            setForm(p => ({ 
                ...p, 
                country_code: value,
                is_india: value === '+91'
            }));
        } else {
            setForm(p => ({ ...p, [name]: value }));
        }
    };

    // ── Step 1: Initiate Signup (generate OTP) ─────────────────────────────
    const handleInitiate = async (e) => {
        e.preventDefault();
        setError('');

        if (form.phone.length !== 10) {
            setError('Please enter a valid 10-digit phone number.');
            return;
        }
        if (form.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...form,
                phone: `${form.country_code}${form.phone}`
            };
            const res = await api.post('/auth/signup/initiate/', payload);
            if (res.data.success) {
                setOtpData({
                    devOtp: res.data.dev_otp,
                    phone: `${form.country_code} ${form.phone}`
                });
            } else {
                setError(res.data.message || 'Failed to send OTP.');
            }
        } catch (err) {
            const errors = err.response?.data?.errors;
            if (errors) {
                setError(errors.phone?.[0] || errors.email?.[0] || errors.password?.[0] || 'Please fix the errors above.');
            } else {
                setError(err.response?.data?.message || 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: Verify OTP → Create Account ───────────────────────────────
    const handleVerifyOTP = async (otp) => {
        const payload = {
            ...form,
            phone: `${form.country_code}${form.phone}`,
            otp
        };
        const res = await api.post('/auth/signup/verify/', payload);
        if (res.data.success) {
            setAuth(res.data.user, res.data.tokens);
            // Redirect to home page after successful signup
            navigate('/', { state: { toast: res.data.message } });
        } else {
            throw new Error(res.data.message || 'Verification failed.');
        }
    };

    // ── Resend OTP ─────────────────────────────────────────────────────────
    const handleResend = async () => {
        try {
            const payload = { ...form, phone: `${form.country_code}${form.phone}` };
            const res = await api.post('/auth/signup/initiate/', payload);
            if (res.data.success) {
                setOtpData(prev => ({ ...prev, devOtp: res.data.dev_otp }));
            }
        } catch {}
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '2rem 1rem',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #fff 100%)'
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
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111', margin: 0 }}>Create your account</h1>
                    <p style={{ color: '#888', marginTop: '0.3rem', fontSize: '0.9rem' }}>Join for fresh groceries & snacks</p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div style={{
                        background: '#fef2f2', color: '#dc2626', padding: '0.75rem 1rem',
                        borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.875rem',
                        fontWeight: 600, border: '1px solid #fecaca'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleInitiate}>
                    {/* Full Name */}
                    <div style={{ marginBottom: '1.1rem' }}>
                        <label style={LABEL_STYLE}>Full Name</label>
                        <input
                            type="text" name="full_name" required
                            value={form.full_name} onChange={handleChange}
                            placeholder="e.g. Rahul Shah"
                            style={INPUT_STYLE}
                        />
                    </div>

                    {/* Phone */}
                    <div style={{ marginBottom: '1.1rem' }}>
                        <label style={LABEL_STYLE}>Mobile Number</label>
                        <div style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
                            <select
                                name="country_code"
                                value={form.country_code}
                                onChange={handleChange}
                                style={{ 
                                    ...INPUT_STYLE, 
                                    width: '95px', 
                                    flexShrink: 0, 
                                    paddingLeft: '0.5rem',
                                    paddingRight: '0.2rem',
                                    fontSize: '0.9rem',
                                    textAlign: 'left'
                                }}
                            >
                                <option value="+91">🇮🇳 +91</option>
                                <option value="+1">🇺🇸 +1</option>
                                <option value="+44">🇬🇧 +44</option>
                                <option value="+971">🇦🇪 +971</option>
                                <option value="+61">🇦🇺 +61</option>
                            </select>
                            <input
                                type="tel" name="phone" required
                                value={form.phone} onChange={handleChange}
                                placeholder="10-digit number"
                                maxLength={10}
                                style={{ ...INPUT_STYLE, flex: 1, minWidth: 0 }}
                            />
                        </div>
                        {form.phone && form.phone.length !== 10 && (
                            <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                Phone must be exactly 10 digits ({form.phone.length}/10)
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div style={{ marginBottom: '1.1rem' }}>
                        <label style={LABEL_STYLE}>Email Address <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span></label>
                        <input
                            type="email" name="email"
                            value={form.email} onChange={handleChange}
                            placeholder="you@example.com"
                            style={INPUT_STYLE}
                        />
                    </div>

                    {/* Password */}
                    <div style={{ marginBottom: '1.75rem' }}>
                        <label style={LABEL_STYLE}>Create Password</label>
                        <input
                            type="password" name="password" required
                            value={form.password} onChange={handleChange}
                            placeholder="Minimum 8 characters"
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
                            transition: 'all 0.2s'
                        }}
                    >
                        {loading ? 'Sending OTP...' : '📱 Send OTP & Continue →'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                        Login here
                    </Link>
                </p>
            </div>

            {/* OTP Modal */}
            {otpData && (
                <OTPModal
                    phone={otpData.phone}
                    devOtp={otpData.devOtp}
                    onVerify={handleVerifyOTP}
                    onResend={handleResend}
                    onClose={() => setOtpData(null)}
                />
            )}
        </div>
    );
};

export default Signup;
