import React from 'react';

const Terms = () => {
    return (
        <div style={{ padding: '4rem 1rem', maxWidth: '800px', margin: '0 auto', lineHeight: 1.8 }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '2rem' }}>Terms & Conditions</h1>
            <p style={{ color: '#666', marginBottom: '2rem' }}>Last Updated: March 2026</p>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>1. Introduction</h2>
                <p>Welcome to Shridhar Enterprise. By accessing this website and placing an order, you agree to be bound by these terms and conditions.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>2. Ordering and Delivery</h2>
                <p>We deliver within Ahmedabad. Delivery charges are calculated based on distance (₹10/km beyond 1km). We strive to deliver within 24-48 hours.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>3. Pricing</h2>
                <p>All prices include applicable GST. We reserve the right to change prices without prior notice.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>4. Returns and Refunds</h2>
                <p>Due to the perishable nature of food items, we only accept returns if the item is damaged or incorrect at the time of delivery.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>5. Limitation of Liability</h2>
                <p>Shridhar Enterprise shall not be liable for any indirect or consequential loss arising from the use of our products or website.</p>
            </section>
        </div>
    );
};

export default Terms;
