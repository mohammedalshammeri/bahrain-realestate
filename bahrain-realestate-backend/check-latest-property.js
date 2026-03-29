// Check latest property (129)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestProperty() {
  console.log('🔍 CHECKING LATEST PROPERTY');
  console.log('============================\n');

  try {
    // Get latest property
    const latestProperty = await prisma.property.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        propertyImages: {
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            imageUrl: true,
            displayOrder: true,
            isVideo: true,
            createdAt: true,
          },
        },
      },
    });

    if (!latestProperty) {
      console.log('❌ No properties found!');
      return;
    }

    console.log(`✅ Latest Property: ID ${latestProperty.id}`);
    console.log(`   Title: ${latestProperty.title || 'No Title'}`);
    console.log(`   Company: ${latestProperty.company?.name || 'N/A'}`);
    console.log(`   Status: ${latestProperty.status}`);
    console.log(`   Created: ${latestProperty.createdAt}`);
    console.log(`\n📊 Property Images (${latestProperty.propertyImages.length} total):`);
    console.log('==============================================');

    if (latestProperty.propertyImages.length === 0) {
      console.log('❌ NO IMAGES OR VIDEOS FOUND!');
      console.log('\n🔴 CRITICAL PROBLEM: Upload completely failed!');
      console.log('   No media files were saved to database.\n');
      return;
    }

    // Analyze each media item
    let imageCount = 0;
    let videoCount = 0;
    let videosWithoutFlag = 0;

    latestProperty.propertyImages.forEach((img, i) => {
      const filename = img.imageUrl.split('/').pop();
      const isVideoByExtension = /\.(mp4|mov|webm|mkv)(\?.*)?$/i.test(img.imageUrl);
      
      console.log(`\n${i + 1}. ${filename}`);
      console.log(`   📌 ID: ${img.id}`);
      console.log(`   📌 isVideo flag: ${img.isVideo}`);
      console.log(`   📌 Display Order: ${img.displayOrder}`);
      console.log(`   📌 Created: ${img.createdAt}`);

      if (img.isVideo) {
        videoCount++;
        console.log(`   ✅ This is a VIDEO`);
      } else if (isVideoByExtension) {
        videosWithoutFlag++;
        console.log(`   ❌ ERROR: Video file but isVideo = false!`);
      } else {
        imageCount++;
        console.log(`   📸 This is an IMAGE`);
      }
    });

    console.log(`\n\n📈 SUMMARY:`);
    console.log(`===========`);
    console.log(`📸 Total Images: ${imageCount}`);
    console.log(`🎥 Total Videos (with correct flag): ${videoCount}`);
    console.log(`❌ Videos missing flag: ${videosWithoutFlag}`);
    console.log(`📊 Total Media: ${latestProperty.propertyImages.length}`);

    console.log(`\n\n🎯 WHAT FRONTEND SEES:`);
    console.log(`======================`);
    const frontendVideos = latestProperty.propertyImages.filter(img => img.isVideo);
    console.log(`Videos displayed: ${frontendVideos.length}`);
    
    if (frontendVideos.length === 0) {
      console.log(`\n❌ NO VIDEOS WILL SHOW IN FRONTEND!`);
      console.log(`\nPossible causes:`);
      console.log(`1. Videos were not uploaded from mobile app`);
      console.log(`2. Backend failed to receive videos`);
      console.log(`3. Backend failed to save videos`);
      console.log(`4. isVideo flag not set correctly`);
    } else if (frontendVideos.length < 2) {
      console.log(`\n⚠️  Only ${frontendVideos.length} video will show (expected 2)`);
    } else {
      console.log(`\n✅ ${frontendVideos.length} videos will show correctly`);
    }

    // Check backend logs for this property
    console.log(`\n\n📝 CHECKING BACKEND UPLOAD LOGS:`);
    console.log(`=================================`);
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(process.cwd(), 'uploads', 'upload-debug.log');
    
    if (fs.existsSync(logPath)) {
      const logs = fs.readFileSync(logPath, 'utf8').split('\n');
      const propertyLogs = logs.filter(line => line.includes(`"propertyId":${latestProperty.id}`));
      
      if (propertyLogs.length > 0) {
        console.log(`Found ${propertyLogs.length} log entries for this property:`);
        propertyLogs.forEach(log => {
          try {
            const entry = JSON.parse(log);
            console.log(`- ${entry.event}: ${JSON.stringify(entry.info || entry)}`);
          } catch (e) {
            console.log(`- ${log}`);
          }
        });
      } else {
        console.log(`⚠️  No upload logs found for property ${latestProperty.id}`);
      }
    } else {
      console.log(`⚠️  No upload debug log file exists`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestProperty();