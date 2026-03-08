import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { CheckCircle, Package, ArrowRight, MapPin, Calendar } from 'lucide-react';

const OrderSuccess = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await api.get(`/orders/${id}/`);
                setOrder(response.data);
            } catch (err) {
                console.error('Order not found');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    if (loading) return <div className="container text-center" style={{ paddingTop: '100px' }}>Loading confirmation...</div>;

    return (
        <div className="order-success-page animate-fade">
            <div className="container" style={{ paddingTop: '4rem', maxWidth: '700px' }}>
                <div className="glass text-center" style={{ padding: '3rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
                    <div style={{ background: '#e8f5e9', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', margin: '0 auto 1.5rem auto' }}>
                        <CheckCircle size={48} color="var(--success)" style={{ margin: 'auto' }} />
                    </div>

                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Order Placed!</h1>
                    <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
                        Thank you for shopping with <strong>Shridhar Enterprise</strong>. Your order has been placed successfully.
                    </p>

                    <div style={{ background: '#f8f9fa', borderRadius: 'var(--radius-md)', padding: '1.5rem', textAlign: 'left', marginBottom: '2.5rem', wordBreak: 'break-word' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#444' }}>
                                <Package size={18} /> Order ID
                            </div>
                            <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>#{order?.order_number}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#444' }}>
                                <Calendar size={18} /> Date
                            </div>
                            <span style={{ fontWeight: 600 }}>{new Date(order?.created_at).toLocaleDateString()}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#444' }}>
                                <MapPin size={18} style={{ flexShrink: 0 }} /> Delivering To
                            </div>
                            <span style={{ textAlign: 'right', fontWeight: 600, flex: 1, minWidth: '150px' }}>{order?.address_snapshot?.line1}, {order?.address_snapshot?.city}</span>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '1rem 0' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.15rem', fontWeight: 900, flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span>Amount Paid</span>
                            <span style={{ color: 'var(--primary)', fontSize: '1.3rem' }}>₹{order?.total_amount}</span>
                        </div>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                        We've sent a confirmation email to your registered email address with all the details.
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                        <Link to={`/orders/${order?.id || ''}`} style={{
                            background: 'var(--primary)', color: 'white', padding: '1rem 1.5rem',
                            borderRadius: '14px', fontWeight: 800, textDecoration: 'none',
                            textAlign: 'center', flex: '1 1 200px',
                            boxShadow: '0 8px 20px rgba(198,40,40,0.2)'
                        }}>
                            View Order Details
                        </Link>
                        <Link to="/" style={{
                            color: '#111', fontWeight: 800, padding: '1rem 1.5rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            border: '2px solid #eee', borderRadius: '14px', textDecoration: 'none',
                            flex: '1 1 200px'
                        }}>
                            Continue Shopping <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;
