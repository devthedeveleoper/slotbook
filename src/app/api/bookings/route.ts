import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createBookingSchema } from "@/lib/validators";
import { Prisma } from "@prisma/client";

// GET /api/bookings — List current user's bookings
export async function GET() {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: {
      slot: {
        include: {
          event: {
            select: {
              id: true,
              title: true,
              description: true,
              location: true,
              priceCents: true,
              currency: true,
              imageUrl: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ bookings });
}

// POST /api/bookings — Create a booking with race-condition-safe transaction
//
// DOUBLE-BOOKING PREVENTION (3-Layer Defense):
// 1. UNIQUE(user_id, slot_id) constraint — prevents same user booking same slot twice
// 2. CHECK via application logic — verifies current_bookings < max_bookings
// 3. SELECT ... FOR UPDATE — pessimistic lock serializes concurrent booking attempts
//
// This prevents the TOCTOU (Time-of-check to time-of-use) race condition where
// two transactions both read current_bookings=0 and both try to increment to 1.
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = createBookingSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { slotId } = validation.data;
    const userId = session.user.id;

    // Execute the entire booking in a serializable transaction
    const booking = await prisma.$transaction(async (tx) => {
      // LAYER 3: SELECT FOR UPDATE — Lock the slot row.
      // Any other concurrent transaction trying to book this slot will WAIT here
      // until our transaction commits or rolls back.
      const [slot] = await tx.$queryRaw<
        Array<{
          id: string;
          event_id: string;
          max_bookings: number;
          current_bookings: number;
          status: string;
        }>
      >`
        SELECT id, event_id, max_bookings, current_bookings, status
        FROM time_slots
        WHERE id = ${slotId}
        FOR UPDATE
      `;

      if (!slot) {
        throw new Error("SLOT_NOT_FOUND");
      }

      if (slot.status === "CANCELLED") {
        throw new Error("SLOT_CANCELLED");
      }

      // LAYER 2: Application-level check — verify availability AFTER acquiring lock
      if (slot.current_bookings >= slot.max_bookings) {
        throw new Error("SLOT_FULL");
      }

      // Check the event exists and is active
      const [event] = await tx.$queryRaw<
        Array<{ id: string; price_cents: number; is_active: boolean }>
      >`
        SELECT id, price_cents, is_active FROM events WHERE id = ${slot.event_id}
      `;

      if (!event || !event.is_active) {
        throw new Error("EVENT_NOT_AVAILABLE");
      }

      // Atomically increment current_bookings
      await tx.$executeRaw`
        UPDATE time_slots
        SET current_bookings = current_bookings + 1,
            status = CASE
              WHEN current_bookings + 1 >= max_bookings THEN 'FULL'::"SlotStatus"
              ELSE status
            END
        WHERE id = ${slotId}
      `;

      // LAYER 1: UNIQUE(user_id, slot_id) constraint — if this user already
      // booked this slot, the INSERT will fail with a unique violation error
      const newBooking = await tx.booking.create({
        data: {
          userId,
          slotId,
          status: event.price_cents > 0 ? "PENDING" : "CONFIRMED",
          amountPaidCents: event.price_cents,
        },
        include: {
          slot: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  priceCents: true,
                  currency: true,
                },
              },
            },
          },
        },
      });

      return newBooking;
    });

    return Response.json({ booking }, { status: 201 });
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      switch (error.message) {
        case "SLOT_NOT_FOUND":
          return Response.json({ error: "Time slot not found" }, { status: 404 });
        case "SLOT_CANCELLED":
          return Response.json({ error: "This time slot has been cancelled" }, { status: 410 });
        case "SLOT_FULL":
          return Response.json(
            { error: "This time slot is fully booked" },
            { status: 409 }
          );
        case "EVENT_NOT_AVAILABLE":
          return Response.json(
            { error: "This event is no longer available" },
            { status: 410 }
          );
      }
    }

    // Handle unique constraint violation (Layer 1: same user booking same slot)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "You have already booked this time slot" },
        { status: 409 }
      );
    }

    console.error("Booking error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
