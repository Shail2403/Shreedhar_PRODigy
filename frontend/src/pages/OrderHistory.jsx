/**
 * OrderHistory Page — Shridhar Enterprise
 * ─────────────────────────────────────────────────────────────────────────────
 * Dedicated page to view all past orders.
 * Shows order summary, status, and items for each order.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Clock, CheckCircle, XCircle, ShoppingBag, ChevronLeft } from 'lucide-react';
import api from '../api/axios';

const StatusBadge = ({ status }) => {
    const statusMap = {
        'pending': { color: '#f59e0b', bg: '#fef3c7', text: 'Pending' },
        'confirmed': { color: '#10b981', bg: '#d1fae5', text: 'Confirmed' },
        'processing': { color: '#3b82f6', bg: '#dbeafe', text: 'Processing' },
        'shipped': { color: '#8b5cf6', bg: '#ede9fe', text: 'Shipped' },
        'delivered': { color: '#059669', bg: '#ecfdf5', text: 'Delivered' },
        'cancelled': { color: '#ef4444', bg: '#fee2e2', text: 'Cancelled' },
    };
    const s = statusMap[status] || { color: '#6b7280', bg: '#f3f4f6', text: status };

    return (
        <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            background: s.bg,
            color: s.color,
            textTransform: 'capitalize',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem'
        }}>
            {status === 'delivered' ? <CheckCircle size={12} /> :
                status === 'cancelled' ? <XCircle size={12} /> : <Clock size={12} />}
            {s.text}
        </span>
    );
};

const OrderHistory = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await api.get('/orders/');
                // Backend returns results in a "results" key if paginated, or direct list
                setOrders(response.data.results || response.data);
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    if (loading) {
        return (
            <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                <div className="animate-pulse" style={{ color: 'var(--primary)', fontWeight: 700 }}>Loading your orders...</div>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#666', fontWeight: 600, textDecoration: 'none', marginBottom: '1.5rem' }}>
                <ChevronLeft size={18} /> Back to Profile
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <Package size={28} color="var(--primary)" />
                <h1 style={{ fontSize: '1.75rem', fontWeight: 900 }}>My Orders</h1>
            </div>

            {orders.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    background: 'white',
                    borderRadius: '24px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }}>
                    <ShoppingBag size={64} color="#e5e7eb" style={{ marginBottom: '1.5rem' }} />
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No orders found</h2>
                    <p style={{ color: '#666', marginBottom: '1.5rem' }}>Looks like you haven't placed any orders yet.</p>
                    <Link to="/" style={{
                        display: 'inline-block',
                        padding: '0.75rem 2rem',
                        background: 'var(--primary)',
                        color: 'white',
                        borderRadius: '12px',
                        fontWeight: 700,
                        textDecoration: 'none'
                    }}>
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {orders.map(order => (
                        <div key={order.id} style={{
                            background: 'white',
                            borderRadius: '20px',
                            padding: '1.5rem',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                            border: '1px solid #f3f4f6'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '1rem',
                                paddingBottom: '1rem',
                                borderBottom: '1px solid #f3f4f6'
                            }}>
                                <div>
                                    <p style={{ fontSize: '0.8rem', color: '#888', fontWeight: 600, marginBottom: '0.2rem' }}>
                                        ORDER #{order.order_number}
                                    </p>
                                    <p style={{ fontSize: '0.9rem', color: '#444' }}>
                                        Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <StatusBadge status={order.status} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', marginBottom: '1rem', paddingBottom: '0.5rem' }}>
                                {order.items.map(item => (
                                    <div key={item.id} style={{ flexShrink: 0, textAlign: 'center' }}>
                                        <div style={{
                                            position: 'relative',
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '12px',
                                            background: '#f9fafb',
                                            overflow: 'hidden'
                                        }}>
                                            <img
                                                src={item.product_image_url}
                                                alt={item.product_name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                right: 0,
                                                background: 'rgba(0,0,0,0.7)',
                                                color: 'white',
                                                fontSize: '0.65rem',
                                                padding: '0.1rem 0.3rem',
                                                borderTopLeftRadius: '6px'
                                            }}>
                                                x{item.quantity}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingTop: '1rem',
                                borderTop: '1px solid #f3f4f6'
                            }}>
                                <div>
                                    <span style={{ fontSize: '0.85rem', color: '#888' }}>Total Amount</span>
                                    <p style={{ fontSize: '1.25rem', fontWeight: 900 }}>₹{parseFloat(order.total_amount).toFixed(0)}</p>
                                </div>
                                <Link to={`/orders/${order.id}`} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    color: 'var(--primary)',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    textDecoration: 'none'
                                }}>
                                    View Details <ChevronRight size={16} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderHistory;
