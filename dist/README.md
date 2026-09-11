# Getpes — Sitio web

Sitio en HTML/CSS/JS puro (sin build, sin dependencias) con 5 secciones: Inicio, Nosotros, Portafolio, Contacto y Dashboard.

## Cómo verlo
Abre `index.html` directamente en el navegador, o levanta un servidor local:
```
cd getpes-web
python3 -m http.server 8000
```
y entra a `http://localhost:8000`.

## Dashboard — cuentas demo
El login funciona con datos simulados guardados en `localStorage` (no hay backend real todavía).

| Correo | Contraseña |
|---|---|
| sonrisa@cliente.com | 123456 |
| cafeandino@cliente.com | 123456 |

Cada cuenta ve **solo sus propias métricas** (resumen, campañas, gráfico) y puede guardar su configuración de reportes — los cambios persisten en su navegador.

⚠️ **Importante para producción:** esta autenticación es solo una maqueta de front-end. Antes de usarlo con clientes reales hay que conectarlo a un backend de verdad (Supabase, Firebase o una API propia) con contraseñas hasheadas y sesiones seguras — decías que ya tienes el dashboard maquetado, así que cuando me lo pases podemos conectar esta estructura a tus datos reales y, más adelante, sumar el rol Admin para que tú veas todos los clientes a la vez.

## Estructura
```
getpes-web/
  index.html         Inicio (hero + servicios + teaser dashboard)
  nosotros.html       Nosotros
  portafolio.html     Portafolio (placeholders, listo para tus proyectos reales)
  contacto.html       Contacto (formulario funcional en el navegador)
  dashboard.html       Login + panel de cliente
  css/style.css        Estilos del sitio público
  css/dashboard.css    Estilos del dashboard
  js/main.js            Nav/footer compartidos + formulario de contacto
  js/dashboard.js       Login, sesión, métricas y configuración por cliente
  assets/logo.svg       Tu logo
```

## Personalizar / agregar clientes
Edita el arreglo `SEED_CLIENTS` en `js/dashboard.js` (nombre, correo, contraseña, métricas, campañas y configuración inicial). Al recargar el dashboard con `localStorage` limpio, se recrea con esos datos.
