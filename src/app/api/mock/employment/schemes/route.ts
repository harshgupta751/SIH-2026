import { NextResponse } from 'next/server';
import { employmentMockSystem } from '@/lib/mock-departments/employment-system';

export async function GET() {
  const schemes = employmentMockSystem.getAvailableSchemes();
  return NextResponse.json({ success: true, schemes });
}
