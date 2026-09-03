const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MahaSetu PostgreSQL database...');

  // 1. Departments
  const deptRevenue = await prisma.department.upsert({
    where: { code: 'REVENUE' },
    update: {},
    create: {
      code: 'REVENUE',
      name: 'Department of Revenue & Land Records',
      description: 'Custodian of land registries, title deeds, and property tax clearances in Maharashtra.',
      icon: 'LandPlot',
      apiBaseUrl: '/api/mock/revenue',
      status: 'HEALTHY',
    },
  });

  const deptMunicipal = await prisma.department.upsert({
    where: { code: 'MUNICIPAL' },
    update: {},
    create: {
      code: 'MUNICIPAL',
      name: 'Municipal Corporation (MuniSys)',
      description: 'Authority for commercial trade licenses, ward inspections, and business zoning.',
      icon: 'Building2',
      apiBaseUrl: '/api/mock/municipal',
      status: 'HEALTHY',
    },
  });

  const deptEmployment = await prisma.department.upsert({
    where: { code: 'EMPLOYMENT' },
    update: {},
    create: {
      code: 'EMPLOYMENT',
      name: 'Skill Development & Employment (KaushalPortal)',
      description: 'State employment schemes, entrepreneurship subsidies, and vocational certificates.',
      icon: 'GraduationCap',
      apiBaseUrl: '/api/mock/employment',
      status: 'HEALTHY',
    },
  });

  // 2. Services
  await prisma.service.upsert({
    where: { code: 'BUSINESS_LICENSE' },
    update: {},
    create: {
      code: 'BUSINESS_LICENSE',
      name: 'Municipal Trade & Business License',
      departmentId: deptMunicipal.id,
      description: 'Statutory commercial permit for retail and business establishments within city boundaries.',
      requiredClearances: JSON.stringify(['REVENUE_ADDRESS_AND_TAX_CLEARANCE']),
      slaDays: 3,
      fee: 1200,
    },
  });

  await prisma.service.upsert({
    where: { code: 'ADDRESS_VERIFICATION' },
    update: {},
    create: {
      code: 'ADDRESS_VERIFICATION',
      name: 'Residential Land Record & Address Clearance',
      departmentId: deptRevenue.id,
      description: 'Digital verified land record extract and residential property tax clearance certificate.',
      requiredClearances: JSON.stringify(['REVENUE_TITLE_CLEARANCE']),
      slaDays: 2,
      fee: 0,
    },
  });

  await prisma.service.upsert({
    where: { code: 'SKILL_SUBSIDY' },
    update: {},
    create: {
      code: 'SKILL_SUBSIDY',
      name: 'MSME Youth Enterprise & Skill Subsidy',
      departmentId: deptEmployment.id,
      description: 'Credit-linked capital subsidy for new micro-enterprises under state employment schemes.',
      requiredClearances: JSON.stringify(['TRADE_LICENSE', 'DOMICILE_CERTIFICATE']),
      slaDays: 5,
      fee: 0,
    },
  });

  // 3. Demo Users & Citizen
  const citizenUser = await prisma.user.upsert({
    where: { email: 'rahul.sharma@example.gov.in' },
    update: {},
    create: {
      email: 'rahul.sharma@example.gov.in',
      name: 'Rahul Sharma',
      role: 'CITIZEN',
      citizen: {
        create: {
          fullName: 'Rahul Sharma',
          mobile: '9876543210',
          aadhaarHash: 'sha256_mock_e3b0c44298fc1c149afbf4c8996fb924',
          addressLine: 'Flat 402, Shanti Niwas',
          locality: 'Kothrud',
          city: 'Pune',
          district: 'Pune',
          state: 'Maharashtra',
          postalCode: '411038',
        },
      },
    },
  });

  // 4. Default Field Mappings
  const mappings = [
    {
      departmentId: deptRevenue.id,
      sourceSystem: 'RevNet',
      sourceField: 'citizen.fullName',
      targetSystem: 'MahaSetu_CDM',
      targetField: 'name',
      transformation: 'DIRECT',
    },
    {
      departmentId: deptRevenue.id,
      sourceSystem: 'RevNet',
      sourceField: 'citizen.mobile',
      targetSystem: 'MahaSetu_CDM',
      targetField: 'mobile',
      transformation: 'FORMAT_MOBILE',
    },
    {
      departmentId: deptRevenue.id,
      sourceSystem: 'RevNet',
      sourceField: 'address_record.city_name',
      targetSystem: 'MahaSetu_CDM',
      targetField: 'address.city',
      transformation: 'DIRECT',
    },
    {
      departmentId: deptRevenue.id,
      sourceSystem: 'RevNet',
      sourceField: 'address_record.pin',
      targetSystem: 'MahaSetu_CDM',
      targetField: 'address.postalCode',
      transformation: 'DIRECT',
    },
    {
      departmentId: deptRevenue.id,
      sourceSystem: 'RevNet',
      sourceField: 'address_record.property_tax_cleared',
      targetSystem: 'MahaSetu_CDM',
      targetField: 'clearances.propertyTaxCleared',
      transformation: 'BOOLEAN_FLAG',
    },
    {
      departmentId: deptMunicipal.id,
      sourceSystem: 'MahaSetu_CDM',
      sourceField: 'name',
      targetSystem: 'MuniSys',
      targetField: 'applicant_name',
      transformation: 'DIRECT',
    },
    {
      departmentId: deptMunicipal.id,
      sourceSystem: 'MahaSetu_CDM',
      sourceField: 'mobile',
      targetSystem: 'MuniSys',
      targetField: 'phone_number',
      transformation: 'DIRECT',
    },
    {
      departmentId: deptMunicipal.id,
      sourceSystem: 'MahaSetu_CDM',
      sourceField: 'address.fullFormattedAddress',
      targetSystem: 'MuniSys',
      targetField: 'premises_address',
      transformation: 'DIRECT',
    },
    {
      departmentId: deptMunicipal.id,
      sourceSystem: 'MahaSetu_CDM',
      sourceField: 'clearances.revenueReferenceId',
      targetSystem: 'MuniSys',
      targetField: 'revenue_clearance_ref',
      transformation: 'DIRECT',
    },
  ];

  for (const m of mappings) {
    const existing = await prisma.fieldMapping.findFirst({
      where: {
        sourceSystem: m.sourceSystem,
        sourceField: m.sourceField,
        targetSystem: m.targetSystem,
        targetField: m.targetField,
      },
    });
    if (!existing) {
      await prisma.fieldMapping.create({ data: m });
    }
  }

  // 5. Default Integrations
  const integrations = [
    {
      departmentId: deptRevenue.id,
      name: 'RevNet Citizen & Land Registry API',
      endpointUrl: '/api/mock/revenue',
      authType: 'API_KEY',
      status: 'CONNECTED',
      responseTimeMs: 38,
    },
    {
      departmentId: deptMunicipal.id,
      name: 'MuniSys Trade Licensing Gateway',
      endpointUrl: '/api/mock/municipal',
      authType: 'OAUTH2',
      status: 'CONNECTED',
      responseTimeMs: 42,
    },
    {
      departmentId: deptEmployment.id,
      name: 'KaushalPortal Scheme Engine',
      endpointUrl: '/api/mock/employment',
      authType: 'API_KEY',
      status: 'CONNECTED',
      responseTimeMs: 35,
    },
  ];

  for (const i of integrations) {
    const existing = await prisma.integration.findFirst({ where: { name: i.name } });
    if (!existing) {
      await prisma.integration.create({ data: i });
    }
  }

  console.log('✅ MahaSetu PostgreSQL Database Seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
