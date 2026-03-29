
import { PrismaClient, PropertyPurpose, PropertyStatus, CompanyStatus, EmployeeStatus, CompanyEmployeeRole, IndividualPropertyStatus, IndividualPropertyCompanyOfferStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive seed for testing...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // --- 1. Create Companies ---
  console.log('🏢 Creating companies...');
  
  const companiesData = [
    {
      name: 'Bahrain Real Estate Co',
      email: 'bahrain@test.com',
      crNumber: 'CR11111',
      phone: '33331111',
      status: 'approved' as CompanyStatus,
    },
    {
      name: 'Seef Luxury Apartments',
      email: 'seef@test.com',
      crNumber: 'CR22222',
      phone: '33332222',
      status: 'approved' as CompanyStatus,
    },
    {
      name: 'Future Lands Developer',
      email: 'lands@test.com',
      crNumber: 'CR33333',
      phone: '33333333',
      status: 'approved' as CompanyStatus,
    }
  ];

  const companies = [];
  for (const c of companiesData) {
    const upserted = await prisma.company.upsert({
      where: { crNumber: c.crNumber },
      update: {},
      create: { ...c, employeesLimit: 10, freeAdsRemaining: 100 },
    });
    companies.push(upserted);
    console.log(`   - Created/Found: ${c.name} (ID: ${upserted.id})`);
  }

  const [companyA, companyB, companyC] = companies;

  // --- 2. Create Employees ---
  console.log('👥 Creating employees...');

  const employeesData = [
    { companyId: companyA.id, name: 'Ahmed Manager', email: 'manager@bahrain.com', role: 'MANAGER' as CompanyEmployeeRole },
    { companyId: companyA.id, name: 'Ali Agent', email: 'agent@bahrain.com', role: 'AGENT' as CompanyEmployeeRole },
    { companyId: companyB.id, name: 'Fatima Manager', email: 'manager@seef.com', role: 'MANAGER' as CompanyEmployeeRole },
    { companyId: companyC.id, name: 'Khalid Manager', email: 'manager@lands.com', role: 'MANAGER' as CompanyEmployeeRole },
  ];

  for (const e of employeesData) {
    await prisma.companyEmployee.upsert({
      where: { companyId_email: { companyId: e.companyId, email: e.email } },
      update: {},
      create: {
        companyId: e.companyId,
        name: e.name,
        email: e.email,
        phone: '12345678',
        role: e.role,
        status: 'active' as EmployeeStatus,
        passwordHash,
      },
    });
    console.log(`   - Added: ${e.name} to Company ${e.companyId}`);
  }

  // Fetch employees to use IDs for property creation
  const managerA = await prisma.companyEmployee.findUnique({ where: { companyId_email: { companyId: companyA.id, email: 'manager@bahrain.com' } } });
  const managerB = await prisma.companyEmployee.findUnique({ where: { companyId_email: { companyId: companyB.id, email: 'manager@seef.com' } } });
  const managerC = await prisma.companyEmployee.findUnique({ where: { companyId_email: { companyId: companyC.id, email: 'manager@lands.com' } } });

  if (!managerA || !managerB || !managerC) throw new Error("Failed to retrieve created employees");

  // --- 3. Create Company Properties ---
  console.log('🏠 Creating company properties...');

  // Prop 1: Luxury Villa (Company A)
  await prisma.property.create({
    data: {
      companyId: companyA.id,
      createdByEmployeeId: managerA.id,
      title: 'Luxury Villa in Riffa Views',
      description: 'Amazing 5 bedroom villa with pool and garden.',
      type: 'villas_houses',
      purpose: 'sale',
      price: 350000,
      governorate: 'Southern',
      area: 'Riffa',
      bedrooms: 5,
      bathrooms: 6,
      areaSqm: 600,
      status: 'active' as PropertyStatus,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    }
  });

  // Prop 2: Apartment (Company B)
  await prisma.property.create({
    data: {
      companyId: companyB.id,
      createdByEmployeeId: managerB.id,
      title: 'Modern Apartment in Seef',
      description: 'High floor, sea view, 2 bedrooms.',
      type: 'apartments',
      purpose: 'rent',
      price: 600,
      governorate: 'Capital',
      area: 'Seef',
      bedrooms: 2,
      bathrooms: 2,
      status: 'active' as PropertyStatus,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }
  });

  // Prop 3: Land (Company C)
  await prisma.property.create({
    data: {
      companyId: companyC.id,
      createdByEmployeeId: managerC.id,
      title: 'Industrial Land in Hidd',
      description: 'Large plot suitable for warehousing.',
      type: 'lands',
      purpose: 'sale',
      price: 150000,
      governorate: 'Muharraq',
      area: 'Hidd',
      areaSqm: 1200,
      status: 'active' as PropertyStatus,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }
  });

  console.log('   - Added initial properties for each company.');

  // --- 4. Create Individuals ---
  console.log('👤 Creating individuals...');

  const individual1 = await prisma.individualUser.upsert({
    where: { email: 'john@test.com' },
    update: {},
    create: {
      fullName: 'John Individual',
      email: 'john@test.com',
      phone: '39999991',
      passwordHash,
    }
  });

  const individual2 = await prisma.individualUser.upsert({
    where: { email: 'sarah@test.com' },
    update: {},
    create: {
      fullName: 'Sarah Owner',
      email: 'sarah@test.com',
      phone: '39999992',
      passwordHash,
    }
  });

  // --- 5. Individual Property Workflow Test Cases ---
  console.log('🔄 Creating individual property scenarios...');

  // Case 1: PENDING_ADMIN (Just submitted)
  await prisma.individualProperty.create({
    data: {
      ownerIndividualId: individual1.id,
      title: 'Cozy Studio in Juffair (Pending Admin)',
      description: 'Fully furnished studio, waiting for approval.',
      type: 'studio',
      purpose: 'rent',
      minimumPrice: 300,
      governorate: 'Capital',
      area: 'Juffair',
      status: 'PENDING_ADMIN' as IndividualPropertyStatus,
      videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    }
  });
  console.log('   - Case 1: Property pending admin approval created.');

  // Case 2: SENT_TO_COMPANIES (Admin approved, sent to Company A)
  const propSent = await prisma.individualProperty.create({
    data: {
      ownerIndividualId: individual2.id,
      title: 'Old House in Muharraq (Sent to Company)',
      description: 'Traditional house needing renovation.',
      type: 'traditional_houses',
      purpose: 'sale',
      minimumPrice: 80000,
      governorate: 'Muharraq',
      area: 'Muharraq',
      status: 'SENT_TO_COMPANIES' as IndividualPropertyStatus,
    }
  });

  await prisma.individualPropertyCompanyOffer.create({
    data: {
      companyId: companyA.id,
      propertyId: propSent.id,
      status: 'PENDING' as IndividualPropertyCompanyOfferStatus,
    }
  });
  console.log('   - Case 2: Property distributed to Company A created.');

  // Case 3: ACTIVE (Company C accepted and published)
  const propActive = await prisma.individualProperty.create({
    data: {
      ownerIndividualId: individual1.id,
      title: 'Investment Plot (Active/Published)',
      description: 'Great ROI potential.',
      type: 'lands',
      purpose: 'sale',
      minimumPrice: 200000,
      governorate: 'Northern',
      area: 'Hamala',
      status: 'ACTIVE' as IndividualPropertyStatus,
    }
  });

  await prisma.individualPropertyCompanyOffer.create({
    data: {
      companyId: companyC.id,
      propertyId: propActive.id,
      status: 'ACCEPTED' as IndividualPropertyCompanyOfferStatus,
      companyPrice: 210000,
    }
  });
  console.log('   - Case 3: Property accepted and published by Company C created.');

  console.log('✅ Seed completed successfully! You can now test the flows.');
  console.log('-----------------------------------------------------------');
  console.log('Credentials Summary:');
  console.log('Company A (Bahrain): manager@bahrain.com / agent@bahrain.com (pass: password123)');
  console.log('Company B (Seef):    manager@seef.com (pass: password123)');
  console.log('Company C (Lands):   manager@lands.com (pass: password123)');
  console.log('Individual 1 (John): john@test.com (pass: password123)');
  console.log('Individual 2 (Sarah): sarah@test.com (pass: password123)');
  console.log('-----------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
