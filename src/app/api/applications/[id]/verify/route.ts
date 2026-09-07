export { dynamic, runtime } from '@/lib/api/route-config';

import { NextResponse } from 'next/server';
import { requireRoles, forbidden } from '@/lib/auth/guards';
import { getApplicationById } from '@/lib/db/application-store';
import { runInteropPipeline } from '@/lib/interop/pipeline';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = requireRoles(['CITIZEN']);
  if ('response' in auth) return auth.response;

  try {
    const application = await getApplicationById(params.id);
    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }
    if (application.citizenId !== auth.user.citizenId) return forbidden();

    const result = await runInteropPipeline(params.id);
    return NextResponse.json({
      success: true,
      message: 'Interoperability workflow completed',
      ...result,
    });
  } catch (err: unknown) {
    const status = (err as { status?: number }).status || 500;
    const message = err instanceof Error ? err.message : 'Pipeline failed';
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
