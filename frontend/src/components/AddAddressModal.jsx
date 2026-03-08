import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, User, Phone as PhoneIcon, Navigation, Search } from 'lucide-react';
import api from '../api/axios';

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

const AddAddressModal = ({ existingAddresses = [], onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    label: 'Home',
    recipient_name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    latitude: null,
    longitude: null,
    is_default: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Address Limit States
  const [addressesState, setAddressesState] = useState(existingAddresses);
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [showDeleteSelector, setShowDeleteSelector] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState([]);
  const [shake, setShake] = useState(false);

  // Initialize Autocomplete
  useEffect(() => {
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
        const components = place.address_components || [];

        let road = '', neighbourhood = '', city = '', state = '', pincode = '';
        for (const c of components) {
          if (c.types.includes('route')) road = c.long_name;
          else if (c.types.includes('sublocality_level_1') || c.types.includes('sublocality')) neighbourhood = c.long_name;
          else if (c.types.includes('locality')) city = c.long_name;
          else if (c.types.includes('administrative_area_level_1')) state = c.long_name;
          else if (c.types.includes('postal_code')) pincode = c.long_name;
        }

        setFormData(prev => ({
          ...prev,
          line1: [road, neighbourhood].filter(Boolean).join(', ') || place.formatted_address || '',
          city,
          state,
          pincode,
          latitude: lat,
          longitude: lng,
        }));
      });
      autocompleteRef.current = autocomplete;
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.phone.length < 10) { setError('Phone must be 10 digits.'); return; }
    if (formData.pincode.length !== 6) { setError('Pincode must be 6 digits.'); return; }

    if (addressesState.length >= 5) {
      setShowLimitPopup(true);
      return;
    }

    await saveAddress();
  };

  const saveAddress = async () => {
    setLoading(true);
    setError('');
    try {
      let finalPhone = formData.phone.trim();
      if (finalPhone.length === 10 && !finalPhone.startsWith('+')) finalPhone = `+91${finalPhone}`;

      const payload = {
        ...formData,
        phone: finalPhone,
        country: 'India'
      };
      const response = await api.post('/auth/addresses/', payload);
      onSuccess(response.data);
      onClose();
    } catch (err) {
      const data = err.response?.data || {};
      setError(data.phone?.[0] || data.detail || 'Failed to save address.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOldestAndAdd = async () => {
    if (addressesState.length === 0) return;
    const sortedAddrs = [...addressesState].sort((a, b) => new Date(a.created_at || parseInt(a.id, 16)) - new Date(b.created_at || parseInt(b.id, 16)));
    const oldestId = sortedAddrs[0].id; // guaranteed oldest by time
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
        await saveAddress(); // Auto save since we are now under the limit!
      } else {
        setError(`You still have ${newAddresses.length} addresses. Please delete at least ${newAddresses.length - 4} more.`);
      }
    } catch (err) {
      setError('Failed to delete selected addresses.');
    } finally {
      setLoading(false);
    }
  };

  const INPUT_STYLE = { width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1.5px solid #eee', outline: 'none' };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass animate-fade" style={{ position: 'relative', width: '100%', maxWidth: '480px', background: 'white', borderRadius: 'var(--radius-lg)', overflow: 'hidden', maxHeight: '95vh', overflowY: 'auto' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.15rem' }}>Add Delivery Address</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 600, background: '#fef2f2', padding: '0.5rem', borderRadius: '8px' }}>{error}</p>}

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.2rem' }}>🔍 Search on Google Maps</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#aaa" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input ref={locationInputRef} placeholder="Start typing your address..." style={{ ...INPUT_STYLE, paddingLeft: '2.2rem' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.2rem' }}>Recipient Name *</label>
              <input required value={formData.recipient_name} onChange={e => setFormData({ ...formData, recipient_name: e.target.value })} placeholder="Full name" style={INPUT_STYLE} />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.2rem' }}>Mobile Number *</label>
              <input required type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="10-digit phone" style={INPUT_STYLE} />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.2rem' }}>Area / Street / Building *</label>
              <input required value={formData.line1} onChange={e => setFormData({ ...formData, line1: e.target.value })} placeholder="Address line 1" style={INPUT_STYLE} />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.2rem' }}>City *</label>
              <input required value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="City" style={INPUT_STYLE} />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.2rem' }}>Pincode *</label>
              <input required value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="6 digits" style={INPUT_STYLE} />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.2rem' }}>State *</label>
              <input required value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} placeholder="State" style={INPUT_STYLE} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ background: 'var(--primary)', color: 'white', padding: '1rem', borderRadius: '12px', fontWeight: 800, fontSize: '1rem', border: 'none', cursor: 'pointer', marginTop: '0.5rem' }}>
            {loading ? 'Saving...' : 'Save Address'}
          </button>
        </form>

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
          .pac-container { z-index: 11000 !important; }
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

export default AddAddressModal;
