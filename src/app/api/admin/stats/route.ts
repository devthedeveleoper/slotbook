import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/admin/stats — Admin dashboard statistics
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const adminId = session.user.id;

  // Get all events for this admin
  const adminEvents = await prisma.event.findMany({
    where: { adminId },
    select: { id: true },
  });

  const eventIds = adminEvents.map((e) => e.id);

  // Parallel queries for stats
  const [
    totalBookings,
    confirmedBookings,
    pendingBookings,
    cancelledBookings,
    totalEvents,
    activeEvents,
    recentBookings,
  ] = await Promise.all([
    // Total bookings across all admin's events
    prisma.booking.count({
      where: { slot: { eventId: { in: eventIds } } },
    }),
    prisma.booking.count({
      where: { slot: { eventId: { in: eventIds } }, status: "CONFIRMED" },
    }),
    prisma.booking.count({
      where: { slot: { eventId: { in: eventIds } }, status: "PENDING" },
    }),
    prisma.booking.count({
      where: { slot: { eventId: { in: eventIds } }, status: "CANCELLED" },
    }),
    // Events
    prisma.event.count({ where: { adminId } }),
    prisma.event.count({ where: { adminId, isActive: true } }),
    // Recent bookings with details
    prisma.booking.findMany({
      where: { slot: { eventId: { in: eventIds } } },
      include: {
        user: { select: { name: true, email: true } },
        slot: {
          include: {
            event: { select: { title: true, priceCents: true, currency: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  // Calculate revenue from confirmed bookings
  const revenueResult = await prisma.booking.aggregate({
    where: {
      slot: { eventId: { in: eventIds } },
      status: "CONFIRMED",
    },
    _sum: { amountPaidCents: true },
  });

  // Revenue this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyRevenueResult = await prisma.booking.aggregate({
    where: {
      slot: { eventId: { in: eventIds } },
      status: "CONFIRMED",
      createdAt: { gte: startOfMonth },
    },
    _sum: { amountPaidCents: true },
  });

  return Response.json({
    stats: {
      totalRevenue: revenueResult._sum.amountPaidCents || 0,
      monthlyRevenue: monthlyRevenueResult._sum.amountPaidCents || 0,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      totalEvents,
      activeEvents,
      averageBookingValue:
        confirmedBookings > 0
          ? Math.round(
              (revenueResult._sum.amountPaidCents || 0) / confirmedBookings
            )
          : 0,
    },
    recentBookings,
  });
}
