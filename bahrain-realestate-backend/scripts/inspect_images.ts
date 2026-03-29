
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("--- Company Properties Images ---");
  const propImages = await prisma.propertyImage.findMany({ take: 3 });
  console.log(propImages);

  console.log("\n--- Individual Property Images ---");
  // @ts-ignore
  const indImages = await prisma.individualPropertyImage.findMany({ take: 3 });
  console.log(indImages);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
