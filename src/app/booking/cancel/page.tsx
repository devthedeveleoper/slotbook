"use client";

import Link from "next/link";

export default function BookingCancelPage() {
  return (
    <div className="auth-container">
      <div className="auth-card animate-scale-in" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "var(--space-4)" }}>
          😔
        </div>
        <h1 style={{ fontSize: "var(--text-3xl)" }}>Payment Cancelled</h1>
        <p className="text-secondary mt-2 mb-6">
          Your payment was cancelled. Don&apos;t worry — no charges were made.
          Your slot reservation will be released shortly.
        </p>

        <div className="flex gap-3" style={{ justifyContent: "center" }}>
          <Link href="/events" className="btn btn-primary">
            Try Again
          </Link>
          <Link href="/dashboard" className="btn btn-secondary">
            My Bookings
          </Link>
        </div>
      </div>
    </div>
  );
}
