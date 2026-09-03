import { NextResponse } from 'next/server';
import { municipalMockSystem } from '@/lib/mock-departments/municipal-system';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const app = municipalMockSystem.getApplication(params.id);
  if (!app) {
    return NextResponse.json({ error: 'Application not found in MuniSys' }, { status: 404 });
  }
  return NextResponse.json(app);
}
