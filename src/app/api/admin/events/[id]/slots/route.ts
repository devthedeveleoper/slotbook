import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createSlotSchema, bulkCreateSlotsSchema } from "@/lib/validators";

// GET /api/admin/events/[id]/slots — List slots for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id, adminId: session.user.id },
  });

  if (!event) {
    return Response.json({ error: "Event not found" }, { status: 404 });
  }

  const slots = await prisma.timeSlot.findMany({
    where: { eventId: id },
    include: {
      bookings: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  return Response.json({ slots });
}

// POST /api/admin/events/[id]/slots — Create slots (single or bulk)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  // Verify event ownership
  const event = await prisma.event.findUnique({
    where: { id, adminId: session.user.id },
  });

  if (!event) {
    return Response.json({ error: "Event not found" }, { status: 404 });
  }

  try {
    const body = await request.json();

    // Check if this is a bulk creation request
    if (body.date && body.startHour !== undefined) {
      const validation = bulkCreateSlotsSchema.safeParse(body);

      if (!validation.success) {
        return Response.json(
          { error: "Validation failed", details: validation.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { date, startHour, endHour, slotDurationMinutes, maxBookings } =
        validation.data;

      // Generate time slots
      const slots = [];
      const baseDate = new Date(`${date}T00:00:00.000Z`);

      let currentMinutes = startHour * 60;
      const endMinutes = endHour * 60;

      while (currentMinutes + slotDurationMinutes <= endMinutes) {
        const startTime = new Date(baseDate);
        startTime.setUTCMinutes(currentMinutes);

        const endTime = new Date(baseDate);
        endTime.setUTCMinutes(currentMinutes + slotDurationMinutes);

        slots.push({
          eventId: id,
          startTime,
          endTime,
          maxBookings,
        });

        currentMinutes += slotDurationMinutes;
      }

      if (slots.length === 0) {
        return Response.json(
          { error: "No valid slots could be generated with these parameters" },
          { status: 400 }
        );
      }

      const created = await prisma.timeSlot.createMany({ data: slots });

      return Response.json(
        { message: `${created.count} slots created`, count: created.count },
        { status: 201 }
      );
    }

    // Single slot creation
    const validation = createSlotSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const slot = await prisma.timeSlot.create({
      data: {
        eventId: id,
        startTime: new Date(validation.data.startTime),
        endTime: new Date(validation.data.endTime),
        maxBookings: validation.data.maxBookings,
      },
    });

    return Response.json({ slot }, { status: 201 });
  } catch (error) {
    console.error("Create slot error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
