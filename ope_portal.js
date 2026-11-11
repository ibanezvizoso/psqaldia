/**
 * ope_portal.js — Portal OPE SERGAS: un único motor para todas las especialidades.
 *
 * AÑADIR UN EXAMEN NUEVO
 *   1. Crear en la hoja una pestaña con las columnas: Pregunta | Opción A | Opción B | Opción C | Opción D |
 *      Respuesta correcta (A/B/C/D o NULA) | Explicación (puede ir vacía).
 *   2. Añadir una línea { año: 'AA', hoja: 'Nombre_de_la_pestaña' } en la especialidad que toque de
 *      OPE_ESPECIALIDADES (o una especialidad nueva con el mismo formato).
 *
 * Los exámenes a medias se guardan en el navegador con las mismas claves que usaban los scripts antiguos,
 * así que se pueden continuar después de la actualización.
 */

/* ============================================================
 * 1. Utilidades comunes
 * ============================================================ */
window.OPE = {
    // La hoja marca las anuladas con «NULA»: no puntúan ni como acierto ni como fallo.
    anulada(p) { return !/^[ABCD]$/.test(String(p && p.correcta || '').trim()); },
    etiqueta(p) { return this.anulada(p) ? 'PREGUNTA ANULADA (no puntúa)' : 'CORRECTA: ' + p.correcta; },
    // Algunos textos traen notación LaTeX ($PaCO_2$, $\geq 60$…) que la web no interpreta.
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
    resumen(aciertos, evaluadas, anuladas, sinContestar) {
        let t = `Aciertos: ${aciertos} de ${evaluadas}`;
        if (sinContestar) t += `\nSin contestar: ${sinContestar}`;
        if (anuladas) t += `\n(${anuladas} ${anuladas === 1 ? 'pregunta anulada no puntúa' : 'preguntas anuladas no puntúan'})`;
        return t;
    }
};

/* ============================================================
 * 2. Especialidades y exámenes (lo único que hay que tocar para añadir exámenes)
 *    - año: lo que se muestra («20» → «Convocatoria 2020»)
 *    - hoja: nombre exacto de la pestaña
 *    - guardado: clave del examen a medias en el navegador (no cambiarla)
 *    - snack: nº de preguntas aleatorias del modo Snack (de todas sus convocatorias)
 *    - filtroAño (solo Parte Común): todas las convocatorias están en una pestaña y se filtran por la columna H
 * ============================================================ */
const OPE_ESPECIALIDADES = [
    { id: 'psq', nombre: 'Psiquiatría', titulo: 'OPE Psiquiatría', icono: 'fa-brain', color: '#4338ca', guardado: 'psq_save_ope', snack: 10,
      examenes: [{ año: '22', hoja: 'Ope_PSQ22' }, { año: '20', hoja: 'Ope_PSQ20' }] },
    { id: 'psicli', nombre: 'Psicología Clínica', titulo: 'OPE Psicología Clínica', icono: 'fa-comments', color: '#0d9488', guardado: 'psq_save_psicli', snack: 10,
      examenes: [{ año: '22', hoja: 'Ope_PsiCli22' }, { año: '20', hoja: 'Ope_PsiCli20' }] },
    { id: 'neuro', nombre: 'Neurología', titulo: 'OPE Neurología', icono: 'fa-wave-square', color: '#7c3aed', guardado: 'psq_save_neuro', snack: 10,
      examenes: [{ año: '22', hoja: 'Ope_Neuro22' }, { año: '20', hoja: 'Ope_Neuro20' }] },
    { id: 'anest', nombre: 'Anestesia', titulo: 'OPE Anestesia', icono: 'fa-syringe', color: '#10b981', guardado: 'psq_save_anest', snack: 10,
      examenes: [{ año: '22', hoja: 'Ope_Anest22' }, { año: '20', hoja: 'Ope_Anest20' }] },
    { id: 'ped', nombre: 'Pediatría', titulo: 'OPE Pediatría', icono: 'fa-baby', color: '#ef4444', guardado: 'psq_save_ped', snack: 10,
      examenes: [{ año: '22', hoja: 'Ope_Ped22' }, { año: '20', hoja: 'Ope_Ped20' }] },
    { id: 'cot', nombre: 'Traumatología', titulo: 'OPE Traumatología', icono: 'fa-bone', color: '#0ea5e9', guardado: 'psq_save_cot', snack: 10,
      examenes: [{ año: '20', hoja: 'Ope_Cot20' }] },
    { id: 'car', nombre: 'Cardiología', titulo: 'OPE Cardiología', icono: 'fa-heart-pulse', color: '#b91c1c', guardado: 'psq_save_car', snack: 10,
      examenes: [{ año: '22', hoja: 'Ope_Car22' }, { año: '20', hoja: 'Ope_Car20' }] },
    { id: 'gine', nombre: 'Ginecología', titulo: 'OPE Ginecología', icono: 'fa-female', color: '#db2777', guardado: 'psq_save_gine', snack: 10,
      examenes: [{ año: '20', hoja: 'Ope_Gine20' }] },
    { id: 'uro', nombre: 'Urología', titulo: 'OPE Urología', icono: 'fa-microscope', color: '#0284c7', guardado: 'psq_save_uro', snack: 10,
      examenes: [{ año: '22', hoja: 'Ope_Uro22' }, { año: '20', hoja: 'Ope_Uro20' }] },
    { id: 'min', nombre: 'Medicina Interna', titulo: 'OPE Med. Interna', icono: 'fa-stethoscope', color: '#8b5cf6', guardado: 'psq_save_min', snack: 10,
      examenes: [{ año: '22', hoja: 'Ope_Min22' }, { año: '20', hoja: 'Ope_Min20' }] },
    { id: 'comun', nombre: 'Parte Común', titulo: 'OPE Común', icono: 'fa-gavel', color: '#d97706', guardado: 'psq_save_comun', snack: 5,
      examenes: [{ año: '2022', hoja: 'Ope_Comun', filtroAño: '2022' }, { año: '2020', hoja: 'Ope_Comun', filtroAño: '2020' }] },
];
window.OPE_ESPECIALIDADES = OPE_ESPECIALIDADES;

/* ============================================================
 * 3. Estado y persistencia
 * ============================================================ */
const POR_TANDA = 20;
const opeEstado = { esp: null, año: '', preguntas: [], respuestas: {}, visibles: POR_TANDA, corregido: false };

const opeEsp = id => OPE_ESPECIALIDADES.find(e => e.id === id);
const opeAñoLargo = a => (/^\d{2}$/.test(a) ? '20' + a : a);
function opeTitulo() {
    const e = opeEstado.esp, a = String(opeEstado.año || '');
    if (a.startsWith('snack')) return `Modo Snack · ${e.nombre}` + a.slice(5);
    return `${e.titulo} ${a.replace(/^(\d{2})(?!\d)/, '20$1')}`;
}
function opeLeer(esp) {
    try {
        const d = JSON.parse(localStorage.getItem(esp.guardado) || 'null');
        return d && Array.isArray(d.preguntas) && d.preguntas.length ? d : null;
    } catch (e) { return null; }
}
function opeGuardar() {
    if (opeEstado.corregido) return;
    try {
        localStorage.setItem(opeEstado.esp.guardado, JSON.stringify({
            año: opeEstado.año, preguntas: opeEstado.preguntas, respuestas: opeEstado.respuestas, visibles: opeEstado.visibles
        }));
    } catch (e) { /* almacenamiento lleno o bloqueado: el examen sigue funcionando sin guardarse */ }
}
function opeBorrar(esp) { try { localStorage.removeItem(esp.guardado); } catch (e) {} }

/* ============================================================
 * 4. Pantallas: portal → especialidad → examen
 * ============================================================ */
function opeModal() {
    const modal = document.getElementById('modal');
    if (modal) modal.style.display = 'flex';
    return document.getElementById('modalData');
}
function opeScrollArriba() {
    const mc = document.querySelector('.modal-content');
    if (mc) mc.scrollTo({ top: 0, behavior: 'smooth' });
}
const opeBotonEsp = e => `
    <button onclick="opeAbrirEspecialidad('${e.id}')" style="padding: 1.1rem 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; display: flex; align-items: center; gap: 15px; text-align: left; width: 100%;">
        <span style="background: ${e.color}1a; width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <i class="fas ${e.icono}" style="color: ${e.color};"></i>
        </span>
        <span style="flex-grow: 1;">
            <b style="color: var(--text-main); font-size: 1.1rem; display: block;">${e.nombre}</b>
            <small style="color: var(--text-muted); font-size: 0.75rem;">${e.examenes.map(x => opeAñoLargo(x.año)).join(' · ')}</small>
        </span>
        <i class="fas fa-chevron-right" style="color: var(--border);"></i>
    </button>`;

function abrirPortalExamenes() {
    const modalData = opeModal();
    modalData.innerHTML = `
        <div style="padding: 2.5rem 1.5rem; text-align: center; max-width: 500px; margin: auto;">
            <div style="margin-bottom: 2rem;">
                <i class="fas fa-clipboard-list fa-3x" style="color: var(--primary); margin-bottom: 1rem; opacity: 0.8;"></i>
                <h2 style="color: var(--text-main); font-weight: 900; margin: 0; font-size: 1.8rem;">Portal OPE</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem;">Selecciona tu especialidad para comenzar</p>
            </div>
            <div style="display: grid; gap: 12px;">${OPE_ESPECIALIDADES.map(opeBotonEsp).join('')}</div>
            <button onclick="closeModal()" style="margin-top: 2rem; background: none; border: none; color: var(--text-muted); font-weight: 800; cursor: pointer; font-size: 0.8rem; letter-spacing: 1px;">
                CERRAR PORTAL
            </button>
        </div>`;
}

function opeAbrirEspecialidad(id) {
    const e = opeEsp(id); if (!e) return;
    const modalData = opeModal();
    const boton = (onclick, texto, extra = '') => `
        <button onclick="${onclick}" style="padding: 1.2rem; border-radius: 20px; border: 2px solid ${extra ? e.color : 'var(--border)'}; background: ${extra ? e.color + '1a' : 'var(--card)'}; cursor: pointer; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
            <span><b style="color: ${extra ? e.color : 'var(--text-main)'}; font-size: 1.1rem;">${texto}</b>${extra}</span>
            <i class="fas ${extra ? 'fa-bolt' : 'fa-chevron-right'}" style="color: ${e.color};"></i>
        </button>`;
    const varios = e.examenes.length > 1;
    modalData.innerHTML = `
        <div style="padding: 2.5rem 1.5rem; text-align: center; max-width: 500px; margin: auto;">
            <div style="margin-bottom: 2.5rem;">
                <i class="fas ${e.icono} fa-3x" style="color: ${e.color}; margin-bottom: 1rem; opacity: 0.85;"></i>
                <h2 style="color: var(--text-main); font-weight: 900; margin: 0; font-size: 1.8rem;">${e.titulo}</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.5rem;">Selecciona la convocatoria para comenzar</p>
            </div>
            <div style="display: grid; gap: 12px; margin-bottom: 2rem;">
                ${e.examenes.map(x => boton(`opeIniciar('${e.id}','${x.año}')`, `Convocatoria ${opeAñoLargo(x.año)}`)).join('')}
                ${boton(`opeIniciar('${e.id}','snack')`, 'Snack', `<small style="display: block; color: var(--text-muted); font-size: 0.75rem;">(${e.snack} preguntas aleatorias${varios ? ' de todas las convocatorias' : ''})</small>`)}
            </div>
            <button onclick="abrirPortalExamenes()" style="background: none; border: none; color: var(--text-muted); font-weight: 800; cursor: pointer; font-size: 0.8rem; letter-spacing: 1px;">
                <i class="fas fa-arrow-left"></i> VOLVER AL PORTAL
            </button>
        </div>`;
}

/* ============================================================
 * 5. Carga de un examen
 * ============================================================ */
function opeFila(row) {
    return {
        pregunta: OPE.limpiar(row[0]),
        opciones: [row[1], row[2], row[3], row[4]].map(x => OPE.limpiar(x)),
        correcta: String(row[5] || '').trim().toUpperCase(),
        explicacion: OPE.limpiar(row[6])
    };
}
async function opeLeerHoja(hoja) {
    const r = await fetch(`/?sheet=${encodeURIComponent(hoja)}`);
    const data = await r.json();
    if (!data || data.error || !Array.isArray(data.values)) throw new Error(`No se pudo leer la hoja ${hoja}`);
    return data.values;
}
async function opeCargarPreguntas(e, año) {
    const lista = año === 'snack' ? e.examenes : e.examenes.filter(x => x.año === año);
    const hojas = [...new Set(lista.map(x => x.hoja))];
    const datos = {};
    await Promise.all(hojas.map(async h => { datos[h] = await opeLeerHoja(h); }));
    let filas = [];
    lista.forEach(x => {
        let rows = (datos[x.hoja] || []).filter(r => r && String(r[0] || '').trim() !== '' && !/^pregunta$/i.test(String(r[0]).trim()));
        if (x.filtroAño) rows = rows.filter(r => String(r[7] || '').trim().replace(/\.0+$/, '') === x.filtroAño);
        filas = filas.concat(rows);
    });
    let preguntas = filas.map(opeFila);
    if (año === 'snack') {
        // Fisher-Yates: mezcla uniforme
        for (let i = preguntas.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [preguntas[i], preguntas[j]] = [preguntas[j], preguntas[i]]; }
        preguntas = preguntas.slice(0, e.snack);
    }
    return preguntas;
}

async function opeIniciar(id, año, esContinuacion = false) {
    const e = opeEsp(id); if (!e) return;
    const guardado = opeLeer(e);
    if (!esContinuacion && guardado) {
        const modo = String(guardado.año).startsWith('snack') ? 'Snack' : opeAñoLargo(String(guardado.año));
        if (confirm(`Tienes un examen (${modo}) a medias. ¿Quieres continuarlo?`)) {
            Object.assign(opeEstado, { esp: e, año: String(guardado.año), preguntas: guardado.preguntas, respuestas: guardado.respuestas || {},
                visibles: guardado.visibles || POR_TANDA, corregido: false });
            opeRenderizar();
            return;
        }
    }
    const modalData = opeModal();
    modalData.innerHTML = `<div style="padding:3rem; text-align:center;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:${e.color};"></i><br><br><b style="color:var(--text-main);">Preparando examen...</b></div>`;
    try {
        const preguntas = await opeCargarPreguntas(e, año);
        if (!preguntas.length) throw new Error('No se encontraron preguntas para esta convocatoria.');
        Object.assign(opeEstado, { esp: e, año, preguntas, respuestas: {}, visibles: año === 'snack' ? preguntas.length : POR_TANDA, corregido: false });
        opeRenderizar();
        opeGuardar();
    } catch (err) {
        modalData.innerHTML = `
            <div style="padding:2rem; text-align:center; color:var(--text-main);">
                <i class="fas fa-exclamation-triangle fa-2x" style="color:#ef4444; margin-bottom:1rem;"></i><br>
                Error al cargar el examen.<br><small style="color:var(--text-muted);">${err.message}</small><br><br>
                <button onclick="opeIniciar('${e.id}','${año}', true)" style="padding:10px 16px; border-radius:12px; border:1px solid var(--border); background:var(--card); color:var(--text-main); font-weight:800; cursor:pointer;">Reintentar</button>
                <button onclick="opeAbrirEspecialidad('${e.id}')" style="padding:10px 16px; border-radius:12px; border:none; background:none; color:var(--text-muted); font-weight:800; cursor:pointer;">Volver</button>
            </div>`;
    }
}

/* ============================================================
 * 6. Examen: preguntas, explicación y corrección
 * ============================================================ */
function opeBloque(p, i) {
    const e = opeEstado.esp, previa = opeEstado.respuestas[i] || '';
    const opciones = ['A', 'B', 'C', 'D'].map((letra, k) => !p.opciones[k] ? '' : `
        <label data-letra="${letra}" style="display:flex; align-items:center; gap:12px; padding:15px; background:var(--card); border:1px solid var(--border); border-radius:12px; cursor:pointer; color:var(--text-main);">
            <input type="radio" name="preg-${i}" value="${letra}" ${previa === letra ? 'checked' : ''} onclick="opeResponder(${i}, '${letra}')">
            <span style="font-size:0.95rem;">${p.opciones[k]}</span>
        </label>`).join('');
    return `
        <div id="bloque-${i}" style="margin-bottom:2.5rem; padding:1.5rem; background:var(--bg); border-radius:1.5rem; border:1px solid var(--border);">
            <p style="font-weight:700; font-size:1.05rem; line-height:1.4; margin-bottom:1.5rem; color:var(--text-main);">${p.pregunta}</p>
            <div style="display:flex; flex-direction:column; gap:10px;">${opciones}</div>
            <button onclick="opeVerExplicacion(${i})" style="margin-top:1.5rem; background:none; border:none; color:var(--text-muted); font-weight:800; font-size:0.7rem; text-transform:uppercase; cursor:pointer;"><i class="fas fa-lightbulb"></i> Ver explicación</button>
            <div id="feedback-${i}" style="display:none; margin-top:1.2rem; padding:1.2rem; background:var(--card); border-left:4px solid ${e.color}; border-radius:12px;">
                <strong style="color:${e.color}; display:block; margin-bottom:8px;">${OPE.etiqueta(p)}</strong>
                <div style="font-size:0.9rem; opacity:0.9;">${p.explicacion || '<i style="color:var(--text-muted);">Sin explicación por ahora.</i>'}</div>
            </div>
        </div>`;
}

function opeRenderizar() {
    const e = opeEstado.esp, total = opeEstado.preguntas.length;
    opeEstado.visibles = Math.min(opeEstado.visibles || POR_TANDA, total);
    const modalData = opeModal();
    modalData.innerHTML = `
        <div style="padding:1.5rem; max-width:800px; margin:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:2rem; border-bottom:2px solid var(--border); padding-bottom:1.5rem;">
                <div>
                    <h2 style="margin:0; font-weight:900; color:${e.color}; font-size:1.5rem;">${opeTitulo()}</h2>
                    <p style="margin:5px 0 0; font-size:0.75rem; color:var(--text-muted);">Cargadas <span id="cont-preg">${opeEstado.visibles}</span> de ${total}</p>
                </div>
                <button onclick="opeAbrirEspecialidad('${e.id}')" style="background:var(--card); border:1px solid var(--border); color:var(--text-muted); padding:8px 12px; border-radius:10px; cursor:pointer; font-size:0.75rem; font-weight:800; flex-shrink:0;">
                    <i class="fas fa-undo"></i> SALIR
                </button>
            </div>
            <div id="contenedor-preguntas">${opeEstado.preguntas.slice(0, opeEstado.visibles).map(opeBloque).join('')}</div>
            <button id="btn-mas" onclick="opeCargarMas()" style="display:${opeEstado.visibles < total ? 'block' : 'none'}; width:100%; padding:1rem; margin-bottom:2rem; border-radius:15px; border:2px dashed var(--border); background:none; color:var(--text-muted); font-weight:800; cursor:pointer;">CARGAR MÁS PREGUNTAS...</button>
            <div id="footer-actions" style="position:sticky; bottom:10px; z-index:100; display:flex; gap:10px;">
                <button onclick="opeCorregir()" style="flex:1; height:55px; border-radius:15px; border:none; background:${e.color}; color:white; font-weight:900; font-size:1rem; cursor:pointer; box-shadow:0 5px 15px rgba(0,0,0,0.2);">
                    FINALIZAR Y CORREGIR
                </button>
            </div>
        </div>`;
}

function opeResponder(i, letra) { opeEstado.respuestas[i] = letra; opeGuardar(); }

function opeCargarMas() {
    const total = opeEstado.preguntas.length, inicio = opeEstado.visibles;
    opeEstado.visibles = Math.min(inicio + POR_TANDA, total);
    document.getElementById('contenedor-preguntas').insertAdjacentHTML('beforeend',
        opeEstado.preguntas.slice(inicio, opeEstado.visibles).map((p, k) => opeBloque(p, inicio + k)).join(''));
    document.getElementById('cont-preg').innerText = opeEstado.visibles;
    if (opeEstado.visibles >= total) document.getElementById('btn-mas').style.display = 'none';
    if (opeEstado.corregido) opeCorregir(true);
    opeGuardar();
}

function opeVerExplicacion(i) {
    const fb = document.getElementById(`feedback-${i}`);
    if (fb) fb.style.display = (fb.style.display === 'none' || fb.style.display === '') ? 'block' : 'none';
}

function opeCorregir(silencioso = false) {
    const e = opeEstado.esp;
    let aciertos = 0, evaluadas = 0, anuladas = 0, sinContestar = 0;
    const fallos = [];
    opeEstado.preguntas.forEach((p, i) => {
        const bloque = document.getElementById(`bloque-${i}`), fb = document.getElementById(`feedback-${i}`);
        if (!bloque || !fb) return;  // solo se corrigen las preguntas cargadas
        fb.style.display = 'block';
        const r = opeEstado.respuestas[i];
        bloque.querySelectorAll('label[data-letra]').forEach(l => {
            const letra = l.dataset.letra;
            l.style.borderColor = (!OPE.anulada(p) && letra === p.correcta) ? '#22c55e' : (letra === r ? '#ef4444' : 'var(--border)');
            l.style.borderWidth = (letra === p.correcta || letra === r) ? '2px' : '1px';
        });
        if (OPE.anulada(p)) { anuladas++; bloque.style.borderColor = '#94a3b8'; return; }
        evaluadas++;
        if (r === p.correcta) {
            aciertos++;
            bloque.style.borderColor = '#22c55e'; bloque.style.background = 'rgba(34, 197, 94, 0.05)';
        } else {
            if (!r) sinContestar++;
            fallos.push(i);
            bloque.style.borderColor = '#ef4444'; bloque.style.background = 'rgba(239, 68, 68, 0.05)';
        }
    });
    opeEstado.corregido = true;
    opeBorrar(e);  // el examen ya está corregido: no se ofrece continuarlo

    const footer = document.getElementById('footer-actions');
    footer.innerHTML = (fallos.length ? `
        <button onclick="opeRepasarFallos([${fallos}])" style="flex:1; background:#ef4444; color:white; height:55px; border-radius:15px; border:none; font-weight:900; cursor:pointer;">
            REPASAR ${fallos.length} FALLOS
        </button>` : '') + `
        <button onclick="opeAbrirEspecialidad('${e.id}')" style="flex:1; background:var(--border); color:var(--text-main); height:55px; border-radius:15px; border:none; font-weight:900; cursor:pointer;">
            SALIR
        </button>`;
    if (silencioso) return;
    alert(`Examen finalizado.\n\n${OPE.resumen(aciertos, evaluadas, anuladas, sinContestar)}`);
    opeScrollArriba();
}

function opeRepasarFallos(indices) {
    const preguntas = indices.map(i => opeEstado.preguntas[i]).filter(Boolean);
    Object.assign(opeEstado, { preguntas, respuestas: {}, visibles: preguntas.length, corregido: false,
        año: String(opeEstado.año).replace(/ \(Fallos\)$/, '') + ' (Fallos)' });
    opeRenderizar();
    opeScrollArriba();
}

// Exponer en window lo que se usa desde los onclick
Object.assign(window, { abrirPortalExamenes, opeAbrirEspecialidad, opeIniciar, opeResponder, opeCargarMas, opeVerExplicacion, opeCorregir, opeRepasarFallos });
