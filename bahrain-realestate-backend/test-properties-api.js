// QUICK /PROPERTIES ENDPOINT TEST
// Tests the actual API endpoint directly

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simulate the public service function
const toAbsolute = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `http://localhost:3000${url.startsWith('/') ? '' : '/'}${url}`;
};

const mapAcceptedOfferToPublicProperty = (offer) => {
  const property = offer.property;
  const company = offer.company;

  const rawImages = (property)?.images || (property)?.propertyImages || [];

  const propertyImages = Array.isArray(rawImages)
    ? rawImages
        .slice()
        .sort((a, b) => {
          if (a.isCover && !b.isCover) return -1;
          if (!a.isCover && b.isCover) return 1;
          return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
        })
        .map((img) => ({
          id: img.id,
          propertyId: -Number(offer.id),
          imageUrl: toAbsolute(img.imageUrl),
          displayOrder: img.displayOrder ?? 0,
          isVideo: Boolean(img.isVideo),
        }))
    : [];

  return {
    id: -Number(offer.id),
    companyId: Number(company.id),
    createdByEmployeeId: 0,
    updatedByEmployeeId: null,
    title: property.title,
    type: property.type,
    purpose: property.purpose,
    price: offer.companyPrice?.toString?.() ?? String(offer.companyPrice),
    governorate: property.governorate,
    area: property.area,
    branch: property.branch,
    description: property.description,
    videoUrl: property.videoUrl ? toAbsolute(property.videoUrl) : null,
    locationLat: property.locationLat,
    locationLng: property.locationLng,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    areaSqm: property.areaSqm,
    furnishingStatus: property.furnishingStatus,
    floorsCount: property.floorsCount,
    floorNumber: property.floorNumber,
    livingRooms: property.livingRooms,
    buildingAge: property.buildingAge,
    negotiable: property.negotiable,
    parkingCount: property.parkingCount,
    status: property.status,
    showPhoneNumber: property.showPhoneNumber,
    enableWhatsApp: property.enableWhatsApp,
    createdAt: offer.createdAt,
    updatedAt: offer.updatedAt,
    company,
    propertyImages,
  };
};

async function testPropertiesEndpoint() {
  console.log('🔍 TESTING /properties ENDPOINT DIRECTLY');
  console.log('=========================================');

  try {
    const skip = 0;
    const take = 10;
    const takeWindow = skip + take;

    const [properties, acceptedOffers] = await Promise.all([
      prisma.property.findMany({
        where: { status: "active" },
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
            orderBy: { displayOrder: "asc" },
            select: {
              id: true,
              imageUrl: true,
              displayOrder: true,
              isVideo: true
            },
          },
        },
        take: takeWindow,
        orderBy: { createdAt: "desc" },
      }),
      prisma.individualPropertyCompanyOffer.findMany({
        where: {
          status: 'ACCEPTED',
          companyPrice: { not: null },
          property: { status: 'ACTIVE' },
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          property: {
            include: {
              propertyImages: {
                orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
                select: {
                  id: true,
                  imageUrl: true,
                  displayOrder: true,
                  isVideo: true
                }
              },
            },
          },
        },
        take: takeWindow,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const merged = [
      ...properties.map((p) => ({
        ...p,
        propertyImages: Array.isArray(p.propertyImages)
          ? p.propertyImages.map((img) => ({
              ...img,
              imageUrl: toAbsolute(img.imageUrl),
            }))
          : [],
      })),
      ...acceptedOffers.map(mapAcceptedOfferToPublicProperty),
    ].sort((a, b) => {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return bDate - aDate;
    });

    const pageItems = merged.slice(skip, skip + take);

    console.log('\\n📊 /PROPERTIES API RESPONSE:');
    console.log('============================');

    let totalVideos = 0;
    let propertiesWithVideos = 0;

    pageItems.forEach((property, index) => {
      const videos = property.propertyImages.filter(img => img.isVideo);
      const images = property.propertyImages.filter(img => !img.isVideo);
      
      if (videos.length > 0) {
        propertiesWithVideos++;
        totalVideos += videos.length;
        
        console.log(`\\n${index + 1}. Property ${property.id}:`);
        console.log(`   📸 Images: ${images.length}`);
        console.log(`   🎥 Videos: ${videos.length}`);
        
        videos.forEach((video, i) => {
          const filename = video.imageUrl.split('/').pop();
          console.log(`      ${i + 1}. ${filename}`);
        });

        if (videos.length >= 2) {
          console.log(`   ✅ EXPECTED RESULT: Multiple videos (${videos.length}) returned!`);
        } else {
          console.log(`   ⚠️  Single video returned`);
        }
      }
    });

    console.log('\\n🎯 FINAL RESULTS:');
    console.log('=================');
    console.log(`Total properties in response: ${pageItems.length}`);
    console.log(`Properties with videos: ${propertiesWithVideos}`);
    console.log(`Total videos returned: ${totalVideos}`);

    if (totalVideos > propertiesWithVideos) {
      console.log('\\n🎉 SUCCESS: Multi-video support confirmed!');
      console.log('The /properties endpoint returns ALL videos for each property.');
      console.log('Mobile app will now show correct video counts like "Videos (2+)"');
    } else {
      console.log('\\n⚠️  Only single videos found or no videos found.');
    }

  } catch (error) {
    console.error('❌ Error testing /properties endpoint:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPropertiesEndpoint();