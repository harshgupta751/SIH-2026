import { NextResponse } from 'next/server';
import { revenueAdapter } from '@/lib/interop/adapters/revenue.adapter';
import { municipalAdapter } from '@/lib/interop/adapters/municipal.adapter';
import { employmentAdapter } from '@/lib/interop/adapters/employment.adapter';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { departmentCode = 'REVENUE' } = body;

    let result;
    if (departmentCode === 'REVENUE') {
      result = await revenueAdapter.testHealth();
    } else if (departmentCode === 'MUNICIPAL') {
      result = await municipalAdapter.testHealth();
    } else if (departmentCode === 'EMPLOYMENT') {
      result = await employmentAdapter.testHealth();
    } else {
      return NextResponse.json({ success: false, error: 'Unknown department code' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      departmentCode,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
