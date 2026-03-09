import React, { useState } from 'react';
import { Plus, Minus, ShoppingCart, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';

const ProductCard = ({ product }) => {
    const { cart, addItem, updateItem } = useCartStore();
    const { isAuthenticated } = useAuthStore();
    const [isAdding, setIsAdding] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const navigate = useNavigate();

    const cartItem = cart?.items?.find(item => item.product?.id === product.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    const inStock = product.stock > 0;

    const handleAdd = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!inStock) return;

        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        setIsAdding(true);
        try {
            await addItem(product.id, 1);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (error) {
            console.error('Add to cart failed');
        } finally {
            setIsAdding(false);
        }
    };

    const handleUpdate = (e, newQty) => {
        e.preventDefault();
        e.stopPropagation();
        if (cartItem && inStock) {
            updateItem(cartItem.id, newQty);
        }
    };

    return (
        <div className="zepto-card animate-pop" style={{
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            cursor: 'default',
            position: 'relative',
            opacity: inStock ? 1 : 0.6,
            filter: inStock ? 'none' : 'grayscale(0.8)',
            pointerEvents: inStock ? 'auto' : 'none'
        }}>

            <Link to={inStock ? `/product/${product.slug}` : '#'} style={{ flex: 1, textDecoration: 'none', color: 'inherit', cursor: inStock ? 'pointer' : 'default' }}>
                <div style={{ position: 'relative', marginBottom: '1.25rem', overflow: 'hidden', borderRadius: 'var(--radius-sm)' }}>
                    <img
                        src={product.primary_image || 'https://via.placeholder.com/400?text=Product'}
                        alt={product.name}
                        loading="lazy"
                        style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', transition: 'transform 0.5s' }}
                        onMouseOver={e => inStock && (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseOut={e => inStock && (e.currentTarget.style.transform = 'scale(1)')}
                    />
                    {!inStock && (
                        <div style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            background: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <span style={{
                                background: '#333', color: 'white', padding: '0.4rem 0.8rem',
                                borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px'
                            }}>OUT OF STOCK</span>
                        </div>
                    )}
                    {product.discount_percent > 0 && inStock && (
                        <div style={{
                            position: 'absolute', top: '10px', left: '10px',
                            background: 'var(--primary)', color: 'white',
                            padding: '4px 8px', borderRadius: '4px',
                            fontSize: '0.7rem', fontWeight: 900,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                            {Math.round(product.discount_percent)}% OFF
                        </div>
                    )}
                    {product.is_veg && (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', width: '16px', height: '16px', border: '1px solid #1b5e20', padding: '2px', background: 'white', borderRadius: '2px' }}>
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#1b5e20' }}></div>
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: '0.5rem' }}>
                    <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 800, marginBottom: '2px' }}>{product.brand_name}</p>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 800, height: '2.8rem', overflow: 'hidden', lineHeight: '1.4', marginBottom: '0.3rem', color: '#111' }}>
                        {product.name}
                    </h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>{product.weight}</p>
            </Link>

            <div className="flex items-center justify-between" style={{ marginTop: 'auto', paddingTop: '0.5rem', pointerEvents: 'auto' }}>
                <div className="flex flex-col">
                    <span style={{ fontWeight: 900, fontSize: '1.15rem', color: '#111' }}>₹{product.selling_price}</span>
                    {product.mrp > product.selling_price && (
                        <span style={{ fontSize: '0.8rem', color: '#999', textDecoration: 'line-through' }}>₹{product.mrp}</span>
                    )}
                </div>

                {!inStock ? (
                    <button
                        disabled
                        className="zepto-btn-add"
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', background: '#eee', color: '#999', border: '1px solid #ddd', cursor: 'not-allowed' }}
                    >
                        OUT
                    </button>
                ) : quantity > 0 ? (
                    <div className="qty-controls-mobile animate-pop">
                        <button className="qty-btn-mobile" onClick={(e) => handleUpdate(e, quantity - 1)}><Minus size={14} /></button>
                        <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 800, fontSize: '0.9rem' }}>{quantity}</span>
                        <button className="qty-btn-mobile" onClick={(e) => handleUpdate(e, quantity + 1)}><Plus size={14} /></button>
                    </div>
                ) : (
                    <button
                        onClick={handleAdd}
                        disabled={isAdding}
                        className="zepto-btn-add animate-scale"
                        style={{ padding: '0.5rem 1.25rem' }}
                    >
                        {isAdding ? '...' : showSuccess ? <><Check size={16} /></> : 'ADD'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProductCard;
