"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewEventPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("usd");

  // Bulk slot generation
  const [slotDate, setSlotDate] = useState("");
  const [startHour, setStartHour] = useState("9");
  const [endHour, setEndHour] = useState("17");
  const [slotDuration, setSlotDuration] = useState("30");
  const [maxBookings, setMaxBookings] = useState("1");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Step 1: Create the event
      const eventRes = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          location: location || undefined,
          priceCents: Math.round(parseFloat(price || "0") * 100),
          currency,
        }),
      });

      const eventData = await eventRes.json();

      if (!eventRes.ok) {
        setError(eventData.error || "Failed to create event");
        return;
      }

      // Step 2: Generate slots if date is provided
      if (slotDate) {
        const slotRes = await fetch(
          `/api/admin/events/${eventData.event.id}/slots`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: slotDate,
              startHour: parseInt(startHour),
              endHour: parseInt(endHour),
              slotDurationMinutes: parseInt(slotDuration),
              maxBookings: parseInt(maxBookings),
            }),
          }
        );

        const slotData = await slotRes.json();

        if (!slotRes.ok) {
          setError(
            `Event created but slot generation failed: ${slotData.error}`
          );
          return;
        }
      }

      router.push("/admin/events");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: "700px" }}>
      <div className="page-header">
        <h1>Create New Event</h1>
        <p className="text-secondary">
          Set up an event and generate available time slots
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <span>⚠️</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Event Details */}
        <div className="card mb-6">
          <h3 className="mb-4">Event Details</h3>

          <div className="auth-form">
            <div className="input-group">
              <label htmlFor="title">Event Title *</label>
              <input
                id="title"
                className="input"
                placeholder="e.g., Guitar Lesson, Consultation, Haircut"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                className="input"
                placeholder="Describe your event or service..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="input-group">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                className="input"
                placeholder="e.g., 123 Main St, Room 4B, or Online"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2">
              <div className="input-group">
                <label htmlFor="price">Price ($)</label>
                <input
                  id="price"
                  type="number"
                  className="input"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <span className="text-xs text-secondary">
                  Leave at 0 for free events
                </span>
              </div>

              <div className="input-group">
                <label htmlFor="currency">Currency</label>
                <select
                  id="currency"
                  className="input"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="usd">USD ($)</option>
                  <option value="eur">EUR (€)</option>
                  <option value="gbp">GBP (£)</option>
                  <option value="inr">INR (₹)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Slot Generation */}
        <div className="card mb-6">
          <h3 className="mb-2">Time Slots</h3>
          <p className="text-sm text-secondary mb-4">
            Generate time slots automatically. You can add more slots later.
          </p>

          <div className="auth-form">
            <div className="input-group">
              <label htmlFor="slotDate">Date</label>
              <input
                id="slotDate"
                type="date"
                className="input"
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2">
              <div className="input-group">
                <label htmlFor="startHour">Start Hour</label>
                <select
                  id="startHour"
                  className="input"
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="endHour">End Hour</label>
                <select
                  id="endHour"
                  className="input"
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {(i + 1).toString().padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2">
              <div className="input-group">
                <label htmlFor="slotDuration">Slot Duration (minutes)</label>
                <select
                  id="slotDuration"
                  className="input"
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(e.target.value)}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="maxBookings">Max Bookings per Slot</label>
                <input
                  id="maxBookings"
                  type="number"
                  className="input"
                  min="1"
                  value={maxBookings}
                  onChange={(e) => setMaxBookings(e.target.value)}
                />
              </div>
            </div>

            {slotDate && (
              <div className="alert alert-info">
                <span>ℹ️</span>
                This will generate{" "}
                {Math.floor(
                  ((parseInt(endHour) - parseInt(startHour)) * 60) /
                    parseInt(slotDuration)
                )}{" "}
                slots of {slotDuration} minutes each, from{" "}
                {parseInt(startHour).toString().padStart(2, "0")}:00 to{" "}
                {parseInt(endHour).toString().padStart(2, "0")}:00 on{" "}
                {new Date(slotDate + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                .
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg w-full"
          disabled={loading || !title}
        >
          {loading ? (
            <>
              <span className="loading-spinner" /> Creating...
            </>
          ) : (
            "Create Event"
          )}
        </button>
      </form>
    </div>
  );
}
