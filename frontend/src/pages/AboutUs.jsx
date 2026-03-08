import React from 'react';

const AboutUs = () => {
    return (
        <div style={{ padding: '4rem 1rem', maxWidth: '800px', margin: '0 auto', lineHeight: 1.8 }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '2rem' }}>About Shridhar Enterprise</h1>
            <p style={{ fontSize: '1.2rem', color: '#444', marginBottom: '1.5rem', fontWeight: 600 }}>
                Serving tradition since 2026.
            </p>
            <p style={{ marginBottom: '1.5rem' }}>
                At Shridhar Enterprise, we believe that quality food is the cornerstone of a happy home.
                What started as a small passion for authentic Indian snacks has grown into a trusted destination for thousands of families in Ahmedabad and beyond.
            </p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '2.5rem', marginBottom: '1rem' }}>Our Mission</h2>
            <p style={{ marginBottom: '1.5rem' }}>
                Our mission is simple: To deliver the most authentic, fresh, and high-quality snacks and groceries
                directly to your doorstep with the same care and love that you'd find in your own kitchen.
            </p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '2.5rem', marginBottom: '1rem' }}>Why Choose Us?</h2>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '2rem' }}>
                <li><strong>Authenticity:</strong> We source from traditional regional brands and follow authentic recipes.</li>
                <li><strong>Quality First:</strong> Every product is checked for freshness and quality before it reaches you.</li>
                <li><strong>Local Support:</strong> As an Ahmedabad-based enterprise, we understand local tastes and needs better than anyone.</li>
                <li><strong>Fast Delivery:</strong> Our optimized logistics ensure your snacks reach you while they're still crisp.</li>
            </ul>
            <div style={{ background: '#fef2f2', padding: '2rem', borderRadius: '20px', border: '1px solid var(--primary)', marginTop: '3rem' }}>
                <h3 style={{ color: 'var(--primary)', fontWeight: 800, marginBottom: '0.5rem' }}>Visit Our Flagship Store</h3>
                <p>Block-E, ASHRAYA-9, Chamunda Nagar, Kali, Ahmedabad, Gujarat 382470</p>
            </div>
        </div>
    );
};

export default AboutUs;
