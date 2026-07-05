import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace("?sslmode=require", "")
  : "postgresql://dummy:dummy@localhost:5432/dummy";

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ["error"] });

async function main() {
  console.log("🌱 Seeding database...\n");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@slotbook.com" },
    update: {},
    create: {
      email: "admin@slotbook.com",
      name: "Admin User",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin user created: ${admin.email} (password: admin123)`);

  // Create regular user
  const userPassword = await bcrypt.hash("user123", 12);
  const user = await prisma.user.upsert({
    where: { email: "user@slotbook.com" },
    update: {},
    create: {
      email: "user@slotbook.com",
      name: "Jane Doe",
      passwordHash: userPassword,
      role: "USER",
    },
  });
  console.log(`✅ Regular user created: ${user.email} (password: user123)`);

  // Create sample events
  const event1 = await prisma.event.create({
    data: {
      adminId: admin.id,
      title: "Guitar Lesson with Alex",
      description:
        "One-on-one guitar lessons for all skill levels. Bring your own guitar or use one of ours. We cover everything from basic chords to advanced finger-picking techniques.",
      location: "Music Studio, 456 Harmony Ave",
      priceCents: 4500,
      currency: "usd",
    },
  });

  const event2 = await prisma.event.create({
    data: {
      adminId: admin.id,
      title: "Web Development Consultation",
      description:
        "Get expert advice on your web development project. Whether you're building a new app, optimizing performance, or planning architecture — I can help.",
      location: "Online (Zoom)",
      priceCents: 7500,
      currency: "usd",
    },
  });

  const event3 = await prisma.event.create({
    data: {
      adminId: admin.id,
      title: "Yoga & Meditation Session",
      description:
        "A relaxing 60-minute yoga and meditation class suitable for beginners and experienced practitioners alike. Mats provided.",
      location: "Serenity Wellness Center, 789 Calm St",
      priceCents: 2000,
      currency: "usd",
    },
  });

  const event4 = await prisma.event.create({
    data: {
      adminId: admin.id,
      title: "Free Portfolio Review",
      description:
        "Get your design or development portfolio reviewed by an industry professional. Limited slots available each week.",
      location: "Online (Google Meet)",
      priceCents: 0,
      currency: "usd",
    },
  });

  console.log(`✅ Created ${4} sample events`);

  // Generate time slots for each event (next 3 days)
  const events = [event1, event2, event3, event4];
  let totalSlots = 0;

  for (const event of events) {
    for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);
      date.setHours(0, 0, 0, 0);

      const slots = [];
      const startHour = 9;
      const endHour = 17;
      const durationMinutes = event === event3 ? 60 : 30;

      let currentMinutes = startHour * 60;
      while (currentMinutes + durationMinutes <= endHour * 60) {
        const startTime = new Date(date);
        startTime.setUTCHours(0, 0, 0, 0);
        startTime.setUTCMinutes(currentMinutes);

        const endTime = new Date(date);
        endTime.setUTCHours(0, 0, 0, 0);
        endTime.setUTCMinutes(currentMinutes + durationMinutes);

        slots.push({
          eventId: event.id,
          startTime,
          endTime,
          maxBookings: event === event3 ? 5 : 1, // Yoga allows groups
        });

        currentMinutes += durationMinutes;
      }

      await prisma.timeSlot.createMany({ data: slots });
      totalSlots += slots.length;
    }
  }

  console.log(`✅ Created ${totalSlots} time slots across 3 days\n`);

  console.log("🎉 Seeding complete!\n");
  console.log("Login credentials:");
  console.log("  Admin: admin@slotbook.com / admin123");
  console.log("  User:  user@slotbook.com / user123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
