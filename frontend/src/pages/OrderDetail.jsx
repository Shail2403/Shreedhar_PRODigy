import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, MapPin, Truck, CreditCard, Clock, CheckCircle, XCircle, ChevronLeft, Phone } from 'lucide-react';
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
            padding: '0.4rem 0.85rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 800,
            background: s.bg, color: s.color, textTransform: 'capitalize',
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
        }}>
            {status === 'delivered' ? <CheckCircle size={14} /> :
                status === 'cancelled' ? <XCircle size={14} /> : <Clock size={14} />}
            {s.text}
        </span>
    );
};

const OrderDetail = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await api.get(`/orders/${id}/`);
                setOrder(response.data);
            } catch (error) {
                console.error('Failed to fetch order details:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    if (loading) {
        return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--primary)', fontWeight: 700 }}>Loading order details...</div>;
    }

    if (!order) {
        return (
            <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Order Not Found</h2>
                <Link to="/orders" style={{ color: 'var(--primary)', fontWeight: 700, marginTop: '1rem', display: 'inline-block' }}>Return to Orders</Link>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa', padding: '2rem 1rem' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <Link to="/orders" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#666', fontWeight: 600, textDecoration: 'none', marginBottom: '1.5rem' }}>
                    <ChevronLeft size={18} /> Back to Orders
                </Link>

                {/* Header */}
                <div className="glass" style={{ padding: '2rem', borderRadius: '20px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <p style={{ color: '#888', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.2rem' }}>ORDER #{order.order_number}</p>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111', marginBottom: '0.5rem' }}>Order Details</h1>
                        <p style={{ color: '#555', fontSize: '0.9rem' }}>
                            Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    </div>
                    <StatusBadge status={order.status} />
                </div>

                {/* Items */}
                <div className="glass" style={{ padding: '2rem', borderRadius: '20px', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Package size={20} color="var(--primary)" /> Items ({order.items.length})
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {order.items.map(item => (
                            <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid #f3f4f6' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: '#f9fafb', overflow: 'hidden', flexShrink: 0 }}>
                                    <img src={item.product_image_url} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111', marginBottom: '0.2rem' }}>{item.product_name}</h3>
                                    <p style={{ fontSize: '0.85rem', color: '#666' }}>Quantity: {item.quantity}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '1.05rem', fontWeight: 800 }}>₹{parseFloat(item.unit_price * item.quantity).toFixed(2)}</p>
                                    <p style={{ fontSize: '0.8rem', color: '#888' }}>₹{parseFloat(item.unit_price).toFixed(2)} each</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '300px', marginLeft: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.95rem' }}>
                            <span>Subtotal</span>
                            <span style={{ fontWeight: 600 }}>₹{parseFloat(order.subtotal).toFixed(2)}</span>
                        </div>
                        {(order.cgst_amount || order.sgst_amount) && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.95rem' }}>
                                <span>GST (CGST + SGST)</span>
                                <span style={{ fontWeight: 600 }}>₹{(parseFloat(order.cgst_amount) + parseFloat(order.sgst_amount)).toFixed(2)}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.95rem' }}>
                            <span>Delivery Fees</span>
                            <span style={{ fontWeight: 600 }}>₹{parseFloat(order.delivery_charge).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#111', fontSize: '1.25rem', fontWeight: 900, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '2px solid #f3f4f6' }}>
                            <span>Total</span>
                            <span style={{ color: 'var(--primary)' }}>₹{parseFloat(order.total_amount).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Info Blocks */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    <div className="glass" style={{ padding: '2rem', borderRadius: '20px' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <MapPin size={18} color="var(--primary)" /> Delivery Address
                        </h2>
                        <div style={{ background: '#f9fafb', padding: '1.25rem', borderRadius: '12px' }}>
                            <p style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.4rem', color: '#111' }}>
                                {order.address_snapshot?.recipient_name || 'Customer'}
                            </p>
                            <p style={{ color: '#555', fontSize: '0.95rem', lineHeight: 1.6 }}>
                                {order.address_snapshot?.line1}<br />
                                {order.address_snapshot?.line2 && <>{order.address_snapshot.line2}<br /></>}
                                {order.address_snapshot?.city}, {order.address_snapshot?.state} - {order.address_snapshot?.pincode}
                            </p>
                            {order.address_snapshot?.phone && (
                                <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Phone size={14} /> {order.address_snapshot.phone}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="glass" style={{ padding: '2rem', borderRadius: '20px' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <CreditCard size={18} color="var(--primary)" /> Payment Details
                        </h2>
                        <div style={{ background: '#f9fafb', padding: '1.25rem', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{ color: '#666', fontSize: '0.9rem' }}>Method</span>
                                <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.9rem' }}>{order.payment_method}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{ color: '#666', fontSize: '0.9rem' }}>Status</span>
                                <span style={{ fontWeight: 800, color: order.payment_status === 'completed' ? '#16a34a' : '#d97706', textTransform: 'capitalize', fontSize: '0.9rem' }}>{order.payment_status}</span>
                            </div>
                            {order.paypal_order_id && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#666', fontSize: '0.9rem' }}>Transaction ID</span>
                                    <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#111' }}>{order.paypal_order_id}</span>
                                </div>
                            )}
                        </div>

                        {order.notes && (
                            <div style={{ marginTop: '1.5rem' }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.5rem', color: '#111' }}>Order Notes</h3>
                                <p style={{ background: '#fef3c7', padding: '1rem', borderRadius: '10px', fontSize: '0.85rem', color: '#92400e', fontStyle: 'italic', lineHeight: 1.5 }}>
                                    "{order.notes}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
