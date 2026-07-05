import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

// POST /api/checkout — Create a Stripe Checkout Session for a pending booking
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return Response.json({ error: "Booking ID is required" }, { status: 400 });
    }

    // Fetch the booking with event details
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
        userId: session.user.id,
        status: "PENDING",
      },
      include: {
        slot: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!booking) {
      return Response.json(
        { error: "Booking not found or not in pending state" },
        { status: 404 }
      );
    }

    const event = booking.slot.event;

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: event.currency,
            product_data: {
              name: event.title,
              description: `Booking for ${new Date(booking.slot.startTime).toLocaleString()}`,
            },
            unit_amount: event.priceCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXTAUTH_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/booking/cancel?booking_id=${bookingId}`,
      metadata: {
        bookingId: booking.id,
        userId: session.user.id,
      },
      customer_email: session.user.email || undefined,
    });

    // Save the Stripe session ID to the booking
    await prisma.booking.update({
      where: { id: bookingId },
      data: { stripeSessionId: checkoutSession.id },
    });

    return Response.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
