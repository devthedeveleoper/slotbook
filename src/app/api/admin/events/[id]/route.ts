import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateEventSchema } from "@/lib/validators";

// GET /api/admin/events/[id] — Get single event with slots
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
    include: {
      timeSlots: {
        include: {
          bookings: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
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

// PUT /api/admin/events/[id] — Update event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validation = updateEventSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.event.findUnique({
      where: { id, adminId: session.user.id },
    });

    if (!existing) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    const event = await prisma.event.update({
      where: { id },
      data: validation.data,
    });

    return Response.json({ event });
  } catch (error) {
    console.error("Update event error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/events/[id] — Soft-delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.event.findUnique({
    where: { id, adminId: session.user.id },
  });

  if (!existing) {
    return Response.json({ error: "Event not found" }, { status: 404 });
  }

  await prisma.event.update({
    where: { id },
    data: { isActive: false },
  });

  return Response.json({ message: "Event deactivated" });
}
