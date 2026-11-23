# psqaldia.com

## Sobre el proyecto
psqaldia.com es una plataforma para profesionales de la salud mental con contenidos de actualidad: herramientas clínicas (conversores, titulaciones, exploraciones), entradas sobre novedades y evidencia reciente, y un portal de exámenes OPE del SERGAS. El código está en este repositorio, los datos en el Google Sheets del autor y se publica en Cloudflare Pages, con un Worker delante.

## Forma de trabajar
- Actúa directamente. Pregunta solo cuando la decisión sea realmente del autor.
- Responde en español, claro y sin rodeos.
- Escribe para profesionales: lenguaje técnico preciso, sin simplificar en exceso.
- No inventes. Comprueba con fuentes los datos clínicos (dosis, equivalencias, criterios, cifras). Prefiere fuentes actuales: guías vigentes, fichas técnicas de la AEMPS, artículos recientes. Si la fuente da un rango, usa el rango. Si no encuentras confirmación, dilo.
- Si necesitas acceder a una web o fuente externa que no tienes disponible, pídelo enseguida. Lo mismo si falta un artículo o documento: pídelo en vez de trabajar sin él.
- Cuando el autor pase un documento, léelo entero antes de usarlo.
- No publiques (merge a main) sin que el autor autorice ese cambio concreto. Que autorice un cambio no autoriza el siguiente.
- La hoja de Google la edita el autor. Pásale las celdas o la tabla lista para pegar, con la cabecera y en el mismo formato que la pestaña.
- Si encuentras errores mientras haces otra cosa, avisa aunque no los haya pedido.

## Cómo está montada la web
- Las páginas leen los datos con `/?sheet=NOMBRE`. El Worker devuelve el rango A2:Z500, sin la fila de cabecera.
- El Worker no está en el repositorio: cuando cambia, se entrega el archivo completo y el autor lo pega en Cloudflare.
- En cada cambio publicado, sube la versión de la caché en `sw.js` (`psq-vNN`).
- Para que una página nueva entre en el sitemap, añádela a `paginas.json`. Cuida el título y la descripción de cada página para que Google la muestre bien.
- Las herramientas siguen un formato común: tres tarjetas de presentación, la herramienta, las fuentes, el botón "VOLVER A HERRAMIENTAS" y la línea final "© 2026 PSQ AL DÍA · Herramientas clínicas".
- Siempre que sea posible, las herramientas tendrán un selector de idioma español/english.
- Antes de publicar, prueba los cambios en el navegador (móvil y escritorio) simulando los datos del Sheets. Después, comprueba la web publicada en psqaldia.com. Excepción: añadir un examen OPE (solo la línea en `OPE_ESPECIALIDADES` y las páginas generadas) no necesita esta prueba completa; basta con que `node scripts/generar-paginas-ope.js` termine sin errores.

## Exámenes OPE
- Formato de cada pestaña: A pregunta · B–E opciones A–D · F respuesta correcta (A–D, o NULA si está anulada) · G explicación. En la Parte Común, la columna H lleva el año.
- Usa siempre el examen y la plantilla de respuestas definitivos del SERGAS. Copia literal: ni resumir ni corregir el enunciado.
- Para añadir un examen: una línea en `OPE_ESPECIALIDADES` de `ope_portal.js` y después `node scripts/generar-paginas-ope.js`.
- Comprueba la columna F casilla por casilla contra la plantilla oficial; las preguntas modificadas por el tribunal (letra entre comillas) llevan la letra nueva sin comillas.
- La hoja entregada lleva la columna G vacía, salvo en las anuladas: «Pregunta anulada por el tribunal. Motivo oficial: …» (motivo traducido de la página 2 de la plantilla). Las explicaciones las completa el autor en otra conversación. En la hoja no van notas internas, marcas de duda ni texto provisional.
- Si te piden explicaciones: si la pregunta es clara, explicación directa, sin cita. Si hay un dato concreto, una cifra, un criterio, una dosis o algo que no cuadra con la plantilla, compruébalo en fuentes externas antes de escribirla. Si aun así no se puede confirmar, escribe la explicación mejor respaldada, con prudencia y sin afirmar lo que no esté claro.
- Las dudas van aparte, fuera de la hoja: una lista corta con el número de pregunta y el motivo, por si el autor puede resolverlas.
