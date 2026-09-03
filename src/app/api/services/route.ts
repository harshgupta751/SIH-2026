import { NextResponse } from 'next/server';
import { applicationStore } from '@/lib/db/application-store';

export async function GET() {
  const services = applicationStore.getServices();
  return NextResponse.json({ success: true, services });
}
