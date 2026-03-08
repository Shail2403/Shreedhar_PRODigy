import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';

const CartPage = () => {
  const { cart, updateItem, removeItem, loading } = useCartStore();
  const navigate = useNavigate();

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Your cart is empty</h2>
        <p style={{ color: '#888', marginBottom: '2rem' }}>Looks like you haven't added anything to your cart yet.</p>
        <Link to="/" style={{ background: 'var(--primary)', color: 'white', padding: '1rem 2rem', borderRadius: 'var(--radius-md)', fontWeight: 800 }}>
          Go Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page animate-fade">
      <div className="container" style={{ paddingTop: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>Shopping Cart</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'flex-start' }}>
          
          {/* Item List */}
          <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
            {cart.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
                    <h3 style={{ marginBottom: '0.5rem' }}>Your cart is empty</h3>
                    <p style={{ color: '#888' }}>Add some delicious snacks to get started!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {cart.items.map(item => (
                        <div key={item.id} className="cart-item-card flex gap-4" style={{ borderBottom: '1px solid #eee', paddingBottom: '1.5rem' }}>
                            <img src={item.product.primary_image || 'https://via.placeholder.com/80'} alt={item.product.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px', background: '#f5f5f5' }} />
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div className="flex justify-between" style={{ marginBottom: '4px' }}>
                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{item.product.name}</h3>
                                    <button onClick={() => removeItem(item.id)} style={{ color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>{item.product.weight}</p>
                                
                                <div className="flex justify-between items-center">
                                    <div className="cart-qty-selector">
                                        <button className="cart-qty-btn" onClick={() => updateItem(item.id, item.quantity - 1)}>
                                            {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                                        </button>
                                        <span className="cart-qty-val">{item.quantity}</span>
                                        <button className="cart-qty-btn" onClick={() => updateItem(item.id, item.quantity + 1)}>
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>₹{item.line_total}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <Link to="/" className="flex items-center gap-2" style={{ marginTop: '2rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
              <ArrowLeft size={16} /> Continue Shopping
            </Link>
          </div>

          {/* Billing Summary */}
          <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '2rem', position: 'sticky', top: '100px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Billing Summary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div className="flex justify-between" style={{ color: '#555' }}>
                <span>Item Subtotal</span>
                <span>₹{cart.billing.subtotal}</span>
              </div>
              <div className="flex justify-between" style={{ color: '#555' }}>
                <span>CGST (5%)</span>
                <span>₹{cart.billing.cgst_amount}</span>
              </div>
              <div className="flex justify-between" style={{ color: '#555' }}>
                <span>SGST (2.5%)</span>
                <span>₹{cart.billing.sgst_amount}</span>
              </div>
              <div className="flex justify-between" style={{ color: '#555' }}>
                <span>Delivery Charge</span>
                <span style={{ color: cart.billing.delivery_charge === 0 ? 'var(--success)' : 'inherit', fontWeight: 600 }}>
                  {cart.billing.delivery_charge === 0 ? 'FREE' : `₹${cart.billing.delivery_charge}`}
                </span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '0.5rem 0' }} />
              <div className="flex justify-between" style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>
                <span>Total</span>
                <span>₹{cart.billing.total}</span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/checkout')}
              style={{ width: '100%', background: 'var(--primary)', color: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem' }}
            >
              Checkout <ArrowRight size={20} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CartPage;
