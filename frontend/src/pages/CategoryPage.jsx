import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { ChevronRight, Filter, SlidersHorizontal, ArrowUpDown, ChevronLeft } from 'lucide-react';

const CategoryPage = () => {
    const { slug } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [ordering, setOrdering] = useState('sort_order');
    const [brandFilter, setBrandFilter] = useState('');
    const [availability, setAvailability] = useState('all'); // 'all' or 'in_stock'
    const [brands, setBrands] = useState([]);

    useEffect(() => {
        const fetchBrands = async () => {
            try {
                const res = await api.get('/products/brands/');
                setBrands(res.data);
            } catch (e) { }
        };
        fetchBrands();
    }, []);

    useEffect(() => {
        const fetchCategoryProducts = async () => {
            setLoading(true);
            try {
                let url = slug === 'all' ? '/products/' : `/products/?category=${slug}`;
                const connector = url.includes('?') ? '&' : '?';
                url += `${connector}ordering=${ordering}&availability=${availability}`;
                if (brandFilter) url += `&brand=${brandFilter}`;

                const response = await api.get(url);
                setData(response.data);
            } catch (error) {
                console.error('Failed to fetch category products');
            } finally {
                setLoading(false);
            }
        };
        fetchCategoryProducts();
    }, [slug, ordering, brandFilter, availability]);

    if (loading && !data) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div className="loader"></div>
        </div>
    );

    const title = slug === 'all' ? 'All Products' : (data?.results?.[0]?.category_name || slug.charAt(0).toUpperCase() + slug.slice(1));

    return (
        <div className="category-page animate-fade">
            <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#666', fontWeight: 600, textDecoration: 'none', marginBottom: '1.5rem' }}>
                    <ChevronLeft size={18} /> Back to Home
                </Link>

                {/* Breadcrumbs */}
                <div className="flex items-center gap-2" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
                    <ChevronRight size={14} />
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{title}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '2rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-main)' }}>{title}</h1>
                        <p style={{ color: '#666', marginTop: '0.25rem' }}>Showing {data?.results?.length || 0} premium items</p>
                    </div>

                    <div className="flex gap-4 items-center" style={{ flexWrap: 'wrap' }}>
                        {/* In Stock Toggle */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'white', padding: '0.65rem 1rem', border: '1px solid #ddd', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', fontWeight: 600 }}>
                            <input
                                type="checkbox"
                                checked={availability === 'in_stock'}
                                onChange={e => setAvailability(e.target.checked ? 'in_stock' : 'all')}
                                style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                            />
                            Hide Out of Stock
                        </label>

                        {/* Brand Filter */}
                        <div style={{ position: 'relative' }}>
                            <select
                                value={brandFilter}
                                onChange={e => setBrandFilter(e.target.value)}
                                style={{
                                    appearance: 'none', background: 'white', border: '1px solid #ddd',
                                    padding: '0.65rem 2.5rem 0.65rem 1rem', borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.9rem', fontWeight: 600, outline: 'none', cursor: 'pointer',
                                    minWidth: '150px'
                                }}
                            >
                                <option value="">All Brands</option>
                                {brands.map(b => <option key={b.id} value={b.slug}>{b.name}</option>)}
                            </select>
                            <Filter size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#888' }} />
                        </div>

                        {/* Sort Ordering */}
                        <div style={{ position: 'relative' }}>
                            <select
                                value={ordering}
                                onChange={e => setOrdering(e.target.value)}
                                style={{
                                    appearance: 'none', background: 'white', border: '1px solid #ddd',
                                    padding: '0.65rem 2.5rem 0.65rem 1rem', borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.9rem', fontWeight: 600, outline: 'none', cursor: 'pointer',
                                    minWidth: '180px'
                                }}
                            >
                                <option value="relevance">Relevance</option>
                                <option value="price_low">Price: Low to High</option>
                                <option value="price_high">Price: High to Low</option>
                                <option value="rating">Rating: High to Low</option>
                                <option value="discount">Biggest Discount</option>
                                <option value="newest">Newest First</option>
                            </select>
                            <ArrowUpDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#888' }} />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30vh' }}>
                        <div className="loader"></div>
                    </div>
                ) : data?.results?.length > 0 ? (
                    <div className="grid-products">
                        {data.results.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px dashed #ddd' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🥖</div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No items found</h3>
                        <p style={{ color: '#888' }}>We couldn't find any products in this selection. Try clearing filters.</p>
                        <button
                            onClick={() => { setBrandFilter(''); setOrdering('sort_order'); }}
                            style={{ marginTop: '1.5rem', background: 'var(--primary)', color: 'white', padding: '0.6rem 1.5rem', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Reset Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryPage;
