"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Booking {
  id: string;
  status: string;
  amountPaidCents: number | null;
  createdAt: string;
  slot: {
    startTime: string;
    endTime: string;
    event: {
      id: string;
      title: string;
      description: string | null;
      location: string | null;
      priceCents: number;
      currency: string;
      imageUrl: string | null;
    };
  };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch("/api/bookings");
        const data = await res.json();
        if (res.ok) {
          setBookings(data.bookings);
        }
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "badge-success";
      case "PENDING":
        return "badge-warning";
      case "CANCELLED":
        return "badge-error";
      case "EXPIRED":
        return "badge-error";
      default:
        return "badge-info";
    }
  };

  const upcomingBookings = bookings.filter(
    (b) =>
      (b.status === "CONFIRMED" || b.status === "PENDING") &&
      new Date(b.slot.startTime) > new Date()
  );

  const pastBookings = bookings.filter(
    (b) =>
      b.status === "CANCELLED" ||
      b.status === "EXPIRED" ||
      new Date(b.slot.startTime) <= new Date()
  );

  if (loading) {
    return (
      <div className="loading-page">
        <span className="loading-spinner" style={{ width: 40, height: 40 }} />
        <p className="text-secondary">Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Bookings</h1>
        <p>Welcome back, {session?.user?.name || "User"}</p>
      </div>

      {/* Upcoming Bookings */}
      <h2 className="mb-4">Upcoming</h2>
      {upcomingBookings.length === 0 ? (
        <div className="empty-state" style={{ padding: "var(--space-10)" }}>
          <div className="empty-state-icon">📅</div>
          <h3>No upcoming bookings</h3>
          <p>Browse events to find something you&apos;d like to book!</p>
          <Link href="/events" className="btn btn-primary">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4 mb-8 stagger-children">
          {upcomingBookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <div className="booking-card-info">
                <h3>{booking.slot.event.title}</h3>
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-sm text-secondary">
                    🕐 {formatDateTime(booking.slot.startTime)} –{" "}
                    {new Date(booking.slot.endTime).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                  {booking.slot.event.location && (
                    <span className="text-sm text-secondary">
                      📍 {booking.slot.event.location}
                    </span>
                  )}
                </div>
              </div>
              <div className="booking-card-actions">
                <span className={`badge ${statusBadgeClass(booking.status)}`}>
                  {booking.status}
                </span>
                <span className="text-sm font-semibold mt-2">
                  {booking.slot.event.priceCents === 0
                    ? "Free"
                    : formatPrice(
                        booking.amountPaidCents || booking.slot.event.priceCents,
                        booking.slot.event.currency
                      )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <>
          <h2 className="mb-4 mt-8">Past & Cancelled</h2>
          <div className="flex flex-col gap-4 stagger-children">
            {pastBookings.map((booking) => (
              <div
                key={booking.id}
                className="booking-card"
                style={{ opacity: 0.6 }}
              >
                <div className="booking-card-info">
                  <h3>{booking.slot.event.title}</h3>
                  <span className="text-sm text-secondary">
                    🕐 {formatDateTime(booking.slot.startTime)}
                  </span>
                </div>
                <div className="booking-card-actions">
                  <span className={`badge ${statusBadgeClass(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
