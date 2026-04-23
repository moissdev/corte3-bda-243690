-- HABILITACIÓN DE ROW-LEVEL SECURITY

ALTER TABLE mascotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacunas_aplicadas ENABLE ROW LEVEL SECURITY;


-- CREACIÓN DE POLÍTICAS

-- TABLA: MASCOTAS ==============================
-- Admin y Recepción ven todas las mascotas

CREATE POLICY pol_mascotas_ver_todo ON mascotas
    FOR SELECT TO rol_admin, rol_recepcion
    USING (true);

-- Los Veterinarios solo ven las mascotas que atienden cruzando con vet_atiende_mascota
-- Se utiliza current_setting('app.current_vet_id') para saber quién es el vet logueado actualmente

CREATE POLICY pol_mascotas_vet_ver ON mascotas
    FOR SELECT TO rol_veterinario
    USING (
        EXISTS (
            SELECT 1 FROM vet_atiende_mascota vam
            WHERE vam.mascota_id = mascotas.id
            AND vam.vet_id = NULLIF(current_setting('app.current_vet_id', true), '')::INT
        )
    );


-- TABLA: CITAS ==============================

CREATE POLICY pol_citas_ver_todo ON citas 
    FOR ALL TO rol_admin, rol_recepcion 
    USING (true) WITH CHECK (true);

CREATE POLICY pol_citas_vet ON citas
    FOR ALL TO rol_veterinario
    USING (veterinario_id = NULLIF(current_setting('app.current_vet_id', true), '')::INT)
    WITH CHECK (veterinario_id = NULLIF(current_setting('app.current_vet_id', true), '')::INT);


-- TABLA: VACUNAS APLICADAS ==============================
CREATE POLICY pol_vacunas_ver_todo ON vacunas_aplicadas 
    FOR ALL TO rol_admin 
    USING (true) WITH CHECK (true);

CREATE POLICY pol_vacunas_vet ON vacunas_aplicadas
    FOR ALL TO rol_veterinario
    USING (
        EXISTS (
            SELECT 1 FROM vet_atiende_mascota vam 
            WHERE vam.mascota_id = vacunas_aplicadas.mascota_id 
            AND vam.vet_id = NULLIF(current_setting('app.current_vet_id', true), '')::INT
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vet_atiende_mascota vam 
            WHERE vam.mascota_id = vacunas_aplicadas.mascota_id 
            AND vam.vet_id = NULLIF(current_setting('app.current_vet_id', true), '')::INT
        )
    );