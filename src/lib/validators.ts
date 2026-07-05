import { z } from "zod";

// ─── Auth Validators ──────────────────────────────────────

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─── Event Validators ─────────────────────────────────────

export const createEventSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters"),
  description: z.string().max(2000, "Description too long").optional(),
  location: z.string().max(300, "Location too long").optional(),
  priceCents: z
    .number()
    .int("Price must be a whole number (in cents)")
    .min(0, "Price cannot be negative"),
  currency: z.string().length(3, "Currency must be a 3-letter code").default("usd"),
  imageUrl: z.string().url("Invalid image URL").optional(),
});

export const updateEventSchema = createEventSchema.partial();

// ─── Slot Validators ──────────────────────────────────────

export const createSlotSchema = z.object({
  startTime: z.string().datetime("Invalid start time"),
  endTime: z.string().datetime("Invalid end time"),
  maxBookings: z.number().int().min(1, "Must allow at least 1 booking").default(1),
});

export const bulkCreateSlotsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(1).max(24),
  slotDurationMinutes: z.number().int().min(5).max(480),
  maxBookings: z.number().int().min(1).default(1),
});

// ─── Booking Validators ───────────────────────────────────

export const createBookingSchema = z.object({
  slotId: z.string().uuid("Invalid slot ID"),
});

// ─── Type exports ─────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateSlotInput = z.infer<typeof createSlotSchema>;
export type BulkCreateSlotsInput = z.infer<typeof bulkCreateSlotsSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
