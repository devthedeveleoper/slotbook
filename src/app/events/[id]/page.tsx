"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  maxBookings: number;
  currentBookings: number;
  status: string;
}

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  createdAt: string;
  admin: { name: string };
  timeSlots: TimeSlot[];
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${id}`);
        const data = await res.json();
        if (res.ok) {
          setEvent(data.event);
        }
      } catch (err) {
        console.error("Failed to fetch event:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  // Group slots by date
  const slotsByDate = event?.timeSlots.reduce(
    (groups: Record<string, TimeSlot[]>, slot) => {
      const date = new Date(slot.startTime).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(slot);
      return groups;
    },
    {}
  );

  const handleBook = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=/events/${id}`);
      return;
    }

    if (!selectedSlot) return;

    setBooking(true);
    setError("");
    setSuccess("");

    try {
      // Step 1: Create the booking
      const bookRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: selectedSlot }),
      });

      const bookData = await bookRes.json();

      if (!bookRes.ok) {
        setError(bookData.error || "Failed to create booking");
        return;
      }

      // Step 2: If the event costs money, redirect to Stripe checkout
      if (event && event.priceCents > 0) {
        const checkoutRes = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: bookData.booking.id }),
        });

        const checkoutData = await checkoutRes.json();

        if (checkoutRes.ok && checkoutData.url) {
          window.location.href = checkoutData.url;
          return;
        } else {
          setError("Failed to create checkout session");
          return;
        }
      }

      // Free event — booking is already confirmed
      setSuccess("Booking confirmed! Redirecting to your dashboard...");
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <span className="loading-spinner" style={{ width: 40, height: 40 }} />
        <p className="text-secondary">Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="empty-state" style={{ minHeight: "50vh" }}>
        <div className="empty-state-icon">🔍</div>
        <h3>Event Not Found</h3>
        <p>This event may have been removed or is no longer available.</p>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: "900px" }}>
      <div className="animate-fade-in">
        {/* Event Header */}
        <div className="card mb-6">
          {event.imageUrl && (
            <img
              src={event.imageUrl}
              alt={event.title}
              style={{
                width: "100%",
                height: "300px",
                objectFit: "cover",
                borderRadius: "var(--radius-lg)",
                marginBottom: "var(--space-6)",
              }}
            />
          )}
          <h1 className="mb-2">{event.title}</h1>
          <div className="flex gap-4 mb-4" style={{ flexWrap: "wrap" }}>
            {event.location && (
              <span className="text-secondary">📍 {event.location}</span>
            )}
            <span className="text-secondary">👤 by {event.admin.name}</span>
            <span className="event-price" style={{ fontSize: "var(--text-lg)" }}>
              {event.priceCents === 0
                ? "Free"
                : formatPrice(event.priceCents, event.currency)}
            </span>
          </div>
          {event.description && (
            <p className="text-secondary">{event.description}</p>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error mb-4">
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success mb-4">
            <span>✅</span> {success}
          </div>
        )}

        {/* Slot Selection */}
        <h2 className="mb-4">Select a Time Slot</h2>

        {!slotsByDate || Object.keys(slotsByDate).length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No Available Slots</h3>
            <p>All time slots for this event have been booked or haven&apos;t been added yet.</p>
          </div>
        ) : (
          <>
            {Object.entries(slotsByDate).map(([date, slots]) => (
              <div key={date} className="mb-6">
                <h4 className="mb-3 text-secondary">{date}</h4>
                <div className="slot-grid">
                  {slots.map((slot) => {
                    const isFull =
                      slot.currentBookings >= slot.maxBookings ||
                      slot.status === "FULL";
                    const isSelected = selectedSlot === slot.id;

                    return (
                      <div
                        key={slot.id}
                        className={`slot-item ${isFull ? "slot-full" : ""} ${
                          isSelected ? "slot-selected" : ""
                        }`}
                        onClick={() => !isFull && setSelectedSlot(slot.id)}
                      >
                        <div className="slot-time">
                          {formatTime(slot.startTime)} –{" "}
                          {formatTime(slot.endTime)}
                        </div>
                        <div className="slot-availability">
                          {isFull
                            ? "Fully booked"
                            : `${slot.maxBookings - slot.currentBookings} spot${
                                slot.maxBookings - slot.currentBookings !== 1
                                  ? "s"
                                  : ""
                              } left`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Book Button */}
            <div className="mt-8" style={{ textAlign: "center" }}>
              <button
                className="btn btn-primary btn-lg"
                disabled={!selectedSlot || booking}
                onClick={handleBook}
              >
                {booking ? (
                  <>
                    <span className="loading-spinner" /> Processing...
                  </>
                ) : !session ? (
                  "Sign in to Book"
                ) : event.priceCents > 0 ? (
                  `Book & Pay ${formatPrice(event.priceCents, event.currency)}`
                ) : (
                  "Book Now — Free"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
