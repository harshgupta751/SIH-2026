import { NextResponse } from 'next/server';
import { revenueMockSystem } from '@/lib/mock-departments/revenue-system';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const citizen = revenueMockSystem.getCitizenRecord(params.id);
  if (!citizen) {
    return NextResponse.json(
      { error: 'Citizen not found in Revenue Department (RevNet)' },
      { status: 404 }
    );
  }
  return NextResponse.json(citizen);
}
