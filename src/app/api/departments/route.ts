import { NextResponse } from 'next/server';

export async function GET() {
  const departments = [
    {
      id: 'DEP-REV',
      code: 'REVENUE',
      name: 'Department of Revenue & Land Records',
      systemName: 'RevNet',
      description: 'Custodian of cadastral land parcels, title deeds, and property tax clearances.',
      status: 'ONLINE',
      apiBaseUrl: '/api/mock/revenue',
      latencyMs: 38,
    },
    {
      id: 'DEP-MUNI',
      code: 'MUNICIPAL',
      name: 'Municipal Corporation Department',
      systemName: 'MuniSys',
      description: 'Authority for commercial trade licenses, ward inspections, and business zoning.',
      status: 'ONLINE',
      apiBaseUrl: '/api/mock/municipal',
      latencyMs: 42,
    },
    {
      id: 'DEP-EMP',
      code: 'EMPLOYMENT',
      name: 'Skill Development & Employment Department',
      systemName: 'KaushalPortal',
      description: 'State employment schemes, entrepreneurship subsidies, and vocational certificates.',
      status: 'ONLINE',
      apiBaseUrl: '/api/mock/employment',
      latencyMs: 35,
    },
  ];

  return NextResponse.json({ success: true, departments });
}
