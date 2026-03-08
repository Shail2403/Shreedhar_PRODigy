import React from 'react';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

const ContactUs = () => {
    return (
        <div style={{ padding: '4rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '1rem' }}>Get in Touch</h1>
                <p style={{ color: '#666', fontSize: '1.2rem' }}>We'd love to hear from you. Our team is always here to help.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                <div style={{ background: 'white', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <div style={{ width: '60px', height: '60px', background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <Phone color="var(--primary)" size={30} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Call Us</h3>
                    <p style={{ color: '#666', marginBottom: '1rem' }}>Mon-Sat from 9am to 8pm.</p>
                    <a href="tel:+918401926275" style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'none', fontSize: '1.1rem' }}>+91 84019 26275</a>
                </div>

                <div style={{ background: 'white', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <div style={{ width: '60px', height: '60px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <Mail color="#3b82f6" size={30} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Email Us</h3>
                    <p style={{ color: '#666', marginBottom: '1rem' }}>Our friendly team is here to help.</p>
                    <a href="mailto:gcp.shridharenterprise@gmail.com" style={{ color: '#3b82f6', fontWeight: 800, textDecoration: 'none', fontSize: '1.1rem' }}>gcp.shridharenterprise@gmail.com</a>
                </div>

                <div style={{ background: 'white', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <div style={{ width: '60px', height: '60px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <MessageCircle color="#22c55e" size={30} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>WhatsApp</h3>
                    <p style={{ color: '#666', marginBottom: '1rem' }}>Quick chat for order updates.</p>
                    <a href="https://wa.me/918401926275" style={{ color: '#22c55e', fontWeight: 800, textDecoration: 'none', fontSize: '1.1rem' }}>Chat on WhatsApp</a>
                </div>
            </div>

            <div style={{ marginTop: '4rem', background: '#111', color: 'white', padding: '3rem', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Visit our physical store</h2>
                    <p style={{ opacity: 0.7 }}>See our full range and taste before you buy.</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
                        <MapPin color="var(--primary)" size={20} />
                        <span>Block-E, ASHRAYA-9, Chamunda Nagar, Ahmedabad</span>
                    </div>
                </div>
                <a href="https://www.google.com/maps/search/?api=1&query=Block-E, ASHRAYA-9, Chamunda Nagar, Kali, Ahmedabad, Gujarat 382470"
                    target="_blank" rel="noopener noreferrer"
                    style={{ background: 'white', color: '#111', padding: '1rem 2rem', borderRadius: '14px', fontWeight: 900, textDecoration: 'none' }}>
                    Open in Maps
                </a>
            </div>
        </div>
    );
};

export default ContactUs;
