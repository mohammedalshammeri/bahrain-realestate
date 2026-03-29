// Check property 128 specifically
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProperty128() {
  console.log('🔍 CHECKING PROPERTY 128');
  console.log('========================\n');

  try {
    // Get property 128 with all details
    const property = await prisma.property.findUnique({
      where: { id: 128 },
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

    if (!property) {
      console.log('❌ Property 128 NOT FOUND in database!');
      console.log('Make sure the property was created successfully.\n');
      return;
    }

    console.log(`✅ Property Found: ${property.title || 'No Title'}`);
    console.log(`   Company: ${property.company?.name || 'N/A'}`);
    console.log(`   Status: ${property.status}`);
    console.log(`   Created: ${property.createdAt}`);
    console.log(`\n📊 Property Images (${property.propertyImages.length} total):`);
    console.log('==============================================');

    if (property.propertyImages.length === 0) {
      console.log('❌ NO IMAGES OR VIDEOS FOUND!');
      console.log('\n🔴 PROBLEM: Property has no media files.');
      console.log('This means the upload failed or images were not attached.\n');
      return;
    }

    // Analyze each media item
    let imageCount = 0;
    let videoCount = 0;
    let videosWithoutFlag = 0;

    property.propertyImages.forEach((img, i) => {
      const filename = img.imageUrl.split('/').pop();
      const isVideoByExtension = /\.(mp4|mov|webm|mkv)(\?.*)?$/i.test(img.imageUrl);
      
      console.log(`\n${i + 1}. ${filename}`);
      console.log(`   📌 ID: ${img.id}`);
      console.log(`   📌 isVideo flag: ${img.isVideo}`);
      console.log(`   📌 Display Order: ${img.displayOrder}`);
      console.log(`   📌 Detected as video (by extension): ${isVideoByExtension}`);
      console.log(`   📌 Created: ${img.createdAt}`);

      if (img.isVideo) {
        videoCount++;
        console.log(`   ✅ This is a VIDEO (isVideo = true)`);
      } else if (isVideoByExtension) {
        videosWithoutFlag++;
        console.log(`   ❌ ERROR: This is a video file but isVideo = false!`);
      } else {
        imageCount++;
        console.log(`   📸 This is an IMAGE`);
      }
    });

    console.log(`\n\n📈 SUMMARY:`);
    console.log(`===========`);
    console.log(`📸 Total Images: ${imageCount}`);
    console.log(`🎥 Total Videos (with isVideo flag): ${videoCount}`);
    console.log(`❌ Videos without flag: ${videosWithoutFlag}`);
    console.log(`📊 Total Media: ${property.propertyImages.length}`);

    // Diagnosis
    console.log(`\n\n🔍 DIAGNOSIS:`);
    console.log(`=============`);

    if (videoCount === 0 && imageCount === 0) {
      console.log(`❌ PROBLEM: No media files uploaded!`);
      console.log(`   The upload might have failed.`);
    } else if (videoCount === 0) {
      console.log(`❌ PROBLEM: No videos found!`);
      console.log(`   - Either no videos were uploaded`);
      console.log(`   - Or videos failed to upload`);
      console.log(`   - Or isVideo flag is not set correctly`);
    } else if (videoCount === 1) {
      console.log(`⚠️  ISSUE: Only ${videoCount} video found!`);
      console.log(`   Expected: 2 videos (as you mentioned)`);
      console.log(`   Possible reasons:`);
      console.log(`   - Only 1 video was actually uploaded`);
      console.log(`   - Second video failed to upload`);
      console.log(`   - Mobile app sent only 1 video`);
    } else if (videoCount >= 2) {
      console.log(`✅ SUCCESS: ${videoCount} videos found!`);
      console.log(`   The API should return all ${videoCount} videos.`);
      console.log(`   If frontend shows only 1, it's a display issue.`);
    }

    if (videosWithoutFlag > 0) {
      console.log(`\n❌ CRITICAL: ${videosWithoutFlag} videos have isVideo = false!`);
      console.log(`   These videos won't show in the frontend.`);
      console.log(`   Need to fix the upload process.`);
    }

    // Test what frontend will see
    console.log(`\n\n🎯 WHAT FRONTEND WILL SEE:`);
    console.log(`===========================`);
    
    const frontendVideos = property.propertyImages.filter(img => img.isVideo);
    const frontendImages = property.propertyImages.filter(img => !img.isVideo);
    
    console.log(`📸 Images count: ${frontendImages.length}`);
    console.log(`🎥 Videos count: ${frontendVideos.length}`);
    
    if (frontendVideos.length > 0) {
      console.log(`\n🎥 Videos that will appear:`);
      frontendVideos.forEach((v, i) => {
        console.log(`   ${i + 1}. ${v.imageUrl.split('/').pop()}`);
      });
    }

    console.log(`\n💡 EXPECTED DISPLAY:`);
    console.log(`   - Admin Dashboard: "Videos (${frontendVideos.length})"`);
    console.log(`   - Mobile App: ${frontendVideos.length} video thumbnail(s)`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProperty128();