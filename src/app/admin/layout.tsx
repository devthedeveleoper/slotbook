"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-section-title">Admin Panel</div>

        <Link
          href="/admin/dashboard"
          className={`sidebar-link ${
            pathname === "/admin/dashboard" ? "active" : ""
          }`}
        >
          📊 Dashboard
        </Link>

        <Link
          href="/admin/events"
          className={`sidebar-link ${
            pathname === "/admin/events" || pathname === "/admin/events/new"
              ? "active"
              : ""
          }`}
        >
          🗓️ Events
        </Link>

        <div className="sidebar-section-title" style={{ marginTop: "auto" }}>
          Quick Actions
        </div>

        <Link href="/admin/events/new" className="sidebar-link">
          ➕ New Event
        </Link>

        <Link href="/events" className="sidebar-link">
          🌐 Public Site
        </Link>
      </aside>

      <main className="admin-content">{children}</main>
    </div>
  );
}
