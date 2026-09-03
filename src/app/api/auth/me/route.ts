import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('mahasetu_user');

    if (userCookie) {
      return NextResponse.json({
        success: true,
        user: JSON.parse(userCookie.value),
      });
    }

    // Default citizen session
    return NextResponse.json({
      success: true,
      user: {
        id: 'usr-01',
        name: 'Rahul Sharma',
        email: 'rahul.sharma@example.gov.in',
        role: 'CITIZEN',
        citizenId: 'CIT-3210',
        mobile: '9876543210',
        department: 'CITIZEN_SERVICES',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
