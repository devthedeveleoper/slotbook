"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  priceCents: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  _count: { timeSlots: number };
  timeSlots: Array<{
    id: string;
    currentBookings: number;
    maxBookings: number;
    status: string;
  }>;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/admin/events");
        const data = await res.json();
        if (res.ok) {
          setEvents(data.events);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const toggleEventStatus = async (eventId: string, isActive: boolean) => {
    try {
      const method = isActive ? "DELETE" : "PUT";
      const body = isActive ? undefined : JSON.stringify({ isActive: true });

      const res = await fetch(`/api/admin/events/${eventId}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : {},
        body,
      });

      if (res.ok) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId ? { ...e, isActive: !isActive } : e
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle event:", error);
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <span className="loading-spinner" style={{ width: 40, height: 40 }} />
        <p className="text-secondary">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1>Events</h1>
          <p className="text-secondary">Manage your events and time slots</p>
        </div>
        <Link href="/admin/events/new" className="btn btn-primary">
          ➕ Create Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🗓️</div>
          <h3>No events yet</h3>
          <p>Create your first event to start accepting bookings.</p>
          <Link href="/admin/events/new" className="btn btn-primary">
            Create Event
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Price</th>
                <th>Slots</th>
                <th>Bookings</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const totalBookings = event.timeSlots.reduce(
                  (sum, s) => sum + s.currentBookings,
                  0
                );
                const totalCapacity = event.timeSlots.reduce(
                  (sum, s) => sum + s.maxBookings,
                  0
                );

                return (
                  <tr key={event.id}>
                    <td>
                      <div className="font-semibold">{event.title}</div>
                      <div className="text-xs text-secondary">
                        Created{" "}
                        {new Date(event.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="font-semibold">
                      {event.priceCents === 0
                        ? "Free"
                        : formatPrice(event.priceCents, event.currency)}
                    </td>
                    <td>{event._count.timeSlots}</td>
                    <td>
                      {totalBookings} / {totalCapacity}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          event.isActive ? "badge-success" : "badge-error"
                        }`}
                      >
                        {event.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          View
                        </Link>
                        <button
                          className={`btn btn-sm ${
                            event.isActive ? "btn-danger" : "btn-secondary"
                          }`}
                          onClick={() =>
                            toggleEventStatus(event.id, event.isActive)
                          }
                        >
                          {event.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
