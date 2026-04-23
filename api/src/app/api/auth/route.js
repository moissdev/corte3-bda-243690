import { cookies } from 'next/headers';

export async function POST(request) {
  const body = await request.json();
  const { role, vet_id } = body;

  const cookieStore = await cookies();
  cookieStore.set('auth_session', JSON.stringify({ role, vet_id }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  return Response.json({ message: 'Sesión actualizada', role, vet_id });
}