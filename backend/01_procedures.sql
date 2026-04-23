CREATE OR REPLACE PROCEDURE sp_agendar_cita(
    p_mascota_id INT,
    p_veterinario_id INT,
    p_fecha_hora TIMESTAMP,
    p_motivo TEXT,
    OUT p_cita_id INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_mascota_existe BOOLEAN;
    v_vet_activo BOOLEAN;
    v_dias_descanso VARCHAR(50);
    v_dia_semana VARCHAR(20);
BEGIN
    -- 1. Valida que la mascota existe
    SELECT EXISTS(SELECT 1 FROM mascotas WHERE id = p_mascota_id) INTO v_mascota_existe;
    IF NOT v_mascota_existe THEN
        RAISE EXCEPTION 'Operación rechazada: La mascota con ID % no existe.', p_mascota_id;
    END IF;

    -- 2. Valida al veterinario y obtiene sus datos con bloqueo read-decide-write
    -- FOR UPDATE bloquea la fila del veterinario para serializar citas concurrentes al mismo veterinario
    SELECT activo, dias_descanso INTO v_vet_activo, v_dias_descanso
    FROM veterinarios
    WHERE id = p_veterinario_id FOR UPDATE;

    IF v_vet_activo IS NULL THEN
        RAISE EXCEPTION 'Operación rechazada: El veterinario con ID % no existe.', p_veterinario_id;
    ELSIF NOT v_vet_activo THEN
        RAISE EXCEPTION 'Operación rechazada: El veterinario con ID % no se encuentra activo.', p_veterinario_id;
    END IF;

    -- 3. Valida los días de descanso
    -- Utiliza TMDay para obtener el día en español
    v_dia_semana := trim(lower(to_char(p_fecha_hora, 'TMDay')));
    
    IF v_dias_descanso IS NOT NULL AND v_dias_descanso <> '' THEN
        IF position(v_dia_semana IN lower(v_dias_descanso)) > 0 THEN
            RAISE EXCEPTION 'Operación rechazada: El veterinario descansa los días % y se intentó agendar en %.', v_dias_descanso, v_dia_semana;
        END IF;
    END IF;

    -- 4. Previene colisiones de horario 
    IF EXISTS (
        SELECT 1 FROM citas 
        WHERE veterinario_id = p_veterinario_id AND fecha_hora = p_fecha_hora
    ) THEN
        RAISE EXCEPTION 'Colisión de horario: El veterinario ya tiene una cita agendada en esa fecha y hora exacta.';
    END IF;

    -- 5. Registra la cita
    INSERT INTO citas(mascota_id, veterinario_id, fecha_hora, motivo, estado)
    VALUES (p_mascota_id, p_veterinario_id, p_fecha_hora, p_motivo, 'AGENDADA')
    RETURNING id INTO p_cita_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;