"use client";

import { useState, useEffect } from "react";

interface Stats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalEvents: number;
  activeEvents: number;
  averageBookingValue: number;
}

interface RecentBooking {
  id: string;
  status: string;
  createdAt: string;
  user: { name: string; email: string };
  slot: {
    event: { title: string; priceCents: number; currency: string };
    startTime: string;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        if (res.ok) {
          setStats(data.stats);
          setRecentBookings(data.recentBookings);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
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
      default:
        return "badge-info";
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <span className="loading-spinner" style={{ width: 40, height: 40 }} />
        <p className="text-secondary">Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="empty-state">
        <h3>Failed to load dashboard</h3>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of your events and bookings</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid stagger-children mb-8">
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{formatCurrency(stats.monthlyRevenue)}</div>
          <div className="stat-label">This Month</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.totalBookings}</div>
          <div className="stat-label">Total Bookings</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.activeEvents}</div>
          <div className="stat-label">Active Events</div>
        </div>
      </div>

      {/* Booking Status Breakdown */}
      <div className="grid grid-cols-3 mb-8">
        <div className="card text-center">
          <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--success)" }}>
            {stats.confirmedBookings}
          </div>
          <div className="text-sm text-secondary">Confirmed</div>
        </div>
        <div className="card text-center">
          <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--warning)" }}>
            {stats.pendingBookings}
          </div>
          <div className="text-sm text-secondary">Pending</div>
        </div>
        <div className="card text-center">
          <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--error)" }}>
            {stats.cancelledBookings}
          </div>
          <div className="text-sm text-secondary">Cancelled</div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <h2 className="mb-4">Recent Bookings</h2>
      {recentBookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No bookings yet</h3>
          <p>Bookings will appear here once users start booking your events.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Event</th>
                <th>Date</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <div className="font-semibold">{booking.user.name}</div>
                    <div className="text-xs text-secondary">
                      {booking.user.email}
                    </div>
                  </td>
                  <td>{booking.slot.event.title}</td>
                  <td className="text-sm">
                    {new Date(booking.slot.startTime).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" }
                    )}
                  </td>
                  <td>
                    <span className={`badge ${statusBadgeClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="font-semibold">
                    {formatCurrency(booking.slot.event.priceCents)}
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
