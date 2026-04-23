-- CREACIÓN DE ROLES PARA EL SISTEMA

DROP ROLE IF EXISTS rol_admin;
DROP ROLE IF EXISTS rol_recepcion;
DROP ROLE IF EXISTS rol_veterinario;

CREATE ROLE rol_admin;
CREATE ROLE rol_recepcion;
CREATE ROLE rol_veterinario;

-- ASIGNACIÓN DE PERMISOS
-- Admin: Tiene acceso total al sistema y las secuencias

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rol_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rol_admin;

-- Recepción: Puede ver los dueños y mascotas, y gestionar las citas

GRANT SELECT ON duenos, mascotas, citas, veterinarios TO rol_recepcion;
GRANT INSERT, UPDATE ON citas TO rol_recepcion;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rol_recepcion;

-- Mínimo privilegio: La recepción nunca ve los datos médicos
REVOKE ALL PRIVILEGES ON vacunas_aplicadas FROM rol_recepcion;

-- Veterinario: Solo ve lo que es necesario para su operación y los registros médicos

GRANT SELECT ON duenos, mascotas, citas, vacunas_aplicadas, inventario_vacunas, veterinarios, vet_atiende_mascota TO rol_veterinario;
GRANT INSERT, UPDATE ON citas, vacunas_aplicadas TO rol_veterinario;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rol_veterinario;

-- El veterinario necesita poder insertar en el historial porque al agendar la cita, se dispara el trigger
GRANT INSERT ON historial_movimientos TO rol_veterinario;
