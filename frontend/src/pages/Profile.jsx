/**
 * Profile Page — Shridhar Enterprise
 * ─────────────────────────────────────────────────────────────────────────────
 * Full user profile with:
 *   - Account info (name, phone, editable email with verification status)
 *   - Saved addresses (view, add, delete)
 *   - Order history (full list)
 *   - Logout button
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    User, Phone, Mail, MapPin, Package, LogOut,
    CheckCircle, XCircle, Edit3, Save, X, Plus, Trash2,
    ChevronRight, Clock, ShieldCheck, ChevronLeft
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import AddAddressModal from '../components/AddAddressModal';

/* ─── Status Badge ──────────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
    const map = {
        pending: { bg: '#fef9c3', color: '#92400e', label: '⏳ Pending' },
        confirmed: { bg: '#dcfce7', color: '#166534', label: '✅ Confirmed' },
        processing: { bg: '#dbeafe', color: '#1e40af', label: '🔧 Processing' },
        shipped: { bg: '#e0e7ff', color: '#3730a3', label: '🚚 Shipped' },
        delivered: { bg: '#dcfce7', color: '#166534', label: '📦 Delivered' },
        cancelled: { bg: '#fee2e2', color: '#991b1b', label: '❌ Cancelled' },
    };
    const s = map[status] || { bg: '#f3f4f6', color: '#374151', label: status };
    return (
        <span style={{
            background: s.bg, color: s.color,
            padding: '0.25rem 0.75rem', borderRadius: '999px',
            fontSize: '0.78rem', fontWeight: 700
        }}>{s.label}</span>
    );
};

/* ─── Section Header ────────────────────────────────────────────────────────── */
const SectionHeader = ({ icon: Icon, title }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '2px solid #f3f4f6' }}>
        <Icon size={20} color="var(--primary)" />
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{title}</h2>
    </div>
);

/* ─── Main Component ──────────────────────────────────────────────────────────*/
const Profile = () => {
    const { user, setAuth, logout } = useAuthStore();
    const navigate = useNavigate();

    // Tab state
    const [tab, setTab] = useState('account'); // 'account' | 'orders' | 'addresses'

    // Account info state
    const [email, setEmail] = useState(user?.email || '');
    const [editingEmail, setEditingEmail] = useState(false);
    const [emailSaving, setEmailSaving] = useState(false);
    const [emailMsg, setEmailMsg] = useState('');
    const [resendSending, setResendSending] = useState(false);
    const [resendMsg, setResendMsg] = useState('');

    const startEditingEmail = () => {
        setEditingEmail(true);
        setEmailMsg('');
        setResendMsg('');
    };

    // Orders state
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    // Addresses state
    const [addresses, setAddresses] = useState([]);
    const [addrsLoading, setAddrsLoading] = useState(false);
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [toast, setToast] = useState(null);

    // Auto-clear toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Load orders
    const fetchOrders = useCallback(async () => {
        setOrdersLoading(true);
        try {
            const res = await api.get('/orders/');
            setOrders(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch { }
        finally { setOrdersLoading(false); }
    }, []);

    // Load addresses
    const fetchAddresses = useCallback(async () => {
        setAddrsLoading(true);
        try {
            const res = await api.get('/auth/addresses/');
            setAddresses(Array.isArray(res.data) ? res.data : (res.data.results || []));
        } catch { }
        finally { setAddrsLoading(false); }
    }, []);

    // Fetch latest profile data, addresses, and orders on mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/auth/profile/');
                setAuth(res.data, null); // Update user in store
            } catch (err) {
                console.error("Failed to fetch latest profile data:", err);
            }
        };
        fetchProfile();
        // Also fetch addresses and orders on initial load
        fetchAddresses();
        fetchOrders();
    }, [fetchAddresses, fetchOrders, setAuth]); // Dependencies for initial fetch

    // Fetch orders/addresses when tab changes (if not already loaded on mount)
    useEffect(() => {
        if (tab === 'orders') fetchOrders();
        if (tab === 'addresses') fetchAddresses();
    }, [tab, fetchOrders, fetchAddresses]);

    // Save email
    const handleSaveEmail = async () => {
        if (!email.trim()) return;
        setEmailSaving(true); setEmailMsg('');
        try {
            const res = await api.patch('/auth/profile/', { email: email.trim().toLowerCase() });
            setAuth(res.data, null); // Update user in store without clearing tokens
            setEditingEmail(false);
            setEmailMsg('Email saved. A verification link has been sent to your inbox.');
        } catch (err) {
            setEmailMsg(err.response?.data?.email?.[0] || 'Failed to save email.');
        } finally { setEmailSaving(false); }
    };

    // Resend verification email
    const handleResendVerification = async () => {
        setResendSending(true); setResendMsg('');
        try {
            const res = await api.post('/auth/resend-verification/');
            setResendMsg(res.data.message);
            // If already verified, update store
            if (res.data.message.toLowerCase().includes('already verified')) {
                const profileRes = await api.get('/auth/profile/');
                setAuth(profileRes.data, null);
            }
        } catch (err) {
            setResendMsg(err.response?.data?.message || 'Failed to send email.');
            if (err.response?.data?.message?.toLowerCase().includes('already verified')) {
                const profileRes = await api.get('/auth/profile/');
                setAuth(profileRes.data, null);
            }
        } finally { setResendSending(false); }
    };

    // Delete address
    const handleDeleteAddress = async (id, e) => {
        if (e) e.stopPropagation();
        if (!confirm('Delete this address?')) return;
        try {
            await api.delete(`/auth/addresses/${id}/`);
            setAddresses(prev => prev.filter(a => a.id !== id));
        } catch { }
    };

    // Set active address
    const handleSetActiveAddress = async (id) => {
        try {
            await api.patch(`/auth/addresses/${id}/`, { is_default: true });
            setAddresses(prev => prev.map(a => ({
                ...a,
                is_default: a.id === id
            })));
        } catch (err) {
            console.error('Failed to set active address', err);
        }
    };

    // Logout
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    const TABS = [
        { id: 'account', label: 'Account Info', icon: User },
        { id: 'addresses', label: 'My Addresses', icon: MapPin },
        { id: 'orders', label: 'My Orders', icon: Package },
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa', padding: '2rem 1rem' }}>
            <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', paddingTop: '1rem' }}>

                {/* ── Profile Header ───────────────────────────────────────── */}
                <div style={{
                    background: 'white', borderRadius: '20px', padding: '2.5rem 2rem 2rem',
                    marginBottom: '1.5rem', boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                    display: 'flex', alignItems: 'center', gap: '1.5rem',
                    flexWrap: 'wrap', position: 'relative'
                }}>
                    <Link to="/" style={{
                        position: 'absolute', top: '1rem', right: '1.2rem',
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        background: '#111', padding: '0.6rem 0.95rem', borderRadius: '10px',
                        color: 'white', fontWeight: 800, fontSize: '0.85rem',
                        textDecoration: 'none', border: '1.5px solid #000',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}>
                        <ChevronLeft size={16} /> <span className="hidden-mobile">Back</span>
                    </Link>
                    {/* Avatar */}
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: 'var(--primary)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', fontWeight: 900, flexShrink: 0
                    }}>
                        {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{user.full_name || 'User'}</h1>
                        <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.2rem' }}>{user.phone}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            {user.email_verified ? (
                                <span style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <ShieldCheck size={13} /> Email Verified
                                </span>
                            ) : user.email ? (
                                <span style={{ background: '#fef9c3', color: '#92400e', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <XCircle size={13} /> Email Not Verified
                                </span>
                            ) : null}
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.6rem 1.2rem', borderRadius: '10px',
                            border: '1.5px solid #fee2e2', color: 'var(--primary)',
                            fontWeight: 700, background: 'white', cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>

                {/* ── Tabs ─────────────────────────────────────────────────── */}
                <div style={{
                    display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap'
                }}>
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.65rem 1.25rem', borderRadius: '12px',
                                fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                                border: 'none', transition: 'all 0.2s',
                                background: tab === id ? 'var(--primary)' : 'white',
                                color: tab === id ? 'white' : '#555',
                                boxShadow: tab === id ? '0 4px 12px rgba(211,47,47,0.25)' : '0 2px 8px rgba(0,0,0,0.06)',
                            }}
                        >
                            <Icon size={16} /> {label}
                        </button>
                    ))}
                </div>

                {/* ── ACCOUNT INFO TAB ──────────────────────────────────────── */}
                {tab === 'account' && (
                    <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                        <SectionHeader icon={User} title="Account Information" />

                        {/* Name */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#666', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
                                <User size={14} /> Full Name
                            </label>
                            <div style={{ padding: '0.875rem 1rem', background: '#f9fafb', borderRadius: '10px', fontSize: '1rem', fontWeight: 600 }}>
                                {user.full_name}
                            </div>
                        </div>

                        {/* Phone */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#666', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
                                <Phone size={14} /> Mobile Number
                            </label>
                            <div style={{ padding: '0.875rem 1rem', background: '#f9fafb', borderRadius: '10px', fontSize: '1rem', fontWeight: 600 }}>
                                {user.phone}
                            </div>
                        </div>

                        {/* Email */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#666', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
                                <Mail size={14} /> Email Address
                                {!editingEmail && (
                                    <button
                                        onClick={startEditingEmail}
                                        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 700 }}
                                    >
                                        <Edit3 size={13} /> Edit
                                    </button>
                                )}
                            </label>

                            {editingEmail ? (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="email" value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        style={{ flex: 1, padding: '0.875rem 1rem', borderRadius: '10px', border: '1.5px solid #e5e7eb', outline: 'none', fontSize: '1rem' }}
                                    />
                                    <button onClick={handleSaveEmail} disabled={emailSaving} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', padding: '0 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700, fontSize: '0.85rem' }}>
                                        <Save size={14} /> {emailSaving ? '...' : 'Save'}
                                    </button>
                                    <button onClick={() => { setEditingEmail(false); setEmail(user.email || ''); }} style={{ background: '#f3f4f6', border: 'none', borderRadius: '10px', padding: '0 0.75rem', cursor: 'pointer' }}>
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div style={{ padding: '0.875rem 1rem', background: '#f9fafb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '1rem', fontWeight: 600 }}>{user.email || <em style={{ color: '#aaa' }}>Not added yet</em>}</span>
                                    {user.email && (
                                        user.email_verified
                                            ? <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}><CheckCircle size={14} /> Verified</span>
                                            : <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}><XCircle size={14} /> Not verified</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Verify Now button */}
                        {user.email && !user.email_verified && (
                            <div style={{ marginBottom: '1rem' }}>
                                <button
                                    onClick={handleResendVerification}
                                    disabled={resendSending}
                                    style={{
                                        padding: '0.65rem 1.25rem', background: '#fffbeb',
                                        border: '1.5px solid #fcd34d', color: '#92400e',
                                        borderRadius: '10px', fontWeight: 700, cursor: 'pointer',
                                        fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem'
                                    }}
                                >
                                    <Mail size={15} /> {resendSending ? 'Sending...' : 'Verify Now – Resend Activation Email'}
                                </button>
                                {resendMsg && <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#16a34a', fontWeight: 600 }}>{resendMsg}</p>}
                            </div>
                        )}

                        {emailMsg && (
                            <p style={{ fontSize: '0.875rem', color: '#16a34a', fontWeight: 600, padding: '0.5rem', background: '#f0fdf4', borderRadius: '8px' }}>{emailMsg}</p>
                        )}
                    </div>
                )}

                {/* ── ADDRESSES TAB ─────────────────────────────────────────── */}
                {tab === 'addresses' && (
                    <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '2px solid #f3f4f6' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <MapPin size={20} color="var(--primary)" />
                                <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Saved Addresses</h2>
                            </div>
                            <button
                                onClick={() => setShowAddAddress(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                                <Plus size={15} /> Add Address
                            </button>
                        </div>

                        {addrsLoading ? (
                            <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>Loading...</p>
                        ) : addresses.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                                <MapPin size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                <p>No saved addresses yet.</p>
                                <button onClick={() => setShowAddAddress(true)} style={{ marginTop: '1rem', padding: '0.6rem 1.25rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                                    Add Your First Address
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {addresses.map(addr => {
                                    // Highlight if it's the current selected address in this session
                                    const isCurrent = addr.is_default; // Simplified: default is current unless changed
                                    return (
                                        <div
                                            key={addr.id}
                                            onClick={() => !isCurrent && handleSetActiveAddress(addr.id)}
                                            style={{
                                                border: isCurrent ? '2.5px solid var(--primary)' : '1.5px solid #e5e7eb',
                                                borderRadius: '14px',
                                                padding: '1.25rem',
                                                display: 'flex',
                                                gap: '1rem',
                                                alignItems: 'flex-start',
                                                background: isCurrent ? '#fff9f9' : 'white',
                                                boxShadow: isCurrent ? '0 4px 15px rgba(211,47,47,0.1)' : 'none',
                                                position: 'relative',
                                                cursor: isCurrent ? 'default' : 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div style={{ background: isCurrent ? 'var(--primary)' : '#f9fafb', borderRadius: '50%', padding: '0.5rem', flexShrink: 0 }}>
                                                <MapPin size={18} color={isCurrent ? 'white' : '#9ca3af'} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                    <span style={{ fontWeight: 800, color: isCurrent ? 'var(--primary)' : '#111' }}>{addr.label || 'Address'}</span>
                                                    {isCurrent && (
                                                        <span style={{
                                                            background: 'var(--primary)', color: 'white',
                                                            fontSize: '0.7rem', padding: '0.2rem 0.6rem',
                                                            borderRadius: '999px', fontWeight: 800,
                                                            display: 'flex', alignItems: 'center', gap: '0.2rem'
                                                        }}>
                                                            <CheckCircle size={10} /> Active Delivery Address
                                                        </span>
                                                    )}
                                                </div>
                                                <p style={{ fontSize: '0.9rem', color: isCurrent ? '#333' : '#555', lineHeight: 1.6, fontWeight: isCurrent ? 600 : 400 }}>
                                                    {addr.recipient_name} · {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} – {addr.pincode}
                                                </p>
                                            </div>
                                            {!isCurrent && (
                                                <button
                                                    onClick={(e) => handleDeleteAddress(addr.id, e)}
                                                    style={{ background: '#fef2f2', border: 'none', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', flexShrink: 0, zIndex: 10 }}
                                                >
                                                    <Trash2 size={15} color="var(--primary)" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── ORDERS TAB ────────────────────────────────────────────── */}
                {tab === 'orders' && (
                    <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                        <SectionHeader icon={Package} title="Order History" />

                        {ordersLoading ? (
                            <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>Loading orders...</p>
                        ) : orders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                                <Package size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                <p style={{ fontWeight: 600 }}>No orders yet</p>
                                <Link to="/" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.75rem 1.5rem', background: 'var(--primary)', color: 'white', borderRadius: '12px', fontWeight: 700, textDecoration: 'none' }}>
                                    Start Shopping →
                                </Link>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {orders.map(order => (
                                    <div key={order.id} style={{ border: '1.5px solid #f3f4f6', borderRadius: '16px', overflow: 'hidden' }}>
                                        {/* Order Header */}
                                        <div style={{ background: '#fafafa', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            <div>
                                                <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>Order #{order.order_number}</p>
                                                <p style={{ fontSize: '0.78rem', color: '#999', marginTop: '0.1rem' }}>
                                                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <StatusBadge status={order.status} />
                                        </div>
                                        {/* Items */}
                                        <div style={{ padding: '1rem 1.25rem' }}>
                                            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                                {order.items?.map(item => (
                                                    <div key={item.id} style={{ flexShrink: 0, textAlign: 'center' }}>
                                                        <img
                                                            src={item.product_image_url || 'https://placehold.co/56x56?text=📦'}
                                                            alt={item.product_name}
                                                            style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '10px', background: '#f5f5f5' }}
                                                            onError={e => { e.target.src = 'https://placehold.co/56x56/f5f5f5/999?text=📦'; }}
                                                        />
                                                        <p style={{ fontSize: '0.65rem', color: '#666', marginTop: '0.25rem', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name}</p>
                                                        <p style={{ fontSize: '0.7rem', fontWeight: 700 }}>×{item.quantity}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#888' }}>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''} · {order.payment_method?.toUpperCase()}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <span style={{ fontWeight: 800, fontSize: '1rem' }}>₹{parseFloat(order.total_amount).toFixed(0)}</span>
                                                    <Link to={`/orders/${order.id}`} style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>
                                                        View Details →
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showAddAddress && (
                <AddAddressModal
                    existingAddresses={addresses}
                    onClose={() => setShowAddAddress(false)}
                    onSuccess={(newAddr) => {
                        api.get('/auth/addresses/').then(res => setAddresses(res.data)).catch(console.error);
                        setShowAddAddress(false);
                        setToast({ message: 'Address saved successfully!', type: 'success' });
                    }}
                />
            )}

            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '2rem', right: '2rem',
                    background: toast.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white', padding: '1rem 2rem', borderRadius: '12px',
                    fontWeight: 700, boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    zIndex: 2000, animation: 'slideInRight 0.3s ease-out'
                }}>
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default Profile;
