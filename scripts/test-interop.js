/**
 * Unit & Integration Test Suite for MahaSetu Interoperability Core
 */
const { revenueMockSystem } = require('../src/lib/mock-departments/revenue-system');
const { municipalMockSystem } = require('../src/lib/mock-departments/municipal-system');
const { DataMappingEngine } = require('../src/lib/interop/mapping-engine');
const { consentManager } = require('../src/lib/consent/consent-manager');
const { auditLogger } = require('../src/lib/audit/audit-logger');

async function runTests() {
  console.log('🧪 Starting MahaSetu Interoperability Core Test Suite...\n');

  // Test 1: RevNet Mock System
  console.log('Test 1: RevNet Raw Payload Verification');
  const revRaw = revenueMockSystem.getCitizenRecord('9876543210');
  if (!revRaw || !revRaw.citizen || revRaw.citizen.fullName !== 'Rahul Sharma') {
    throw new Error('Test 1 Failed: RevNet returned invalid data');
  }
  console.log('  ✅ RevNet citizen record returned correctly:', revRaw.citizen.fullName);
  console.log('  ✅ RevNet address record formatted with city_name:', revRaw.address_record.city_name);

  // Test 2: Data Mapping Engine (RevNet -> CDM)
  console.log('\nTest 2: Dynamic Data Mapping Engine (RevNet -> CDM)');
  const cdm = DataMappingEngine.transformRevenueToCDM(revRaw);
  if (cdm.name !== 'Rahul Sharma' || cdm.address.city !== 'Pune' || !cdm.clearances.revenueVerified) {
    throw new Error('Test 2 Failed: DataMappingEngine failed to produce valid CDM');
  }
  console.log('  ✅ CDM Normalized Record generated:');
  console.log('     Name:', cdm.name);
  console.log('     Formatted Address:', cdm.address.fullFormattedAddress);
  console.log('     Property Tax Cleared:', cdm.clearances.propertyTaxCleared);
  console.log('     Revenue Clearance Ref:', cdm.clearances.revenueReferenceId);

  // Test 3: Data Mapping Engine (CDM -> MuniSys)
  console.log('\nTest 3: Dynamic Data Mapping Engine (CDM -> MuniSys)');
  const muniPayload = DataMappingEngine.transformCDMToMunicipal(cdm, 'Rahul Enterprises');
  if (muniPayload.applicant_name !== 'Rahul Sharma' || muniPayload.business_title !== 'Rahul Enterprises') {
    throw new Error('Test 3 Failed: DataMappingEngine failed to translate CDM to MuniSys');
  }
  console.log('  ✅ Dispatched MuniSys Payload generated:');
  console.log('     applicant_name:', muniPayload.applicant_name);
  console.log('     premises_address:', muniPayload.premises_address);
  console.log('     revenue_clearance_ref:', muniPayload.revenue_clearance_ref);
  console.log('     approval_state:', muniPayload.approval_state);

  // Test 4: MuniSys Registration and Approval
  console.log('\nTest 4: MuniSys Application Registration & Approval Workflow');
  const permitRecord = municipalMockSystem.registerApplication(muniPayload);
  console.log('  ✅ MuniSys registered application:', permitRecord.applicationNumber);
  const approvedPermit = municipalMockSystem.approveApplication(permitRecord.applicationNumber, 'All checks OK');
  if (approvedPermit.officerDecision !== 'APPROVED' || !approvedPermit.permitCertificateNumber) {
    throw new Error('Test 4 Failed: Municipal approval failed');
  }
  console.log('  ✅ MuniSys trade permit approved:', approvedPermit.permitCertificateNumber);

  // Test 5: Consent Management (DPDP Act)
  console.log('\nTest 5: DPDP Consent Lifecycle');
  const consent = consentManager.createConsentRequest({
    citizenId: 'CIT-3210',
    applicationId: 'MH-MUNI-TEST-1',
    requestedByDept: 'MUNICIPAL',
    sourceDept: 'REVENUE',
    purpose: 'Test verification',
    dataFields: ['name', 'address'],
  });
  console.log('  ✅ Consent requested:', consent.id, 'Status:', consent.status);
  const granted = consentManager.grantConsent(consent.id);
  if (granted.status !== 'GRANTED' || !granted.grantedAt) {
    throw new Error('Test 5 Failed: Consent grant failed');
  }
  console.log('  ✅ Consent granted:', granted.id, 'at:', granted.grantedAt);

  // Test 6: Audit Logger Non-Repudiation Chaining
  console.log('\nTest 6: Immutable Audit Log Chaining');
  const log1 = auditLogger.log({
    actorId: 'CIT-3210',
    actorRole: 'CITIZEN',
    action: 'TEST_ACTION_1',
    entityType: 'TEST',
    entityId: 'TEST-1',
    department: 'MUNICIPAL',
    purpose: 'Unit Testing',
    details: { test: true },
  });
  const log2 = auditLogger.log({
    actorId: 'OFFICER-01',
    actorRole: 'OFFICER',
    action: 'TEST_ACTION_2',
    entityType: 'TEST',
    entityId: 'TEST-2',
    department: 'REVENUE',
    purpose: 'Unit Testing Chain',
    details: { test: true },
  });
  if (log2.prevHash !== log1.hash) {
    throw new Error('Test 6 Failed: Cryptographic audit hash chain broken');
  }
  console.log('  ✅ Audit Log 1 Hash:', log1.hash.slice(0, 16) + '...');
  console.log('  ✅ Audit Log 2 PrevHash:', log2.prevHash.slice(0, 16) + '... (Strict Match!)');

  console.log('\n🎉 ALL 6 INTEROPERABILITY TESTS PASSED WITH 100% INTEGRITY!\n');
}

runTests().catch((e) => {
  console.error('❌ Test failed:', e);
  process.exit(1);
});
