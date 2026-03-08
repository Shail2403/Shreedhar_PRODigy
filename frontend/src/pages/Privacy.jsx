import React from 'react';

const Privacy = () => {
    return (
        <div style={{ padding: '4rem 1rem', maxWidth: '800px', margin: '0 auto', lineHeight: 1.8 }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '2rem' }}>Privacy Policy</h1>
            <p style={{ color: '#666', marginBottom: '2rem' }}>Last Updated: March 2026</p>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>1. Data We Collect</h2>
                <p>We collect your phone number, name, and address to process your orders and provide delivery services. If you register via email, we store your email address securely.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>2. How We Use Your Data</h2>
                <p>Your data is used exclusively for order processing, customer support, and notifying you about your order status. We do not sell your personal information to third parties.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>3. Data Security</h2>
                <p>We use industry-standard encryption and secure servers to protect your sensitive information. Your payment details are processed through secure gateways like PayPal.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>4. Your Rights</h2>
                <p>You can request to view, edit, or delete your personal data at any time by contacting us through the support channel.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>5. Cookies</h2>
                <p>We use essential cookies to maintain your login session and shopping cart contents.</p>
            </section>
        </div>
    );
};

export default Privacy;
