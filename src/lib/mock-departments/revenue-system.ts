import { prisma } from '@/lib/db/prisma';
import { hashIdentifier } from '@/lib/auth/password';
import { RevNetCitizenResponse } from '@/lib/interop/types';

export function buildRevenuePayload(input: {
  fullName: string;
  mobile: string;
  aadhaarHash: string;
  addressLine: string;
  locality: string;
  city: string;
  district: string;
  state: string;
  postalCode: string;
  landHoldingSqft?: number;
  propertyTaxCleared?: boolean;
}): RevNetCitizenResponse {
  return {
    citizen: {
      fullName: input.fullName,
      mobile: input.mobile,
      aadhaarHash: input.aadhaarHash || hashIdentifier(input.mobile),
    },
    address_record: {
      house_no: input.addressLine,
      locality: input.locality,
      city_name: input.city,
      pin: input.postalCode,
      district_name: input.district,
      state_code: input.state === 'Maharashtra' ? 'MH' : input.state.slice(0, 2).toUpperCase(),
      land_holding_sqft: input.landHoldingSqft ?? 0,
      property_tax_cleared: input.propertyTaxCleared ?? false,
    },
    verification_status: 'VERIFIED_ACTIVE',
    issued_at: new Date().toISOString(),
  };
}

export async function upsertRevenueRecord(input: {
  fullName: string;
  mobile: string;
  aadhaarHash: string;
  addressLine: string;
  locality: string;
  city: string;
  district: string;
  state: string;
  postalCode: string;
  landHoldingSqft?: number;
  propertyTaxCleared?: boolean;
}) {
  const payload = buildRevenuePayload(input);
  return prisma.revenueCitizenRecord.upsert({
    where: { mobile: input.mobile },
    update: { payloadJson: JSON.stringify(payload) },
    create: { mobile: input.mobile, payloadJson: JSON.stringify(payload) },
  });
}

class RevenueSystem {
  public async getCitizenRecord(identifier: string): Promise<RevNetCitizenResponse | null> {
    const row = await prisma.revenueCitizenRecord.findUnique({ where: { mobile: identifier } });
    if (!row) return null;
    return JSON.parse(row.payloadJson) as RevNetCitizenResponse;
  }

  public async verifyAddressAndTax(mobile: string) {
    const record = await this.getCitizenRecord(mobile);
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

  public async setPropertyTaxCleared(mobile: string, cleared: boolean) {
    const record = await this.getCitizenRecord(mobile);
    if (!record) throw new Error('Citizen not found in Revenue records');
    record.address_record.property_tax_cleared = cleared;
    record.issued_at = new Date().toISOString();
    await prisma.revenueCitizenRecord.update({
      where: { mobile },
      data: { payloadJson: JSON.stringify(record) },
    });
    return record;
  }
}

export const revenueMockSystem = new RevenueSystem();
