// Seed script for Bahrain Property Hub Backend
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  try {
    console.log('🧹 Cleaning existing data...');
    
    await prisma.property.deleteMany({});
    await prisma.companyEmployee.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.area.deleteMany({});
    await prisma.governorate.deleteMany({});

    console.log('📍 Adding governorates and areas...');

    await prisma.governorate.createMany({
      data: [
        { nameAr: "محافظة العاصمة", nameEn: "Capital Governorate" },
        { nameAr: "المحافظة الشمالية", nameEn: "Northern Governorate" },
        { nameAr: "المحافظة الجنوبية", nameEn: "Southern Governorate" },
        { nameAr: "محافظة المحرق", nameEn: "Muharraq Governorate" }
      ]
    });

    // Get created governorates
    const governorates = await prisma.governorate.findMany();
    const capital = governorates.find(g => g.nameEn === "Capital Governorate")!;
    const northern = governorates.find(g => g.nameEn === "Northern Governorate")!;
    const southern = governorates.find(g => g.nameEn === "Southern Governorate")!;
    const muharraq = governorates.find(g => g.nameEn === "Muharraq Governorate")!;

    await prisma.area.createMany({
      data: [
        // Capital Governorate
        { nameAr: "المنامة", nameEn: "Manama", governorateId: capital.id },
        { nameAr: "القضيبية", nameEn: "Gudaibiya", governorateId: capital.id },
        { nameAr: "الحورة", nameEn: "Hoora", governorateId: capital.id },
        { nameAr: "الجفير", nameEn: "Juffair", governorateId: capital.id },
        { nameAr: "العدلية", nameEn: "Adliya", governorateId: capital.id },
        { nameAr: "رأس رمان", nameEn: "Ras Rumman", governorateId: capital.id },
        { nameAr: "السلمانية", nameEn: "Salmaniya", governorateId: capital.id },
        { nameAr: "أم الحصم", nameEn: "Umm Al Hassam", governorateId: capital.id },
        { nameAr: "الزنج", nameEn: "Zinj", governorateId: capital.id },
        { nameAr: "المنطقة الدبلوماسية", nameEn: "Diplomatic Area", governorateId: capital.id },

        // Northern Governorate
        { nameAr: "البديع", nameEn: "Al Budaiya", governorateId: northern.id },
        { nameAr: "باربار", nameEn: "Barbar", governorateId: northern.id },
        { nameAr: "الدراز", nameEn: "Diraz", governorateId: northern.id },
        { nameAr: "سار", nameEn: "Saar", governorateId: northern.id },
        { nameAr: "المرخ", nameEn: "Al Markh", governorateId: northern.id },
        { nameAr: "مقابة", nameEn: "Maqaba", governorateId: northern.id },
        { nameAr: "كرزكان", nameEn: "Karzakan", governorateId: northern.id },
        { nameAr: "المالكية", nameEn: "Malikiyah", governorateId: northern.id },
        { nameAr: "الجنبية", nameEn: "Janabiya", governorateId: northern.id },
        { nameAr: "الشاخورة", nameEn: "Shakhura", governorateId: northern.id },
        { nameAr: "الهملة", nameEn: "Hamala", governorateId: northern.id },
        { nameAr: "أبوقوة", nameEn: "Abu Quwah", governorateId: northern.id },
        { nameAr: "مدينة حمد", nameEn: "Hamad Town", governorateId: northern.id },

        // Muharraq Governorate
        { nameAr: "المحرق", nameEn: "Muharraq", governorateId: muharraq.id },
        { nameAr: "الحد", nameEn: "Hidd", governorateId: muharraq.id },
        { nameAr: "عراد", nameEn: "Arad", governorateId: muharraq.id },
        { nameAr: "بسيتين", nameEn: "Busaiteen", governorateId: muharraq.id },
        { nameAr: "قلالي", nameEn: "Galali", governorateId: muharraq.id },
        { nameAr: "الدير", nameEn: "Al Dair", governorateId: muharraq.id },
        { nameAr: "سماهيج", nameEn: "Samaheej", governorateId: muharraq.id },
        { nameAr: "حالة النعيم", nameEn: "Halat Al Naim", governorateId: muharraq.id },
        { nameAr: "حالة بوماهر", nameEn: "Halat Bu Maher", governorateId: muharraq.id },
        { nameAr: "أمواج", nameEn: "Amwaj Islands", governorateId: muharraq.id },

        // Southern Governorate
        { nameAr: "الرفاع الشرقي", nameEn: "East Riffa", governorateId: southern.id },
        { nameAr: "بو كوارة", nameEn: "Bu Kowara", governorateId: southern.id },
        { nameAr: "الرفاع الغربي", nameEn: "West Riffa", governorateId: southern.id },
        { nameAr: "الرفاع فيوز", nameEn: "Riffa Views", governorateId: southern.id },
        { nameAr: "وادي البحير", nameEn: "Wadi Al Buhair", governorateId: southern.id },
        { nameAr: "وادي السيل", nameEn: "Wadi Al Sail", governorateId: southern.id },
        { nameAr: "عوالي", nameEn: "Awali", governorateId: southern.id },
        { nameAr: "مدينة عيسى", nameEn: "Isa Town", governorateId: southern.id },
        { nameAr: "سند", nameEn: "Sanad", governorateId: southern.id },
        { nameAr: "الزلاق", nameEn: "Zallaq", governorateId: southern.id },
        { nameAr: "الصخير", nameEn: "Sakhir", governorateId: southern.id },
        { nameAr: "جَو", nameEn: "Jaw", governorateId: southern.id },
        { nameAr: "العكر", nameEn: "Aker", governorateId: southern.id },
        { nameAr: "المعامير", nameEn: "Ma'ameer", governorateId: southern.id },
        { nameAr: "النبيه صالح", nameEn: "Nabih Saleh", governorateId: southern.id },
        { nameAr: "أم الشجر", nameEn: "Umm Al Shajar", governorateId: southern.id },
        { nameAr: "درة البحرين", nameEn: "Durrat Al Bahrain", governorateId: southern.id }
      ]
    });

    console.log('🏢 Creating test companies...');
    
    const company1 = await prisma.company.create({
      data: {
        name: "Bahrain Real Estate Co.",
        email: "info@bahrainrealestate.com",
        phone: "+97317123456",
        crNumber: "CR123456789",
        status: "approved",
        employeesLimit: 20,
        freeAdsRemaining: 10,
        featuredAdsBalance: 50
      }
    });

    const company2 = await prisma.company.create({
      data: {
        name: "Gulf Properties Ltd.",
        email: "contact@gulfproperties.bh",
        phone: "+97317987654",
        crNumber: "CR987654321",
        status: "approved",
        employeesLimit: 15,
        freeAdsRemaining: 5,
        featuredAdsBalance: 25      }
    });

    console.log('👥 Creating company employees...');

    const hashedPassword = await bcrypt.hash('password123', 10);

    const owner1 = await prisma.companyEmployee.create({
      data: {
        companyId: company1.id,
        name: "Ahmed Al-Khalifa",
        email: "ahmed@bahrainrealestate.com",
        phone: "+97336111111",
        role: "OWNER",
        passwordHash: hashedPassword,
        isActive: true
      }
    });

    await prisma.companyEmployee.create({
      data: {
        companyId: company1.id,
        name: "Sara Al-Mansoor",
        email: "sara@bahrainrealestate.com",
        phone: "+97336222222",
        role: "MANAGER",
        passwordHash: hashedPassword,
        isActive: true
      }
    });

    await prisma.companyEmployee.create({
      data: {
        companyId: company1.id,
        name: "Mohammed Al-Zayed",
        email: "mohammed@bahrainrealestate.com",
        phone: "+97336333333",
        role: "AGENT",
        passwordHash: hashedPassword,
        isActive: true      }
    });

    // Company 2 Employees
    const owner2 = await prisma.companyEmployee.create({
      data: {
        companyId: company2.id,
        name: "Fatima Al-Sabah",
        email: "fatima@gulfproperties.bh",
        phone: "+97336444444",
        role: "OWNER",
        passwordHash: hashedPassword,
        isActive: true
      }
    });

    await prisma.companyEmployee.create({
      data: {
        companyId: company2.id,
        name: "Ali Al-Rashid",
        email: "ali@gulfproperties.bh",
        phone: "+97336555555",
        role: "AGENT",
        passwordHash: hashedPassword,
        isActive: true      }
    });

    console.log('🏠 Creating sample properties...');

    // Create Sample Properties
    await prisma.property.create({
      data: {
        companyId: company1.id,
        createdByEmployeeId: owner1.id,
        description: "Beautiful modern 3-bedroom apartment with sea view in the heart of Seef district.",
        purpose: "rent",
        type: "Apartment",
        governorate: "Manama",
        area: "Seef",
        price: 800,
        bedrooms: 3,
        bathrooms: 2,
        areaSqm: 150,
        isFeatured: true,
        status: "active",
        expiresAt: new Date(Date.now() + 30 * 86400000)
      }
    });

    await prisma.property.create({
      data: {
        companyId: company1.id,
        createdByEmployeeId: owner1.id,
        description: "Spacious 4-bedroom villa with private garden and parking in quiet Arad neighborhood.",
        purpose: "sale",
        type: "Villa",
        governorate: "Muharraq",
        area: "Arad",
        price: 250000,
        bedrooms: 4,
        bathrooms: 3,
        areaSqm: 300,
        isFeatured: false,
        status: "active",
        expiresAt: new Date(Date.now() + 30 * 86400000)
      }
    });    await prisma.property.create({
      data: {
        companyId: company2.id,
        createdByEmployeeId: owner2.id,
        description: "Fully furnished executive apartment perfect for professionals in Juffair area.",
        purpose: "rent",
        type: "Apartment",
        governorate: "Manama",
        area: "Juffair",
        price: 650,
        bedrooms: 2,
        bathrooms: 2,        areaSqm: 120,
        isFeatured: true,
        status: "active",
        expiresAt: new Date(Date.now() + 30 * 86400000)
      }
    });

    await prisma.property.create({
      data: {
        companyId: company2.id,
        createdByEmployeeId: owner2.id,
        description: "Prime commercial office space in central Manama with parking facilities.",
        purpose: "rent",
        type: "Commercial",
        governorate: "Manama",
        area: "Manama",
        price: 1200,
        bedrooms: 0,
        bathrooms: 2,
        areaSqm: 200,
        isFeatured: false,
        status: "active",
        expiresAt: new Date(Date.now() + 30 * 86400000)
      }
    });

    console.log('✅ Database seeding completed successfully!');
    console.log('📊 Summary of created data:');
    console.log('   • 4 Governorates');
    console.log('   • 16 Areas');
    console.log('   • 2 Companies');
    console.log('   • 5 Company Employees');
    console.log('   • 4 Sample Properties');
    console.log('');
    console.log('🔐 Test Login Credentials:');
    console.log('   Company 1 Owner: ahmed@bahrainrealestate.com / password123');
    console.log('   Company 1 Manager: sara@bahrainrealestate.com / password123');
    console.log('   Company 1 Agent: mohammed@bahrainrealestate.com / password123');
    console.log('   Company 2 Owner: fatima@gulfproperties.bh / password123');
    console.log('   Company 2 Agent: ali@gulfproperties.bh / password123');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((err) => {
    console.error('❌ Seed script error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
