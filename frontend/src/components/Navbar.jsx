/**
 * Navbar Component — Shridhar Enterprise
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsive navigation bar with:
 *   - Logo & location indicator
 *   - Amazon/Zepto-style search bar
 *   - My Orders button (when authenticated)
 *   - Cart button with total
 *   - Profile avatar
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, MapPin, Package } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import useSearchStore from '../store/searchStore';

const Navbar = ({ onCartClick, onLocationClick }) => {
    const { user, isAuthenticated } = useAuthStore();
    const { cart, currentAddress } = useCartStore();
    const { searchQuery, setSearchQuery, sortBy, setSortBy, availability, setAvailability, resetFilters } = useSearchStore();
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const itemCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
    const cartTotal = cart?.billing?.total || 0;

    return (
        <nav className="navbar-container" style={{
            position: 'fixed', top: 0, left: 0, right: 0,
            zIndex: 1000, background: 'white',
            borderBottom: '1px solid #f3f4f6',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            display: 'flex', flexDirection: 'column'
        }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', height: '70px' }}>

                {/* Logo */}
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.15rem', flexShrink: 0 }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-1px' }}>शridhar</span>
                    <span className="hidden-mobile" style={{ fontSize: '1.2rem', fontWeight: 900, color: '#111', letterSpacing: '-1px' }}>Enterprise</span>
                </Link>

                {/* Location Indicator & Search */}
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '1px solid #eee', paddingLeft: '0.75rem', flexShrink: 0, position: 'relative' }}
                >
                    <div
                        onClick={onLocationClick}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', color: '#888', cursor: 'pointer' }}
                    >
                        <MapPin size={13} color="var(--primary)" />
                        <span style={{ fontWeight: 600, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {currentAddress || 'Select Location'}
                        </span>
                    </div>


                </div>

                {/* Search moved below */}

                {/* Right Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0, marginLeft: 'auto' }}>

                    {/* My Orders */}
                    {isAuthenticated && (
                        <Link
                            to="/orders"
                            className="hidden-mobile"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.6rem 1rem', borderRadius: '14px',
                                border: '1.5px solid #f0f0f0', background: 'white',
                                color: '#333', fontWeight: 700, fontSize: '0.9rem',
                                textDecoration: 'none', transition: 'all 0.2s', lineHeight: 1
                            }}
                        >
                            <Package size={20} color="var(--primary)" />
                            <span>Orders</span>
                        </Link>
                    )}

                    {/* Profile */}
                    {isAuthenticated ? (
                        <Link to="/profile" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--primary) 0%, #b71c1c 100%)',
                                color: 'white', border: '2px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 900, fontSize: '1rem', flexShrink: 0
                            }}>
                                {user?.full_name?.charAt(0)?.toUpperCase() || <User size={18} />}
                            </div>
                            <span className="hidden-mobile" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#444', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user?.full_name?.split(' ')[0] || 'User'}
                            </span>
                        </Link>
                    ) : (
                        <Link to="/login" style={{
                            fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem',
                            textDecoration: 'none', padding: '0.6rem 1.25rem',
                            border: '2px solid var(--primary)', borderRadius: '14px',
                            transition: 'all 0.2s'
                        }} onMouseOver={e => { e.target.style.background = 'var(--primary)'; e.target.style.color = 'white' }} onMouseOut={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--primary)' }}>
                            Login
                        </Link>
                    )}

                    {/* Cart */}
                    <button
                        onClick={onCartClick}
                        className="cart-btn-desktop"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.6rem',
                            background: 'var(--primary)', color: 'white',
                            padding: '0.75rem 1.4rem', borderRadius: '16px',
                            fontWeight: 800, border: 'none', cursor: 'pointer',
                            boxShadow: '0 8px 20px rgba(198,40,40,0.3)',
                            position: 'relative', flexShrink: 0,
                            transition: 'transform 0.2s', fontSize: '0.95rem'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <ShoppingCart size={22} />
                        <span className="hidden-mobile">
                            {itemCount > 0 ? `₹${cartTotal}` : 'Cart'}
                        </span>
                        {itemCount > 0 && (
                            <span style={{
                                position: 'absolute', top: '-6px', right: '-6px',
                                background: '#111', color: 'white',
                                width: '22px', height: '22px', borderRadius: '50%',
                                fontSize: '0.75rem', fontWeight: 900,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '2px solid white'
                            }}>{itemCount}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Sub-header: Global Search & Filters */}
            <div style={{ padding: '0.5rem 1rem 0.75rem', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>

                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.65rem',
                            background: '#f8f8f8', borderRadius: '14px',
                            padding: '0.6rem 1rem', width: '100%',
                            border: '1.5px solid #eee', transition: 'all 0.3s ease'
                        }}>
                            <Search size={20} color='var(--primary)' />
                            <input
                                type="text"
                                placeholder="Search among 100+ snacks & staples..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#111', fontWeight: 600 }}
                            />
                            {searchQuery && (
                                <button type="submit" style={{
                                    background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px',
                                    padding: '0.3rem 0.75rem', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem'
                                }}>
                                    Search
                                </button>
                            )}
                        </div>
                    </form>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem', scrollbarWidth: 'none' }}>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{ padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1.5px solid #eee', fontWeight: 700, fontSize: '0.8rem', outline: 'none', cursor: 'pointer', background: '#f8f8f8', color: '#333' }}
                        >
                            <option value="default">Sort: Relevance</option>
                            <option value="price_low">Price: Low to High</option>
                            <option value="price_high">Price: High to Low</option>
                            <option value="newest">Newest First</option>
                        </select>

                        <select
                            value={availability}
                            onChange={(e) => setAvailability(e.target.value)}
                            style={{ padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1.5px solid #eee', fontWeight: 700, fontSize: '0.8rem', outline: 'none', cursor: 'pointer', background: '#f8f8f8', color: '#333' }}
                        >
                            <option value="all">Status: All</option>
                            <option value="in_stock">In Stock</option>
                        </select>

                        {(sortBy !== 'default' || availability !== 'all') && (
                            <button
                                onClick={resetFilters}
                                style={{ background: '#fdecec', border: 'none', padding: '0.5rem 0.75rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer', flexShrink: 0 }}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </nav>
    );
};

export default Navbar;
