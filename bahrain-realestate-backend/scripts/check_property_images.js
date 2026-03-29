const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');

(async () => {
  try {
    const prisma = new PrismaClient();
    const propertyId = parseInt(process.argv[2] || '114', 10);
    const results = await prisma.propertyImage.findMany({
      where: { propertyId },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, imageUrl: true, displayOrder: true, createdAt: true }
    });
    console.log(JSON.stringify({ propertyId, count: results.length, results }, null, 2));
    await prisma.$disconnect();
  } catch (err) {
    console.error('ERROR', err.message || err);
    process.exit(1);
  }
})();
