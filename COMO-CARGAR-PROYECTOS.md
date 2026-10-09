# Cargar las ocho imágenes de Portafolio

1. Prepara las imágenes verticales de 1080 × 1920 píxeles. Usa nombres simples, por ejemplo `proyecto-01.webp` hasta `proyecto-08.webp`. También puedes usar `.jpg` o `.png`, indicando la misma extensión en el código.
2. Guarda los archivos dentro de `public/assets/portafolio/`.
3. Abre `public/portafolio.html` y busca `data-project-slot="1"`. Los ocho espacios están numerados del 1 al 8.
4. Reemplaza la tarjeta correspondiente por este bloque, cambiando el número, el nombre de la imagen y su descripción:

```html
<li class="portfolio-capture" data-project-slot="1">
  <img src="assets/portafolio/proyecto-01.webp"
       alt="Descripción del proyecto"
       width="1080" height="1920" loading="lazy">
</li>
```

Deja las tarjetas pendientes con su texto `Próximamente`. Si prefieres insertar el `<img>` y conservar el `<span>` existente, el carrusel elimina el aviso automáticamente al encontrar la imagen.

Edita solamente las ocho tarjetas originales: el carrusel crea su copia para el movimiento continuo, por lo que no debes duplicarlas manualmente.

5. Guarda el archivo y vuelve a desplegar el contenido completo de `public/` en Netlify, incluyendo las imágenes nuevas. El cambio no aparece en la web publicada hasta que actualices el despliegue.
