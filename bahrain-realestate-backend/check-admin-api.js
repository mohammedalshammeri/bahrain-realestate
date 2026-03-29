// Simulate Admin API responses
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const backendBase = 'http://localhost:8000';

const toAbsolute = (value) => {
  if (!value) return value;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/')) return `${backendBase}${value}`;
  return `${backendBase}/${value}`;
};

async function checkAdminAPI() {
  console.log('🔍 CHECKING ADMIN API LOGIC (SIMULATED)');
  console.log('=====================================\n');

  try {
    // 1. Simulate getPropertyById(129)
    console.log('--- getPropertyById(129) ---');
    
    const property = await prisma.property.findUnique({
      where: { id: 129 },
      include: {
        company: { select: { id: true, name: true, status: true } },
        createdBy: { select: { name: true, role: true } },
        propertyImages: { 
          orderBy: { displayOrder: 'asc' }, 
          select: { id: true, imageUrl: true, isVideo: true, displayOrder: true } 
        },
      },
    });

    if (!property) {
      console.log('❌ Property 129 not found');
    } else {
      const mapped = {
        ...property,
        images: property.propertyImages.map(img => toAbsolute(img.imageUrl)),
        propertyImages: property.propertyImages.map(img => ({
            ...img,
            imageUrl: toAbsolute(img.imageUrl)
        })),
        videoUrl: property.videoUrl ? toAbsolute(property.videoUrl) : null,
      };

      console.log(`✅ Property: ${mapped.title}`);
      
      const adminVideos = mapped.propertyImages.filter(img => img.isVideo);
      console.log(`🎥 Videos in propertyImages: ${adminVideos.length}`);
      
      if (adminVideos.length > 0) {
        adminVideos.forEach((v, i) => {
          console.log(`   ${i+1}. ${v.imageUrl} (isVideo: ${v.isVideo})`);
        });
      }

      if (adminVideos.length >= 2) {
        console.log('✅ getPropertyById FIXED! Admin Dashboard details will show all videos.');
      } else {
        console.log('❌ STILL BROKEN: Only found ' + adminVideos.length + ' videos.');
      }
    }

    // 2. Simulate getAllProperties (List View) logic for Property 129
    console.log('\n--- getAllProperties (List item 129) ---');
    
    const properties = await prisma.property.findMany({
      where: { id: 129 },
      take: 1,
      include: {
        company: {
            select: {
              id: true,
              name: true,
              status: true
            }
          },
          createdBy: {
            select: {
              name: true,
              role: true
            }
          },
          propertyImages: {
            orderBy: { displayOrder: 'asc' },
            select: {
              id: true,
              imageUrl: true,
              isVideo: true,
              displayOrder: true
            }
          }
      }
    });

    if (properties.length > 0) {
        const p = properties[0];
        const mappedP = {
            ...p,
            images: p.propertyImages.map(img => toAbsolute(img.imageUrl)),
            propertyImages: p.propertyImages.map(img => ({
                ...img,
                imageUrl: toAbsolute(img.imageUrl)
            })),
            videoUrl: p.videoUrl ? toAbsolute(p.videoUrl) : null,
            source: 'COMPANY',
        };

        const listVideos = mappedP.propertyImages.filter(img => img.isVideo);
        console.log(`🎥 Videos in list item: ${listVideos.length}`);
        
        if (listVideos.length >= 2) {
            console.log('✅ getAllProperties FIXED! Admin Dashboard list will contain video info.');
        } else {
            console.log('❌ STILL BROKEN in List: Only found ' + listVideos.length + ' videos.');
        }

    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminAPI();