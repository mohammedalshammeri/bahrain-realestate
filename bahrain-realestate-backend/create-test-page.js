// Create a simple test HTML page to verify API response
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function createTestPage() {
  console.log('🔍 Creating test page for Property 129...\n');

  try {
    const property = await prisma.property.findUnique({
      where: { id: 129 },
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
          },
        },
      },
    });

    if (!property) {
      console.log('❌ Property 129 not found');
      return;
    }

    const videos = property.propertyImages.filter(img => img.isVideo);
    const images = property.propertyImages.filter(img => !img.isVideo);

    const html = `<!DOCTYPE html>
<html>
<head>
    <title>Property 129 - Test</title>
    <style>
        body { font-family: Arial; padding: 20px; background: #1a1a1a; color: white; }
        .section { margin: 30px 0; padding: 20px; background: #2a2a2a; border-radius: 10px; }
        .section h2 { color: #60a5fa; margin-top: 0; }
        video { width: 100%; max-width: 600px; border-radius: 8px; margin: 10px 0; }
        img { width: 200px; height: 150px; object-fit: cover; border-radius: 8px; margin: 5px; }
        .stats { background: #3a3a3a; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .success { color: #4ade80; }
        .error { color: #ef4444; }
    </style>
</head>
<body>
    <h1>🏠 Property ${property.id}: ${property.title}</h1>
    
    <div class="stats">
        <p><strong>Company:</strong> ${property.company?.name}</p>
        <p><strong>Status:</strong> ${property.status}</p>
        <p><strong>Total Media:</strong> ${property.propertyImages.length} items</p>
        <p class="${images.length > 0 ? 'success' : 'error'}"><strong>📸 Images:</strong> ${images.length}</p>
        <p class="${videos.length >= 2 ? 'success' : 'error'}"><strong>🎥 Videos:</strong> ${videos.length}</p>
    </div>

    ${videos.length > 0 ? `
    <div class="section">
        <h2>🎥 Videos (${videos.length})</h2>
        ${videos.map((v, i) => `
            <div>
                <h3>Video ${i + 1}</h3>
                <video controls>
                    <source src="${v.imageUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <p style="font-size: 12px; color: #888;">
                    URL: ${v.imageUrl}<br>
                    ID: ${v.id}, Display Order: ${v.displayOrder}
                </p>
            </div>
        `).join('')}
    </div>
    ` : '<div class="section error"><h2>❌ No Videos Found</h2></div>'}

    ${images.length > 0 ? `
    <div class="section">
        <h2>📸 Images (${images.length})</h2>
        <div>
            ${images.map((img, i) => `
                <img src="${img.imageUrl}" alt="Image ${i + 1}" />
            `).join('')}
        </div>
    </div>
    ` : ''}

    <div class="section">
        <h2>📊 Raw Data</h2>
        <pre style="background: #1a1a1a; padding: 15px; border-radius: 8px; overflow-x: auto;">${JSON.stringify(property, null, 2)}</pre>
    </div>

</body>
</html>`;

    const outputPath = path.join(process.cwd(), 'test-property-129.html');
    fs.writeFileSync(outputPath, html);

    console.log('✅ Test page created successfully!');
    console.log(`📄 File: ${outputPath}`);
    console.log('\n📊 Summary:');
    console.log(`   📸 Images: ${images.length}`);
    console.log(`   🎥 Videos: ${videos.length}`);
    console.log('\n💡 Open the HTML file in your browser to see the actual videos!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestPage();