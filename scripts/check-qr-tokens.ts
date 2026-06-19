import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
db.pet.findMany({ select: { id: true, name: true, qrToken: true } })
  .then(r => console.log(JSON.stringify(r, null, 2)))
  .catch(console.error)
  .finally(() => db.$disconnect());
