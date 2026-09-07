/**
 * Mapping-engine tests (no database required)
 */
import { DataMappingEngine } from '../src/lib/interop/mapping-engine';

async function runTests() {
  const revRaw = {
    citizen: {
      fullName: 'Test Citizen',
      mobile: '9876543210',
      aadhaarHash: 'abc',
    },
    address_record: {
      house_no: 'Flat 1',
      locality: 'Kothrud',
      city_name: 'Pune',
      pin: '411038',
      district_name: 'Pune',
      state_code: 'MH',
      land_holding_sqft: 1200,
      property_tax_cleared: true,
    },
    verification_status: 'VERIFIED_ACTIVE' as const,
    issued_at: new Date().toISOString(),
  };

  const cdm = DataMappingEngine.transformRevenueToCDM(revRaw);
  if (cdm.name !== 'Test Citizen' || cdm.address.city !== 'Pune' || !cdm.clearances.revenueVerified) {
    throw new Error('CDM transform failed');
  }

  const muni = DataMappingEngine.transformCDMToMunicipal(cdm, 'Test Enterprises');
  if (muni.applicant_name !== 'Test Citizen' || muni.business_title !== 'Test Enterprises') {
    throw new Error('Municipal transform failed');
  }

  const mapped = DataMappingEngine.executeMapping(revRaw, [
    { id: '1', sourceSystem: 'RevNet', sourceField: 'citizen.mobile', targetSystem: 'CDM', targetField: 'mobile', transformation: 'FORMAT_MOBILE' },
    { id: '2', sourceSystem: 'RevNet', sourceField: 'address_record.property_tax_cleared', targetSystem: 'CDM', targetField: 'cleared', transformation: 'BOOLEAN_FLAG' },
  ]);
  if (mapped.mobile !== '9876543210' || mapped.cleared !== true) {
    throw new Error('Generic mapping failed');
  }

  console.log('Mapping engine tests passed.');
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
