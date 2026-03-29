// Check isVideo flag for all property images
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkIsVideoFlag() {
  console.log('🔍 CHECKING isVideo FLAG FOR ALL PROPERTY IMAGES');
  console.log('================================================');

  try {
    // Get all property images
    const allImages = await prisma.propertyImage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        property: {
          select: { id: true, title: true }
        }
      }
    });

    console.log(`\n📊 Total property images found: ${allImages.length}\n`);

    let videosWithFlag = 0;
    let videosWithoutFlag = 0;
    let regularImages = 0;

    allImages.forEach(img => {
      const isVideo = /\.(mp4|mov|webm|mkv)(\?.*)?$/i.test(img.imageUrl);
      const filename = img.imageUrl.split('/').pop();
      
      if (isVideo) {
        if (img.isVideo === true) {
          videosWithFlag++;
          console.log(`✅ Video WITH flag: ${filename} (Property ${img.property.id})`);
        } else {
          videosWithoutFlag++;
          console.log(`❌ Video WITHOUT flag: ${filename} (Property ${img.property.id}) - isVideo: ${img.isVideo}`);
        }
      } else {
        regularImages++;
      }
    });

    console.log(`\n📈 SUMMARY:`);
    console.log(`==========`);
    console.log(`✅ Videos WITH isVideo flag: ${videosWithFlag}`);
    console.log(`❌ Videos WITHOUT isVideo flag: ${videosWithoutFlag}`);
    console.log(`📸 Regular images: ${regularImages}`);
    console.log(`📊 Total: ${allImages.length}`);

    if (videosWithoutFlag > 0) {
      console.log(`\n⚠️  PROBLEM FOUND:`);
      console.log(`==================`);
      console.log(`${videosWithoutFlag} videos don't have isVideo: true flag!`);
      console.log(`This is why the frontend shows only some videos.`);
      console.log(`\nSolution: Update these videos to set isVideo: true`);
    } else {
      console.log(`\n✅ All videos have correct isVideo flag!`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkIsVideoFlag();