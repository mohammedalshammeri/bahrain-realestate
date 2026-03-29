// Test what the API actually returns for a property with multiple videos
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAPIResponse() {
  console.log('🔍 TESTING ACTUAL API RESPONSE');
  console.log('================================');

  try {
    // Find property with multiple videos (Property 30)
    const property = await prisma.property.findUnique({
      where: { id: 30 },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        propertyImages: {
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            imageUrl: true,
            displayOrder: true,
            isVideo: true
          },
        },
      },
    });

    if (!property) {
      console.log('❌ Property 30 not found');
      return;
    }

    console.log(`\n🏠 Property ${property.id}: ${property.title || 'No Title'}`);
    console.log(`Status: ${property.status}`);
    console.log(`\n📊 propertyImages array (${property.propertyImages.length} items):`);
    console.log('===========================================');
    
    property.propertyImages.forEach((img, i) => {
      const filename = img.imageUrl.split('/').pop();
      console.log(`${i + 1}. ${filename}`);
      console.log(`   - ID: ${img.id}`);
      console.log(`   - isVideo: ${img.isVideo}`);
      console.log(`   - displayOrder: ${img.displayOrder}`);
      console.log('');
    });

    // Separate videos and images like the frontend does
    const videos = property.propertyImages.filter(img => img.isVideo);
    const images = property.propertyImages.filter(img => !img.isVideo);

    console.log(`\n🎯 FRONTEND FILTERING RESULT:`);
    console.log(`============================`);
    console.log(`📸 Images: ${images.length}`);
    console.log(`🎥 Videos: ${videos.length}`);

    if (videos.length > 0) {
      console.log(`\n🎥 VIDEO URLS:`);
      videos.forEach((v, i) => {
        console.log(`   ${i + 1}. ${v.imageUrl}`);
      });
    }

    console.log(`\n💡 EXPECTED IN FRONTEND:`);
    console.log(`======================`);
    console.log(`- Admin Dashboard should show: "Videos (${videos.length})"`);
    console.log(`- Mobile should show ${videos.length} video thumbnails`);

    if (videos.length !== 2) {
      console.log(`\n⚠️  ISSUE: Expected 2 videos but found ${videos.length}!`);
    } else {
      console.log(`\n✅ API returns correct number of videos!`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPIResponse();