import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createEventSchema } from "@/lib/validators";

// GET /api/admin/events — List all events for admin
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const events = await prisma.event.findMany({
    where: { adminId: session.user.id },
    include: {
      timeSlots: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          maxBookings: true,
          currentBookings: true,
          status: true,
        },
      },
      _count: {
        select: { timeSlots: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ events });
}

// POST /api/admin/events — Create a new event
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = createEventSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        ...validation.data,
        adminId: session.user.id,
      },
    });

    return Response.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Create event error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
