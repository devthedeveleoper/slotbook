import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/events — Public listing of active events
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const skip = (page - 1) * limit;

  const where = {
    isActive: true,
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { location: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        priceCents: true,
        currency: true,
        imageUrl: true,
        createdAt: true,
        admin: {
          select: { name: true },
        },
        timeSlots: {
          where: {
            status: "AVAILABLE",
            startTime: { gte: new Date() },
          },
          select: { id: true },
        },
        _count: {
          select: {
            timeSlots: {
              where: {
                status: "AVAILABLE",
                startTime: { gte: new Date() },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  // Add available slot count
  const eventsWithCount = events.map((event) => ({
    ...event,
    availableSlots: event._count.timeSlots,
    timeSlots: undefined,
    _count: undefined,
  }));

  return Response.json({
    events: eventsWithCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
