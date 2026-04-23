import redisClient from '@/lib/redis';
import { queryWithRLS } from '@/lib/db';

export async function GET() {
  const CACHE_KEY = 'vacunacion_pendiente';
  
  try {
    // 1. Intentar buscar en Redis
    const cachedData = await redisClient.get(CACHE_KEY);
    
    if (cachedData) {
      console.log('[CACHE HIT] vacunacion_pendiente');
      return Response.json({ source: 'redis', data: JSON.parse(cachedData) });
    }
    
    // 2. Si no está en Redis (Cache Miss), consultar la vista en la BD
    console.log('[CACHE MISS] vacunacion_pendiente');
    const data = await queryWithRLS('SELECT * FROM v_mascotas_vacunacion_pendiente', []);
    
    // 3. Guardar en Redis. 
    // Justificación del TTL para tu README: 300 segundos (5 minutos) 
    // es un tiempo razonable porque la vacunación de pacientes no ocurre por segundo,
    // reduciendo la carga en la DB sin perder demasiada frescura en la recepción.
    await redisClient.setEx(CACHE_KEY, 300, JSON.stringify(data));
    
    return Response.json({ source: 'database', data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}