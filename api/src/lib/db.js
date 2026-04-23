import { Pool } from 'pg';
import { cookies } from 'next/headers';

const pool = new Pool({
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "tu_password_super_seguro",
  host: "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.POSTGRES_DB || "clinica_vet",
});

export async function queryWithRLS(text, params) {
  const client = await pool.connect();
  try {
    // 1. Leer la sesión simulada desde las cookies
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth_session');
    const session = authCookie ? JSON.parse(authCookie.value) : { role: 'rol_recepcion', vet_id: null };

    // Validar roles permitidos (Hardening)
    const validRoles = ['rol_admin', 'rol_recepcion', 'rol_veterinario'];
    const safeRole = validRoles.includes(session.role) ? session.role : 'rol_recepcion';

    await client.query('BEGIN');
    
    // 2. Establecer el rol en PostgreSQL
    await client.query(`SET LOCAL ROLE ${safeRole}`);
    
    // 3. Establecer el ID del veterinario para las políticas RLS
    if (session.vet_id) {
      await client.query(`SET LOCAL app.current_vet_id = '${session.vet_id}'`);
    } else {
      await client.query(`SET LOCAL app.current_vet_id = ''`);
    }

    // 4. Ejecutar la consulta protegida (params previene SQL Injection)
    const res = await client.query(text, params);
    
    await client.query('COMMIT');
    return res.rows;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}