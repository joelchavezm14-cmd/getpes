# Integración preparada, no activada

La configuración de campañas y la paleta de cada empresa se guardan actualmente en Sites. No se ha creado ni conectado un proyecto Supabase.

Para activar: crear el proyecto, ejecutar preferences.sql y configurar exclusivamente en el servidor SUPABASE_URL, SUPABASE_SECRET_KEY (clave secreta sb_secret_) y PREFERENCES_STORE=supabase. No colocar claves en archivos públicos ni en el navegador. Mantener las variables existentes de autenticación.

Antes de activar en producción, copiar las filas de dashboard_preferences a getpes_preferences y verificar lectura/escritura en un entorno de prueba. Si no hay fila remota se lee la local, y el siguiente guardado la copia a Supabase. Las nuevas escrituras también conservan una copia en Sites. Un fallo remoto muestra error y no se anuncia un guardado exitoso. La configuración personal de color continúa en la cuenta de Getpes y tiene prioridad sobre la empresa. No se migra autenticación ni datos de campañas.

Validar sesión, aislamiento entre empresas y permisos antes de cada acceso remoto. La tabla no es accesible con claves públicas. Documentación: https://supabase.com/docs/guides/api y https://supabase.com/docs/guides/getting-started/api-keys
