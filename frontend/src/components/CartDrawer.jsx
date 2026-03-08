import React from 'react';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';

const CartDrawer = ({ onClose }) => {
    const { cart, updateItem, removeItem, loading } = useCartStore();
    const navigate = useNavigate();

    const handleCheckout = () => {
        onClose();
        navigate('/checkout');
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 2000,
            display: 'flex', justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease'
        }} onClick={onClose}>

            <div
                className="cart-drawer"
                style={{
                    width: '100%', maxWidth: '450px',
                    background: 'white', height: '100%',
                    display: 'flex', flexDirection: 'column',
                    animation: 'slideInRight 0.3s ease-out',
                    boxShadow: '-4px 0 24px rgba(0,0,0,0.15)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between" style={{ padding: '1.5rem', borderBottom: '1px solid #eee' }}>
                    <div className="flex items-center gap-2">
                        <ShoppingBag size={24} color="var(--primary)" />
                        <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>My Cart</span>
                        <span style={{ background: '#f0f0f0', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                            {cart?.items?.length || 0} items
                        </span>
                    </div>
                    <button onClick={onClose} style={{ background: '#f5f5f5', padding: '8px', borderRadius: '50%' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    {cart?.items?.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
                            <h3 style={{ marginBottom: '0.5rem' }}>Your cart is empty</h3>
                            <p style={{ color: '#888', marginBottom: '2rem' }}>Add some delicious snacks to get started!</p>
                            <button
                                onClick={onClose}
                                style={{ background: 'var(--primary)', color: 'white', padding: '0.75rem 2rem', borderRadius: 'var(--radius-md)', fontWeight: 700 }}
                            >
                                Browse Products
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {cart?.items?.map((item) => (
                                <div key={item.id} className="cart-item-card flex gap-4" style={{ marginBottom: '1rem' }}>
                                    <img
                                        src={item.product.primary_image || 'https://via.placeholder.com/80'}
                                        alt={item.product.name}
                                        style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', background: '#f5f5f5' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '4px' }}>{item.product.name}</h4>
                                        <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>{item.product.weight}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="cart-qty-selector">
                                                <button className="cart-qty-btn" onClick={() => updateItem(item.id, item.quantity - 1)}>
                                                    {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                                                </button>
                                                <span className="cart-qty-val">{item.quantity}</span>
                                                <button className="cart-qty-btn" onClick={() => updateItem(item.id, item.quantity + 1)}>
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>₹{item.line_total}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer / Summary */}
                {cart?.items?.length > 0 && (
                    <div style={{ padding: '1.5rem', background: '#fcfcfc', borderTop: '1px solid #eee' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div className="flex justify-between" style={{ fontSize: '0.95rem' }}>
                                <span style={{ color: '#666' }}>Subtotal</span>
                                <span>₹{cart.billing.subtotal}</span>
                            </div>
                            <div className="flex justify-between" style={{ fontSize: '0.95rem' }}>
                                <span style={{ color: '#666' }}>Taxes (GST)</span>
                                <span>₹{(cart.billing.cgst_amount + cart.billing.sgst_amount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between" style={{ fontSize: '0.95rem' }}>
                                <span style={{ color: '#666' }}>Delivery Charge</span>
                                <span style={{ color: cart.billing.delivery_charge === 0 ? 'var(--success)' : 'inherit', fontWeight: 600 }}>
                                    {cart.billing.delivery_charge === 0 ? 'FREE' : `₹${cart.billing.delivery_charge}`}
                                </span>
                            </div>
                            <div className="flex justify-between" style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--primary)' }}>
                                <span>Total</span>
                                <span>₹{cart.billing.total}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            className="flex items-center justify-between"
                            style={{
                                width: '100%',
                                background: 'var(--primary)',
                                color: 'white',
                                padding: '1.25rem',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: 800,
                                boxShadow: '0 8px 24px rgba(211, 47, 47, 0.2)'
                            }}
                        >
                            <span>Proceed to Checkout</span>
                            <ArrowRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartDrawer;
