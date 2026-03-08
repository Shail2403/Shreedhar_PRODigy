/**
 * Toast Notification Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Displays a temporary success/error/info message on top of the screen.
 * Auto-dismisses after provided duration.
 */
import React, { useEffect, useState } from 'react';
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react';

const TYPES = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', icon: CheckCircle },
    error: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', icon: AlertCircle },
    info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', icon: Info },
};

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
    const [visible, setVisible] = useState(false);
    const config = TYPES[type] || TYPES.success;
    const Icon = config.icon;

    useEffect(() => {
        // Animate in
        const showTimer = setTimeout(() => setVisible(true), 10);
        // Auto-dismiss
        const hideTimer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 400);
        }, duration);
        return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
    }, [duration, onClose]);

    return (
        <div style={{
            position: 'fixed', top: '88px', right: '1.5rem',
            zIndex: 9999, maxWidth: '380px', width: 'calc(100% - 3rem)',
            background: config.bg,
            border: `1.5px solid ${config.border}`,
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            transform: visible ? 'translateY(0)' : 'translateY(-20px)',
            opacity: visible ? 1 : 0,
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}>
            <Icon size={20} color={config.text} style={{ marginTop: '1px', flexShrink: 0 }} />
            <p style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600, color: config.text, margin: 0, lineHeight: 1.4 }}>
                {message}
            </p>
            <button
                onClick={() => { setVisible(false); setTimeout(onClose, 400); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: config.text, opacity: 0.6 }}
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
