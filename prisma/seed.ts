import { AuthProvider, PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const imagePool = [
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304",
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
];

const roomTypes = [
  {
    name: "Superior Twin",
    description: "Modern twin room with garden view",
    size: 32,
    price: 150,
    totalCount: 12,
    normalCapacity: 2,
    maxCapacity: 4,
  },
  {
    name: "Superior Queen",
    description: "Queen bed room with balcony",
    size: 35,
    price: 150,
    totalCount: 10,
    normalCapacity: 2,
    maxCapacity: 4,
  },
  {
    name: "Triple Room",
    description: "Comfortable triple guest room",
    size: 40,
    price: 180,
    totalCount: 8,
    normalCapacity: 3,
    maxCapacity: 5,
  },
  {
    name: "Junior Suite",
    description: "Elegant junior suite with lounge area",
    size: 55,
    price: 250,
    totalCount: 6,
    normalCapacity: 2,
    maxCapacity: 4,
  },
  {
    name: "Executive Room",
    description: "Executive business-class room",
    size: 48,
    price: 320,
    totalCount: 5,
    normalCapacity: 2,
    maxCapacity: 4,
  },
  {
    name: "Suite",
    description: "Premium luxury suite",
    size: 70,
    price: 450,
    totalCount: 4,
    normalCapacity: 2,
    maxCapacity: 4,
  },
  {
    name: "Family Suite",
    description: "Spacious suite for families",
    size: 85,
    price: 550,
    totalCount: 4,
    normalCapacity: 4,
    maxCapacity: 6,
  },
  {
    name: "King Suite",
    description: "King-size luxury suite",
    size: 95,
    price: 950,
    totalCount: 3,
    normalCapacity: 4,
    maxCapacity: 6,
  },
  {
    name: "One Bedroom Cottage",
    description: "Private cottage with one bedroom",
    size: 100,
    price: 250,
    totalCount: 3,
    normalCapacity: 2,
    maxCapacity: 4,
  },
  {
    name: "Two Bedroom Cottage",
    description: "Large cottage with two bedrooms",
    size: 140,
    price: 400,
    totalCount: 2,
    normalCapacity: 4,
    maxCapacity: 7,
  },
  {
    name: "Three Bedroom Cottage",
    description: "Luxury cottage for large families",
    size: 180,
    price: 550,
    totalCount: 2,
    normalCapacity: 6,
    maxCapacity: 10,
  },
];

async function main() {
   // ADMIN
  // await prisma.user.create({
  //   data: {
  //     email: "admin@garden.com",
  //     name: "System Admin",
  //     password: "hashed_password",
  //     role: UserRole.ADMIN,
  //     provider: AuthProvider.LOCAL,
  //   },
  // });
await prisma.user.upsert({
  where: {
    email: "admin@garden.com",
  },
  update: {},
  create: {
    email: "admin@garden.com",
    name: "System Admin",
    password: "hashed_password",
    role: UserRole.ADMIN,
    provider: AuthProvider.LOCAL,
  },
});
  // CUSTOMER
 const customer = await prisma.user.upsert({
  where: {
    email: "user@garden.com",
  },
  update: {},
  create: {
    email: "user@garden.com",
    name: "Murad",
    password: "hashed_password",
    role: UserRole.CUSTOMER,
    provider: AuthProvider.LOCAL,
  },
});
  for (const room of roomTypes) {
    await prisma.roomType.create({
      data: {
        ...room,
        images: {
          create: [
            {
              imageUrl:
                imagePool[Math.floor(Math.random() * imagePool.length)],
            },
            {
              imageUrl:
                imagePool[Math.floor(Math.random() * imagePool.length)],
            },
          ],
        },
      },
    });
  }

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });