CREATE OR REPLACE FUNCTION fn_trg_historial_cita()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_nombre_mascota VARCHAR;
    v_nombre_vet VARCHAR;
    v_descripcion TEXT;
BEGIN
    -- Recupera los nombres para hacer un log legible
    SELECT nombre INTO v_nombre_mascota FROM mascotas WHERE id = NEW.mascota_id;
    SELECT nombre INTO v_nombre_vet FROM veterinarios WHERE id = NEW.veterinario_id;

    -- Formatea la descripción
    v_descripcion := 'Cita para ' || v_nombre_mascota || ' con ' || v_nombre_vet || ' el ' || to_char(NEW.fecha_hora, 'DD/MM/YYYY');

    -- Inserta el log
    INSERT INTO historial_movimientos(tipo, referencia_id, descripcion, fecha)
    VALUES ('CITA_AGENDADA', NEW.id, v_descripcion, NOW());

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_historial_cita
AFTER INSERT ON citas
FOR EACH ROW
EXECUTE FUNCTION fn_trg_historial_cita();

-- ====================================================================================================

CREATE OR REPLACE FUNCTION fn_total_facturado(
    p_mascota_id INT,
    p_anio INT
) RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_citas NUMERIC;
    v_total_vacunas NUMERIC;
BEGIN
    -- Suma las citas completadas en el año
    SELECT COALESCE(SUM(costo), 0) INTO v_total_citas
    FROM citas
    WHERE mascota_id = p_mascota_id
      AND estado = 'COMPLETADA'
      AND EXTRACT(YEAR FROM fecha_hora) = p_anio;

    -- Suma las vacunas aplicadas en el año
    SELECT COALESCE(SUM(costo_cobrado), 0) INTO v_total_vacunas
    FROM vacunas_aplicadas
    WHERE mascota_id = p_mascota_id
      AND EXTRACT(YEAR FROM fecha_aplicacion) = p_anio;

    -- Devuelve una sumatoria de ambos rubros
    RETURN v_total_citas + v_total_vacunas;
END;
$$;