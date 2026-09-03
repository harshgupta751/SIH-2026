import { NextResponse } from 'next/server';
import { IntegrationRegistry } from '@/lib/interop/registry';

export async function GET() {
  const healthList = await IntegrationRegistry.getHealthOverview();
  return NextResponse.json({ success: true, integrations: healthList });
}
