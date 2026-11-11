/**
 * ope_portal.js - Portal OPE SERGAS y motor único de exámenes.
 *
 * Todas las especialidades funcionan igual: selector de convocatoria, Modo Snack,
 * «Cargar más», «Ver explicación», corrección, preguntas anuladas, repaso de fallos
 * y examen guardado a medias. Lo único que cambia de una a otra está en OPE_ESPECIALIDADES.
 *
 * AÑADIR UN EXAMEN NUEVO: basta con añadir su pestaña de la hoja a la lista de
 * convocatorias de su especialidad (o una especialidad nueva). No hay que tocar nada más.
 *
 * Cada pestaña tiene las columnas: Pregunta | Opción A | Opción B | Opción C | Opción D |
 * Respuesta correcta | Explicación (y, solo en Ope_Comun, la columna H con el año).
 */

/**
 * Utilidades comunes de los bancos de la OPE.
 * - anulada(p): la hoja marca las preguntas anuladas con «NULA»; no puntúan ni como acierto ni como fallo.
 * - limpiar(s): algunos textos traen notación LaTeX ($PaCO_2$, $\geq 60$…) que no se interpreta en la web.
 */
window.OPE = {
    anulada(p) { return !/^[ABCD]$/.test(String(p && p.correcta || '').trim()); },
    etiqueta(p) { return this.anulada(p) ? 'PREGUNTA ANULADA (no puntúa)' : 'CORRECTA: ' + p.correcta; },
    limpiar(s) {
        s = (s == null ? '' : String(s)).trim();
        if (s.indexOf('$') < 0) return s;
        return s.replace(/\$([^$]{1,60})\$/g, (_, m) => m
            .replace(/\\text\{([^}]*)\}/g, '$1')
            .replace(/\\(?:geq|ge)(?![a-z])/g, '≥')
            .replace(/\\(?:leq|le)(?![a-z])/g, '≤')
            .replace(/\\times(?![a-z])/g, '×')
            .replace(/\\alpha(?![a-z])/g, 'α')
            .replace(/\\beta(?![a-z])/g, 'β')
            .replace(/_\{([^}]*)\}|_(\w)/g, (_, a, b) => '<sub>' + (a || b) + '</sub>')
            .replace(/\^\{([^}]*)\}|\^(\S)/g, (_, a, b) => '<sup>' + (a || b) + '</sup>')
            .replace(/\s+/g, ' ').trim());
    },
    resumen(aciertos, evaluadas, anuladas) {
        return `Aciertos: ${aciertos} de ${evaluadas}` + (anuladas ? `\n(${anuladas} ${anuladas === 1 ? 'pregunta anulada no puntúa' : 'preguntas anuladas no puntúan'})` : '');
    }
};

/**
 * Especialidades del portal, en el orden en que aparecen.
 * - clave: dónde se guarda el examen a medias en el navegador (no cambiar las existentes).
 * - convocatorias: cada botón del selector. «id» es el valor que se guarda; «hoja», la pestaña.
 *   «filtro» (opcional) filtra por la columna H de la hoja (solo la Parte Común).
 * - snack: número de preguntas aleatorias del Modo Snack (mezcla todas las convocatorias).
 */
const OPE_ESPECIALIDADES = [
    { id: 'psq', nombre: 'Psiquiatría', icono: 'fa-brain', color: '#4338ca', clave: 'psq_save_ope',
      convocatorias: [{ id: '22', año: '2022', hoja: 'Ope_PSQ22' }, { id: '20', año: '2020', hoja: 'Ope_PSQ20' }] },
    { id: 'psicli', nombre: 'Psicología Clínica', icono: 'fa-comment-medical', color: '#0d9488', clave: 'psq_save_psicli',
      convocatorias: [{ id: '22', año: '2022', hoja: 'Ope_PsiCli22' }, { id: '20', año: '2020', hoja: 'Ope_PsiCli20' }] },
    { id: 'neuro', nombre: 'Neurología', icono: 'fa-wave-square', color: '#7c3aed', clave: 'psq_save_neuro',
      convocatorias: [{ id: '22', año: '2022', hoja: 'Ope_Neuro22' }, { id: '20', año: '2020', hoja: 'Ope_Neuro20' }] },
    { id: 'anest', nombre: 'Anestesia', icono: 'fa-syringe', color: '#10b981', clave: 'psq_save_anest',
      convocatorias: [{ id: '22', año: '2022', hoja: 'Ope_Anest22' }, { id: '20', año: '2020', hoja: 'Ope_Anest20' }] },
    { id: 'ped', nombre: 'Pediatría', icono: 'fa-baby', color: '#ef4444', clave: 'psq_save_ped',
      convocatorias: [{ id: '22', año: '2022', hoja: 'Ope_Ped22' }, { id: '20', año: '2020', hoja: 'Ope_Ped20' }] },
    { id: 'cot', nombre: 'Traumatología', icono: 'fa-bone', color: '#0ea5e9', clave: 'psq_save_cot',
      convocatorias: [{ id: '20', año: '2020', hoja: 'Ope_Cot20' }] },
    { id: 'car', nombre: 'Cardiología', icono: 'fa-heartbeat', color: '#b91c1c', clave: 'psq_save_car',
      convocatorias: [{ id: '22', año: '2022', hoja: 'Ope_Car22' }, { id: '20', año: '2020', hoja: 'Ope_Car20' }] },
    { id: 'gine', nombre: 'Ginecología', icono: 'fa-female', color: '#db2777', clave: 'psq_save_gine',
      convocatorias: [{ id: '20', año: '2020', hoja: 'Ope_Gine20' }] },
    { id: 'uro', nombre: 'Urología', icono: 'fa-microscope', color: '#0284c7', clave: 'psq_save_uro',
      convocatorias: [{ id: '22', año: '2022', hoja: 'Ope_Uro22' }, { id: '20', año: '2020', hoja: 'Ope_Uro20' }] },
    { id: 'min', nombre: 'Medicina Interna', icono: 'fa-stethoscope', color: '#8b5cf6', clave: 'psq_save_min',
      convocatorias: [{ id: '22', año: '2022', hoja: 'Ope_Min22' }, { id: '20', año: '2020', hoja: 'Ope_Min20' }] },
    { id: 'comun', nombre: 'Parte Común', icono: 'fa-gavel', color: '#f59e0b', clave: 'psq_save_comun', snack: 5,
      convocatorias: [{ id: '2022', año: '2022', hoja: 'Ope_Comun', filtro: '2022' }, { id: '2020', año: '2020', hoja: 'Ope_Comun', filtro: '2020' }] }
];

const OPE_LOTE = 20;          // preguntas que se añaden con «Cargar más»
const OPE_SNACK = 10;         // preguntas del Modo Snack si la especialidad no indica otra cifra

// Estado del examen en curso
const opeEstado = { esp: null, modo: '', preguntas: [], respuestas: {}, visibles: OPE_LOTE, repaso: false };

function opeEsp(id) { return OPE_ESPECIALIDADES.find(e => e.id === id); }
function opeAlpha(color, a) {
    const n = parseInt(color.slice(1), 16);
    return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
function opeMezclar(lista) {
    const a = lista.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}
function opeNombreModo(esp, modo) {
    if (modo === 'snack') return 'Snack';
    const c = esp.convocatorias.find(x => x.id === modo);
    return c ? c.año : modo;
}

/* ============================ PORTAL ============================ */

function abrirPortalExamenes() {
    const modalData = document.getElementById('modalData');
    const modal = document.getElementById('modal');
    if (modal) modal.style.display = 'flex';

    const botones = OPE_ESPECIALIDADES.map(e => `
                <button onclick="opeAbrirSelector('${e.id}')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; display: flex; align-items: center; gap: 15px; text-align: left;">
                    <div style="background: ${opeAlpha(e.color, 0.1)}; width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <i class="fas ${e.icono}" style="color: ${e.color};"></i>
                    </div>
                    <div style="flex-grow: 1;">
                        <b style="color: var(--text-main); font-size: 1.1rem; display: block;">${e.nombre}</b>
                    </div>
                    <i class="fas fa-chevron-right" style="color: var(--border);"></i>
                </button>`).join('');

    modalData.innerHTML = `
        <div style="padding: 2.5rem 1.5rem; text-align: center; max-width: 500px; margin: auto;">
            <div style="margin-bottom: 2rem;">
                <i class="fas fa-clipboard-list fa-3x" style="color: var(--primary); margin-bottom: 1rem; opacity: 0.8;"></i>
                <h2 style="color: var(--text-main); font-weight: 900; margin: 0; font-size: 1.8rem;">Portal OPE</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem;">Selecciona tu especialidad para comenzar</p>
            </div>
            <div style="display: grid; gap: 15px;">${botones}
            </div>
            <button onclick="closeModal()" style="margin-top: 2rem; background: none; border: none; color: var(--text-muted); font-weight: 800; cursor: pointer; font-size: 0.8rem; letter-spacing: 1px;">
                CERRAR PORTAL
            </button>
        </div>
    `;
}

/* ===================== SELECTOR DE CONVOCATORIA ===================== */

function opeAbrirSelector(espId) {
    const esp = opeEsp(espId);
    const modalData = document.getElementById('modalData');
    const modal = document.getElementById('modal');
    if (modal) modal.style.display = 'flex';

    const nSnack = esp.snack || OPE_SNACK;
    const años = esp.convocatorias.map(c => c.año);
    const textoSnack = años.length > 1 ? `(${nSnack} preguntas aleatorias de ${años.join(' y ')})` : `(${nSnack} preguntas aleatorias)`;

    const botones = esp.convocatorias.map(c => `
                <button onclick="opeIniciar('${esp.id}', '${c.id}')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <b style="color: var(--text-main); font-size: 1.1rem;">Convocatoria ${c.año}</b>
                    <i class="fas fa-chevron-right" style="color: ${esp.color};"></i>
                </button>`).join('');

    modalData.innerHTML = `
        <div style="padding: 2.5rem 1.5rem; text-align: center; max-width: 500px; margin: auto;">
            <div style="margin-bottom: 2.5rem;">
                <i class="fas ${esp.icono} fa-3x" style="color: ${esp.color}; margin-bottom: 1rem; opacity: 0.8;"></i>
                <h2 style="color: var(--text-main); font-weight: 900; margin: 0; font-size: 1.8rem;">OPE ${esp.nombre}</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.5rem;">Selecciona la convocatoria para comenzar</p>
            </div>
            <div style="display: grid; gap: 12px; margin-bottom: 2rem;">${botones}
                <button onclick="opeIniciar('${esp.id}', 'snack')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid ${esp.color}; background: ${opeAlpha(esp.color, 0.1)}; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <div>
                        <b style="color: ${esp.color}; font-size: 1.1rem;">Modo Snack</b>
                        <small style="display: block; color: var(--text-muted); font-size: 0.75rem;">${textoSnack}</small>
                    </div>
                    <i class="fas fa-bolt" style="color: ${esp.color};"></i>
                </button>
            </div>
            <button onclick="abrirPortalExamenes()" style="background: none; border: none; color: var(--text-muted); font-weight: 800; cursor: pointer; font-size: 0.8rem; letter-spacing: 1px;">
                <i class="fas fa-arrow-left"></i> VOLVER AL PORTAL
            </button>
        </div>
    `;
}

/* ============================ CARGA ============================ */

function opeGuardar() {
    if (opeEstado.repaso) return; // el repaso de fallos no sustituye al examen guardado
    const e = opeEstado;
    localStorage.setItem(e.esp.clave, JSON.stringify({ año: e.modo, preguntas: e.preguntas, respuestas: e.respuestas, visibles: e.visibles }));
}

async function opeLeerHoja(hoja) {
    const response = await fetch(`/?sheet=${encodeURIComponent(hoja)}`);
    if (!response.ok) throw new Error(`No se pudo cargar la hoja ${hoja} (${response.status})`);
    const data = await response.json();
    if (data.error || !data.values) throw new Error(`No se pudo acceder a la hoja ${hoja}`);
    return data.values;
}

function opeFila(row) {
    return {
        pregunta: OPE.limpiar(row[0]),
        opciones: [row[1], row[2], row[3], row[4]].map(x => OPE.limpiar(x)),
        correcta: (row[5] || '').trim().toUpperCase(),
        explicacion: OPE.limpiar(row[6]) || 'No hay explicación disponible.',
        año: (row[7] || '').trim()
    };
}

async function opeIniciar(espId, modo) {
    const esp = opeEsp(espId);
    const modalData = document.getElementById('modalData');

    // ¿Hay un examen de esta especialidad a medias?
    const guardado = localStorage.getItem(esp.clave);
    if (guardado) {
        let data = null;
        try { data = JSON.parse(guardado); } catch (e) { localStorage.removeItem(esp.clave); }
        if (data && Array.isArray(data.preguntas) && data.preguntas.length &&
            confirm(`Tienes un examen de ${esp.nombre} (${opeNombreModo(esp, data.año)}) a medias. ¿Quieres continuarlo?`)) {
            Object.assign(opeEstado, { esp, modo: data.año, preguntas: data.preguntas, respuestas: data.respuestas || {},
                visibles: Math.min(data.visibles || OPE_LOTE, data.preguntas.length), repaso: false });
            opeRenderizar();
            return;
        }
    }

    modalData.innerHTML = `<div style="padding:3rem; text-align:center;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:${esp.color};"></i><br><br><b style="color:var(--text-main);">Cargando ${esp.nombre}...</b></div>`;

    try {
        const convs = modo === 'snack' ? esp.convocatorias : esp.convocatorias.filter(c => c.id === modo);
        if (!convs.length) throw new Error(`Convocatoria desconocida: ${modo}`);

        // Cada pestaña se pide una sola vez aunque la usen varias convocatorias (Parte Común)
        const hojas = [...new Set(convs.map(c => c.hoja))];
        const datos = {};
        await Promise.all(hojas.map(async h => { datos[h] = (await opeLeerHoja(h)).map(opeFila).filter(p => p.pregunta); }));

        let preguntas = [];
        if (modo === 'snack') {
            hojas.forEach(h => preguntas.push(...datos[h]));
            preguntas = opeMezclar(preguntas).slice(0, esp.snack || OPE_SNACK);
        } else {
            const c = convs[0];
            preguntas = c.filtro ? datos[c.hoja].filter(p => p.año === c.filtro) : datos[c.hoja];
        }
        if (!preguntas.length) throw new Error(`No se encontraron preguntas para ${opeNombreModo(esp, modo)}`);

        Object.assign(opeEstado, { esp, modo, preguntas, respuestas: {},
            visibles: Math.min(modo === 'snack' ? preguntas.length : OPE_LOTE, preguntas.length), repaso: false });
        opeRenderizar();
        opeGuardar();
    } catch (error) {
        modalData.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--text-main);">
            <i class="fas fa-exclamation-triangle fa-2x" style="color:#ef4444; margin-bottom:1rem;"></i><br>
            Error al cargar el examen.<br><small style="color:var(--text-muted);">${error.message}</small><br><br>
            <button onclick="opeAbrirSelector('${esp.id}')" style="background:var(--card); border:1px solid var(--border); color:var(--text-muted); padding:8px 12px; border-radius:10px; cursor:pointer; font-size:0.75rem; font-weight:800;">VOLVER</button>
        </div>`;
    }
}

/* ============================ EXAMEN ============================ */

function opeRenderizar() {
    const { esp, modo, preguntas, visibles, repaso } = opeEstado;
    const container = document.getElementById('modalData');
    let titulo = modo === 'snack' ? `Snack ${esp.nombre}` : `OPE ${esp.nombre.toUpperCase()} ${opeNombreModo(esp, modo)}`;
    if (repaso) titulo += ' (Fallos)';

    let html = `
        <div style="padding:1.5rem; max-width:800px; margin:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom: 2px solid var(--border); padding-bottom:1.5rem;">
                <div>
                    <h2 style="margin:0; font-weight:900; color:${esp.color}; font-size:1.6rem;">${titulo}</h2>
                    <p style="margin:5px 0 0; font-size:0.75rem; color:var(--text-muted);">
                        Cargadas <span id="ope-cont">${visibles}</span> de ${preguntas.length}
                    </p>
                </div>
                <button onclick="opeAbrirSelector('${esp.id}')" style="background:var(--card); border:1px solid var(--border); color:var(--text-muted); padding:8px 12px; border-radius:10px; cursor:pointer; font-size:0.75rem; font-weight:800;">
                    <i class="fas fa-undo"></i> SALIR
                </button>
            </div>

            <div id="contenedor-preguntas-ope">${opeBloques(0, visibles)}</div>`;

    if (visibles < preguntas.length) {
        html += `<button id="ope-mas" onclick="opeCargarMas()" style="width:100%; padding:1rem; margin-bottom:2rem; border-radius:15px; border:2px dashed var(--border); background:none; color:var(--text-muted); font-weight:800; cursor:pointer;">CARGAR MÁS PREGUNTAS...</button>`;
    }

    html += `
            <div id="ope-footer" style="position:sticky; bottom:10px; z-index:100; display:flex; gap:10px;">
                <button onclick="opeCorregir()" class="btn btn-primary" style="flex:1; height:55px; border-radius:15px; font-weight:900; background:${esp.color}; border:none; color:white; cursor:pointer; box-shadow: 0 5px 15px ${opeAlpha(esp.color, 0.3)};">
                    FINALIZAR Y CORREGIR
                </button>
            </div>
        </div>`;

    container.innerHTML = html;
}

function opeBloques(inicio, fin) {
    const { esp, preguntas, respuestas } = opeEstado;
    return preguntas.slice(inicio, fin).map((p, i) => {
        const idx = inicio + i;
        const previa = respuestas[idx] || '';
        return `
            <div id="ope-bloque-${idx}" style="margin-bottom:2.5rem; padding:1.5rem; background:var(--bg); border-radius:1.5rem; border:1px solid var(--border);">
                <p style="font-weight:700; font-size:1.05rem; line-height:1.4; margin-bottom:1.5rem; color:var(--text-main);">${p.pregunta}</p>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${['A', 'B', 'C', 'D'].map((letra, k) => !p.opciones[k] ? '' : `
                        <label style="display:flex; align-items:center; gap:12px; padding:15px; background:var(--card); border:1px solid var(--border); border-radius:12px; cursor:pointer; color:var(--text-main);">
                            <input type="radio" name="ope-preg-${idx}" value="${letra}" ${previa === letra ? 'checked' : ''} onclick="opeResponder(${idx}, '${letra}')">
                            <span style="font-size:0.95rem;">${p.opciones[k]}</span>
                        </label>
                    `).join('')}
                </div>
                <button onclick="opeVerExplicacion(${idx})" style="margin-top:1.5rem; background:none; border:none; color:var(--text-muted); font-weight:800; font-size:0.7rem; cursor:pointer;"><i class="fas fa-lightbulb"></i> Ver explicación</button>
                <div id="ope-feedback-${idx}" style="display:none; margin-top:1.2rem; padding:1.2rem; background:var(--card); border-left:4px solid ${esp.color}; border-radius:12px; color:var(--text-main);">
                    <strong style="color:${esp.color}; display:block; margin-bottom:8px;">${OPE.etiqueta(p)}</strong>
                    <div style="font-size:0.9rem; opacity:0.9;">${p.explicacion}</div>
                </div>
            </div>`;
    }).join('');
}

function opeResponder(idx, letra) {
    opeEstado.respuestas[idx] = letra;
    opeGuardar();
}

function opeCargarMas() {
    const e = opeEstado;
    const inicio = e.visibles;
    e.visibles = Math.min(e.visibles + OPE_LOTE, e.preguntas.length);
    document.getElementById('contenedor-preguntas-ope').insertAdjacentHTML('beforeend', opeBloques(inicio, e.visibles));
    document.getElementById('ope-cont').innerText = e.visibles;
    if (e.visibles >= e.preguntas.length) document.getElementById('ope-mas').style.display = 'none';
    opeGuardar();
}

function opeVerExplicacion(idx) {
    const fb = document.getElementById(`ope-feedback-${idx}`);
    if (fb) fb.style.display = fb.style.display === 'block' ? 'none' : 'block';
}

function opeCorregir() {
    const e = opeEstado;
    let aciertos = 0, evaluadas = 0, anuladas = 0;
    const fallos = [];

    // Se corrigen las preguntas cargadas en pantalla
    e.preguntas.forEach((p, idx) => {
        const bloque = document.getElementById(`ope-bloque-${idx}`);
        const feedback = document.getElementById(`ope-feedback-${idx}`);
        if (!bloque || !feedback) return;
        feedback.style.display = 'block';
        if (OPE.anulada(p)) { anuladas++; bloque.style.borderColor = '#94a3b8'; return; }
        evaluadas++;
        if (e.respuestas[idx] === p.correcta) {
            aciertos++;
            bloque.style.borderColor = '#22c55e';
            bloque.style.background = 'rgba(34, 197, 94, 0.05)';
        } else {
            fallos.push(idx);
            bloque.style.borderColor = '#ef4444';
            bloque.style.background = 'rgba(239, 68, 68, 0.05)';
        }
    });

    if (!e.repaso) localStorage.removeItem(e.esp.clave);

    const footer = document.getElementById('ope-footer');
    footer.innerHTML = fallos.length ? `
            <button onclick="opeRepasarFallos([${fallos}])" class="btn" style="flex:1; background:#ef4444; color:white; height:55px; border-radius:15px; font-weight:900; border:none; cursor:pointer;">
                REPASAR ${fallos.length} ${fallos.length === 1 ? 'FALLO' : 'FALLOS'}
            </button>
            <button onclick="opeAbrirSelector('${e.esp.id}')" class="btn" style="flex:1; background:var(--border); color:var(--text-main); height:55px; border-radius:15px; font-weight:900; border:none; cursor:pointer;">
                SALIR
            </button>` : `
            <button onclick="opeAbrirSelector('${e.esp.id}')" class="btn btn-primary" style="flex:1; height:55px; border-radius:15px; font-weight:900; background:${e.esp.color}; border:none; color:white; cursor:pointer;">
                ${evaluadas ? '¡EXAMEN PERFECTO! VOLVER' : 'VOLVER'}
            </button>`;

    alert(`Examen finalizado.\n\n${OPE.resumen(aciertos, evaluadas, anuladas)}`);
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
}

function opeRepasarFallos(indices) {
    const e = opeEstado;
    e.preguntas = indices.map(i => e.preguntas[i]);
    e.respuestas = {};
    e.visibles = e.preguntas.length;
    e.repaso = true;
    opeRenderizar();
}

/* ===================== COMPATIBILIDAD ===================== */
// Nombres de función del portal anterior: los conservan por si algún enlace o tarjeta los usa.
function portal_irAPsiq()   { opeAbrirSelector('psq'); }
function portal_irAAnest()  { opeAbrirSelector('anest'); }
function portal_irAPed()    { opeAbrirSelector('ped'); }
function portal_irACot()    { opeAbrirSelector('cot'); }
function portal_irACardio() { opeAbrirSelector('car'); }
function portal_irAGine()   { opeAbrirSelector('gine'); }
function portal_irAUro()    { opeAbrirSelector('uro'); }
function portal_irAMin()    { opeAbrirSelector('min'); }
function portal_irAComun()  { opeAbrirSelector('comun'); }
