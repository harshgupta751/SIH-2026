import { NextResponse } from 'next/server';
import { applicationStore } from '@/lib/db/application-store';
import { DataMappingEngine } from '@/lib/interop/mapping-engine';

export async function GET() {
  const mappings = applicationStore.getFieldMappings();
  return NextResponse.json({ success: true, count: mappings.length, mappings });
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, updates } = body;
    const updated = applicationStore.updateFieldMapping(id, updates);
    return NextResponse.json({ success: true, mapping: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sourceData, rules } = body;
    const activeRules = rules || applicationStore.getFieldMappings();
    const result = DataMappingEngine.executeMapping(sourceData, activeRules);
    return NextResponse.json({ success: true, transformedData: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
