import redisClient from '@/lib/redis';
import { queryWithRLS } from '@/lib/db';

export async function POST(request) {
  const body = await request.json();
  const { mascota_id, vacuna_id, veterinario_id, costo } = body;

  try {
    await queryWithRLS(
      'INSERT INTO vacunas_aplicadas (mascota_id, vacuna_id, veterinario_id, costo_cobrado) VALUES ($1, $2, $3, $4)',
      [mascota_id, vacuna_id, veterinario_id, costo]
    );

    // ESTRATEGIA DE INVALIDACIÓN: Borrado directo (Cache Invalidation on Write)
    // Justificación: Al vacunar, la vista general cambia inmediatamente. Borramos la key
    // para que la siguiente consulta GET experimente un MISS y regenere la caché.
    await redisClient.del('vacunacion_pendiente');
    console.log('[CACHE INVALIDATED] Se aplicó una vacuna, caché borrada.');

    return Response.json({ message: 'Vacuna registrada y caché invalidada' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}