'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  // Estados para la sesión y UI
  const [role, setRole] = useState('rol_recepcion');
  const [vetId, setVetId] = useState('');
  const [pets, setPets] = useState([]);
  const [search, setSearch] = useState('');
  const [vaccines, setVaccines] = useState({ source: '', data: [], latency: 0 });

  // 1. Función para cambiar de rol (Login simulado)
  const handleLogin = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ role, vet_id: vetId }),
    });
    alert(`Sesión actualizada como: ${role}`);
    // Limpiar vistas al cambiar de rol para forzar recarga
    setPets([]);
    setVaccines({ source: '', data: [], latency: 0 });
  };

  // 2. Búsqueda de Mascotas (Blindada)
  const searchPets = async () => {
    try {
      const res = await fetch(`/api/mascotas?q=${search}`);
      const data = await res.json();
      
      if (res.ok) {
        setPets(data); // Si todo sale bien, guarda el arreglo
      } else {
        alert("Error de la Base de Datos: " + data.error);
        setPets([]); // Limpia la lista si hay error
      }
    } catch (err) {
      console.error("Error de red:", err);
    }
  };

  // 3. Listado de Vacunación (Blindada)
  const loadVaccines = async () => {
    const start = performance.now();
    try {
      const res = await fetch('/api/vacunacion-pendiente');
      const result = await res.json();
      const end = performance.now();
      
      if (res.ok) {
        setVaccines({ 
          source: result.source, 
          data: result.data, 
          latency: (end - start).toFixed(2) 
        });
      } else {
        alert("Error del servidor: " + result.error);
        setVaccines({ source: '', data: [], latency: 0 });
      }
    } catch (err) {
      console.error("Error de red:", err);
    }
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Panel de Gestión - Clínica Veterinaria</h1>

      {/* SECCIÓN DE LOGIN */}
      <section style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '2rem' }}>
        <h2>1. Control de Acceso (Prueba de RLS)</h2>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="rol_admin">Administrador</option>
          <option value="rol_recepcion">Recepción</option>
          <option value="rol_veterinario">Veterinario</option>
        </select>
        {role === 'rol_veterinario' && (
          <input 
            type="number" 
            placeholder="ID de Veterinario (1, 2 o 3)" 
            value={vetId} 
            onChange={(e) => setVetId(e.target.value)}
          />
        )}
        <button onClick={handleLogin}>Actualizar Sesión</button>
      </section>

      {/* BUSCADOR DE MASCOTAS */}
      <section style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '2rem' }}>
        <h2>2. Búsqueda de Mascotas (Prueba de SQL Injection)</h2>
        <p><small>Intenta usar: <code>' OR '1'='1</code></small></p>
        <input 
          type="text" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Nombre de mascota..."
        />
        <button onClick={searchPets}>Buscar</button>
        <ul>
          {pets.map(p => <li key={p.id}>{p.nombre} ({p.especie})</li>)}
        </ul>
      </section>

      {/* LISTADO DE VACUNACIÓN */}
      <section style={{ border: '1px solid #ccc', padding: '1rem' }}>
        <h2>3. Vacunación Pendiente (Prueba de Redis)</h2>
        <button onClick={loadVaccines}>Cargar Listado</button>
        {vaccines.source && (
          <div style={{ marginTop: '1rem' }}>
            <p><strong>Origen:</strong> {vaccines.source.toUpperCase()}</p>
            <p><strong>Latencia:</strong> {vaccines.latency} ms</p>
            <table border="1" cellPadding="5" style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th>Mascota</th>
                  <th>Dueño</th>
                  <th>Última Vacuna</th>
                  <th>Prioridad</th>
                </tr>
              </thead>
              <tbody>
                {vaccines.data.map((v, i) => (
                  <tr key={i}>
                    <td>{v.nombre_mascota}</td>
                    <td>{v.nombre_dueno}</td>
                    <td>{v.fecha_ultima_vacuna || 'Nunca'}</td>
                    <td>{v.prioridad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}