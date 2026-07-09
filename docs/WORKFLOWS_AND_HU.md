# Flujos de Trabajo e Historias de Usuario

## Alcance Actual

La app permite administrar familias, productos con imagen, generar catalogos PDF con distintos formatos, guardar historial local y compartir archivos usando el sistema nativo del dispositivo.

## Persistencia Local

- Familias, productos y catalogos se guardan en SQLite local (`catalog.db`).
- Las fotos de productos se copian a almacenamiento persistente de la app en `document/product-images`.
- Los PDFs generados se copian a almacenamiento persistente de la app en `document/catalog-pdfs`.
- El historial guarda la URI persistente del PDF, no la URI temporal de cache.
- Al eliminar un catalogo, el archivo PDF fisico se borra solo si ningun otro registro del historial lo usa.

## Roles

- Administrador de catalogo: crea familias, productos y catalogos.
- Vendedor o usuario operativo: genera y comparte catalogos PDF.

## Flujos Principales

### 1. Configurar familias

1. Entrar a Familias.
2. Crear una familia con nombre.
3. Editar familia si cambia el nombre.
4. Eliminar familia si ya no se usa.

Criterios:
- El nombre es obligatorio.
- Al eliminar una familia, se eliminan sus productos relacionados por SQLite.
- Si no hay familias, la app crea una familia General al cargar.

### 2. Crear producto con foto

1. Entrar a Productos.
2. Completar nombre, precio, formato y familia.
3. Seleccionar foto desde galeria.
4. Guardar producto.

Criterios:
- Nombre, precio, formato y familia son obligatorios.
- El precio debe ser mayor a cero.
- La foto se copia al almacenamiento interno de la app.
- El producto queda disponible para catalogos por familia.

### 3. Editar o eliminar producto

1. Entrar a Productos.
2. Elegir Editar sobre un producto.
3. Modificar datos o foto.
4. Guardar cambios.
5. Usar Eliminar para removerlo.

Criterios:
- Los cambios actualizan SQLite.
- La eliminacion pide confirmacion.
- Los errores se muestran en pantalla.

### 4. Generar catalogo PDF

1. Entrar a Catalogo.
2. Escribir nombre del catalogo.
3. Seleccionar familia.
4. Seleccionar productos filtrados por familia.
5. Elegir formato visual:
   - Grilla 2
   - Grilla 3
   - Grilla 4x5
   - Grilla 3x7
   - Lista
   - Premium
6. Presionar Generar PDF.

Criterios:
- Debe haber al menos un producto seleccionado.
- El PDF incluye foto, nombre, formato y precio.
- El PDF queda guardado en historial y en almacenamiento persistente de la app.
- Grilla 4x5 pagina hasta 20 productos por hoja.
- Grilla 3x7 pagina hasta 21 productos por hoja.

### 5. Compartir PDF generado

1. Generar PDF.
2. Presionar Compartir PDF.
3. Elegir una app nativa compatible.

Criterios:
- Usa expo-sharing.
- Permite enviar por apps disponibles del dispositivo, como WhatsApp, correo, Drive, Telegram, AirDrop u otras si estan instaladas.
- Si compartir no esta disponible, se muestra error controlado.

### 6. Gestionar historial

1. Entrar a Historial.
2. Ver catalogos generados.
3. Abrir/Enviar catalogo.
4. Duplicar catalogo.
5. Eliminar catalogo.

Criterios:
- El historial se lee desde SQLite.
- Duplicar crea un nuevo registro con nombre "copia".
- Eliminar pide confirmacion.
- Abrir/Enviar usa el menu nativo de compartir.

## Historias de Usuario

### HU-001 Crear familia

Como administrador, quiero crear familias de productos para organizar el catalogo por grupos.

Criterios de aceptacion:
- Dado un nombre valido, cuando guardo, entonces la familia aparece en el listado.
- Dado un nombre vacio, cuando guardo, entonces veo un error.

### HU-002 Editar familia

Como administrador, quiero editar el nombre de una familia para mantener la organizacion actualizada.

Criterios de aceptacion:
- Dada una familia existente, cuando cambio su nombre, entonces se actualiza en SQLite.

### HU-003 Eliminar familia

Como administrador, quiero eliminar familias que ya no uso.

Criterios de aceptacion:
- Dada una familia existente, cuando confirmo eliminacion, entonces desaparece del listado.

### HU-004 Crear producto con imagen

Como administrador, quiero crear productos con foto para generar catalogos visuales.

Criterios de aceptacion:
- Dado un producto valido con foto, cuando guardo, entonces se muestra en el listado.
- Dada una foto seleccionada, cuando guardo, entonces la URI persistente se conserva en SQLite.

### HU-005 Editar producto

Como administrador, quiero actualizar datos e imagenes de productos.

Criterios de aceptacion:
- Dado un producto existente, cuando edito datos o foto, entonces el listado refleja los cambios.

### HU-006 Eliminar producto

Como administrador, quiero eliminar productos que ya no vendere.

Criterios de aceptacion:
- Dado un producto existente, cuando confirmo eliminar, entonces desaparece del listado.

### HU-007 Generar PDF por familia

Como vendedor, quiero generar un PDF filtrado por familia para enviar solo productos relevantes.

Criterios de aceptacion:
- Dada una familia seleccionada, cuando entro al selector, entonces solo veo productos de esa familia.
- Dado al menos un producto seleccionado, cuando genero PDF, entonces se guarda un catalogo en historial.

### HU-008 Elegir formato de catalogo

Como vendedor, quiero elegir formatos como 4x5 o 3x7 para adaptar el catalogo al tipo de venta.

Criterios de aceptacion:
- Dado el formato 4x5, cuando genero PDF, entonces se pagina en grilla de 4 columnas y 5 filas.
- Dado el formato 3x7, cuando genero PDF, entonces se pagina en grilla de 3 columnas y 7 filas.

### HU-009 Compartir catalogo

Como vendedor, quiero compartir el PDF con aplicaciones nativas para enviarlo rapidamente.

Criterios de aceptacion:
- Dado un catalogo generado, cuando presiono compartir, entonces se abre el menu nativo.

### HU-010 Ver historial

Como usuario, quiero ver catalogos generados anteriormente para reutilizarlos.

Criterios de aceptacion:
- Dado un catalogo generado, cuando entro a Historial, entonces aparece en la lista.

### HU-011 Duplicar catalogo

Como vendedor, quiero duplicar un catalogo para reutilizar una base anterior.

Criterios de aceptacion:
- Dado un catalogo existente, cuando duplico, entonces se crea un nuevo registro copia.

### HU-012 Eliminar catalogo

Como usuario, quiero eliminar catalogos del historial para mantenerlo limpio.

Criterios de aceptacion:
- Dado un catalogo existente, cuando confirmo eliminacion, entonces desaparece del historial.

## Flujos Pendientes Recomendados

- Copiar o mover PDFs generados a una carpeta persistente con nombres legibles.
- Borrar archivo PDF fisico al eliminar catalogo del historial.
- Agregar vista previa visual antes de generar PDF.
- Agregar busqueda y filtros en productos.
- Agregar sincronizacion futura con backend.
- Agregar tests unitarios para casos de uso y repositorios.
