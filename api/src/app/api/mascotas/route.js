import { queryWithRLS } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  
  try {
    // La línea que previene la inyección SQL está aquí.
    // El texto del usuario se pasa como parámetro aislado ($1), no concatenado con +.
    const data = await queryWithRLS(
      'SELECT * FROM mascotas WHERE nombre ILIKE $1',
      [`%${q}%`]
    );
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}