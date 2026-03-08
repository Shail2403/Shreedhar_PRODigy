import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Star, Truck, ShieldCheck, Plus, Minus, Info, ChevronLeft } from 'lucide-react';
import useCartStore from '../store/cartStore';

const ProductPage = () => {
    const { slug } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const { cart, addItem, updateItem } = useCartStore();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await api.get(`/products/${slug}/`);
                setProduct(response.data);
            } catch (error) {
                console.error('Product not found');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [slug, navigate]);

    if (loading) return <div className="container" style={{ paddingTop: '2rem' }}>Loading product details...</div>;

    const cartItem = cart?.items?.find(item => item.product.id === product.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    return (
        <div className="product-page animate-fade">
            <div className="container" style={{ paddingTop: '1.5rem' }}>
                <button 
                    onClick={() => navigate(-1)} 
                    style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#666', fontWeight: 600, cursor: 'pointer', marginBottom: '1.5rem', padding: 0 }}
                >
                    <ChevronLeft size={18} /> Back
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem' }}>

                    {/* Images */}
                    <div style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
                        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid #eee' }}>
                            <img
                                src={product.primary_image || 'https://via.placeholder.com/600'}
                                alt={product.name}
                                style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }}
                            />
                        </div>
                        <div className="flex gap-4" style={{ marginTop: '1rem' }}>
                            {product.images?.map((img, i) => (
                                <img key={i} src={img.image} style={{ width: '80px', height: '80px', borderRadius: '8px', cursor: 'pointer', border: '1px solid #eee' }} />
                            ))}
                        </div>
                    </div>

                    {/* Details */}
                    <div>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <span className="badge badge-red" style={{ fontSize: '0.7rem' }}>{product.brand_name}</span>
                        </div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.5rem', lineHeight: 1.2 }}>{product.name}</h1>
                        <div className="flex items-center gap-4" style={{ marginBottom: '1.5rem' }}>
                            <div className="flex items-center gap-1" style={{ background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.9rem' }}>
                                <Star size={16} fill="currentColor" />
                                {product.rating}
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>({product.review_count} Reviews)</span>
                            <span style={{ color: '#eee' }}>|</span>
                            <span style={{ fontWeight: 600, color: 'var(--success)' }}>{product.weight}</span>
                        </div>

                        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
                            <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>₹{product.selling_price}</span>
                            {product.mrp > product.selling_price && (
                                <span style={{ fontSize: '1.1rem', color: '#999', textDecoration: 'line-through', marginBottom: '4px' }}>MRP ₹{product.mrp}</span>
                            )}
                            {product.discount_percent > 0 && (
                                <span className="badge badge-red" style={{ marginBottom: '6px' }}>SAVE {Math.round(product.discount_percent)}%</span>
                            )}
                        </div>

                        {/* Actions */}
                        <div style={{ marginBottom: '2.5rem' }}>
                            {quantity > 0 ? (
                                <div className="qty-selector" style={{ fontSize: '1.1rem', padding: '4px', width: 'fit-content' }}>
                                    <button className="qty-btn" style={{ padding: '12px 20px' }} onClick={() => updateItem(cartItem.id, quantity - 1)}><Minus size={20} /></button>
                                    <span className="qty-val" style={{ padding: '0 1rem' }}>{quantity} in cart</span>
                                    <button className="qty-btn" style={{ padding: '12px 20px' }} onClick={() => updateItem(cartItem.id, quantity + 1)}><Plus size={20} /></button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => addItem(product.id, 1)}
                                    style={{
                                        background: 'var(--primary)', color: 'white', padding: '1rem 3rem', borderRadius: 'var(--radius-md)',
                                        fontWeight: 800, fontSize: '1.1rem', boxShadow: '0 8px 24px rgba(211,47,47,0.2)'
                                    }}
                                >
                                    Add to Cart
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                            <div className="flex gap-3 items-center">
                                <Truck size={24} color="var(--primary)" />
                                <div style={{ fontSize: '0.85rem' }}>
                                    <p style={{ fontWeight: 700 }}>Express Delivery</p>
                                    <p style={{ color: '#888' }}>Delivered in 15-30 mins</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-center">
                                <ShieldCheck size={24} color="var(--primary)" />
                                <div style={{ fontSize: '0.85rem' }}>
                                    <p style={{ fontWeight: 700 }}>Quality Assured</p>
                                    <p style={{ color: '#888' }}>100% Authentic Products</p>
                                </div>
                            </div>
                        </div>

                        {/* Info Tabs-like sections */}
                        <div style={{ borderTop: '1px solid #eee', paddingTop: '2rem' }}>
                            <h3 className="flex items-center gap-2" style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
                                <Info size={18} color="var(--primary)" /> Product Description
                            </h3>
                            <p style={{ color: '#555', lineHeight: 1.8, marginBottom: '1.5rem' }}>{product.description}</p>

                            {product.ingredients && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Ingredients</h4>
                                    <p style={{ fontSize: '0.9rem', color: '#666' }}>{product.ingredients}</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductPage;
