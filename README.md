# Decisiones de diseño

## Preguntas

**1. ¿Qué política RLS aplicaste a la tabla mascotas?**
````sql
CREATE POLICY pol_mascotas_vet_ver ON mascotas
    FOR SELECT TO rol_veterinario 
    USING (
        EXISTS (
            SELECT 1 FROM vet_atiende_mascota vam 
            WHERE vam.mascota_id = mascotas.id 
            AND vam.vet_id = NULLIF (current_setting('app.current_vet_id', true), '')::INT
        )
    );
````

Esta política restringe la vista del veterinario para que solo pueda ver las filas de mascotas cuyo ID esté vinculado a su propio ID a través de la tabla intermedia de *vet_atiende_mascota*.


**2. Cualquiera que sea la estrategia que elegiste para identificar al veterinario actual en RLS, tiene un vector de ataque posible. ¿Cuál es? ¿Tu sistema lo previene? ¿Cómo?**
El vector es la suplantación de identidad. El sistema lo previene porque la variable *app.current_vet_id* se establece de forma segura y temporal con un *SET LOCAL* dentro del backend. El usuario final no tiene acceso directo a la conexión de base de datos como para ejecutar o alterar las variables de entorno de PostgreSQL.


**3. Si usas SECURITY DEFINER en algún procedure, ¿qué medida específica tomaste para prevenir la escalada de privilegios que ese modo habilita? Si no lo usas, justifica por qué no era necesario.**
No utilicé *SECURITY DEFINER* en los procedimientos porque ya se tiene un modelo de privilegios mínimos en donde cada rol ya cuenta con los permisos exactos sobre las tablas necesarias. Ejecutar funciones como *SECURITY INVOKER* resulta más seguro ya que elimina el peligro de que se manipule maliciosamente el *search_path*


**4. ¿Qué TTL le pusiste al caché Redis y por qué ese valor específico? ¿Qué pasaría si fuera demasiado bajo? ¿Demasiado alto?**
Utilicé un TTL de 300 segundos en *vacunacion_pendiente*, elegí este valor porque la aplicación de vacunas no es un evento de alta concurrencia; y 5 minutos reduce significativamente la carga de la base de datos sin sacrificar que el sistema esté "fresco", si fuera más bajo, la base de datos se sobrecargaría anulando la ventaja del caché; y si fuera más alto, la recepción vería datos obsoletos y podría omitir a pacientes que requieran de una vacuna urgente.


**5. Tu frontend manda input del usuario al backend. Elige un endpoint crítico donde el backend maneja ese input antes de enviarlo a la base de datos. Explica qué protege esa línea y de qué, indicando archivo y línea.**
El archivo es *route.js* en *api/src/app/api/mascotas/* a eso de la línea *10 a la 13*.

Esta línea protege la base de datos contra SQL Injection. Y es que al aislar el input del usuario en un arreglo de parámetros, NodeJS lo trata como una cadena de texto literal y mata cualquier comando SQL malicioso.


**6. Si revocas todos los permisos del rol de veterinario excepto SELECT en mascotas, ¿qué deja de funcionar en tu sistema? Lista tres operaciones que se romperían.**
1. **Agendar citas**: El procedure *sp_agendar_cita* fallaría porque el veterinario no tendría permisos de INSERT en la tabla citas.
2. **Registro de vacunas**: El veterinario no podría guardar la aplicación de una dosis porque le faltaría el permiso de INSERT en *vacunas_aplicadas*.
3. **Auditoría de movimientos**: Al insertar una cita, la base de datos arrojaría un error porque el trigger *trg_historial_cita* intentaría hacer un INSERT en *historial_movimientos* sin tener los permisos necesarios.