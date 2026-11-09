/**
 * Herramienta: Enceph-Match v4.0 (orientación diagnóstica en encefalitis)
 * Plataforma: PSQ al día (psqaldia.com)
 * Fuente: Binks SNM, Saylor D, Easton A, Thakur KT, Irani SR. Encephalitis. Lancet 2026; 407: 1968-83 (Seminar).
 * Datos: hoja «encefalitisDD» (porcentajes de las figuras 2C y 3B), leída a través del Worker.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * CHANGELOG v4.0 (rediseño)
 * Problemas de la v3.2, comprobados con casos simulados sobre la hoja real:
 *  - Las pruebas sin marcar contaban como «normales»: antes de la RM, el LCR y el EEG,
 *    la penalización por hallazgo muy prevalente (×0,2 por prueba) hundía a HSV-1
 *    (0,2³ = 0,008). Una herpética típica de 56 años salía como Anti-CASPR2.
 *  - Infecciosas (Fig. 2C) y autoinmunes (Fig. 3B) no miden los mismos síntomas: al omitir
 *    fiebre, cefalea o focalidad en las autoinmunes, su similitud se inflaba.
 *  - El factor de edad (gaussiana estrecha) excluía en la práctica a NMDAR en mayores o a
 *    enterovirus en adultos; la curva bimodal de HSV-1 no venía del artículo y penalizaba
 *    precisamente su mediana (56 años).
 * Cambios:
 *  1. Paso 1, orientación infecciosa/autoinmune con las señales de la figura 1 y del texto
 *     (velocidad de inicio, fiebre, RM, LCR, PCR, FBDS, psiquiatría precoz). Sin porcentaje:
 *     cada hallazgo se muestra en la columna a la que apunta, con su matiz.
 *  2. Paso 2, dos rankings separados: las infecciosas solo entre sí (Fig. 2C) y las
 *     autoinmunes solo entre sí (Fig. 3B). Cada grupo se compara con sus propias columnas.
 *  3. RM, LCR, EEG y PCR con tres estados: no realizada / normal / patológica.
 *     «No realizada» no cuenta para nadie; solo un resultado normal resta.
 *  4. Celdas en blanco dentro de una columna que sí existe en la figura (ceros del artículo
 *     = «no reportado»): se rellenan con la media del grupo en esa columna, para que no
 *     inflen ni penalicen a esa entidad. Las columnas que su figura no tiene no se usan.
 *  5. Edad: gaussiana (σ 15 años; 6 si la mediana ≤5) con suelo 0,25, como el sexo (0,4).
 *     HSV-1 afecta a todas las edades (bimodal <30 / >60 según el texto): σ 25 sobre su mediana.
 *  6. Penalización por hallazgo muy prevalente (≥80 %) ausente: ×0,5 si es un síntoma no marcado
 *     (no marcarlo no garantiza que falte) y ×0,3 si es una prueba explícitamente normal.
 *  7. Aviso permanente: punción lumbar urgente, aciclovir IV empírico y estudio en paralelo de
 *     causas infecciosas y autoinmunes (Fig. 2A).
 * Se mantienen de la v3.2: similitud de coseno, factor de sexo amortiguado, refuerzos de FBDS
 * (Anti-LGI1 ×2,5) y de nervio periférico (Anti-CASPR2 ×2,0), descripciones y alertas.
 * GAD65 sigue fuera del ranking (el Seminar no da una fila cuantitativa), pero su patrón de
 * la figura 1 se avisa cuando encaja.
 * ─────────────────────────────────────────────────────────────────────────
 */
(function () {
    'use strict';

    // Columnas de la hoja «encefalitisDD» (lectura posicional)
    const COL = {
        ETIOLOGIA: 0, TIPO: 1, MEDIANA_EDAD: 2, PCT_VARON: 3, BLANCO: 4,
        FIEBRE: 5, CEFALEA: 6, SINT_MENINGEOS: 7, RESPIRATORIO: 8, ALT_MENTAL_PSQ: 9,
        CRISIS_COMICIALES: 10, FOCALIDAD: 11, VOMITOS: 12, RASH: 13, CRISIS_FBDS: 14,
        COGNITIVO_AMNESIA: 15, SIST_NERV_PERIFERICO: 16, DISAUTONOMIA: 17, NIVEL_CON: 18,
        TRAST_MOVIMIENTO: 19, ALT_SUENO: 20, HIPONATREMIA: 21, RMN_PATOLOGICA: 22,
        LCR_PATOLOGICO: 23, EEG_PATOLOGICO: 24,
    };

    // Síntomas que el clínico puede marcar. «mental» y «psiq» leen la misma columna de la hoja
    // (Alt_Mental_Psq), que en la Fig. 2C es «alteración del estado mental» y en la 3B «psiquiátrico».
    const SINTOMAS = [
        { id: 'FIEBRE', label: 'Fiebre' },
        { id: 'CEFALEA', label: 'Cefalea' },
        { id: 'SINT_MENINGEOS', label: 'Síntomas meníngeos (p. ej., rigidez de nuca)' },
        { id: 'RESPIRATORIO', label: 'Pródromo respiratorio / catarral' },
        { id: 'MENTAL', label: 'Alteración del estado mental (confusión, desorientación)' },
        { id: 'PSIQ', label: 'Síntomas psiquiátricos (afectivos, psicóticos, conductuales)' },
        { id: 'CRISIS_COMICIALES', label: 'Crisis comiciales (focales o generalizadas)' },
        { id: 'FOCALIDAD', label: 'Focalidad neurológica (p. ej., afasia, hemiparesia)' },
        { id: 'VOMITOS', label: 'Vómitos' },
        { id: 'RASH', label: 'Exantema / erupción cutánea' },
        { id: 'CRISIS_FBDS', label: 'Crisis distónicas faciobraquiales (FBDS)' },
        { id: 'COGNITIVO_AMNESIA', label: 'Déficit cognitivo / amnesia' },
        { id: 'SIST_NERV_PERIFERICO', label: 'Nervio periférico (hiperexcitabilidad o dolor neuropático)' },
        { id: 'DISAUTONOMIA', label: 'Disfunción autonómica' },
        { id: 'NIVEL_CON', label: 'Alteración del nivel de conciencia' },
        { id: 'TRAST_MOVIMIENTO', label: 'Trastorno del movimiento (distonía, corea, estereotipias) / catatonia' },
        { id: 'ALT_SUENO', label: 'Alteración del sueño' },
        { id: 'HIPONATREMIA', label: 'Hiponatremia' },
    ];
    const PRUEBAS = [
        { id: 'RMN_PATOLOGICA', label: 'RM cerebral', mal: 'Patológica' },
        { id: 'LCR_PATOLOGICO', label: 'LCR: células', mal: 'Pleocitosis (>5/µL)', bien: 'Sin células' },
        { id: 'EEG_PATOLOGICO', label: 'EEG', mal: 'Patológico' },
        { id: 'PCR', label: 'PCR en LCR (virus)', mal: 'Positiva', bien: 'Negativa' },
    ];
    const INICIO = [
        { id: 'dias', label: '1–3 días' }, { id: 'semana', label: '3–7 días' },
        { id: 'semanas', label: 'Semanas' }, { id: 'meses', label: 'Meses' },
    ];

    // Columnas que usa cada grupo (las de su figura). Para «Alt_Mental_Psq», qué casilla del paciente se lee.
    const GRUPOS = {
        inf: { nombre: 'Infecciosas', fig: 'Fig. 2C', cols: ['FIEBRE', 'CEFALEA', 'SINT_MENINGEOS', 'RESPIRATORIO', 'ALT_MENTAL_PSQ', 'CRISIS_COMICIALES', 'FOCALIDAD', 'VOMITOS', 'RASH', 'RMN_PATOLOGICA', 'LCR_PATOLOGICO', 'EEG_PATOLOGICO'], mental: 'MENTAL' },
        aut: { nombre: 'Autoinmunes', fig: 'Fig. 3B', cols: ['ALT_MENTAL_PSQ', 'CRISIS_COMICIALES', 'CRISIS_FBDS', 'COGNITIVO_AMNESIA', 'SIST_NERV_PERIFERICO', 'DISAUTONOMIA', 'NIVEL_CON', 'TRAST_MOVIMIENTO', 'ALT_SUENO', 'HIPONATREMIA', 'RMN_PATOLOGICA', 'LCR_PATOLOGICO', 'EEG_PATOLOGICO'], mental: 'PSIQ' },
    };
    const PRUEBA_COLS = ['RMN_PATOLOGICA', 'LCR_PATOLOGICO', 'EEG_PATOLOGICO'];

    const DESCRIPCIONES = {
        'JEV': 'Neurotropismo por tálamo y ganglios basales; puede causar trastornos del movimiento (de parkinsonismo a corea/atetosis). Principal causa epidémica en Asia.',
        'HSV-1': 'Distribución de edad bimodal (<30 o >60 años), con afectación típica del lóbulo temporal. El aciclovir precoz reduce la mortalidad de ~70% a ~20%.',
        'WNV': 'Puede afectar el asta anterior medular, causando parálisis flácida asimétrica. Sin vacuna ni antiviral específico disponibles.',
        'Enterovirus': 'Predomina en la infancia; cepas como enterovirus-A71 se asocian a afectación troncoencefálica grave.',
        'VZV': 'Frecuente vasculopatía asociada (riesgo de ictus isquémico o hemorrágico); puede acompañarse de exantema vesicular. La PCR en LCR es poco sensible: la IgG específica en LCR lo es más.',
        'Anti-LGI1': 'Más frecuente en varones >40 años (mediana 64). Crisis distónicas faciobraquiales patognomónicas; ~50% con hiponatremia (clave precoz pero inespecífica).',
        'Anti-CASPR2': 'Predomina en varones >60 años (8:1). Más disautonomía, sueño y nervio periférico que LGI1; en síndrome de Morvan, descartar timoma.',
        'Anti-NMDAR': 'Predomina en mujeres jóvenes (~30% con teratoma ovárico). Psiquiatría florida inicial que progresa en días a alteración cognitiva, crisis o trastorno del movimiento complejo.',
        'Anti-MOG': 'Más frecuente en la infancia. RM característica con afectación cortical/subcortical; puede asociar neuritis óptica o mielitis transversa.',
    };

    // ---------------- Utilidades ----------------
    const $ = id => document.getElementById(id);
    const num = v => { const n = parseFloat(v); return isNaN(n) ? null : n; };
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    // ---------------- Arranque ----------------
    let FILAS = [];
    window.iniciarEncephMatch = async function () {
        const box = $('modalData'); if (!box) return;
        box.innerHTML = '<div class="em-loading">Sincronizando base de datos clínica…</div>';
        let rows = null;
        try {
            const res = await fetch('https://psqaldia.com/?sheet=encefalitisDD');
            const data = await res.json();
            if (res.ok && data && Array.isArray(data.values) && data.values.length) rows = data.values;
        } catch (e) { console.error('Enceph-Match: no se pudo leer la hoja encefalitisDD', e); }
        if (!rows) {
            box.innerHTML = '<div class="em-loading" style="color:#dc2626"><i class="fas fa-exclamation-triangle" style="font-size:1.6rem"></i><br><b>Error de comunicación</b><br>No se pudieron cargar los datos de la herramienta. Inténtalo de nuevo en unos segundos.</div>';
            return;
        }
        const cab = String((rows[0] || [])[0] || '').toUpperCase().trim();
        FILAS = rows.slice(cab === 'ETIOLOGIA' || cab === 'ETIOLOGÍA' ? 1 : 0).filter(r => r && r[COL.ETIOLOGIA]);
        pintarUI();
    };

    // ---------------- Interfaz ----------------
    const CSS = `
    .em { padding: 1.2rem; display: flex; flex-direction: column; gap: 14px; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color: #1e293b; }
    .em-loading { padding: 4rem 1rem; text-align: center; color: #64748b; font-weight: 600; }
    .em h2 { margin: 0; font-size: 1.15rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 6px; }
    .em .sub { margin: 2px 0 0; text-align: center; font-size: .72rem; color: #64748b; font-weight: 500; }
    .em-box { border-radius: 12px; padding: .75rem .9rem; font-size: .74rem; line-height: 1.45; }
    .em-box b.t { display: block; font-size: .64rem; letter-spacing: .5px; text-transform: uppercase; margin-bottom: 3px; }
    .em-urg { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
    .em-p0 { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
    .em-sec { font-size: .66rem; font-weight: 800; color: #64748b; margin: 0 0 6px; text-transform: uppercase; letter-spacing: .6px; }
    .em-demo { display: flex; gap: 12px; flex-wrap: wrap; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: .8rem; }
    .em-demo > div { flex: 1; min-width: 130px; }
    .em-demo label { display: block; font-size: .64rem; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 5px; }
    .em-demo input { width: 100%; box-sizing: border-box; padding: 7px 8px; border-radius: 8px; border: 1px solid #22c55e; font-size: .9rem; font-weight: 600; color: #14532d; background: #fff; }
    .em-seg { display: flex; gap: 4px; flex-wrap: wrap; background: #fff; padding: 3px; border-radius: 9px; border: 1px solid #cbd5e1; }
    .em-demo .em-seg { border-color: #22c55e; }
    .em-seg button { flex: 1; min-width: 60px; padding: 6px 4px; border: 0; border-radius: 7px; background: transparent; font-size: .72rem; font-weight: 700; color: #334155; cursor: pointer; }
    .em-demo .em-seg button { color: #166534; }
    .em-seg button[aria-pressed="true"] { background: #7c3aed; color: #fff; }
    .em-demo .em-seg button[aria-pressed="true"] { background: #166534; }
    .em-checks { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .em-checks label { display: flex; align-items: center; gap: 7px; padding: .5rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: .72rem; line-height: 1.2; cursor: pointer; background: #fdfdfd; min-height: 40px; box-sizing: border-box; }
    .em-checks input { width: 15px; height: 15px; min-width: 15px; accent-color: #7c3aed; }
    .em-tests { display: grid; gap: 8px; }
    .em-test { display: grid; grid-template-columns: 8.5rem 1fr; gap: 8px; align-items: center; font-size: .74rem; font-weight: 700; }
    .em-go { width: 100%; background: #7c3aed; color: #fff; border: 0; padding: 11px; border-radius: 12px; font-size: .86rem; font-weight: 800; cursor: pointer; }
    .em-go:focus-visible, .em-seg button:focus-visible { outline: 2px solid #1e1b4b; outline-offset: 2px; }
    .em-res { display: none; flex-direction: column; gap: 12px; }
    .em-ori { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .em-col { border-radius: 12px; padding: .7rem .8rem; font-size: .72rem; line-height: 1.4; }
    .em-col h4 { margin: 0 0 6px; font-size: .7rem; text-transform: uppercase; letter-spacing: .5px; }
    .em-col ul { margin: 0; padding-left: 1rem; } .em-col li { margin-bottom: 4px; } .em-col li small { color: #64748b; display: block; }
    .em-col.inf { background: #fef2f2; border: 1px solid #fecaca; } .em-col.inf h4 { color: #b91c1c; }
    .em-col.aut { background: #eff6ff; border: 1px solid #bfdbfe; } .em-col.aut h4 { color: #1d4ed8; }
    .em-col .none { color: #94a3b8; font-style: italic; }
    .em-verd { text-align: center; font-size: .78rem; font-weight: 700; padding: .55rem; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; }
    .em-rank { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .em-panel { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: .8rem; display: flex; flex-direction: column; gap: 8px; }
    .em-panel h4 { margin: 0; font-size: .7rem; text-transform: uppercase; letter-spacing: .5px; }
    .em-panel h4 small { font-weight: 600; color: #64748b; text-transform: none; letter-spacing: 0; }
    .em-panel.inf h4 { color: #b91c1c; } .em-panel.aut h4 { color: #1d4ed8; }
    .em-bar { display: flex; flex-direction: column; gap: 2px; }
    .em-bar .top { display: flex; justify-content: space-between; font-size: .74rem; font-weight: 700; }
    .em-bar .trk { height: 7px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
    .em-bar .trk i { display: block; height: 100%; }
    .em-panel.inf .trk i { background: #ef4444; } .em-panel.aut .trk i { background: #3b82f6; }
    .em-bar p { margin: 1px 0 0; font-size: .63rem; color: #64748b; font-style: italic; line-height: 1.25; }
    .em-warn { font-size: .68rem; color: #334155; background: #f1f5f9; border-left: 3px solid #94a3b8; padding: .5rem .6rem; border-radius: 4px; }
    .em-alerts { display: flex; flex-direction: column; gap: 6px; }
    .em-al { border-radius: 10px; padding: .65rem .85rem; font-size: .72rem; line-height: 1.45; }
    .em-al b.t { display: block; font-size: .64rem; text-transform: uppercase; letter-spacing: .4px; margin-bottom: 2px; }
    .em-al.am { background: #fef3c7; border-left: 4px solid #d97706; color: #92400e; }
    .em-al.ro { background: #fef2f2; border-left: 4px solid #ef4444; color: #991b1b; }
    .em-al.az { background: #eff6ff; border-left: 4px solid #2563eb; color: #1e40af; }
    .em-al.mo { background: #f5f3ff; border-left: 4px solid #7c3aed; color: #5b21b6; }
    .em-note { border-top: 1px dashed #e2e8f0; padding-top: .8rem; font-size: .66rem; color: #64748b; line-height: 1.5; font-style: italic; }
    .em-mini { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 5px 14px; border-radius: 50px; font-size: .66rem; font-weight: 700; cursor: pointer; }
    @media (max-width: 560px) { .em-checks, .em-ori, .em-rank { grid-template-columns: 1fr; } .em-test { grid-template-columns: 1fr; } }`;

    function seg(name, opciones, aria) {
        return `<div class="em-seg" role="group" aria-label="${aria}" data-seg="${name}">${opciones.map(o =>
            `<button type="button" data-v="${o.v}" aria-pressed="${o.def ? 'true' : 'false'}">${o.t}</button>`).join('')}</div>`;
    }
    function pintarUI() {
        $('modalData').innerHTML = `<style>${CSS}</style>
        <div class="em">
            <div>
                <h2><i class="fas fa-brain" style="color:#7c3aed"></i> Enceph-Match</h2>
                <p class="sub">Orientación diagnóstica en encefalitis · Binks et al., <i>Lancet</i> 2026</p>
                <div style="display:flex;justify-content:center;margin-top:8px"><button type="button" class="em-mini" id="em-posthsv"><i class="fas fa-history"></i> Autoinmunidad post-HSV</button></div>
            </div>
            <div class="em-box em-urg"><b class="t"><i class="fas fa-truck-medical"></i> Ante toda sospecha de encefalitis aguda</b>
                Punción lumbar urgente (TC previa solo si hay focalidad, GCS &lt;10 o signos de hipertensión intracraneal) y, a continuación, <b>aciclovir IV empírico</b> (10 mg/kg cada 8 h; al menos 14 días si se confirma HSV-1); valora cobertura de meningoencefalitis bacteriana. Si la punción se retrasa, no esperes para el aciclovir. Estudia <b>en paralelo</b> causas infecciosas y autoinmunes en sangre y LCR.</div>
            <div class="em-box em-p0"><b class="t"><i class="fas fa-stethoscope"></i> Paso 0: descarta una encefalopatía</b>
                Sepsis, alteraciones metabólicas o tóxicas: cursan en pocos días con delirium o bajo nivel de conciencia, <i>sin</i> focalidad, con RM y LCR normales y un EEG con enlentecimiento difuso.</div>

            <div class="em-demo">
                <div><label for="em-edad">Edad</label><input type="number" id="em-edad" min="0" max="110" placeholder="Años" inputmode="numeric"></div>
                <div style="flex:2"><label>Sexo biológico</label>${seg('sexo', [{ v: 'varon', t: 'Hombre' }, { v: 'mujer', t: 'Mujer' }], 'Sexo biológico')}</div>
            </div>
            <div><p class="em-sec">Velocidad de instauración</p>${seg('inicio', INICIO.map(o => ({ v: o.id, t: o.label })).concat([{ v: '', t: 'No sé' }]), 'Velocidad de instauración')}</div>
            <div><p class="em-sec">Manifestaciones clínicas</p><div class="em-checks">${SINTOMAS.map(s =>
                `<label><input type="checkbox" class="em-s" value="${s.id}"><span>${s.label}</span></label>`).join('')}</div></div>
            <div><p class="em-sec">Exploraciones complementarias</p><div class="em-tests">${PRUEBAS.map(p =>
                `<div class="em-test"><span>${p.label}</span>${seg(p.id, [{ v: '', t: 'No realizada', def: true }, { v: '0', t: p.bien || 'Normal' }, { v: '1', t: p.mal }], p.label)}</div>`).join('')}</div></div>
            <button type="button" class="em-go" id="em-go"><i class="fas fa-calculator"></i> ORIENTAR</button>

            <div class="em-res" id="em-res" aria-live="polite"></div>

            <div class="em-note"><b>Nota metodológica:</b> el paso 1 recoge las señales que el Seminar usa para distinguir encefalitis infecciosa y autoinmune (figura 1 y texto); no es una probabilidad. El paso 2 compara el perfil del paciente, por similitud de coseno ajustada por edad y sexo, con los porcentajes de las figuras 2C (cinco virus más frecuentes) y 3B (cuatro autoanticuerpos más frecuentes), cada grupo por separado: los porcentajes son relativos dentro de cada grupo y suman 100 aunque la causa real no esté en la lista. No sustituye al juicio clínico ni a la confirmación por PCR y autoanticuerpos en suero y LCR.</div>
        </div>`;
        document.querySelectorAll('#modalData .em-seg').forEach(g => g.addEventListener('click', e => {
            const b = e.target.closest('button'); if (!b) return;
            g.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
        }));
        $('em-go').addEventListener('click', calcular);
        $('em-posthsv').addEventListener('click', window.openPostHsvFlags);
    }
    const segVal = name => { const b = document.querySelector(`#modalData [data-seg="${name}"] button[aria-pressed="true"]`); return b ? b.dataset.v : ''; };

    // ---------------- Paso 1: señales infecciosa / autoinmune (Fig. 1 y texto del Seminar) ----------------
    function señales(P) {
        const inf = [], aut = [];
        const s = P.sint, t = P.prueba;
        if (t.PCR === 1) inf.push(['PCR viral positiva en LCR', 'Identifica el agente: confirma la vía infecciosa.']);
        if (P.inicio === 'dias') inf.push(['Instauración en 1–3 días', 'Típica de las infecciosas; también de MOG. Sin focalidad ni fiebre, piensa en encefalopatía.']);
        if (P.inicio === 'semana') aut.push(['Instauración en 3–7 días', 'Característica de Anti-NMDAR (psiquiatría precoz que progresa a crisis o movimientos).']);
        if (P.inicio === 'semanas') aut.push(['Instauración en semanas', 'Típica de LGI1 y CASPR2.']);
        if (P.inicio === 'meses') aut.push(['Instauración en meses', 'Típica de GAD65 (crisis focales con memoria y ánimo, sin delirium).']);
        if (s.FIEBRE || s.RESPIRATORIO) inf.push([s.FIEBRE ? 'Fiebre' : 'Pródromo respiratorio', 'Típico de las infecciosas, aunque NMDAR y MOG pueden empezar con un pródromo catarral y febrícula.']);
        if (s.FOCALIDAD) inf.push(['Focalidad neurológica', 'Más propia de las infecciosas (y de MOG).']);
        if (s.PSIQ && P.inicio !== 'meses') aut.push(['Síntomas psiquiátricos precoces', 'Muy característicos de Anti-NMDAR.']);
        if (s.CRISIS_FBDS) aut.push(['Crisis distónicas faciobraquiales', 'Patognomónicas de Anti-LGI1.']);
        if (s.SIST_NERV_PERIFERICO) aut.push(['Afectación de nervio periférico', 'Orienta a Anti-CASPR2 (~50%).']);
        if (t.RMN_PATOLOGICA === 0) aut.push(['RM normal', 'Una RM normal suele excluir la infecciosa; es normal en más de la mitad de NMDAR, LGI1 y CASPR2.']);
        if (t.RMN_PATOLOGICA === 1) inf.push(['RM patológica', 'Frecuente en las infecciosas y en MOG. Si la alteración se limita a hipocampo y amígdala, también encaja con autoinmune (límbica).']);
        if (t.LCR_PATOLOGICO === 0) aut.push(['LCR sin células', 'Ayuda a excluir la infecciosa, aunque ~20% no tienen pleocitosis (punción precoz, mayores, inmunodeprimidos).']);
        if (t.LCR_PATOLOGICO === 1) inf.push(['Pleocitosis en LCR', 'Habitual en las infecciosas; también en NMDAR y MOG.']);
        if (t.PCR === 0) aut.push(['PCR viral negativa', 'Señal débil: no excluye todos los virus (VZV, WNV o JEV pueden requerir serología o IgG en LCR).']);
        let verd = 'Sin datos suficientes para orientar: estudia ambas vías en paralelo.';
        if (t.PCR === 1) verd = 'Orientación infecciosa (PCR positiva).';
        else if (inf.length && !aut.length) verd = 'Las señales apuntan a la vía <b style="color:#b91c1c">infecciosa</b>.';
        else if (aut.length && !inf.length) verd = 'Las señales apuntan a la vía <b style="color:#1d4ed8">autoinmune</b>.';
        else if (inf.length && aut.length) verd = inf.length > aut.length ? 'Señales mixtas, con más a favor de la vía <b style="color:#b91c1c">infecciosa</b>.' : aut.length > inf.length ? 'Señales mixtas, con más a favor de la vía <b style="color:#1d4ed8">autoinmune</b>.' : 'Señales mixtas: estudia ambas vías en paralelo.';
        return { inf, aut, verd, lado: t.PCR === 1 ? 'inf' : inf.length > aut.length ? 'inf' : aut.length > inf.length ? 'aut' : null };
    }

    // ---------------- Paso 2: ranking dentro de cada grupo ----------------
    function factorEdad(et, mediana, edad) {
        const sigma = et === 'HSV-1' ? 25 : mediana <= 5 ? 6 : 15;
        return Math.max(0.25, Math.exp(-((edad - mediana) ** 2) / (2 * sigma ** 2)));
    }
    function factorSexo(pctVaron, sexo) {
        if (pctVaron === null) return 1;
        const af = sexo === 'varon' ? pctVaron / 100 : 1 - pctVaron / 100;
        return 0.4 + 0.6 * af;
    }
    function ranking(grupo, P) {
        const G = GRUPOS[grupo];
        const filas = FILAS.filter(r => (grupo === 'inf') === /infec/i.test(String(r[COL.TIPO])));
        // media del grupo en cada columna, para las celdas no reportadas
        const media = {};
        G.cols.forEach(c => { const v = filas.map(r => num(r[COL[c]])).filter(x => x !== null); media[c] = v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; });
        const out = filas.map(r => {
            const et = String(r[COL.ETIOLOGIA]).trim();
            let dot = 0, mp = 0, md = 0, pen = 1;
            G.cols.forEach(c => {
                // valor del paciente: síntomas 1/0; pruebas 1/0 o, si no se han hecho, fuera del cálculo
                let x;
                if (PRUEBA_COLS.includes(c)) { x = P.prueba[c]; if (x === undefined) return; }
                else x = c === 'ALT_MENTAL_PSQ' ? P.sint[G.mental] : P.sint[c];
                let v = num(r[COL[c]]);
                if (v === null) v = media[c];
                if (v === null) return;
                v /= 100;
                dot += x * v; mp += x * x; md += v * v;
                if (v >= 0.8 && x === 0) pen *= PRUEBA_COLS.includes(c) ? 0.3 : 0.5;
            });
            let sim = mp && md ? dot / Math.sqrt(mp * md) : 0;
            let score = sim * factorEdad(et, num(r[COL.MEDIANA_EDAD]) || 0, P.edad) * factorSexo(num(r[COL.PCT_VARON]), P.sexo) * pen;
            if (P.sint.CRISIS_FBDS && et === 'Anti-LGI1') score *= 2.5;
            if (P.sint.SIST_NERV_PERIFERICO && et === 'Anti-CASPR2') score *= 2.0;
            return { et, score };
        });
        const tot = out.reduce((a, b) => a + b.score, 0);
        return out.map(o => ({ ...o, pct: tot > 0 ? Math.round(o.score / tot * 1000) / 10 : 0 })).sort((a, b) => b.score - a.score);
    }

    // ---------------- Cálculo y resultados ----------------
    function calcular() {
        const edad = num($('em-edad').value), sexo = segVal('sexo');
        if (edad === null || edad < 0 || edad > 110) { alert('Introduce una edad válida.'); $('em-edad').focus(); return; }
        if (!sexo) { alert('Selecciona el sexo biológico.'); return; }
        const sint = {}; document.querySelectorAll('#modalData .em-s').forEach(c => { sint[c.value] = c.checked ? 1 : 0; });
        const prueba = {}; PRUEBAS.forEach(p => { const v = segVal(p.id); if (v !== '') prueba[p.id] = +v; });
        const P = { edad, sexo, sint, prueba, inicio: segVal('inicio') };
        const box = $('em-res');
        const algo = Object.values(sint).some(Boolean) || Object.keys(prueba).length || P.inicio;
        box.style.display = 'flex';
        if (!algo) { box.innerHTML = '<div class="em-warn">Marca al menos un síntoma, la velocidad de instauración o una prueba.</div>'; return; }

        const S = señales(P);
        const li = arr => arr.length ? `<ul>${arr.map(([a, b]) => `<li><b>${a}</b><small>${b}</small></li>`).join('')}</ul>` : '<span class="none">Ninguna señal marcada</span>';
        const R = { inf: ranking('inf', P), aut: ranking('aut', P) };
        const panel = g => {
            const r = R[g], vacio = r.every(x => x.score === 0);
            const w = !vacio && r.length > 1 && r[0].pct - r[1].pct < 8 ? `<div class="em-warn"><b>Poco discriminante:</b> ${esc(r[0].et)} y ${esc(r[1].et)} quedan muy próximos.</div>` : '';
            return `<div class="em-panel ${g}"><h4>${GRUPOS[g].nombre} <small>· ${GRUPOS[g].fig}</small></h4>${vacio ? '<span class="none" style="font-size:.72rem;color:#94a3b8">Con lo marcado no hay rasgos de este grupo con los que comparar.</span>' :
                r.map(x => `<div class="em-bar"><div class="top"><span>${esc(x.et)}</span><span>${x.pct}%</span></div><div class="trk"><i style="width:${x.pct}%"></i></div>${DESCRIPCIONES[x.et] ? `<p>${DESCRIPCIONES[x.et]}</p>` : ''}</div>`).join('')}${w}</div>`;
        };
        const orden = S.lado === 'aut' ? ['aut', 'inf'] : ['inf', 'aut'];
        box.innerHTML = `
            <div><p class="em-sec">Paso 1 · ¿Infecciosa o autoinmune?</p>
                <div class="em-ori"><div class="em-col inf"><h4>A favor de infecciosa</h4>${li(S.inf)}</div><div class="em-col aut"><h4>A favor de autoinmune</h4>${li(S.aut)}</div></div>
                <div class="em-verd" style="margin-top:8px">${S.verd}</div></div>
            <div><p class="em-sec">Paso 2 · Qué causa encaja mejor dentro de cada grupo</p><div class="em-rank">${orden.map(panel).join('')}</div></div>
            <div class="em-alerts">${alertas(P, R, S.lado)}</div>`;
        box.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }

    function alertas(P, R, lado) {
        const a = [], top = g => (R[g][0] && R[g][0].score > 0 ? R[g][0].et : null);
        // los avisos de un grupo solo salen si el paso 1 no orienta claramente al otro
        const okInf = lado !== 'aut', okAut = lado !== 'inf';
        const ti = okInf ? top('inf') : null, s = P.sint, t = P.prueba;
        let ta = okAut ? top('aut') : null;
        // NMDAR: instauración en días; con un curso de meses no se dan sus avisos (encaja más con GAD65)
        if (ta === 'Anti-NMDAR' && P.inicio === 'meses') ta = null;
        const al = (cls, icon, titulo, txt) => a.push(`<div class="em-al ${cls}"><b class="t"><i class="fas fa-${icon}"></i> ${titulo}</b>${txt}</div>`);
        if (['Anti-NMDAR', 'Anti-LGI1', 'Anti-CASPR2'].includes(ta) && t.RMN_PATOLOGICA === 0)
            al('am', 'triangle-exclamation', 'RM normal', 'Una RM normal no excluye el origen autoinmune: es anodina en más de la mitad de las encefalitis por NMDAR, LGI1 y CASPR2.');
        if (ta === 'Anti-NMDAR') {
            if (P.sexo === 'mujer' && P.edad <= 50) al('ro', 'dna', 'Cribado de teratoma', 'Con perfil de Anti-NMDAR en una mujer joven, busca un <b>teratoma ovárico</b> (asociación ~30%; su extirpación precoz mejora la evolución).');
            if (P.edad > 50) al('ro', 'user-clock', 'Anti-NMDAR por encima de 50 años', 'Es poco frecuente: pocos teratomas, pero más neoplasias de otro tipo y peor pronóstico. Busca tumor.');
            al('mo', 'heart-pulse', 'Vigilancia en NMDAR', 'Hasta ~30% desarrollan disautonomía multiorgánica con arritmias potencialmente letales, y pueden precisar UCI por bajo nivel de conciencia o hipoventilación central.');
        }
        if (ta === 'Anti-LGI1' && s.HIPONATREMIA) al('az', 'vial', 'LGI1 e hiponatremia', 'La hiponatremia (~50%) apoya la sospecha. Busca activamente FBDS sutiles; un diario de crisis ayuda.');
        if (ta === 'Anti-CASPR2' && s.SIST_NERV_PERIFERICO) al('az', 'lungs', 'Timoma', 'Con afectación de nervio periférico o síndrome de Morvan, descarta un timoma (TC de tórax).');
        if (ti === 'HSV-1' && P.edad > 60) al('mo', 'brain', 'HSV-1 en mayores de 60', 'En mayores e inmunodeprimidos puede presentarse de forma inespecífica, con alteración de la conciencia y sin fiebre ni cefalea.');
        if (ti === 'VZV' && t.PCR === 0) al('am', 'syringe', 'VZV con PCR negativa', 'La PCR en LCR es poco sensible para VZV: pide IgG específica en LCR (también puede ser negativa al principio).');
        if (t.LCR_PATOLOGICO === 0 && (P.edad > 65 || (P.inicio === 'dias'))) al('am', 'clock', 'LCR sin células', 'Hasta ~20% de las infecciosas no tienen pleocitosis, sobre todo en punciones precoces, mayores e inmunodeprimidos. Mantén el aciclovir si la sospecha persiste.');
        if (P.inicio === 'meses' && s.CRISIS_COMICIALES && !s.NIVEL_CON && t.LCR_PATOLOGICO !== 1 && t.RMN_PATOLOGICA !== 1)
            al('az', 'magnifying-glass', 'Patrón de GAD65 (fuera del ranking)', `Meses de crisis focales con alteración leve de memoria o ánimo, sin delirium y con RM y LCR anodinos sugieren encefalitis por GAD65${P.sexo === 'mujer' && P.edad >= 18 && P.edad <= 40 ? ', típica de mujeres de 18 a 40 años' : ''}. Requiere títulos muy altos de anti-GAD65 (los bajos aparecen en diabetes tipo 1 y en sanos).`);
        return a.join('');
    }

    // ---------------- Autoinmunidad post-HSV ----------------
    window.openPostHsvFlags = function () {
        const m = document.createElement('div');
        m.id = 'enceph-rf-modal';
        m.style = 'position:fixed;inset:0;background:rgba(15,23,42,.85);z-index:3000;display:flex;align-items:center;justify-content:center;padding:1.2rem;';
        m.addEventListener('click', () => m.remove());
        m.innerHTML = `<div role="dialog" aria-modal="true" aria-labelledby="em-hsv-t" style="background:#fff;color:#1e293b;padding:1.4rem;border-radius:1.2rem;max-width:420px;width:100%;font-family:system-ui,sans-serif">
            <h3 id="em-hsv-t" style="margin-top:0;font-size:1.05rem"><i class="fas fa-sync-alt" style="color:#3b82f6"></i> Autoinmunidad tras HSV-1</h3>
            <p style="font-size:.8rem;line-height:1.45">En ~25% de niños y adolescentes (menos en adultos), una encefalitis por HSV-1 tratada con aciclovir va seguida, típicamente a las <b>6–12 semanas</b>, de una encefalitis autoinmune muy parecida a la de NMDAR.</p>
            <p style="font-size:.74rem;line-height:1.4;background:#f1f5f9;padding:.6rem;border-radius:8px;color:#475569">Cursa sin ADN de HSV-1 en el LCR y responde a inmunoterapia, sin necesidad de más antivirales.</p>
            <button type="button" style="background:#3b82f6;color:#fff;border:0;width:100%;padding:.7rem;border-radius:10px;font-weight:700;cursor:pointer">Entendido</button></div>`;
        m.querySelector('[role="dialog"]').addEventListener('click', e => e.stopPropagation());
        m.querySelector('button').addEventListener('click', () => m.remove());
        document.body.appendChild(m);
        m.querySelector('button').focus();
    };

    // Para pruebas automáticas
    window.__encephMatch = { ranking, señales, set filas(v) { FILAS = v; } };
})();
