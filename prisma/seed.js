const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const seedPassword = process.env.SEED_PASSWORD || 'ChangeMe#2026';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@mahasetu.gov.in';
  const adminPassword = process.env.ADMIN_PASSWORD || seedPassword;

  const deptRevenue = await prisma.department.upsert({
    where: { code: 'REVENUE' },
    update: {},
    create: {
      code: 'REVENUE',
      name: 'Department of Revenue & Land Records',
      description: 'Land registries, title extracts, and property-tax clearances.',
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
      name: 'Municipal Corporation',
      description: 'Trade licenses, ward inspections, and business zoning.',
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
      name: 'Skill Development & Employment',
      description: 'Employment schemes and entrepreneurship subsidies.',
      icon: 'GraduationCap',
      apiBaseUrl: '/api/mock/employment',
      status: 'HEALTHY',
    },
  });

  await prisma.service.upsert({
    where: { code: 'BUSINESS_LICENSE' },
    update: {},
    create: {
      code: 'BUSINESS_LICENSE',
      name: 'Municipal trade & business license',
      departmentId: deptMunicipal.id,
      description: 'Commercial permit for establishments within municipal limits.',
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
      name: 'Residential land record & address clearance',
      departmentId: deptRevenue.id,
      description: 'Digital land-record extract and property-tax clearance.',
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
      name: 'MSME enterprise & skill subsidy',
      departmentId: deptEmployment.id,
      description: 'Capital subsidy for micro-enterprises, using an approved trade license.',
      requiredClearances: JSON.stringify(['TRADE_LICENSE', 'DOMICILE_CERTIFICATE']),
      slaDays: 5,
      fee: 0,
    },
  });

  const mappings = [
    [deptRevenue.id, 'RevNet', 'citizen.fullName', 'MahaSetu_CDM', 'name', 'DIRECT'],
    [deptRevenue.id, 'RevNet', 'citizen.mobile', 'MahaSetu_CDM', 'mobile', 'FORMAT_MOBILE'],
    [deptRevenue.id, 'RevNet', 'address_record.city_name', 'MahaSetu_CDM', 'address.city', 'DIRECT'],
    [deptRevenue.id, 'RevNet', 'address_record.pin', 'MahaSetu_CDM', 'address.postalCode', 'DIRECT'],
    [deptRevenue.id, 'RevNet', 'address_record.property_tax_cleared', 'MahaSetu_CDM', 'clearances.propertyTaxCleared', 'BOOLEAN_FLAG'],
    [deptMunicipal.id, 'MahaSetu_CDM', 'name', 'MuniSys', 'applicant_name', 'DIRECT'],
    [deptMunicipal.id, 'MahaSetu_CDM', 'mobile', 'MuniSys', 'phone_number', 'DIRECT'],
    [deptMunicipal.id, 'MahaSetu_CDM', 'address.fullFormattedAddress', 'MuniSys', 'premises_address', 'DIRECT'],
    [deptMunicipal.id, 'MahaSetu_CDM', 'clearances.revenueReferenceId', 'MuniSys', 'revenue_clearance_ref', 'DIRECT'],
  ];

  for (const [departmentId, sourceSystem, sourceField, targetSystem, targetField, transformation] of mappings) {
    const existing = await prisma.fieldMapping.findFirst({
      where: { sourceSystem, sourceField, targetSystem, targetField },
    });
    if (!existing) {
      await prisma.fieldMapping.create({
        data: { departmentId, sourceSystem, sourceField, targetSystem, targetField, transformation },
      });
    }
  }

  const integrations = [
    [deptRevenue.id, 'Revenue citizen & land registry API', '/api/mock/revenue', 'API_KEY'],
    [deptMunicipal.id, 'Municipal trade licensing gateway', '/api/mock/municipal', 'OAUTH2'],
    [deptEmployment.id, 'Employment scheme engine', '/api/mock/employment', 'API_KEY'],
  ];
  for (const [departmentId, name, endpointUrl, authType] of integrations) {
    const existing = await prisma.integration.findFirst({ where: { name } });
    if (!existing) {
      await prisma.integration.create({
        data: { departmentId, name, endpointUrl, authType, status: 'CONNECTED', responseTimeMs: 40 },
      });
    }
  }

  const staff = [
    { email: adminEmail, name: 'Platform administrator', role: 'ADMIN', departmentId: null, password: adminPassword },
    {
      email: 'municipal.officer@mahasetu.gov.in',
      name: 'Municipal licensing officer',
      role: 'OFFICER_MUNICIPAL',
      departmentId: deptMunicipal.id,
      password: seedPassword,
    },
    {
      email: 'revenue.officer@mahasetu.gov.in',
      name: 'Revenue records officer',
      role: 'OFFICER_REVENUE',
      departmentId: deptRevenue.id,
      password: seedPassword,
    },
    {
      email: 'employment.officer@mahasetu.gov.in',
      name: 'Employment scheme officer',
      role: 'OFFICER_EMPLOYMENT',
      departmentId: deptEmployment.id,
      password: seedPassword,
    },
  ];

  for (const person of staff) {
    const existing = await prisma.user.findUnique({ where: { email: person.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: person.email,
          name: person.name,
          role: person.role,
          departmentId: person.departmentId,
          passwordHash: hashPassword(person.password),
        },
      });
    } else if (!existing.passwordHash) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash: hashPassword(person.password), departmentId: person.departmentId, role: person.role },
      });
    }
  }

  console.log('Seed complete.');
  console.log('Admin:', adminEmail);
  console.log('Officer accounts use SEED_PASSWORD (default ChangeMe#2026). Change these before production use.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
