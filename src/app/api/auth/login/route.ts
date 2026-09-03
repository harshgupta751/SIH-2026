import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { role = 'CITIZEN' } = body;

    let user = {
      id: 'usr-01',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.gov.in',
      role: 'CITIZEN',
      citizenId: 'CIT-3210',
      mobile: '9876543210',
      department: 'CITIZEN_SERVICES',
    };

    if (role === 'OFFICER_MUNICIPAL') {
      user = {
        id: 'usr-02',
        name: 'Manoj Kulkarni',
        email: 'm.kulkarni@punecorp.gov.in',
        role: 'OFFICER_MUNICIPAL',
        citizenId: '',
        mobile: '9822012345',
        department: 'MUNICIPAL',
      };
    } else if (role === 'OFFICER_REVENUE') {
      user = {
        id: 'usr-03',
        name: 'Sunita Patil',
        email: 's.patil@maha-revenue.gov.in',
        role: 'OFFICER_REVENUE',
        citizenId: '',
        mobile: '9822098765',
        department: 'REVENUE',
      };
    } else if (role === 'ADMIN') {
      user = {
        id: 'usr-04',
        name: 'Dr. Alok Verma',
        email: 'gateway.admin@mahasetu.gov.in',
        role: 'ADMIN',
        citizenId: '',
        mobile: '9800000001',
        department: 'MAHASETU_GATEWAY',
      };
    }

    const response = NextResponse.json({
      success: true,
      token: `jwt_mock_${user.role.toLowerCase()}_token`,
      user,
    });

    response.cookies.set('mahasetu_role', user.role, { path: '/' });
    response.cookies.set('mahasetu_user', JSON.stringify(user), { path: '/' });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
