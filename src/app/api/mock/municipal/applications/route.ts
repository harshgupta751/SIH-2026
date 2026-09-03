import { NextResponse } from 'next/server';
import { municipalMockSystem } from '@/lib/mock-departments/municipal-system';

export async function GET() {
  const list = municipalMockSystem.getAllApplications();
  return NextResponse.json({ success: true, count: list.length, applications: list });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const permitRecord = municipalMockSystem.registerApplication(body);
    return NextResponse.json({ success: true, permitRecord });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
