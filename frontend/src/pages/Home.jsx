import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { ChevronRight, ArrowRight, Search as SearchIcon, MapPin, Filter, X, ChevronsUp } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import useSearchStore from '../store/searchStore';

const CAT_ICONS = {
    'bhakarwadi': '🥨',
    'namkeen': '🥜',
    'sweets': '🍬',
    'spices': '🌶️',
    'pickles': '🥒',
    'daily-essentials': '🥛',
    'biscuits': '🍪',
    'khakhra': '🫓',
    'default': '🛒'
};

const Home = () => {
    const [data, setData] = useState(null);
    const [searchResults, setSearchResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get('search');

    const { calculateDelivery } = useCartStore();
    const { user, isAuthenticated } = useAuthStore();

    // Filters State
    const { sortBy, availability } = useSearchStore();
    const [activeCategory, setActiveCategory] = useState(null);

    const fetchHomeOrSearch = useCallback(async () => {
        setLoading(true);
        try {
            // Determine if we are in "filter/search mode" or "homepage mode"
            const isFilterMode = searchQuery || sortBy !== 'default' || availability !== 'all' || activeCategory;

            if (isFilterMode) {
                let url = '/products/';
                const params = new URLSearchParams();
                if (searchQuery) params.append('search', searchQuery);
                if (sortBy !== 'default') params.append('sort', sortBy);
                if (availability !== 'all') params.append('availability', availability);
                if (activeCategory) params.append('category', activeCategory);

                const response = await api.get(`${url}?${params.toString()}`);
                setSearchResults(response.data.results || response.data);
            } else {
                const response = await api.get('/products/homepage/');
                setData(response.data);
                setSearchResults(null);
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, sortBy, availability, activeCategory]);

    useEffect(() => {
        fetchHomeOrSearch();
    }, [fetchHomeOrSearch]);

    const [heroSearch, setHeroSearch] = useState('');

    const handleHeroSearch = (e) => {
        e.preventDefault();
        if (heroSearch.trim()) {
            setSearchParams({ search: heroSearch.trim() });
            setHeroSearch('');
        }
    };

    if (loading && !data && !searchResults) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
            <div className="loader"></div>
            <p style={{ fontWeight: 600, color: 'var(--primary)' }}>Finding the best snacks for you...</p>
        </div>
    );

    return (
        <div style={{ background: '#fdfdfd', minHeight: '100vh', paddingBottom: '5rem' }}>
            {/* Hero Section (Show only if no search/filter or just on first load) */}
            {!searchQuery && !activeCategory && (
                <div className="container" style={{ paddingTop: '2rem', marginBottom: '3.5rem' }}>
                    <div className="hero-banner animate-pop" style={{
                        background: 'linear-gradient(135deg, #c62828 0%, #e53935 100%)',
                        borderRadius: 'var(--radius-lg)', padding: '4rem 3rem',
                        color: 'white', position: 'relative', overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(211,47,47,0.3)'
                    }}>
                        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
                            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem', display: 'inline-block' }}>
                                Quality Snacks, Delivered Fresh
                            </span>
                            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-2px' }}>
                                Taste the Tradition <br className="hidden-mobile" /> of India.
                            </h1>
                            <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '2.5rem', lineHeight: 1.6 }}>
                                Authentic Bhakarwadi, Premium Spices, and Daily Essentials. Get Shridhar Enterprise quality delivered to your home.
                            </p>

                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}
                                    style={{
                                        background: 'white', color: 'var(--primary)', border: 'none',
                                        padding: '1rem 2.5rem', borderRadius: '16px',
                                        fontWeight: 900, cursor: 'pointer', fontSize: '1.1rem',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                        transition: 'all 0.3s'
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.15)'; }}
                                    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)'; }}
                                >
                                    Shop Now
                                </button>
                                <Link to="/about-us" style={{
                                    background: 'rgba(255,255,255,0.15)', color: 'white',
                                    padding: '1rem 2rem', borderRadius: '16px',
                                    fontWeight: 800, textDecoration: 'none',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    transition: 'all 0.3s'
                                }}>
                                    Learn More <ChevronRight size={18} />
                                </Link>
                            </div>
                        </div>
                        <div style={{
                            position: 'absolute', right: '-80px', top: '-80px',
                            width: '320px', height: '320px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)', border: '30px solid rgba(255,255,255,0.05)'
                        }}></div>
                    </div>
                </div>
            )}

            {/* Categories Section */}
            <div id="category-section" className="container" style={{ marginBottom: '3rem', paddingTop: (searchQuery || activeCategory) ? '4rem' : '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{searchQuery ? `Results for "${searchQuery}"` : 'Shop by Category'}</h2>
                    {(searchQuery || activeCategory) && (
                        <button onClick={() => { setSearchParams({}); setActiveCategory(null); }} style={{ color: 'var(--primary)', fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <X size={16} /> Clear Search
                        </button>
                    )}
                </div>
                <div className="flex gap-4 active-scroll" style={{ overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'none' }}>
                    {data?.categories?.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.slug === activeCategory ? null : cat.slug)}
                            style={{
                                minWidth: '100px', background: 'none', border: 'none', cursor: 'pointer',
                                textAlign: 'center', padding: '4px', opacity: activeCategory && activeCategory !== cat.slug ? 0.5 : 1
                            }}
                        >
                            <div className="zepto-card" style={{
                                width: '80px', height: '80px', borderRadius: '20px', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem',
                                background: 'white', margin: '0 auto 0.5rem',
                                border: activeCategory === cat.slug ? '2.5px solid var(--primary)' : '1px solid #f0f0f0',
                                boxShadow: activeCategory === cat.slug ? '0 8px 16px rgba(198,40,40,0.15)' : 'none',
                                overflow: 'hidden'
                            }}>
                                {(cat.image || cat.sample_image) ? (
                                    <img src={cat.image || cat.sample_image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span>{cat.icon || CAT_ICONS[cat.slug?.toLowerCase()] || CAT_ICONS.default}</span>
                                )}
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#333' }}>{cat.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Premium Filter Bar removed (moved to Navbar) */}

            {/* Results Grid */}
            <div className="container">
                {searchResults ? (
                    <>
                        {searchResults.length > 0 ? (
                            <div className="grid-products animate-fade">
                                {searchResults.map((product) => <ProductCard key={product.id} product={product} />)}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                                <SearchIcon size={48} color="#ddd" style={{ marginBottom: '1rem' }} />
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>No items found matching your filters</h3>
                                <p style={{ color: '#888' }}>Try adjusting your search or filters.</p>
                            </div>
                        )}
                    </>
                ) : data ? (
                    <>
                        {/* Homepage Sections */}
                        {data.featured?.length > 0 && (
                            <section style={{ marginBottom: '4rem' }}>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Top Rated Delights</h2>
                                    <Link to="/products" style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'none', fontSize: '0.9rem' }}>See All</Link>
                                </div>
                                <div className="grid-products">
                                    {data.featured.map(product => <ProductCard key={product.id} product={product} />)}
                                </div>
                            </section>
                        )}

                        <section style={{ marginBottom: '4rem' }}>
                            <div style={{ background: '#fef2f2', border: '1.5px dashed var(--primary)', borderRadius: '20px', padding: '2.5rem', textAlign: 'center' }}>
                                <h4 style={{ color: 'var(--primary)', fontWeight: 900, marginBottom: '1rem', fontSize: '1.1rem' }}>SHOP BY REGIONAL BRANDS</h4>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                                    {['Katdare', 'Chitale Bandhu', 'Falguni', 'Kwality'].map(brand => (
                                        <span key={brand} style={{ fontSize: '1.2rem', fontWeight: 900, color: '#111', opacity: 0.3 }}>{brand}</span>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {data.bestsellers?.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Most Loved Favorites</h2>
                                </div>
                                <div className="grid-products">
                                    {data.bestsellers.map(product => <ProductCard key={product.id} product={product} />)}
                                </div>
                            </section>
                        )}
                    </>
                ) : null}
            </div>
            {/* Scroll Up to Categories FAB (Mobile Only) */}
            {activeCategory && (
                <button
                    className="visible-mobile"
                    onClick={() => {
                        const el = document.getElementById('category-section');
                        if (el) {
                            const offset = 180; // Mega navbar offset buffer
                            const bodyRect = document.body.getBoundingClientRect().top;
                            const elementRect = el.getBoundingClientRect().top;
                            const elementPosition = elementRect - bodyRect;
                            window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
                        }
                    }}
                    style={{
                        position: 'fixed', bottom: data?.cartCount > 0 ? '90px' : '30px', right: '20px',
                        background: '#111', color: 'white', border: 'none',
                        width: '48px', height: '48px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 999, cursor: 'pointer',
                        transition: 'transform 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <ChevronsUp size={24} />
                </button>
            )}
        </div>
    );
};

export default Home;
