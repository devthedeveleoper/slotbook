"use client";

import { useState, useEffect, use } from "react";

interface SlotBooking {
  id: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  maxBookings: number;
  currentBookings: number;
  status: string;
  bookings: SlotBooking[];
}

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  priceCents: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  timeSlots: TimeSlot[];
}

export default function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/admin/events/${id}`);
        const data = await res.json();
        if (res.ok) {
          setEvent(data.event);
        }
      } catch (error) {
        console.error("Failed to fetch event:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
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
      case "AVAILABLE":
        return "badge-success";
      case "FULL":
        return "badge-error";
      case "CANCELLED":
        return "badge-error";
      case "CONFIRMED":
        return "badge-success";
      case "PENDING":
        return "badge-warning";
      default:
        return "badge-info";
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <span className="loading-spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="empty-state">
        <h3>Event not found</h3>
      </div>
    );
  }

  const totalBookings = event.timeSlots.reduce(
    (sum, s) => sum + s.currentBookings,
    0
  );
  const totalCapacity = event.timeSlots.reduce(
    (sum, s) => sum + s.maxBookings,
    0
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="flex justify-between items-center">
          <div>
            <h1>{event.title}</h1>
            <p className="text-secondary">
              {event.location && `📍 ${event.location} · `}
              {event.priceCents === 0
                ? "Free"
                : formatPrice(event.priceCents, event.currency)}
              {" · "}
              <span className={`badge ${event.isActive ? "badge-success" : "badge-error"}`}>
                {event.isActive ? "Active" : "Inactive"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid mb-8">
        <div className="stat-card">
          <div className="stat-value">{event.timeSlots.length}</div>
          <div className="stat-label">Total Slots</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalBookings}</div>
          <div className="stat-label">Bookings</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {totalCapacity > 0
              ? `${Math.round((totalBookings / totalCapacity) * 100)}%`
              : "0%"}
          </div>
          <div className="stat-label">Fill Rate</div>
        </div>
      </div>

      {/* Time Slots Table */}
      <h2 className="mb-4">Time Slots</h2>
      {event.timeSlots.length === 0 ? (
        <div className="empty-state">
          <h3>No slots created yet</h3>
          <p>Add time slots via the event creation form.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Bookings</th>
                <th>Status</th>
                <th>Booked By</th>
              </tr>
            </thead>
            <tbody>
              {event.timeSlots.map((slot) => (
                <tr key={slot.id}>
                  <td className="font-semibold">
                    {formatDateTime(slot.startTime)} –{" "}
                    {new Date(slot.endTime).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </td>
                  <td>
                    {slot.currentBookings} / {slot.maxBookings}
                  </td>
                  <td>
                    <span className={`badge ${statusBadgeClass(slot.status)}`}>
                      {slot.status}
                    </span>
                  </td>
                  <td>
                    {slot.bookings.length === 0 ? (
                      <span className="text-secondary text-sm">—</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {slot.bookings.map((booking) => (
                          <div key={booking.id} className="text-sm">
                            <span className="font-semibold">
                              {booking.user.name}
                            </span>{" "}
                            <span
                              className={`badge ${statusBadgeClass(
                                booking.status
                              )}`}
                              style={{ fontSize: "0.65rem" }}
                            >
                              {booking.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
