
import { PrismaClient, PropertyStatus, PropertyPurpose } from '@prisma/client';

const prisma = new PrismaClient();

const governoratesAndAreas: Record<string, string[]> = {
  'Capital': ['Manama', 'Juffair', 'Seef', 'Adliya', 'Sanabis', 'Gudaibiya'],
  'Muharraq': ['Muharraq', 'Busaiteen', 'Hidd', 'Amwaj Islands', 'Diyar Al Muharraq', 'Arad'],
  'Northern': ['Hamala', 'Saar', 'Janabiya', 'Budaiya', 'Jasra', 'Hamad Town', 'Aali'],
  'Southern': ['Riffa', 'Isa Town', 'Zallaq', 'Durrat Al Bahrain', 'Awali', 'Sitra']
};

const propertyTypes = [
  'apartments', 'villas_houses', 'lands', 'buildings', 'offices', 
  'shops', 'warehouses', 'labor_accommodation', 'commercial_complexes',
  'chalets', 'traditional_houses', 'farms'
];

async function main() {
  console.log('🚀 Starting mass property seeding...');

  // 1. Get Companies created in the previous step
  const companyA = await prisma.company.findFirst({ where: { email: 'bahrain@test.com' } });
  const companyB = await prisma.company.findFirst({ where: { email: 'seef@test.com' } });
  const companyC = await prisma.company.findFirst({ where: { email: 'lands@test.com' } });

  if (!companyA || !companyB || !companyC) {
    console.error('❌ Companies not found. Please run seed-full-test.ts first.');
    return;
  }

  const companies = [companyA, companyB, companyC];

  // 2. Get Employees for these companies (to set createdBy)
  const employees = [];
  for (const c of companies) {
    const emp = await prisma.companyEmployee.findFirst({ where: { companyId: c.id } });
    if (emp) employees.push(emp);
  }

  if (employees.length === 0) {
     console.error('❌ No employees found.');
     return;
  }

  // 3. Generate 50 Diverse Properties
  const propertiesToCreate = [];
  const TOTAL_PROPS = 50;

  for (let i = 0; i < TOTAL_PROPS; i++) {
    // Distribute among companies
    const company = companies[i % companies.length];
    const emp = employees.find(e => e.companyId === company.id) || employees[0];
    
    // Pick random location
    const govKeys = Object.keys(governoratesAndAreas);
    const gov = govKeys[Math.floor(Math.random() * govKeys.length)];
    const areaList = governoratesAndAreas[gov];
    const area = areaList[Math.floor(Math.random() * areaList.length)];

    // Pick random type
    // If Company C (Lands), force mostly lands
    let type = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    if (company.email === 'lands@test.com' && Math.random() > 0.3) {
      type = 'lands';
    } 
    // If Company B (Seef Apartments), force mostly apartments
    else if (company.email === 'seef@test.com' && Math.random() > 0.3) {
      type = 'apartments';
    }

    // Purpose & Price logic
    const purpose = Math.random() > 0.6 ? PropertyPurpose.sale : PropertyPurpose.rent; // 60% rent
    let price = 0;
    
    if (purpose === 'sale') {
      // Sale prices
      if (type === 'lands') price = 100000 + Math.random() * 1000000;
      else if (['villas_houses', 'buildings'].includes(type)) price = 150000 + Math.random() * 500000;
      else price = 50000 + Math.random() * 150000;
    } else {
      // Rent prices
      if (['villas_houses', 'buildings'].includes(type)) price = 800 + Math.random() * 2000;
      else if (type === 'apartments') price = 250 + Math.random() * 800;
      else price = 500 + Math.random() * 3000;
    }

    // Features based on type
    const isLand = ['lands', 'farms'].includes(type);
    const isCommercial = ['offices', 'shops', 'warehouses'].includes(type);
    
    const bedrooms = isLand || isCommercial ? null : Math.floor(Math.random() * 5) + 1;
    const bathrooms = isLand || isCommercial ? null : Math.floor(Math.random() * 4) + 1;
    const parkingCount = isLand ? null : Math.floor(Math.random() * 3);
    
    const titleAdjectives = ['Luxury', 'Modern', 'Spacious', 'Affordable', 'Prime Location', 'Exclusive', 'Cozy', 'Premium'];
    const titleAdj = titleAdjectives[Math.floor(Math.random() * titleAdjectives.length)];
    
    const propertyTypeLabel = type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    propertiesToCreate.push({
      companyId: company.id,
      createdByEmployeeId: emp.id,
      title: `${titleAdj} ${propertyTypeLabel} in ${area}`,
      description: `Experience the best living or investment opportunity with this ${propertyTypeLabel} located in the sought-after area of ${area}, ${gov}. \n\nFeatures:\n- Great view\n- Nearby amenities\n- ${purpose === 'rent' ? 'Ready to move in' : 'Freehold ownership'}`,
      type,
      purpose,
      price: Math.floor(price / 10) * 10, // Round to nearest 10
      governorate: gov,
      area,
      status: PropertyStatus.active,
      bedrooms,
      bathrooms,
      parkingCount,
      areaSqm: 80 + Math.floor(Math.random() * 1000),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      videoUrl: i % 4 === 0 ? 'https://vjs.zencdn.net/v/oceans.mp4' : null, // 25% have video
      
      // Let's create some placeholder images for them in the next step or assume frontend handles missing images
    });
  }

  console.log(`📦 Generated ${propertiesToCreate.length} diverse properties. Inserting into database...`);

  let count = 0;
  for (const p of propertiesToCreate) {
    await prisma.property.create({ data: p });
    count++;
    if (count % 10 === 0) console.log(`   ... inserted ${count}/${TOTAL_PROPS}`);
  }

  console.log('✅ Successfully seeded mass properties with diverse types, locations, and prices.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
