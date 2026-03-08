import React from 'react';
import { Mail, Phone, MapPin, Instagram, ChevronRight, Code } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{ 
      background: 'linear-gradient(to bottom, #111, #000)', 
      color: 'white', 
      padding: '5rem 0 3rem 0', 
      marginTop: '6rem',
      borderTop: '4px solid var(--primary)'
    }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '4rem' }}>
          
          {/* Brand Info */}
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: '2rem' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-1px' }}>शridhar</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>Enterprise</span>
            </div>
            <p style={{ color: '#999', fontSize: '1rem', lineHeight: 1.8, maxWidth: '320px' }}>
              Authentic Indian snacks, premium spices, and daily groceries delivered fresh to your doorstep. Experience the taste of tradition.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '1.2rem', marginBottom: '2rem', fontWeight: 800, color: '#fff' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
              {['About Us', 'Contact Us', 'Terms & Conditions', 'Privacy Policy'].map(link => (
                <li key={link}>
                  <Link to={`/${link.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`} style={{ transition: 'all 0.2s', textDecoration: 'none', color: '#999', display: 'flex', alignItems: 'center', gap: '0.5rem' }} 
                     onMouseOver={e => { e.target.style.color='white'; e.target.style.transform='translateX(5px)'; }} 
                     onMouseOut={e => { e.target.style.color='#999'; e.target.style.transform='translateX(0)'; }}>
                     <ChevronRight size={14} color="var(--primary)" /> {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontSize: '1.2rem', marginBottom: '2rem', fontWeight: 800, color: '#fff' }}>Visit Our Shop</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.95rem', color: '#999' }}>
              <a href="https://www.google.com/maps/search/?api=1&query=Block-E, ASHRAYA-9, Chamunda Nagar, Kali, Ahmedabad, Gujarat 382470" 
                 target="_blank" rel="noopener noreferrer"
                 style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }}
                 onMouseOver={e => e.currentTarget.style.color='white'} onMouseOut={e => e.currentTarget.style.color='#999'}>
                <MapPin size={22} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span>Block-E, ASHRAYA-9, Chamunda Nagar, Kali, Ahmedabad, Gujarat 382470</span>
              </a>
              <a href="tel:+918401926275" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }}
                 onMouseOver={e => e.currentTarget.style.color='white'} onMouseOut={e => e.currentTarget.style.color='#999'}>
                <Phone size={22} color="var(--primary)" />
                <span>+91 99999 00000</span>
              </a>
              <a href="mailto:gcp.shridharenterprise@gmail.com" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }}
                 onMouseOver={e => e.currentTarget.style.color='white'} onMouseOut={e => e.currentTarget.style.color='#999'}>
                <Mail size={22} color="var(--primary)" />
                <span>gcp.shridharenterprise@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Connect */}
          <div>
            <h4 style={{ fontSize: '1.2rem', marginBottom: '2rem', fontWeight: 800, color: '#fff' }}>Stay Connected</h4>
            <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '2rem' }}>
              {/* WhatsApp Business */}
              <a href="https://wa.me/918401926275" target="_blank" rel="noopener noreferrer" 
                 className="nav-social-icon"
                 style={{ 
                   background: '#25D366', padding: '14px', borderRadius: '18px', color: 'white', 
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxShadow: '0 8px 20px rgba(37,211,102,0.2)'
                 }} 
                 onMouseOver={e => { e.currentTarget.style.transform='scale(1.2) rotate(8deg)'; e.currentTarget.style.boxShadow='0 12px 25px rgba(37,211,102,0.4)'; }}
                 onMouseOut={e => { e.currentTarget.style.transform='scale(1) rotate(0)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(37,211,102,0.2)'; }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.89 9.884-.001 2.225.586 3.891 1.746 5.634l-.999 3.648 3.743-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
              </a>
              {/* Instagram ISRO */}
              <a href="https://www.instagram.com/isro.dos/" target="_blank" rel="noopener noreferrer"
                 style={{ 
                   background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', 
                   padding: '14px', borderRadius: '18px', color: 'white', 
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxShadow: '0 8px 20px rgba(220,39,67,0.2)'
                 }} 
                 onMouseOver={e => { e.currentTarget.style.transform='scale(1.2) rotate(-8deg)'; e.currentTarget.style.boxShadow='0 12px 25px rgba(220,39,67,0.4)'; }}
                 onMouseOut={e => { e.currentTarget.style.transform='scale(1) rotate(0)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(220,39,67,0.2)'; }}>
                <Instagram size={24} />
              </a>
              {/* Dev Contact */}
              <a href="mailto:shahshail24@gmail.com?subject=Assistance via Shridhar Enterprise&body=Hello Shail," 
                 style={{ 
                   position: 'relative',
                   background: '#111', padding: '14px', borderRadius: '18px', color: 'white', 
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', border: '2px solid var(--primary)',
                   boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
                 }} 
                 onMouseOver={e => { e.currentTarget.style.transform='scale(1.2) translateY(-5px)'; e.currentTarget.style.background='var(--primary)'; e.currentTarget.style.borderColor='white'; }}
                 onMouseOut={e => { e.currentTarget.style.transform='scale(1) translateY(0)'; e.currentTarget.style.background='#111'; e.currentTarget.style.borderColor='var(--primary)'; }}>
                <span style={{ 
                    position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--primary)', color: 'white', padding: '4px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #111'
                }}>
                    <Code size={12} />
                </span>
                <Mail size={24} />
              </a>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#555', borderTop: '1px solid #222', paddingTop: '1.5rem' }}>
              © 2026 Shridhar Enterprise Pvt Ltd. <br/> Built for Quality & Trust.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
