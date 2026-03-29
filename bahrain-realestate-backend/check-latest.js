const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestProperties() {
  try {
    const properties = await prisma.property.findMany({
      include: {
        propertyImages: true
      },
      orderBy: { id: 'desc' },
      take: 5
    });

    console.log('🔍 Latest 5 properties:');
    
    for (const prop of properties) {
      console.log(`\n🏠 Property ID: ${prop.id}`);
      console.log(`  Title: ${prop.titleAr || prop.titleEn || 'No title'}`);
      console.log(`  Images count: ${prop.propertyImages.length}`);
      console.log(`  VideoUrl: ${prop.videoUrl ? 'YES' : 'NO'}`);
      
      if (prop.propertyImages.length > 0) {
        console.log(`  📁 Property Images:`);
        for (const img of prop.propertyImages) {
          const isVideo = /\.(mp4|mov|webm|mkv)(\?.*)?$/i.test(img.imageUrl);
          console.log(`    - ${img.imageUrl} (${isVideo ? 'VIDEO' : 'IMAGE'}, isVideo: ${img.isVideo || false})`);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestProperties();