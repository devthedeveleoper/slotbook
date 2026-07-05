"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-brand">
        <span className="brand-icon">📅</span>
        SlotBook
      </Link>

      <div className="navbar-links">
        <Link
          href="/events"
          className={`nav-link ${pathname === "/events" ? "active" : ""}`}
        >
          Browse Events
        </Link>

        {status === "loading" ? (
          <span className="loading-spinner" />
        ) : session ? (
          <>
            <Link
              href="/dashboard"
              className={`nav-link ${pathname === "/dashboard" ? "active" : ""}`}
            >
              My Bookings
            </Link>

            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className={`nav-link ${pathname.startsWith("/admin") ? "active" : ""}`}
              >
                Admin
              </Link>
            )}

            <button
              className="btn btn-ghost btn-sm"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="btn btn-ghost btn-sm">
              Sign In
            </Link>
            <Link href="/register" className="btn btn-primary btn-sm">
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
