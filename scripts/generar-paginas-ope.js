#!/usr/bin/env node
/**
 * Genera una página por especialidad del Portal OPE (/opesergas/<especialidad>) a partir de la lista
 * OPE_ESPECIALIDADES de ope_portal.js, para que Google pueda indexar cada examen.
 *
 * Uso (desde la raíz del repositorio):   node scripts/generar-paginas-ope.js
 * Ejecútalo cada vez que añadas o cambies una especialidad o una convocatoria en ope_portal.js.
 *
 * Crea o actualiza:
 *   - opesergas/<slug>.html         una página por especialidad
 *   - opesergas/paginas.json        la lista de páginas (la lee el Worker para el sitemap)
 *   - opesergas.html                el bloque de enlaces entre <!-- OPE:ESPECIALIDADES --> y <!-- /OPE:ESPECIALIDADES -->
 *   - ope_portal.js no se toca
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.resolve(__dirname, '..');
const SITE = 'https://psqaldia.com';

// --- Leer la configuración del motor sin ejecutar nada del navegador ---
const ctx = { window: {}, document: undefined, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(RAIZ, 'ope_portal.js'), 'utf8'), ctx);
const ESPECIALIDADES = ctx.window.OPE_ESPECIALIDADES;
if (!Array.isArray(ESPECIALIDADES) || !ESPECIALIDADES.length) throw new Error('No se encontró OPE_ESPECIALIDADES en ope_portal.js');

const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const añoLargo = a => (/^\d{2}$/.test(a) ? '20' + a : a);
const listaAños = e => e.examenes.map(x => añoLargo(x.año));
const unirY = l => (l.length < 2 ? l.join('') : l.slice(0, -1).join(', ') + ' y ' + l[l.length - 1]);

const paginas = ESPECIALIDADES.map(e => ({ e, slug: slug(e.nombre), url: `${SITE}/opesergas/${slug(e.nombre)}` }));
const slugs = paginas.map(p => p.slug);
if (new Set(slugs).size !== slugs.length) throw new Error('Hay dos especialidades con el mismo nombre de página: ' + slugs.join(', '));

// Nombre tal como se lee en una frase: «de Psiquiatría», «de la Parte Común»
const deNombre = e => (e.id === 'comun' ? 'la Parte Común' : e.nombre);

function pagina({ e, slug: s, url }) {
    const años = listaAños(e);
    const titulo = e.id === 'comun'
        ? `OPE SERGAS Parte Común: examen oficial con respuestas (${años.join(' y ')})`
        : `OPE SERGAS ${e.nombre}: examen oficial con respuestas (${años.join(' y ')})`;
    const descripcion = `Preguntas del examen oficial de ${deNombre(e)} de la OPE del SERGAS (${unirY(años)}) con la plantilla de respuestas definitiva. Haz el examen online con corrección automática o lee todas las preguntas.`;
    const h1 = e.id === 'comun' ? 'OPE SERGAS: Parte Común' : `OPE SERGAS de ${e.nombre}`;
    const ld = {
        '@context': 'https://schema.org',
        '@graph': [
            { '@type': 'WebPage', name: titulo, description: descripcion, url, inLanguage: 'es',
              publisher: { '@type': 'Organization', name: 'psq al día', url: `${SITE}/`, logo: `${SITE}/og-psq.png` } },
            { '@type': 'BreadcrumbList', itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE}/` },
                { '@type': 'ListItem', position: 2, name: 'Portal OPE', item: `${SITE}/opesergas` },
                { '@type': 'ListItem', position: 3, name: e.nombre, item: url } ] }
        ]
    };
    const botones = e.examenes.map(x => `
            <button class="psq-btn" onclick="opeIniciar('${e.id}','${x.año}')"><i class="fas fa-play"></i> Examen ${esc(añoLargo(x.año))}</button>`).join('') + `
            <button class="psq-btn ope-btn-sec" onclick="opeIniciar('${e.id}','snack')"><i class="fas fa-bolt"></i> Snack (${e.snack} al azar)</button>`;
    const secciones = e.examenes.map(x => {
        const a = añoLargo(x.año), ancla = `convocatoria-${slug(a)}`;
        return `
        <section class="ope-conv" id="${ancla}">
            <div class="ope-conv-head">
                <h2>Examen de ${esc(deNombre(e))} · convocatoria ${esc(a)}</h2>
                <span class="ope-num"></span>
            </div>
            <p class="ope-conv-txt">Preguntas oficiales con la respuesta de la plantilla definitiva. Las anuladas por el tribunal aparecen indicadas.</p>
            <div class="ope-conv-acciones">
                <button class="psq-btn" onclick="opeIniciar('${e.id}','${x.año}')"><i class="fas fa-play"></i> Hacer examen</button>
                <button class="psq-btn ope-btn-sec ope-leer" aria-expanded="false" aria-controls="${ancla}-preguntas"><i class="fas fa-list"></i> <span>Leer todas las preguntas</span></button>
            </div>
            <div class="ope-preguntas" id="${ancla}-preguntas" hidden="until-found">
                <ol class="ope-listado" data-hoja="${esc(x.hoja)}"${x.filtroAño ? ` data-filtro="${esc(x.filtroAño)}"` : ''} data-ancla="${ancla}">
                    <li class="ope-cargando">Cargando preguntas…</li>
                </ol>
            </div>
        </section>`;
    }).join('');
    const otras = paginas.filter(p => p.slug !== s).map(p => `<a href="/opesergas/${p.slug}"${p.e.id === 'comun' ? ' class="ope-comun"' : ''}>${esc(p.e.nombre)}</a>`).join('');

    return `<!DOCTYPE html>
<!-- Página generada por scripts/generar-paginas-ope.js a partir de ope_portal.js. No la edites a mano. -->
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(titulo)} | psq al día</title>
    <meta name="description" content="${esc(descripcion)}">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="${url}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="psq al día">
    <meta property="og:title" content="${esc(titulo)}">
    <meta property="og:description" content="${esc(descripcion)}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${SITE}/og-psq.png">
    <meta name="twitter:card" content="summary">
    <link rel="icon" type="image/png" href="/Logo.png">
    <link rel="stylesheet" href="/css/all.min.css">
    <link rel="stylesheet" href="/css/psq.css">
    <link rel="stylesheet" href="/css/ope.css">
    <script src="/js/tema.js"></script>
    <script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
    <nav class="psq-topbar">
        <a href="/" class="psq-brand"><img src="/icon-192.png" alt="" width="34" height="34"><span>psq <b>al día</b></span></a>
        <a href="/opesergas" class="psq-nav-link"><i class="fas fa-graduation-cap"></i><span>Portal OPE</span></a>
    </nav>

    <header class="psq-hero psq-glow">
        <p class="ope-miga"><a href="/opesergas">Portal OPE</a> › ${esc(e.nombre)}</p>
        <h1>${esc(h1)}</h1>
        <p>Exámenes oficiales de ${unirY(años)} con la plantilla de respuestas definitiva. Haz el examen con corrección automática y repaso de fallos, o lee todas las preguntas con su respuesta más abajo.</p>
        <div class="ope-botones">${botones}
        </div>
    </header>

    <main class="container ope-main">${secciones}

        <nav class="ope-otras" aria-label="Otras especialidades">
            <h2>Otras especialidades</h2>
            <div>${otras}</div>
        </nav>
    </main>

    <footer class="psq-footer">
        <a href="/opesergas"><i class="fas fa-arrow-left"></i> Volver al Portal OPE</a>
    </footer>

    <div id="modal">
        <div class="modal-content psq-light-island">
            <button class="btn-cerrar-modal" onclick="cerrarPortal()" aria-label="Cerrar">✕</button>
            <div id="cronometro-container"><i class="fas fa-clock"></i> <span id="cronometro">00:00:00</span></div>
            <div id="modalData"></div>
        </div>
    </div>

    <script src="/ope_portal.js"></script>
    <script src="/js/ope-pagina.js"></script>
</body>
</html>
`;
}

// --- Escribir páginas y lista ---
const dir = path.join(RAIZ, 'opesergas');
fs.mkdirSync(dir, { recursive: true });
const vigentes = new Set(paginas.map(p => p.slug + '.html'));
for (const f of fs.readdirSync(dir)) {
    // Borra las páginas de especialidades que ya no existen (solo las generadas por este script)
    if (f.endsWith('.html') && !vigentes.has(f) && fs.readFileSync(path.join(dir, f), 'utf8').includes('generar-paginas-ope.js')) fs.unlinkSync(path.join(dir, f));
}
paginas.forEach(p => fs.writeFileSync(path.join(dir, p.slug + '.html'), pagina(p)));
fs.writeFileSync(path.join(dir, 'paginas.json'), JSON.stringify(paginas.map(p => 'opesergas/' + p.slug), null, 1) + '\n');

// --- Enlaces en /opesergas ---
const portal = path.join(RAIZ, 'opesergas.html');
let html = fs.readFileSync(portal, 'utf8');
const ini = '<!-- OPE:ESPECIALIDADES -->', fin = '<!-- /OPE:ESPECIALIDADES -->';
const bloque = `${ini}
        <section class="ope-indice">
            <h2>Exámenes por especialidad</h2>
            <ul>${paginas.map(p => `
                <li${p.e.id === 'comun' ? ' class="ope-comun"' : ''}><a href="/opesergas/${p.slug}"><b>${esc(p.e.nombre)}</b><span>${listaAños(p.e).join(' · ')}</span></a></li>`).join('')}
            </ul>
        </section>
        ${fin}`;
if (!html.includes(ini) || !html.includes(fin)) throw new Error('Faltan las marcas OPE:ESPECIALIDADES en opesergas.html');
html = html.slice(0, html.indexOf(ini)) + bloque + html.slice(html.indexOf(fin) + fin.length);
fs.writeFileSync(portal, html);

console.log(`${paginas.length} páginas generadas en opesergas/:\n  ` + paginas.map(p => `${p.slug} (${listaAños(p.e).join(', ')})`).join('\n  '));
