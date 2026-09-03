import { NextResponse } from 'next/server';
import { consentManager } from '@/lib/consent/consent-manager';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const citizenId = searchParams.get('citizenId') || undefined;
  const consents = consentManager.getConsentsForCitizen(citizenId);
  return NextResponse.json({ success: true, count: consents.length, consents });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const consent = consentManager.createConsentRequest(body);
    return NextResponse.json({ success: true, consent });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
