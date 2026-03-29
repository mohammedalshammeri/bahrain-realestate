
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Fixing image URLs...");

  const images = await prisma.propertyImage.findMany();

  for (const img of images) {
    if (img.imageUrl.startsWith('http')) {
      try {
        const url = new URL(img.imageUrl);
        const relativePath = url.pathname;
        
        console.log(`Fixing ${img.id}: ${img.imageUrl} -> ${relativePath}`);
        
        await prisma.propertyImage.update({
          where: { id: img.id },
          data: { imageUrl: relativePath }
        });
      } catch (e) {
        console.error(`Could not parse URL for image ${img.id}: ${img.imageUrl}`);
      }
    }
  }

  console.log("Done.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
