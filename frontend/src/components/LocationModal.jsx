/**
 * LocationModal Component — Shridhar Enterprise
 * ─────────────────────────────────────────────────────────────────────────────
 * Shown once after signup when user has no saved address.
 * Two options:
 *   1. Use Current Location (GPS → Google Maps Reverse Geocoding via backend proxy)
 *   2. Enter address manually (with Google Places Autocomplete)
 *
 * Based on the original project's location approach using Google Maps API.
 */
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, X, CheckCircle, Search } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBcwLjSEIpuh5mZfdoI8pqTRSc5Ztyfi1Q';

// Load Google Maps script once globally
let gmapsLoaded = false;
let gmapsLoading = false;
let gmapsCallbacks = [];

function loadGoogleMaps(callback) {
    if (gmapsLoaded) { callback(); return; }
    gmapsCallbacks.push(callback);
    if (gmapsLoading) return;
    gmapsLoading = true;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
        gmapsLoaded = true;
        gmapsLoading = false;
        gmapsCallbacks.forEach(cb => cb());
        gmapsCallbacks = [];
    };
    document.head.appendChild(script);
}

const LocationModal = ({ onSaved, onSkip }) => {
    const { user } = useAuthStore();
    const [mode, setMode] = useState('choice'); // 'choice' | 'auto' | 'manual' | 'done'

    // Manual form fields
    const [form, setForm] = useState({
        label: 'Home',
        recipient_name: user?.full_name || '',
        phone: user?.phone?.toString().replace(/\D/g, '').slice(-10) || '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        pincode: '',
        latitude: null,
        longitude: null,
    });

    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [error, setError] = useState('');

    // Address Limit States
    const [addressesState, setAddressesState] = useState([]);
    const [showLimitPopup, setShowLimitPopup] = useState(false);
    const [showDeleteSelector, setShowDeleteSelector] = useState(false);
    const [selectedToDelete, setSelectedToDelete] = useState([]);
    const [shake, setShake] = useState(false);

    useEffect(() => {
        api.get('/auth/addresses/').then(res => setAddressesState(res.data || [])).catch(console.error);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onSkip();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSkip]);
    const locationInputRef = useRef(null);
    const autocompleteRef = useRef(null);

    // Sync initial form values once user object is loaded
    useEffect(() => {
        if (user) {
            setForm(prev => ({
                ...prev,
                recipient_name: prev.recipient_name || user.full_name || '',
                phone: prev.phone || user.phone?.toString().replace(/\D/g, '').slice(-10) || '',
            }));
        }
    }, [user]);

    // Initialize Google Places Autocomplete once entering manual mode
    useEffect(() => {
        if (mode !== 'manual') return;

        loadGoogleMaps(() => {
            if (!locationInputRef.current || autocompleteRef.current) return;
            const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current, {
                types: ['geocode'],
                componentRestrictions: { country: 'IN' },
            });
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (!place.geometry || !place.geometry.location) return;

                const lat = parseFloat(place.geometry.location.lat().toFixed(6));
                const lng = parseFloat(place.geometry.location.lng().toFixed(6));

                // Parse components
                const components = place.address_components || [];
                let road = '', neighbourhood = '', city = '', state = '', pincode = '';
                for (const c of components) {
                    if (c.types.includes('route')) road = c.long_name;
                    else if (c.types.includes('sublocality_level_1') || c.types.includes('sublocality')) neighbourhood = c.long_name;
                    else if (c.types.includes('locality')) city = c.long_name;
                    else if (c.types.includes('administrative_area_level_1')) state = c.long_name;
                    else if (c.types.includes('postal_code')) pincode = c.long_name;
                }

                const line1 = [road, neighbourhood].filter(Boolean).join(', ') || place.formatted_address || '';
                setForm(prev => ({
                    ...prev,
                    line1,
                    city,
                    state,
                    pincode,
                    latitude: lat,
                    longitude: lng,
                }));
                setStatusMsg('📍 Address selected! Please verify and complete details below.');
            });
            autocompleteRef.current = autocomplete;
        });
    }, [mode]);

    // ── Use Current Location ────────────────────────────────────────────────
    const handleAutoDetect = () => {
        setMode('auto');
        setStatusMsg('Detecting your location...');
        setError('');

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            setMode('manual');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const latitude = parseFloat(position.coords.latitude.toFixed(6));
                const longitude = parseFloat(position.coords.longitude.toFixed(6));
                setStatusMsg('Fetching address from Google Maps...');
                try {
                    // Use backend proxy for Google Maps Geocoding API
                    const res = await api.get(`/auth/reverse-geocode/?lat=${latitude}&lon=${longitude}`);

                    if (res.data.success) {
                        const addr = res.data.address || {};
                        setForm(prev => ({
                            ...prev,
                            line1: [addr.road, addr.neighbourhood, addr.suburb].filter(Boolean).join(', '),
                            city: addr.city || '',
                            state: addr.state || '',
                            pincode: addr.pincode || '',
                            latitude,
                            longitude,
                        }));
                        setStatusMsg('✅ Location detected! Please verify and complete your address.');
                        setMode('manual');
                    } else {
                        throw new Error('Geocoding returned no result');
                    }
                } catch (err) {
                    // Still allow edit even if reverse geocode fails
                    setForm(prev => ({ ...prev, latitude, longitude }));
                    setStatusMsg('Could not fetch address name. Please enter manually.');
                    setMode('manual');
                }
            },
            () => {
                setError('Could not get your location. Please enter it manually.');
                setMode('manual');
            },
            { timeout: 10000 }
        );
    };

    // ── Save Address ────────────────────────────────────────────────────────
    const handleSave = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.recipient_name.trim()) { setError('Please enter your name.'); return; }
        if (!form.phone.trim() || form.phone.length < 10) { setError('Please enter a valid 10-digit phone number.'); return; }
        if (!form.line1.trim()) { setError('Please enter your street / area.'); return; }
        if (!form.city.trim()) { setError('Please enter your city.'); return; }
        if (!form.pincode.trim() || form.pincode.length !== 6) { setError('Please enter a valid 6-digit pincode.'); return; }
        if (!form.state.trim()) { setError('Please enter your state.'); return; }

        if (addressesState.length >= 5) {
            setShowLimitPopup(true);
            return;
        }

        await saveAddress();
    };

    const saveAddress = async () => {
        setLoading(true);
        try {
            let finalPhone = form.phone.trim();
            if (finalPhone.length === 10 && !finalPhone.startsWith('+')) {
                finalPhone = `+91${finalPhone}`;
            } else if (finalPhone.length === 12 && finalPhone.startsWith('91')) {
                finalPhone = `+${finalPhone}`;
            }

            const payload = { ...form, phone: finalPhone, is_default: true, country: 'India' };
            const res = await api.post('/auth/addresses/', payload);
            setMode('done');
            setTimeout(() => onSaved(res.data), 800);
        } catch (err) {
            const errData = err.response?.data || {};
            const msg = errData.phone?.[0] || errData.recipient_name?.[0] || errData.pincode?.[0] || errData.non_field_errors?.[0] || errData.detail || 'Failed to save address. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOldestAndAdd = async () => {
        if (addressesState.length === 0) return;
        const sortedAddrs = [...addressesState].sort((a, b) => new Date(a.created_at || parseInt(a.id, 16)) - new Date(b.created_at || parseInt(b.id, 16)));
        const oldestId = sortedAddrs[0].id;
        setLoading(true);
        try {
            await api.delete(`/auth/addresses/${oldestId}/`);
            setAddressesState(prev => prev.filter(a => a.id !== oldestId)); // Clear it internally so Save doesn't trigger limit again
            await saveAddress();
        } catch (err) {
            setError('Failed to delete oldest address.');
            setLoading(false);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedToDelete.length === 0) {
            setError('Please select at least one address to delete.');
            setShake(true);
            setTimeout(() => setShake(false), 400);
            return;
        }
        setLoading(true);
        try {
            for (const id of selectedToDelete) {
                await api.delete(`/auth/addresses/${id}/`);
            }
            const newAddresses = addressesState.filter(a => !selectedToDelete.includes(a.id));
            setAddressesState(newAddresses);
            setSelectedToDelete([]);

            if (newAddresses.length < 5) {
                setShowDeleteSelector(false);
                setShowLimitPopup(false);
                setError('');
                await saveAddress();
            } else {
                setError(`You still have ${newAddresses.length} addresses. Please delete at least ${newAddresses.length - 4} more.`);
            }
        } catch (err) {
            setError('Failed to delete selected addresses.');
        } finally {
            setLoading(false);
        }
    };

    const INPUT_STYLE = {
        width: '100%', padding: '0.75rem 1rem',
        border: '1.5px solid #e5e7eb', borderRadius: '10px',
        outline: 'none', fontSize: '0.95rem', background: '#fafafa',
        boxSizing: 'border-box',
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 5000,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
            <div style={{
                background: 'white', borderRadius: '24px',
                width: '100%', maxWidth: '490px',
                maxHeight: '92vh', overflowY: 'auto',
                boxShadow: '0 30px 60px rgba(0,0,0,0.25)',
                animation: 'slideUp 0.3s ease'
            }}>
                {/* Done state */}
                {mode === 'done' && (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <CheckCircle size={64} color="#16a34a" style={{ margin: '0 auto 1rem auto' }} />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111' }}>Location Saved!</h2>
                        <p style={{ color: '#666', marginTop: '0.5rem' }}>Loading your products...</p>
                    </div>
                )}

                {/* Choice screen */}
                {mode === 'choice' && (
                    <div style={{ padding: '2rem', position: 'relative' }}>
                        <button 
                            onClick={onSkip}
                            style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#f3f4f6', border: 'none', borderRadius: '50%', padding: '0.4rem', cursor: 'pointer', display: 'flex' }}
                        >
                            <X size={20} color="#666" />
                        </button>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📍</div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Where should we deliver?</h2>
                            <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                                We need your location to show products and calculate delivery charges.
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button
                                onClick={handleAutoDetect}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '1.25rem 1.5rem', borderRadius: '16px',
                                    border: '2px solid var(--primary)', background: '#fef2f2',
                                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ background: 'var(--primary)', borderRadius: '12px', padding: '0.75rem', flexShrink: 0 }}>
                                    <Navigation size={24} color="white" />
                                </div>
                                <div>
                                    <p style={{ fontWeight: 800, fontSize: '1rem' }}>Use Current Location</p>
                                    <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.1rem' }}>Automatically detect via GPS</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setMode('manual')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '1.25rem 1.5rem', borderRadius: '16px',
                                    border: '2px solid #e5e7eb', background: 'white',
                                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ background: '#f3f4f6', borderRadius: '12px', padding: '0.75rem', flexShrink: 0 }}>
                                    <Search size={24} color="#555" />
                                </div>
                                <div>
                                    <p style={{ fontWeight: 800, fontSize: '1rem' }}>Search & Enter Address</p>
                                    <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.1rem' }}>Type your location (Google Maps autocomplete)</p>
                                </div>
                            </button>
                        </div>

                        {/* Remove skip for strict onboarding as requested */}
                    </div>
                )}

                {/* Auto detecting screen */}
                {mode === 'auto' && (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem', display: 'inline-block', animation: 'spin 1s linear infinite' }}>📡</div>
                        <p style={{ fontWeight: 700, fontSize: '1rem' }}>{statusMsg}</p>
                        <p style={{ color: '#aaa', fontSize: '0.82rem', marginTop: '0.5rem' }}>Please allow location access if prompted</p>
                    </div>
                )}

                {/* ── Manual entry form ──────────────────────────────────────── */}
                {mode === 'manual' && (
                    <form onSubmit={handleSave} style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.3rem', fontWeight: 900 }}>Enter Delivery Address</h2>
                                {statusMsg && <p style={{ fontSize: '0.8rem', color: '#16a34a', marginTop: '0.25rem', fontWeight: 600 }}>{statusMsg}</p>}
                            </div>
                            <button type="button" onClick={() => setMode('choice')} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', padding: '0.4rem', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>

                        {error && (
                            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                {error}
                            </div>
                        )}

                        {/* Google Places Autocomplete search input */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.3rem' }}>🔍 Search Location (Google Maps) *</label>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} color="#aaa" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    ref={locationInputRef}
                                    type="text"
                                    placeholder="Start typing an address..."
                                    style={{ ...INPUT_STYLE, paddingLeft: '2.25rem' }}
                                />
                            </div>
                            <p style={{ fontSize: '0.73rem', color: '#999', marginTop: '0.25rem' }}>Select from dropdown to auto-fill fields below</p>
                        </div>

                        {/* Force Google Maps Pac-container Z-INDEX */}
                        <style>{`
                            .pac-container { 
                                z-index: 9999 !important; 
                                border-radius: 12px; 
                                border: none; 
                                margin-top: 4px;
                                box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                            }
                            .pac-item { padding: 8px 12px; cursor: pointer; }
                            .pac-item:hover { background-color: #f9fafb; }
                        `}</style>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {/* Label */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.3rem' }}>Address Label</label>
                                <select value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
                                    style={{ ...INPUT_STYLE }}>
                                    <option value="Home">🏠 Home</option>
                                    <option value="Work">🏢 Work</option>
                                    <option value="Other">📍 Other</option>
                                </select>
                            </div>

                            {/* Recipient */}
                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.3rem' }}>Your Name *</label>
                                <input required value={form.recipient_name} onChange={e => setForm(p => ({ ...p, recipient_name: e.target.value }))}
                                    placeholder="Full name" style={INPUT_STYLE} />
                            </div>

                            {/* Phone */}
                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.3rem' }}>Mobile Number *</label>
                                <input required type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                                    placeholder="10-digit phone" style={INPUT_STYLE} />
                            </div>

                            {/* Street */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.3rem' }}>Flat / House / Area *</label>
                                <input required value={form.line1} onChange={e => setForm(p => ({ ...p, line1: e.target.value }))}
                                    placeholder="House no., Street, Area" style={INPUT_STYLE} />
                            </div>

                            {/* Landmark */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.3rem' }}>Landmark / Apartment (optional)</label>
                                <input value={form.line2} onChange={e => setForm(p => ({ ...p, line2: e.target.value }))}
                                    placeholder="Near temple, opposite park..." style={INPUT_STYLE} />
                            </div>

                            {/* City */}
                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.3rem' }}>City *</label>
                                <input required value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                                    placeholder="City" style={INPUT_STYLE} />
                            </div>

                            {/* Pincode */}
                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.3rem' }}>Pincode *</label>
                                <input required value={form.pincode} onChange={e => setForm(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                    placeholder="6-digit PIN" style={INPUT_STYLE} />
                            </div>

                            {/* State */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.3rem' }}>State *</label>
                                <input required value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))}
                                    placeholder="State" style={INPUT_STYLE} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', marginTop: '1.5rem', padding: '1rem',
                                background: loading ? '#e5e7eb' : 'var(--primary)',
                                color: loading ? '#999' : 'white',
                                border: 'none', borderRadius: '12px',
                                fontWeight: 800, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Saving...' : '📍 Save & Start Shopping →'}
                        </button>
                    </form>
                )}

                {/* Limit Popup */}
                {showLimitPopup && !showDeleteSelector && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.95)', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
                        <MapPin size={48} color="var(--primary)" style={{ opacity: 0.2, marginBottom: '1rem', position: 'absolute' }} />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', zIndex: 2 }}>Address Limit Reached</h3>
                        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5, zIndex: 2 }}>
                            You can only save up to 5 addresses. To add a new one, you need to remove an existing address.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', zIndex: 2 }}>
                            <button onClick={handleDeleteOldestAndAdd} disabled={loading} style={{ padding: '1rem', background: 'var(--primary)', color: 'white', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                                {loading ? '...' : 'Delete Oldest & Replace'}
                            </button>
                            <button onClick={() => setShowDeleteSelector(true)} disabled={loading} style={{ padding: '1rem', background: '#f8f8f8', color: '#111', borderRadius: '12px', fontWeight: 700, border: '1.5px solid #eee', cursor: 'pointer' }}>
                                I will choose what to delete
                            </button>
                            <button onClick={() => setShowLimitPopup(false)} style={{ background: 'transparent', border: 'none', color: '#888', fontWeight: 600, padding: '0.5rem', marginTop: '0.5rem', cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Delete Selector */}
                {showDeleteSelector && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'white', zIndex: 300, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontWeight: 800, fontSize: '1.15rem' }}>Select to Delete</h2>
                            <button onClick={() => { setShowDeleteSelector(false); setSelectedToDelete([]); setError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }} className={shake ? 'shake-animation' : ''}>
                            {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 600, background: '#fef2f2', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</p>}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {addressesState.map(addr => (
                                    <label key={addr.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1.5px solid #eee', borderRadius: '12px', cursor: 'pointer', background: selectedToDelete.includes(addr.id) ? '#fff8f8' : 'white' }}>
                                        <input type="checkbox" checked={selectedToDelete.includes(addr.id)} onChange={(e) => {
                                            if (e.target.checked) setSelectedToDelete([...selectedToDelete, addr.id]);
                                            else setSelectedToDelete(selectedToDelete.filter(id => id !== addr.id));
                                        }} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                                        <div style={{ flex: 1, fontSize: '0.85rem' }}>
                                            <p style={{ fontWeight: 700, color: '#111' }}>{addr.label} - {addr.recipient_name}</p>
                                            <p style={{ color: '#666', marginTop: '0.15rem' }}>{addr.line1}, {addr.city}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div style={{ padding: '1.5rem', borderTop: '1px solid #eee' }}>
                            <button onClick={handleDeleteSelected} disabled={loading} style={{ width: '100%', background: 'var(--primary)', color: 'white', padding: '1rem', borderRadius: '12px', fontWeight: 800, fontSize: '1rem', border: 'none', cursor: 'pointer' }}>
                                {loading ? 'Deleting...' : `Delete Selected (${selectedToDelete.length})`}
                            </button>
                        </div>
                    </div>
                )}

                <style>{`
                    .shake-animation { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
                    @keyframes shake {
                        10%, 90% { transform: translate3d(-1px, 0, 0); }
                        20%, 80% { transform: translate3d(2px, 0, 0); }
                        30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                        40%, 60% { transform: translate3d(4px, 0, 0); }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default LocationModal;
