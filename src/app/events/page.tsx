"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  createdAt: string;
  admin: { name: string };
  availableSlots: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const fetchEvents = useCallback(async (page = 1, searchTerm = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        ...(searchTerm && { search: searchTerm }),
      });

      const res = await fetch(`/api/events?${params}`);
      const data = await res.json();

      setEvents(data.events);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchEvents(1, search);
    }, 300);
    return () => clearTimeout(debounce);
  }, [search, fetchEvents]);

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Browse Events</h1>
        <p>Find and book available time slots for upcoming events</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <input
          type="text"
          className="input"
          placeholder="🔍  Search events by name, description, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: "500px" }}
        />
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="loading-page">
          <span className="loading-spinner" style={{ width: 40, height: 40 }} />
          <p className="text-secondary">Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No events found</h3>
          <p>
            {search
              ? "Try adjusting your search terms"
              : "Check back later for new events"}
          </p>
        </div>
      ) : (
        <>
          <div className="events-grid stagger-children">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="event-card">
                  <div className="event-card-image">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        style={{
                          width: "100%",
                          height: "200px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div className="event-card-image-placeholder">
                        📅
                      </div>
                    )}
                  </div>
                  <div className="event-card-body">
                    <h3 className="event-card-title">{event.title}</h3>
                    <div className="event-card-meta">
                      {event.location && (
                        <span>📍 {event.location}</span>
                      )}
                      <span>👤 by {event.admin.name}</span>
                    </div>
                    <div className="event-card-footer">
                      <span className="event-price">
                        {event.priceCents === 0
                          ? "Free"
                          : formatPrice(event.priceCents, event.currency)}
                      </span>
                      <span
                        className={`badge ${
                          event.availableSlots > 0
                            ? "badge-success"
                            : "badge-error"
                        }`}
                      >
                        {event.availableSlots > 0
                          ? `${event.availableSlots} slots`
                          : "Fully booked"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div
              className="flex items-center justify-between mt-8"
              style={{ maxWidth: "300px", margin: "2rem auto 0" }}
            >
              <button
                className="btn btn-secondary btn-sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchEvents(pagination.page - 1, search)}
              >
                ← Previous
              </button>
              <span className="text-sm text-secondary">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchEvents(pagination.page + 1, search)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
