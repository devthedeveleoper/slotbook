import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content animate-fade-in">
          <h1>
            Book Your Next
            <br />
            <span className="gradient-text">Appointment</span> Instantly
          </h1>
          <p>
            SlotBook makes scheduling effortless. Browse available time slots,
            book in seconds, and get instant confirmation — all with secure
            payment processing.
          </p>
          <div className="hero-actions">
            <Link href="/events" className="btn btn-primary btn-lg">
              Browse Events
            </Link>
            <Link href="/register" className="btn btn-secondary btn-lg">
              Create an Account
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="text-center mb-8">
          Everything You Need for{" "}
          <span className="gradient-text">Seamless Booking</span>
        </h2>

        <div className="features-grid stagger-children">
          <div className="feature-card">
            <div className="feature-icon">🗓️</div>
            <h3>Smart Scheduling</h3>
            <p>
              Browse available time slots with real-time availability. No more
              phone calls or back-and-forth emails.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Race-Condition Safe</h3>
            <p>
              Our 3-layer booking protection uses database-level locks and
              constraints to prevent double-bookings, even under heavy load.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💳</div>
            <h3>Secure Payments</h3>
            <p>
              Powered by Stripe for PCI-compliant payment processing. Pay
              confidently with any major credit or debit card.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Admin Dashboard</h3>
            <p>
              Full control with revenue analytics, booking management, and
              real-time event monitoring for administrators.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Instant Confirmation</h3>
            <p>
              Get immediate booking confirmation with all the details you need.
              Manage your upcoming appointments from one place.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Mobile Responsive</h3>
            <p>
              Book from any device. Our responsive design ensures a premium
              experience on desktop, tablet, and mobile.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="text-center"
        style={{ padding: "5rem 2rem", maxWidth: "600px", margin: "0 auto" }}
      >
        <h2 className="mb-4">Ready to Get Started?</h2>
        <p className="text-secondary mb-6" style={{ fontSize: "var(--text-lg)" }}>
          Join SlotBook today and experience the future of appointment booking.
        </p>
        <Link href="/register" className="btn btn-primary btn-lg">
          Create Free Account
        </Link>
      </section>
    </main>
  );
}
