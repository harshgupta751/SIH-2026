import { RevNetCitizenResponse } from '../interop/types';

/**
 * RevNet: Simulated Revenue & Land Records Department System
 * Represents an independent, legacy departmental backend with its own schema.
 */
class RevenueSystemMock {
  private citizenDb: Map<string, RevNetCitizenResponse> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    // Primary demo citizen: Rahul Sharma
    this.citizenDb.set('9876543210', {
      citizen: {
        fullName: 'Rahul Sharma',
        mobile: '9876543210',
        aadhaarHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
      address_record: {
        house_no: 'Flat 402, Shanti Niwas',
        locality: 'Kothrud',
        city_name: 'Pune',
        pin: '411038',
        district_name: 'Pune',
        state_code: 'MH',
        land_holding_sqft: 1200,
        property_tax_cleared: true,
      },
      verification_status: 'VERIFIED_ACTIVE',
      issued_at: new Date().toISOString(),
    });

    // Secondary citizen for alternate testing
    this.citizenDb.set('9123456780', {
      citizen: {
        fullName: 'Priya Deshmukh',
        mobile: '9123456780',
        aadhaarHash: '879fa8e87498c47b1981a8bcae62d64f0b2fbe8e45f94a123f18e9508d8e3b12',
      },
      address_record: {
        house_no: 'Plot 12, Baner Enclave',
        locality: 'Baner',
        city_name: 'Pune',
        pin: '411045',
        district_name: 'Pune',
        state_code: 'MH',
        land_holding_sqft: 2400,
        property_tax_cleared: true,
      },
      verification_status: 'VERIFIED_ACTIVE',
      issued_at: new Date().toISOString(),
    });
  }

  /**
   * GET /api/mock/revenue/citizens/:idOrMobile
   */
  public getCitizenRecord(identifier: string): RevNetCitizenResponse | null {
    // Lookup by mobile or fallback to first
    if (this.citizenDb.has(identifier)) {
      return this.citizenDb.get(identifier)!;
    }
    // Default fallback to Rahul Sharma for prototype demo reliability
    return this.citizenDb.get('9876543210')!;
  }

  /**
   * POST /api/mock/revenue/verify
   */
  public verifyAddressAndTax(mobile: string): {
    verified: boolean;
    clearanceCode: string;
    details: { propertyTaxCleared: boolean; addressVerified: boolean };
  } {
    const record = this.getCitizenRecord(mobile);
    if (!record) {
      return {
        verified: false,
        clearanceCode: 'REV-REJECT-NOT-FOUND',
        details: { propertyTaxCleared: false, addressVerified: false },
      };
    }
    return {
      verified: record.address_record.property_tax_cleared && record.verification_status === 'VERIFIED_ACTIVE',
      clearanceCode: `REV-CLR-${Date.now().toString().slice(-6)}`,
      details: {
        propertyTaxCleared: record.address_record.property_tax_cleared,
        addressVerified: record.verification_status === 'VERIFIED_ACTIVE',
      },
    };
  }
}

export const revenueMockSystem = new RevenueSystemMock();
