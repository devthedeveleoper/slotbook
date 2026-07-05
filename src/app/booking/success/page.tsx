"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <>
      <div style={{ fontSize: "4rem", marginBottom: "var(--space-4)" }}>
        🎉
      </div>
      <h1 style={{ fontSize: "var(--text-3xl)" }}>Booking Confirmed!</h1>
      <p className="text-secondary mt-2 mb-6">
        Your appointment has been successfully booked and payment received.
        You&apos;ll receive a confirmation with all the details.
      </p>

      {sessionId && (
        <p className="text-xs text-secondary mb-6">
          Payment reference: {sessionId.slice(0, 20)}...
        </p>
      )}

      <div className="flex gap-3" style={{ justifyContent: "center" }}>
        <Link href="/dashboard" className="btn btn-primary">
          View My Bookings
        </Link>
        <Link href="/events" className="btn btn-secondary">
          Browse More Events
        </Link>
      </div>
    </>
  );
}

export default function BookingSuccessPage() {
  return (
    <div className="auth-container">
      <div className="auth-card animate-scale-in" style={{ textAlign: "center" }}>
        <Suspense fallback={<div className="loading-spinner mx-auto block" />}>
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  );
}
