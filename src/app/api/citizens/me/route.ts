import { NextResponse } from 'next/server';

export async function GET() {
  const profile = {
    citizenId: 'CIT-3210',
    fullName: 'Rahul Sharma',
    email: 'rahul.sharma@example.gov.in',
    mobile: '9876543210',
    aadhaarMasked: 'XXXX-XXXX-1234',
    address: {
      line1: 'Flat 402, Shanti Niwas',
      locality: 'Kothrud',
      city: 'Pune',
      district: 'Pune',
      state: 'Maharashtra',
      postalCode: '411038',
    },
    digiLockerLinked: true,
    verifiedStatus: 'VERIFIED_CITIZEN',
    registeredDate: '2025-08-14T10:00:00.000Z',
  };

  return NextResponse.json({ success: true, profile });
}
