/**
 * Checkout Page — Shridhar Enterprise
 * ─────────────────────────────────────────────────────────────────────────────
 * Multi-step checkout:
 *   Step 1: Review Order (items + billing summary)
 *   Step 2: Select Delivery Address (or add new)
 *   Step 3: Payment (PayPal or Cash on Delivery)
 *
 * Delivery charge: ₹10/km from shop. Free if < 1km.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import {
    MapPin, Plus, CheckCircle, CreditCard, ShoppingBag,
    Truck, ChevronRight, ChevronLeft, Package, ArrowRight
} from 'lucide-react';
import AddAddressModal from '../components/AddAddressModal';

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AQBH1f4jL1K6_fKo0LzYrShqc4Bll13L4JcS_Um39rXtIBM0SLUSVj7vU_4l2ECmp87uzOlfMQnrtqzu';

const Checkout = () => {
    const { cart, deliveryCharge, calculateDelivery, fetchCart, distance, loading: cartLoading } = useCartStore();
    const { user } = useAuthStore();
    const navigate = useNavigate();

    // Steps: 1 = Review Order, 2 = Address, 3 = Payment
    const [step, setStep] = useState(1);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [notes, setNotes] = useState('');
    const [addrLoading, setAddrLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
    const [orderError, setOrderError] = useState('');

    // Redirect if cart is empty (but only if we are on step 1 and not currently placing an order)
    useEffect(() => {
        if (!cartLoading && step === 1 && !placingOrder && (!cart || !cart.items || cart.items.length === 0)) {
            navigate('/');
        }
    }, [cart, cartLoading, navigate, step, placingOrder]);

    // Load addresses
    const fetchAddresses = async () => {
        setAddrLoading(true);
        try {
            const res = await api.get('/auth/addresses/');
            const list = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setAddresses(list);
            const def = list.find(a => a.is_default) || list[0];
            if (def) {
                setSelectedAddress(def);
                if (def.latitude && def.longitude) {
                    await calculateDelivery(def.latitude, def.longitude);
                }
            }
        } catch (e) {
            console.error('Failed to load addresses:', e);
        } finally {
            setAddrLoading(false);
        }
    };

    useEffect(() => { fetchAddresses(); }, []);

    // Scroll to top on step change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    const handleAddressSelect = async (addr) => {
        setSelectedAddress(addr);
        if (addr.latitude && addr.longitude) {
            await calculateDelivery(addr.latitude, addr.longitude);
        }
    };

    // Place Order
    const handlePlaceOrder = async (paypalOrderId = null) => {
        if (!selectedAddress) {
            setOrderError('Please select a delivery address.');
            return;
        }
        setOrderError('');
        setPlacingOrder(true);
        try {
            const payload = {
                address_id: selectedAddress.id,
                payment_method: paypalOrderId ? 'paypal' : paymentMethod,
                customer_notes: notes,
            };
            const response = await api.post('/orders/create/', payload);
            const order = response.data.order;

            if (paypalOrderId) {
                await api.post('/orders/paypal/capture/', {
                    order_id: order.id,
                    paypal_order_id: paypalOrderId,
                });
            }

            await fetchCart();
            navigate(`/order-success/${order.id}`);
        } catch (error) {
            console.error('Order failed:', error);
            setOrderError(error.response?.data?.error || 'Order placement failed. Please try again.');
            setPlacingOrder(false);
        }
    };

    if (cartLoading && (!cart || !cart.items || cart.items.length === 0)) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fb' }}>
                <div className="loader"></div>
            </div>
        );
    }

    if (!cart || !cart.items || cart.items.length === 0) return null;

    const billing = cart.billing || {};
    const items = cart.items || [];
    const currentDeliveryCharge = parseFloat(deliveryCharge || billing.delivery_charge || 0);
    const currentDistance = parseFloat(distance || 0);
    const subtotal = parseFloat(billing.subtotal || 0);
    const gst = parseFloat(billing.cgst_amount || 0) + parseFloat(billing.sgst_amount || 0);
    const totalWithDelivery = subtotal + gst + currentDeliveryCharge;

    const steps = [
        { num: 1, label: 'Review Order' },
        { num: 2, label: 'Delivery Address' },
        { num: 3, label: 'Payment' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: '2rem 1rem' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <Link to="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#666', fontWeight: 600, textDecoration: 'none', marginBottom: '1.5rem' }}>
                    <ChevronLeft size={18} /> Back to Cart
                </Link>

                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>Checkout</h1>
                    {/* Step indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                        {steps.map((s, i) => (
                            <React.Fragment key={s.num}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%', fontWeight: 800,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: step >= s.num ? 'var(--primary)' : '#e5e7eb',
                                        color: step >= s.num ? 'white' : '#999', fontSize: '0.85rem',
                                        transition: 'all 0.3s'
                                    }}>{step > s.num ? '✓' : s.num}</div>
                                    <span style={{ fontWeight: step === s.num ? 800 : 500, color: step >= s.num ? 'var(--primary)' : '#aaa', fontSize: '0.9rem' }}>{s.label}</span>
                                </div>
                                {i < steps.length - 1 && <ArrowRight size={16} color="#ccc" />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="checkout-grid">

                    {/* ── Step 1: Review Order ─────────────────────────────── */}
                    {step === 1 && (
                        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <ShoppingBag size={22} color="var(--primary)" />
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Review Your Order</h2>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                {items.map(item => (
                                    <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem', background: '#f9fafb', borderRadius: '12px' }}>
                                        <img
                                            src={item.product?.primary_image || 'https://placehold.co/64x64/f5f5f5/999?text=+'}
                                            alt={item.product?.name}
                                            style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '10px', background: '#f0f0f0', flexShrink: 0 }}
                                            onError={e => { e.target.src = 'https://placehold.co/64x64/f5f5f5/999?text=+'; }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.product?.name}</p>
                                            <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.15rem' }}>{item.product?.weight} · {item.product?.brand_name}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontWeight: 800, color: '#111' }}>₹{item.line_total?.toFixed(0) || (parseFloat(item.product?.selling_price || 0) * item.quantity).toFixed(0)}</p>
                                            <p style={{ fontSize: '0.8rem', color: '#888' }}>×{item.quantity}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.4rem' }}>
                                    Delivery Instructions (Optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="E.g. Ring the bell, leave at gate, call before delivery..."
                                    style={{ width: '100%', minHeight: '80px', padding: '0.875rem', borderRadius: '12px', border: '1.5px solid #e5e7eb', outline: 'none', resize: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }}
                                />
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                style={{ marginTop: '1.5rem', width: '100%', background: 'var(--primary)', color: 'white', padding: '1rem', borderRadius: '12px', fontWeight: 800, fontSize: '1rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                Select Delivery Address <ChevronRight size={20} />
                            </button>
                        </div>
                    )}

                    {/* ── Step 2: Delivery Address ──────────────────────────── */}
                    {step === 2 && (
                        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <MapPin size={22} color="var(--primary)" />
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Delivery Address</h2>
                            </div>

                            {addrLoading ? (
                                <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>Loading addresses...</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {addresses.length === 0 && (
                                        <div style={{ padding: '1.5rem', background: '#fff8f8', borderRadius: '12px', color: '#666', textAlign: 'center' }}>
                                            <p style={{ marginBottom: '0.5rem' }}>No saved addresses yet.</p>
                                            <p style={{ fontSize: '0.85rem' }}>Add your delivery address to continue.</p>
                                        </div>
                                    )}
                                    {addresses.map(addr => (
                                        <div
                                            key={addr.id}
                                            onClick={() => handleAddressSelect(addr)}
                                            style={{
                                                padding: '1.25rem', borderRadius: '14px', cursor: 'pointer',
                                                border: selectedAddress?.id === addr.id ? '2px solid var(--primary)' : '1.5px solid #e5e7eb',
                                                background: selectedAddress?.id === addr.id ? '#fff8f8' : 'white',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: selectedAddress?.id === addr.id ? 'var(--primary)' : '#111' }}>{addr.label}</span>
                                                        {addr.is_default && <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.65rem', padding: '0.1rem 0.5rem', borderRadius: '999px', fontWeight: 700 }}>Default</span>}
                                                    </div>
                                                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#333' }}>{addr.recipient_name}</p>
                                                    <p style={{ fontSize: '0.82rem', color: '#666', marginTop: '0.2rem', lineHeight: 1.5 }}>
                                                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />{addr.city}, {addr.state} – {addr.pincode}
                                                    </p>
                                                </div>
                                                {selectedAddress?.id === addr.id && <CheckCircle size={20} color="var(--primary)" />}
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        onClick={() => setIsAddAddressOpen(true)}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.1rem', borderRadius: '14px', border: '2px dashed #ccc', background: 'transparent', cursor: 'pointer', fontWeight: 700, color: '#666' }}
                                    >
                                        <Plus size={18} /> Add New Address
                                    </button>
                                </div>
                            )}

                            {/* Delivery charge info */}
                            {selectedAddress && (
                                <div style={{ marginTop: '1.25rem', padding: '0.875rem 1rem', background: '#f0fdf4', borderRadius: '10px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <Truck size={16} color="#16a34a" />
                                    <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
                                        {currentDistance > 0
                                            ? `${currentDistance.toFixed(1)} km away → ₹${currentDeliveryCharge.toFixed(0)} delivery charge`
                                            : 'Calculating delivery charge...'}
                                    </span>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button onClick={() => setStep(1)} style={{ flex: 1, background: '#f3f4f6', color: '#333', padding: '0.875rem', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                    <ChevronLeft size={18} /> Back
                                </button>
                                <button
                                    onClick={() => { if (selectedAddress) setStep(3); else alert('Please select an address first.'); }}
                                    style={{ flex: 2, background: selectedAddress ? 'var(--primary)' : '#e5e7eb', color: selectedAddress ? 'white' : '#aaa', padding: '0.875rem', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: selectedAddress ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                                >
                                    Choose Payment <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Payment ─────────────────────────────────── */}
                    {step === 3 && (
                        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <CreditCard size={22} color="var(--primary)" />
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Choose Payment Method</h2>
                            </div>

                            {/* Selected address summary */}
                            {selectedAddress && (
                                <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                    <MapPin size={16} color="var(--primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                                    <div>
                                        <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedAddress.recipient_name} — {selectedAddress.label}</p>
                                        <p style={{ fontSize: '0.82rem', color: '#666', marginTop: '0.15rem' }}>{selectedAddress.line1}, {selectedAddress.city} – {selectedAddress.pincode}</p>
                                    </div>
                                    <button onClick={() => setStep(2)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>Edit</button>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                {/* COD */}
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem',
                                    borderRadius: '14px', cursor: 'pointer',
                                    border: paymentMethod === 'cod' ? '2px solid var(--primary)' : '1.5px solid #e5e7eb',
                                    background: paymentMethod === 'cod' ? '#fff8f8' : 'white',
                                    transition: 'all 0.2s'
                                }}>
                                    <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                                    <Truck size={22} color={paymentMethod === 'cod' ? 'var(--primary)' : '#666'} />
                                    <div>
                                        <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>Cash on Delivery</p>
                                        <p style={{ fontSize: '0.8rem', color: '#888' }}>Pay in cash when your order arrives</p>
                                    </div>
                                </label>

                                {/* PayPal */}
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem',
                                    borderRadius: '14px', cursor: 'pointer',
                                    border: paymentMethod === 'paypal' ? '2px solid var(--primary)' : '1.5px solid #e5e7eb',
                                    background: paymentMethod === 'paypal' ? '#fff8f8' : 'white',
                                    transition: 'all 0.2s'
                                }}>
                                    <input type="radio" checked={paymentMethod === 'paypal'} onChange={() => setPaymentMethod('paypal')} />
                                    <CreditCard size={22} color={paymentMethod === 'paypal' ? 'var(--primary)' : '#666'} />
                                    <div>
                                        <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>PayPal / Card</p>
                                        <p style={{ fontSize: '0.8rem', color: '#888' }}>Secure online payment via PayPal</p>
                                    </div>
                                </label>
                            </div>

                            {/* Error */}
                            {orderError && (
                                <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
                                    ⚠️ {orderError}
                                </div>
                            )}

                            {/* COD button */}
                            {paymentMethod === 'cod' && (
                                <button
                                    onClick={() => handlePlaceOrder()}
                                    disabled={placingOrder}
                                    style={{
                                        width: '100%', background: placingOrder ? '#e5e7eb' : 'var(--primary)',
                                        color: placingOrder ? '#999' : 'white', padding: '1.1rem',
                                        borderRadius: '14px', fontWeight: 800, fontSize: '1.05rem',
                                        border: 'none', cursor: placingOrder ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {placingOrder ? '⏳ Placing Order...' : '🛒 Place Order (Cash on Delivery)'}
                                </button>
                            )}

                            {/* PayPal */}
                            {paymentMethod === 'paypal' && (
                                <PayPalScriptProvider options={{ 'client-id': PAYPAL_CLIENT_ID, currency: 'USD' }}>
                                    <PayPalButtons
                                        style={{ layout: 'vertical', shape: 'rect', label: 'pay' }}
                                        createOrder={(data, actions) => {
                                            const amountUSD = Math.max(0.01, (totalWithDelivery / 83)).toFixed(2);
                                            return actions.order.create({
                                                purchase_units: [{
                                                    amount: { value: amountUSD, currency_code: 'USD' }
                                                }]
                                            });
                                        }}
                                        onApprove={async (data, actions) => {
                                            const orderData = await actions.order.capture();
                                            const transaction = orderData.purchase_units?.[0]?.payments?.captures?.[0];
                                            const paypalOrderId = transaction?.id || orderData.id;
                                            await handlePlaceOrder(paypalOrderId);
                                        }}
                                        onError={(err) => {
                                            console.error('PayPal error:', err);
                                            setOrderError('PayPal payment failed. Please try again or use Cash on Delivery.');
                                        }}
                                    />
                                </PayPalScriptProvider>
                            )}

                            <button onClick={() => setStep(2)} style={{ width: '100%', marginTop: '0.75rem', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                                <ChevronLeft size={14} /> Change Address
                            </button>
                        </div>
                    )}

                    {/* ── Order Summary Sidebar ─────────────────────────────── */}
                    <div className="glass checkout-sidebar checkout-sidebar-sticky" style={{
                        padding: '2rem',
                        borderRadius: 'var(--radius-lg)'
                    }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Package size={18} color="var(--primary)" /> Order Summary
                        </h3>

                        {/* Items preview */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                            {items.slice(0, 3).map(item => (
                                <div key={item.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <img
                                        src={item.product?.primary_image || 'https://placehold.co/40x40/f5f5f5/999?text=+'}
                                        alt={item.product?.name}
                                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0, background: '#f0f0f0' }}
                                        onError={e => { e.target.src = 'https://placehold.co/40x40/f5f5f5/999?text=+'; }}
                                    />
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product?.name}</p>
                                        <p style={{ fontSize: '0.75rem', color: '#888' }}>×{item.quantity}</p>
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>₹{item.line_total?.toFixed(0) || (parseFloat(item.product?.selling_price || 0) * item.quantity).toFixed(0)}</span>
                                </div>
                            ))}
                            {items.length > 3 && <p style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '0.25rem' }}>+{items.length - 3} more items</p>}
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '0.75rem 0' }} />

                        {/* Billing */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                                <span>Subtotal ({items.length} items)</span>
                                <span>₹{subtotal.toFixed(0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                                <span>GST (CGST + SGST)</span>
                                <span>₹{gst.toFixed(0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                                <span>Delivery Charge</span>
                                <span style={{ color: currentDeliveryCharge === 0 && selectedAddress ? '#16a34a' : 'inherit', fontWeight: 600 }}>
                                    {selectedAddress
                                        ? (currentDeliveryCharge === 0 ? '🎉 FREE' : `₹${currentDeliveryCharge.toFixed(0)}`)
                                        : '–'}
                                </span>
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '0.25rem 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.2rem', color: 'var(--primary)', paddingTop: '0.5rem' }}>
                                <span>Total Amount</span>
                                <span>₹{totalWithDelivery.toFixed(0)}</span>
                            </div>
                        </div>

                        {step > 1 && selectedAddress && (
                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '10px', fontSize: '0.82rem', color: '#666' }}>
                                <p style={{ fontWeight: 700, color: '#333', marginBottom: '0.2rem' }}>📦 Delivering to:</p>
                                <p>{selectedAddress.line1}, {selectedAddress.city}</p>
                                {currentDistance > 0 && <p style={{ marginTop: '0.2rem', color: 'var(--primary)', fontWeight: 600 }}>{currentDistance.toFixed(1)} km · ₹{currentDeliveryCharge.toFixed(0)} delivery</p>}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Add Address Modal */}
            {isAddAddressOpen && (
                <AddAddressModal
                    existingAddresses={addresses}
                    onClose={() => setIsAddAddressOpen(false)}
                    onSuccess={async (newAddr) => {
                        setIsAddAddressOpen(false);
                        await fetchAddresses();
                        if (newAddr) handleAddressSelect(newAddr);
                    }}
                />
            )}
        </div>
    );
};

export default Checkout;
