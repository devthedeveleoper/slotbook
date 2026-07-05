import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/events/[id] — Public event details with available slots
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id, isActive: true },
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
          startTime: { gte: new Date() },
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          maxBookings: true,
          currentBookings: true,
          status: true,
        },
        orderBy: { startTime: "asc" },
      },
    },
  });

  if (!event) {
    return Response.json({ error: "Event not found" }, { status: 404 });
  }

  return Response.json({ event });
}
