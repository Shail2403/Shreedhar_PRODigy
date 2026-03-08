import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { CheckCircle, XCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';

const VerifyEmailPage = () => {
    const { token } = useParams();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const { isAuthenticated, setAuth } = useAuthStore();

    useEffect(() => {
        const verify = async () => {
            try {
                await api.get(`/auth/verify-email/${token}/`);
                setStatus('success');
                
                // If the user is logged in, immediately update their verified status in the background
                if (isAuthenticated) {
                    try {
                        const profileRes = await api.get('/auth/profile/');
                        setAuth(profileRes.data, null);
                    } catch(e) {}
                }
            } catch (err) {
                setStatus('error');
            }
        };
        verify();
    }, [token, isAuthenticated, setAuth]);

    return (
        <div className="container flex items-center justify-center" style={{ minHeight: '60vh' }}>
            <div className="glass text-center" style={{ padding: '4rem', borderRadius: 'var(--radius-lg)', maxWidth: '500px' }}>
                {status === 'verifying' && (
                    <div className="animate-fade">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                        <h2>Verifying your email...</h2>
                        <p style={{ color: '#888' }}>Please wait while we activate your account.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="animate-fade">
                        <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 1.5rem auto' }} />
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>Email Verified!</h2>
                        <p style={{ color: '#666', marginBottom: '2rem' }}>Your account is now fully active. You can now enjoy full benefits and receive order updates.</p>
                        <Link to={isAuthenticated ? "/profile" : "/login"} style={{ background: 'var(--primary)', color: 'white', padding: '1rem 2rem', borderRadius: 'var(--radius-md)', fontWeight: 800 }}>
                            {isAuthenticated ? "Back to Profile" : "Login to Continue"}
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="animate-fade">
                        <XCircle size={64} color="var(--error)" style={{ margin: '0 auto 1.5rem auto' }} />
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>Verification Failed</h2>
                        <p style={{ color: '#666', marginBottom: '2rem' }}>The link is either invalid or has expired. Please request a new verification link from your profile.</p>
                        <Link to="/" style={{ color: 'var(--primary)', fontWeight: 700 }}>Back to Home</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
