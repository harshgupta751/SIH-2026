import { NextResponse } from 'next/server';
import { requireRoles } from '@/lib/auth/guards';
import { municipalMockSystem } from '@/lib/mock-departments/municipal-system';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = requireRoles(['OFFICER_MUNICIPAL', 'ADMIN']);
  if ('response' in auth) return auth.response;
  try {
    const body = await req.json().catch(() => ({}));
    const comments = body.comments || 'Approved by municipal licensing officer.';
    const result = await municipalMockSystem.approveApplication(params.id, comments);
    return NextResponse.json({ success: true, permit: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Approval failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
