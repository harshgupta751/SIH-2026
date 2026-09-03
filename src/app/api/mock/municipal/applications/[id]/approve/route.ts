import { NextResponse } from 'next/server';
import { municipalMockSystem } from '@/lib/mock-departments/municipal-system';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const { comments = 'Approved by Municipal Licensing Officer.' } = body;
    const result = municipalMockSystem.approveApplication(params.id, comments);
    return NextResponse.json({ success: true, permit: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
