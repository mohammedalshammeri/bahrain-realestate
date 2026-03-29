const { db } = require('./src/lib/db');

async function debugPropertyVideos() {
  try {
    console.log('🔍 Debugging property videos...');
    
    // Get property with videos
    const properties = await db.property.findMany({
      include: {
        propertyImages: true,
        images: true
      },
      take: 5,
      orderBy: { id: 'desc' }
    });

    console.log(`\n📊 Found ${properties.length} recent properties:`);
    
    properties.forEach((prop, idx) => {
      console.log(`\n🏠 Property ${idx + 1} (ID: ${prop.id}):`);
      console.log(`  Title: ${prop.titleAr || prop.titleEn || 'No title'}`);
      console.log(`  Images count: ${prop.images?.length || 0}`);
      console.log(`  PropertyImages count: ${prop.propertyImages?.length || 0}`);
      console.log(`  VideoUrl: ${prop.videoUrl || 'No videoUrl'}`);
      
      if (prop.propertyImages?.length > 0) {
        console.log('  🖼️ PropertyImages:');
        prop.propertyImages.forEach((img, imgIdx) => {
          console.log(`    ${imgIdx + 1}. ${img.imageUrl} (isVideo: ${img.isVideo || false}, order: ${img.displayOrder || 0})`);
        });
      }
      
      if (prop.images?.length > 0) {
        console.log('  🖼️ Images array:');
        prop.images.forEach((url, imgIdx) => {
          const isVideo = /\.(mp4|mov|webm|mkv)(\?.*)?$/i.test(url);
          console.log(`    ${imgIdx + 1}. ${url} (detected as ${isVideo ? 'video' : 'image'})`);
        });
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.$disconnect();
  }
}

debugPropertyVideos();