import { NextResponse } from 'next/server';
import { revenueMockSystem } from '@/lib/mock-departments/revenue-system';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mobile = '9876543210' } = body;
    const result = revenueMockSystem.verifyAddressAndTax(mobile);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
