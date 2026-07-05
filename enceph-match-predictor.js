/**
 * Herramienta: Enceph-Match v3.2 (Calculadora de Afinidad Clínica de Encefalitis)
 * Plataforma: PSQ al día (psqaldia.com)
 * Fuente de datos: Binks SNM, Saylor D, Easton A, Thakur KT, Irani SR.
 * Encephalitis. Lancet 2026; 407: 1968-83 (Seminar, Fig. 1-3)
 * INTEGRACIÓN ENCAPSULADA: Conexión automatizada mediante Cloudflare Worker (Hoja: encefalitisDD)
 *
 * ─────────────────────────────────────────────────────────────────────────
 * CHANGELOG v3.2 (recupera rigor perdido en v3.0 sin tocar el fix del fetch)
 * - CORRECCIÓN CRÍTICA: principio de omisión vectorial restaurado. Una celda
 *   vacía (dato no reportado por el estudio de origen) ya NO se convierte en
 *   0 — se omite esa dimensión por completo del cálculo, tanto para el
 *   paciente como para la enfermedad, evitando penalizar artificialmente.
 * - Restaurada la penalización por ausencia de hallazgo muy prevalente
 *   (>80% en la cohorte de referencia y ausente en el paciente → ×0.2).
 * - Restaurados los overrides patognomónicos: FBDS → Anti-LGI1 (×2.5),
 *   síntomas de nervio periférico → Anti-CASPR2 (×2.0).
 * - Restaurada la normalización relativa (los resultados vuelven a sumar
 *   ~100% entre sí), y el aviso de "solapamiento fenotípico estrecho"
 *   vuelve a calcularse sobre esa base relativa.
 * - Restauradas las alertas perdidas: RMN normal no excluye autoinmune
 *   (NMDAR/LGI1/CASPR2), debut geriátrico >50a en NMDAR, timoma en CASPR2
 *   con afectación de nervio periférico, presentación atípica de HSV-1 en
 *   >60a, y el modal informativo de autoinmunidad post-HSV-1.
 * - Sexo biológico: se mantienen solo 2 botones (Hombre/Mujer), sin tercera
 *   opción, pero ninguno viene premarcado — la app exige elegir uno antes
 *   de calcular, para no asumir "varón" en silencio si el clínico lo olvida.
 * - Revisión de fidelidad textual de TODAS las etiquetas y tooltips frente
 *   al Seminar: se retiraron adiciones no sustentadas por el texto (p. ej.
 *   "SIADH"/"refractaria" en LGI1, "gastrointestinal" en el pródromo viral,
 *   "necrótica"/"experimental" en descriptores, edad de LGI1 mal citada).
 * - GAD65 sigue sin incluirse: el Seminar no aporta una fila cuantitativa
 *   comparable a las de LGI1/CASPR2/NMDAR/MOG (Fig. 3B).
 * ─────────────────────────────────────────────────────────────────────────
 */

// Estructura de metadatos para la renderización automática de la interfaz.
// Las etiquetas se han revisado para ceñirse a la terminología y al alcance
// exacto de las Figuras 1-3 del Seminar, evitando añadir detalles clínicos
// (maniobras exploratorias concretas, mecanismos fisiopatológicos, etc.)
// que el artículo no menciona explícitamente para esa variable.
const CAMPOS_ENCEPHALITIS = {
    clinicos: [
        { id: 'FIEBRE', label: 'Fiebre' },
        { id: 'CEFALEA', label: 'Cefalea' },
        { id: 'SINT_MENINGEOS', label: 'Síntomas meníngeos (p. ej., rigidez de nuca)' },
        { id: 'RESPIRATORIO', label: 'Pródromo respiratorio / viral' },
        { id: 'ALT_MENTAL_PSQ', label: 'Alteración del estado mental / Manifestaciones psiquiátricas' },
        { id: 'CRISIS_COMICIALES', label: 'Crisis comiciales (focales o generalizadas)' },
        { id: 'FOCALIDAD', label: 'Focalidad neurológica (p. ej., afasia, hemiparesia)' },
        { id: 'VOMITOS', label: 'Vómitos' },
        { id: 'RASH', label: 'Exantema / Erupción cutánea' },
        { id: 'CRISIS_FBDS', label: 'Crisis distónicas faciobraquiales (FBDS)' },
        { id: 'COGNITIVO_AMNESIA', label: 'Déficit cognitivo / Amnesia (anterógrada y/o retrógrada)' },
        { id: 'SIST_NERV_PERIFERICO', label: 'Síntomas de nervio periférico (neuromiotonía, hiperexcitabilidad o dolor neuropático)' },
        { id: 'DISAUTONOMIA', label: 'Disfunción autonómica (cardiovascular o sudoración)' },
        { id: 'NIVEL_CON', label: 'Alteración del nivel de conciencia' },
        { id: 'TRAST_MOVIMIENTO', label: 'Trastorno del movimiento complejo (distonía, corea, estereotipias) / Catatonia' },
        { id: 'ALT_SUENO', label: 'Trastorno del sueño grave (insomnio agudo, agitación nocturna)' },
        { id: 'HIPONATREMIA', label: 'Hiponatremia sistémica' }
    ],
    paraclinicos: [
        { id: 'RMN_PATOLOGICA', label: 'RM cerebral patológica (p. ej., lóbulo temporal mesial)' },
        { id: 'LCR_PATOLOGICO', label: 'LCR patológico (pleocitosis >5 cél/µL)' },
        { id: 'EEG_PATOLOGICO', label: 'EEG patológico (enlentecimiento focal/difuso o actividad epileptiforme)' }
    ]
};

// Mapeo de índices de columnas de la hoja "encefalitisDD".
// BLANCO y NIVEL_CON se conservan en el índice para no romper la lectura
// posicional de la fila; BLANCO no participa en el cálculo (no forma parte
// de CAMPOS_ENCEPHALITIS), NIVEL_CON sí se usa como variable clínica más.
const COL_INDEX = {
    ETIOLOGIA: 0, TIPO: 1, MEDIANA_EDAD: 2, PCT_VARON: 3, BLANCO: 4,
    FIEBRE: 5, CEFALEA: 6, SINT_MENINGEOS: 7, RESPIRATORIO: 8, ALT_MENTAL_PSQ: 9,
    CRISIS_COMICIALES: 10, FOCALIDAD: 11, VOMITOS: 12, RASH: 13, CRISIS_FBDS: 14,
    COGNITIVO_AMNESIA: 15, SIST_NERV_PERIFERICO: 16, DISAUTONOMIA: 17, NIVEL_CON: 18,
    TRAST_MOVIMIENTO: 19, ALT_SUENO: 20, HIPONATREMIA: 21, RMN_PATOLOGICA: 22,
    LCR_PATOLOGICO: 23, EEG_PATOLOGICO: 24
};

// Perfiles de edad no-unimodales (Fig. 2C, texto: distribución bimodal de
// HSV-1, <30a o >60a). Se toma el máximo de las dos campanas de Gauss.
const PERFILES_EDAD_BIMODAL = {
    'HSV-1': [
        { mediana: 24, sigma: 10 },
        { mediana: 66, sigma: 12 }
    ]
};

// Descriptores clínicos breves para los tooltips. Redactados en términos
// propios (no citas textuales) y verificados frase a frase contra lo que
// el Seminar afirma explícitamente, para no atribuirle al artículo datos
// que no reporta (p. ej., mecanismos fisiopatológicos no mencionados).
const DESCRIPCIONES_BREVES = {
    'JEV': 'Neurotropismo por tálamo y ganglios basales; puede causar trastornos del movimiento (de parkinsonismo a corea/atetosis). Principal causa epidémica en Asia.',
    'HSV-1': 'Distribución de edad bimodal (<30a o >60a), con afectación típica del lóbulo temporal. El aciclovir precoz reduce la mortalidad de ~70% a ~20%.',
    'WNV': 'Puede afectar el asta anterior medular, causando parálisis flácida asimétrica. Sin vacuna ni antiviral específico disponibles.',
    'Enterovirus': 'Predomina en la infancia; cepas como enterovirus-A71 se asocian a afectación troncoencefálica grave.',
    'VZV': 'Frecuente vasculopatía asociada (riesgo de ictus isquémico o hemorrágico); puede acompañarse de exantema vesicular.',
    'Anti-LGI1': 'Más frecuente en varones >40 años (mediana 64a). Crisis distónicas faciobraquiales patognomónicas; hasta 50% presentan hiponatremia (clave diagnóstica precoz pero inespecífica).',
    'Anti-CASPR2': 'Predomina en varones >60 años (ratio 8:1). Más disautonomia y afectación de nervio periférico que LGI1; en Sd. de Morvan, descartar timoma.',
    'Anti-NMDAR': 'Predomina en mujeres jóvenes (~30% asociación con teratoma ovárico). Manifestaciones psiquiátricas floridas iniciales que progresan en días a alteración cognitiva, crisis o trastorno del movimiento complejo.',
    'Anti-MOG': 'Más frecuente en la infancia. RM característica con afectación cortical/subcortical; puede asociar neuritis óptica o mielitis transversa.'
};

window.currentSheetRows = [];

/**
 * FUNCIÓN INICIALIZADORA: Establece el canal con el Cloudflare Worker mediante URL absoluta
 */
window.iniciarEncephMatch = async function() {
    try {
        const modal = document.getElementById('modal');
        if (modal) modal.style.display = 'flex';

        const container = document.getElementById('modalData');
        if (!container) return;

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:220px; font-family:system-ui, sans-serif; font-size:0.85rem; color:var(--text-muted);">
                <div style="width:160px; height:6px; border-radius:5px; background:linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 37%, #e2e8f0 63%); background-size:400% 100%; animation: enceph-shimmer 1.2s ease-in-out infinite; margin-bottom:14px;"></div>
                <span style="font-weight: 500; letter-spacing:0.2px;">Sincronizando base de datos clínica...</span>
            </div>
            <style>@keyframes enceph-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }</style>
        `;

        const response = await fetch('https://psqaldia.com/?sheet=encefalitisDD');
        const data = await response.json();

        if (data && data.values) {
            window.currentSheetRows = data.values;
            window.openEncephalitisUI(data.values);
        } else {
            throw new Error("Payload 'values' no detectado.");
        }
    } catch (error) {
        console.error("Error en la conexión asíncrona:", error);
        document.getElementById('modalData').innerHTML = `
            <div style="padding:2.5rem; text-align:center; font-family:system-ui, sans-serif; font-size:0.85rem; color:#dc2626; line-height:1.4;">
                <i class="fas fa-exclamation-triangle" style="margin-bottom:10px; font-size:1.8rem;"></i><br>
                <b>Error de comunicación</b><br>No se pudieron precargar los datos fenotípicos necesarios desde el servidor de PSQ al día.
            </div>
        `;
    }
};

/**
 * Renderiza la interfaz dentro del modal
 */
window.openEncephalitisUI = function(sheetRows) {
    const modalData = document.getElementById('modalData');
    modalData.innerHTML = `
        <div class="calc-ui" style="padding: 1.2rem; display: flex; flex-direction: column; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-height: 90vh; overflow-y: auto; box-sizing: border-box; background: var(--bg-main, #ffffff); gap: 12px;">
            <div style="text-align:center; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border, #e2e8f0);">
                <h2 style="font-weight:800; font-size: 1.15rem; margin:0 0 0.15rem 0; color: var(--text-main, #1e293b); display:flex; align-items:center; justify-content:center; gap:6px;">
                    <i class="fas fa-brain" style="color:#7c3aed;"></i> Enceph-Match
                </h2>
                <p style="font-size:0.7rem; color:var(--text-muted, #64748b); font-weight: 500; margin:0 0 0.6rem 0;">Calculadora de Afinidad Clínica de Encefalitis</p>
                <div style="display:flex; justify-content:center;">
                    <button type="button" onclick="window.openPostHsvFlags()" style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; padding:5px 14px; border-radius:50px; font-size:0.65rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px;">
                        <i class="fas fa-history"></i> NOTA SOBRE AUTOINMUNIDAD POST-HSV
                    </button>
                </div>
            </div>

            <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:12px; padding:0.7rem 0.9rem; font-size:0.7rem; color:#92400e; line-height:1.45;">
                <span style="font-weight:800; text-transform:uppercase; display:block; margin-bottom: 2px; font-size:0.62rem; letter-spacing:0.5px;"><i class="fas fa-stethoscope"></i> Paso 0: Exclusión de Encefalopatías Puras</span>
                Antes de valorar el árbol diagnóstico, confirme que el cuadro no se explica mejor por una <b>Encefalopatía sistémica</b> (séptica, metabólica o tóxica). Estas cursan habitualmente <i>sin</i> déficits focales estructurales, con RM y LCR normales, y un EEG que revela únicamente enlentecimiento difuso inespecífico.
            </div>

            <div style="display: flex; gap: 12px; background: #f0fdf4; padding: 0.85rem; border-radius: 12px; border: 1px solid #bbf7d0; align-items: flex-end; flex-wrap:wrap;">
                <div style="flex: 1; min-width:100px;">
                    <span style="font-size: 0.65rem; font-weight: 800; color: #166534; display: block; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Edad actual</span>
                    <input type="number" id="p-edad" placeholder="Años" style="width: 100%; padding: 6px 8px; border-radius: 6px; border: 1px solid #22c55e; font-size: 0.85rem; box-sizing: border-box; outline: none; background: #ffffff; font-weight: 600; color: #14532d;">
                </div>
                <div style="flex: 2; min-width:180px;">
                    <span style="font-size: 0.65rem; font-weight: 800; color: #166534; display: block; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Sexo biológico</span>
                    <div id="sexo-toggle" style="display:flex; gap:4px; background:#ffffff; padding:2px; border-radius:8px; border:1px solid #22c55e;">
                        <button type="button" id="btn-sexo-varon" onclick="window.setSexoPaciente('varon')" style="flex:1; padding:5px; border-radius:6px; border:none; background:transparent; font-size:0.7rem; font-weight:700; color:#166534; cursor:pointer; outline:none; transition:0.1s;">Hombre</button>
                        <button type="button" id="btn-sexo-mujer" onclick="window.setSexoPaciente('mujer')" style="flex:1; padding:5px; border-radius:6px; border:none; background:transparent; font-size:0.7rem; font-weight:700; color:#166534; cursor:pointer; outline:none; transition:0.1s;">Mujer</button>
                    </div>
                </div>
            </div>

            <div>
                <p style="font-size:0.65rem; font-weight:800; color:var(--text-muted, #64748b); margin: 0 0 0.4rem 0; text-transform: uppercase; letter-spacing: 0.6px;">Manifestaciones Clínicas Detectadas</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                    ${CAMPOS_ENCEPHALITIS.clinicos.map(s => window.renderEncephCheck(s, 'enceph-sintoma')).join('')}
                </div>
            </div>

            <div>
                <p style="font-size:0.65rem; font-weight:800; color:var(--text-muted, #64748b); margin: 0 0 0.4rem 0; text-transform: uppercase; letter-spacing: 0.6px;">Hallazgos en Exploraciones Complementarias</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                    ${CAMPOS_ENCEPHALITIS.paraclinicos.map(s => window.renderEncephCheck(s, 'enceph-paraclinico')).join('')}
                </div>
            </div>

            <div style="margin-top: 0.4rem;">
                <button type="button" onclick="window.updateEncephalitis()" style="width:100%; background: #7c3aed; color: #ffffff; border: none; padding: 10px; border-radius: 12px; font-size: 0.85rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.2); transition: background 0.15s; outline:none;">
                    <i class="fas fa-calculator" style="margin-right:4px;"></i> CALCULAR AFINIDAD FENOTÍPICA
                </button>
            </div>

            <div id="results-panel" style="display: none; padding: 0.9rem; background: #f8fafc; border-radius: 12px; border: 1px solid var(--border, #e2e8f0); flex-direction: column; gap: 8px;">
                <div style="font-size:0.65rem; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:0.3rem; text-align:center; letter-spacing: 0.6px;">Índice de Afinidad Clínica Relativa</div>
                <div id="results-bars-container" style="display: flex; flex-direction: column; gap: 7px;"></div>
                <div id="discriminacion-warning" style="display:none; margin-top:0.5rem; font-size:0.68rem; color:#334155; background:#f1f5f9; border-left:3px solid #94a3b8; padding:0.6rem; border-radius:4px; line-height:1.4;"></div>
            </div>

            <div id="alerts-container" style="display:none; flex-direction: column; gap: 6px;"></div>

            <div style="margin-top:0.8rem; border-top:1px dashed var(--border, #e2e8f0); padding-top:0.8rem; font-size:0.65rem; color:var(--text-muted, #64748b); text-align:justify; line-height:1.5; font-style: italic;">
                <b>Nota científica y metodológica:</b> Este índice refleja la similitud relativa del perfil clínico introducido con los patrones descritos por Binks et al. en el Seminar de <i>The Lancet</i> (2026). No es una probabilidad diagnóstica validada ni sustituye el juicio clínico independiente ni la confirmación serológica/molecular (PCR, autoanticuerpos en LCR/suero).
            </div>
        </div>
    `;

    // Sin sexo preseleccionado: se exige elección explícita antes de calcular.
    window.encephSexoPaciente = null;
};

window.setSexoPaciente = function(valor) {
    window.encephSexoPaciente = valor;
    const btnVaron = document.getElementById('btn-sexo-varon');
    const btnMujer = document.getElementById('btn-sexo-mujer');

    if (valor === 'varon') {
        btnVaron.style.background = '#166534'; btnVaron.style.color = '#fff';
        btnMujer.style.background = 'transparent'; btnMujer.style.color = '#166534';
    } else {
        btnMujer.style.background = '#166534'; btnMujer.style.color = '#fff';
        btnVaron.style.background = 'transparent'; btnVaron.style.color = '#166534';
    }
};

window.renderEncephCheck = function(s, className) {
    return `
        <label style="display: flex; align-items: center; gap: 6px; background: var(--bg, #fdfdfd); padding: 0.5rem; border-radius: 8px; cursor: pointer; border: 1px solid var(--border, #e2e8f0); font-size: 0.7rem; color: var(--text-main, #334155); height: 100%; box-sizing: border-box; min-height: 40px; user-select:none;">
            <input type="checkbox" class="${className}" value="${s.id}" style="width:14px; height:14px; min-width:14px; accent-color: #7c3aed;">
            <span style="line-height:1.2; font-weight: 500;">${s.label}</span>
        </label>
    `;
};

/**
 * Factor de ajuste por edad, con distribución bimodal cuando aplica (HSV-1)
 */
window.calcularFactorEdad = function(etiologia, medianaEdadFila, edadPaciente) {
    if (PERFILES_EDAD_BIMODAL[etiologia]) {
        const picos = PERFILES_EDAD_BIMODAL[etiologia];
        return Math.max(...picos.map(p =>
            Math.exp(-Math.pow(edadPaciente - p.mediana, 2) / (2 * Math.pow(p.sigma, 2)))
        ));
    }
    const sigma = (medianaEdadFila <= 5) ? 6 : 15;
    return Math.exp(-Math.pow(edadPaciente - medianaEdadFila, 2) / (2 * Math.pow(sigma, 2)));
};

/**
 * Factor de ajuste por sexo biológico. Amortiguado (0.4-1.0): nunca anula
 * por completo una entidad solo por el sexo del paciente.
 */
window.calcularFactorSexo = function(pctVaronFila, sexoPaciente) {
    if (pctVaronFila === null || isNaN(pctVaronFila)) return 1;
    const afinidad = (sexoPaciente === 'varon') ? (pctVaronFila / 100) : (1 - pctVaronFila / 100);
    return 0.4 + 0.6 * afinidad;
};

/**
 * Similitud de coseno para UNA fila (entidad), aplicando el PRINCIPIO DE
 * OMISIÓN VECTORIAL: si el dato no está reportado en el estudio de origen
 * (celda vacía o no numérica), esa dimensión se excluye por completo del
 * espacio vectorial de esta fila — no se añade ni al vector del paciente
 * ni al de la enfermedad. Así, marcar un síntoma que el estudio de origen
 * simplemente no midió no penaliza artificialmente a esa entidad.
 * Devuelve también la penalización por ausencia de un hallazgo muy
 * prevalente (>80% en la cohorte y ausente en el paciente).
 */
window.calcularSimilitudFila = function(row, sintomasSeleccionados, todosLosCampos) {
    let dotProduct = 0;
    let magPaciente = 0;
    let magEnfermedad = 0;
    let penalizacionAusenciaCritica = 1.0;

    todosLosCampos.forEach(f => {
        const idx = COL_INDEX[f.id];
        const celdaRaw = row[idx];

        // Celda vacía / no reportada -> se omite la dimensión completa
        if (celdaRaw === undefined || celdaRaw === null || String(celdaRaw).trim() === '') {
            return;
        }

        let valCelda = parseFloat(celdaRaw);
        if (isNaN(valCelda)) {
            const celdaStr = String(celdaRaw).toUpperCase().trim();
            if (celdaStr === 'TRUE') valCelda = 100;
            else if (celdaStr === 'FALSE') valCelda = 0;
            else return; // texto no interpretable -> se omite, no se asume 0
        }

        const valEtiol = valCelda / 100;
        const valUser = sintomasSeleccionados[f.id];

        dotProduct += valUser * valEtiol;
        magPaciente += valUser * valUser;
        magEnfermedad += valEtiol * valEtiol;

        if (valEtiol > 0.80 && valUser === 0) {
            penalizacionAusenciaCritica *= 0.2;
        }
    });

    let similitudCoseno = 0;
    if (magPaciente > 0 && magEnfermedad > 0) {
        similitudCoseno = dotProduct / (Math.sqrt(magPaciente) * Math.sqrt(magEnfermedad));
    }

    return { similitudCoseno, penalizacionAusenciaCritica };
};

/**
 * Motor Algorítmico Central
 */
window.updateEncephalitis = function() {
    const edadInput = document.getElementById('p-edad').value;
    const sexoPaciente = window.encephSexoPaciente;

    if (!edadInput || isNaN(edadInput) || parseFloat(edadInput) < 0) {
        alert("Por favor, introduce una edad válida para realizar la evaluación.");
        return;
    }
    if (!sexoPaciente) {
        alert("Por favor, selecciona el sexo biológico del paciente.");
        return;
    }
    const edadPaciente = parseFloat(edadInput);

    // 1. Recopilar estados de los checks clínicos y paraclínicos
    const sintomasSeleccionados = {};
    document.querySelectorAll('.enceph-sintoma').forEach(cb => {
        sintomasSeleccionados[cb.value] = cb.checked ? 1 : 0;
    });
    document.querySelectorAll('.enceph-paraclinico').forEach(cb => {
        sintomasSeleccionados[cb.value] = cb.checked ? 1 : 0;
    });

    const todosLosCampos = [...CAMPOS_ENCEPHALITIS.clinicos, ...CAMPOS_ENCEPHALITIS.paraclinicos];

    const resultsPanel = document.getElementById('results-panel');
    const containerBars = document.getElementById('results-bars-container');
    const warningBox = document.getElementById('discriminacion-warning');
    const alertsContainer = document.getElementById('alerts-container');

    resultsPanel.style.display = 'flex';
    containerBars.innerHTML = '';
    alertsContainer.innerHTML = '';
    alertsContainer.style.display = 'none';
    warningBox.style.display = 'none';

    const totalSeleccionados = Object.values(sintomasSeleccionados).reduce((a, b) => a + b, 0);
    if (totalSeleccionados === 0) {
        containerBars.innerHTML = '<div style="font-size:0.72rem; color:var(--text-muted); text-align:center; padding:10px;">Selecciona al menos una manifestación clínica para calcular afinidades diferenciales.</div>';
        return;
    }

    if (!window.currentSheetRows || window.currentSheetRows.length === 0) {
        alert("Base de datos no disponible temporalmente.");
        return;
    }

    const primeraCelda = String(window.currentSheetRows[0]?.[0]).toUpperCase().trim();
    const inicioFila = (primeraCelda === 'ETIOLOGIA' || primeraCelda === 'ETIOLOGÍA') ? 1 : 0;

    let rawScores = [];
    let totalSumScores = 0;

    // 2. Iterar sobre las filas fenotípicas de la hoja
    for (let i = inicioFila; i < window.currentSheetRows.length; i++) {
        const row = window.currentSheetRows[i];
        if (!row || row.length === 0 || !row[COL_INDEX.ETIOLOGIA]) continue;

        const etiologia = String(row[COL_INDEX.ETIOLOGIA]).trim();
        const tipo = row[COL_INDEX.TIPO] || 'Desconocido';
        const medianaEdadFila = parseFloat(row[COL_INDEX.MEDIANA_EDAD]) || 0;
        const pctVaronFila = (row[COL_INDEX.PCT_VARON] !== undefined && row[COL_INDEX.PCT_VARON] !== '')
            ? parseFloat(row[COL_INDEX.PCT_VARON]) : null;

        const fEdad = window.calcularFactorEdad(etiologia, medianaEdadFila, edadPaciente);
        const fSexo = window.calcularFactorSexo(pctVaronFila, sexoPaciente);

        const { similitudCoseno, penalizacionAusenciaCritica } =
            window.calcularSimilitudFila(row, sintomasSeleccionados, todosLosCampos);

        let scoreAjustado = similitudCoseno * fEdad * fSexo * penalizacionAusenciaCritica;

        // Overrides de signos patognomónicos (Fig. 3B y texto del Seminar)
        if (sintomasSeleccionados['CRISIS_FBDS'] && etiologia === 'Anti-LGI1') {
            scoreAjustado *= 2.5;
        }
        if (sintomasSeleccionados['SIST_NERV_PERIFERICO'] && etiologia === 'Anti-CASPR2') {
            scoreAjustado *= 2.0;
        }

        rawScores.push({ etiologia, tipo, score: scoreAjustado });
        totalSumScores += scoreAjustado;
    }

    // 3. Normalización relativa (los resultados suman ~100% entre sí)
    let resultados = rawScores.map(item => {
        const afinidad = totalSumScores > 0 ? (item.score / totalSumScores) * 100 : 0;
        return {
            etiologia: item.etiologia,
            tipo: item.tipo,
            afinidad: parseFloat(afinidad.toFixed(1)),
            descripcion: DESCRIPCIONES_BREVES[item.etiologia] || ''
        };
    }).sort((a, b) => b.afinidad - a.afinidad);

    if (resultados.length === 0 || totalSumScores === 0) {
        containerBars.innerHTML = '<div style="font-size:0.72rem; color:var(--text-muted); text-align:center; padding:10px;">No se ha podido calcular afinidad con los datos disponibles.</div>';
        return;
    }

    // 4. Renderización de barras
    resultados.forEach(res => {
        let barColor = '#a78bfa';
        const tipoLower = res.tipo.toLowerCase();
        if (tipoLower.includes('inmune') || tipoLower.includes('auto')) {
            barColor = '#3b82f6';
        } else if (tipoLower.includes('infec')) {
            barColor = '#ef4444';
        }

        const barHtml = `
            <div style="display: flex; flex-direction: column; gap: 2px; margin-bottom: 2px;">
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; font-weight: 700; color: var(--text-main, #1e293b);">
                    <span>${res.etiologia} <span style="font-size:0.58rem; color:var(--text-muted, #64748b); font-weight:500;">(${res.tipo})</span></span>
                    <span style="color:${barColor}; font-weight:800;">${res.afinidad}%</span>
                </div>
                <div style="width: 100%; height: 7px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${Math.min(res.afinidad, 100)}%; height: 100%; background: ${barColor}; transition: width 0.3s ease-in-out;"></div>
                </div>
                ${res.descripcion ? `<div style="font-size: 0.62rem; color: #64748b; line-height: 1.2; font-style: italic; margin-top: 1px;">${res.descripcion}</div>` : ''}
            </div>
        `;
        containerBars.insertAdjacentHTML('beforeend', barHtml);
    });

    // 5. Indicador de discriminación diagnóstica (base relativa)
    if (resultados.length > 1) {
        const gap = resultados[0].afinidad - resultados[1].afinidad;
        if (resultados[0].afinidad > 0 && gap < 8) {
            warningBox.innerHTML = `<i class="fas fa-scale-balanced"></i> <b>Perfil poco discriminante:</b> "${resultados[0].etiologia}" y "${resultados[1].etiologia}" obtienen puntuaciones muy próximas (${resultados[0].afinidad}% vs ${resultados[1].afinidad}%). Amplía la anamnesis o espera resultados de LCR/RM/autoanticuerpos antes de orientar el diagnóstico.`;
            warningBox.style.display = 'block';
        }
    }

    // 6. Alertas críticas dirigidas según el Seminar
    let alertasHtml = '';
    const topResult = resultados[0];

    if (topResult && topResult.afinidad > 15) {
        const rmnNormal = !sintomasSeleccionados['RMN_PATOLOGICA'];

        if ((topResult.etiologia === 'Anti-NMDAR' || topResult.etiologia === 'Anti-LGI1' || topResult.etiologia === 'Anti-CASPR2') && rmnNormal) {
            alertasHtml += `
                <div style="background:#fef3c7; border-left:4px solid #d97706; padding:0.7rem 0.9rem; border-radius:8px; font-size:0.7rem; color:#92400e; line-height:1.45;">
                    <span style="font-weight:800; text-transform:uppercase; display:block; margin-bottom:2px;"><i class="fas fa-triangle-exclamation"></i> RM Normal</span>
                    Una neuroimagen estructural normal NO excluye el origen autoinmune. Más del 50% de los debuts por anticuerpos comunes (NMDAR, LGI1, CASPR2) cursan con RM cerebral completamente anodina.
                </div>
            `;
        }

        if (topResult.etiologia === 'Anti-NMDAR') {
            if (edadPaciente >= 18 && edadPaciente <= 40 && sexoPaciente === 'mujer') {
                alertasHtml += `
                    <div style="background:#fef2f2; border:1px solid #fca5a5; border-radius:12px; padding:0.7rem 0.9rem; font-size:0.7rem; color:#991b1b; line-height:1.45;">
                        <span style="font-weight:800; text-transform:uppercase; display:block; margin-bottom:2px;"><i class="fas fa-dna"></i> Cribado Oncológico</span>
                        Alta afinidad por Anti-NMDAR en mujer joven. Se aconseja descartar de forma preferente un <b>teratoma ovárico</b> (ecografía o TC abdominopélvica) — existe una asociación de hasta el 30%.
                    </div>
                `;
            } else if (edadPaciente > 50) {
                alertasHtml += `
                    <div style="background:#fff1f2; border-left:4px solid #f43f5e; padding:0.7rem 0.9rem; border-radius:8px; font-size:0.7rem; color:#9f1239; line-height:1.45;">
                        <span style="font-weight:800; text-transform:uppercase; display:block; margin-bottom:2px;"><i class="fas fa-user-clock"></i> Debut Geriátrico (Anti-NMDAR)</span>
                        En mayores de 50 años la incidencia de teratoma es baja, pero el riesgo de otras neoplasias malignas concomitantes es marcadamente mayor, con peor pronóstico global.
                    </div>
                `;
            }
        }

        if (topResult.etiologia === 'Anti-LGI1' && sintomasSeleccionados['HIPONATREMIA']) {
            alertasHtml += `
                <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:0.7rem 0.9rem; font-size:0.7rem; color:#1e40af; line-height:1.45;">
                    <span style="font-weight:800; text-transform:uppercase; display:block; margin-bottom:2px;"><i class="fas fa-vial"></i> Correlación Clínico-Analítica</span>
                    La combinación de alta afinidad por Anti-LGI1 e hiponatremia apoya la sospecha diagnóstica. Vigila la natremia y rastrea activamente crisis distónicas faciobraquiales sutiles.
                </div>
            `;
        }

        if (topResult.etiologia === 'Anti-CASPR2' && sintomasSeleccionados['SIST_NERV_PERIFERICO']) {
            alertasHtml += `
                <div style="background:#eff6ff; border-left:4px solid #2563eb; padding:0.7rem 0.9rem; border-radius:8px; font-size:0.7rem; color:#1e40af; line-height:1.45;">
                    <span style="font-weight:800; text-transform:uppercase; display:block; margin-bottom:2px;"><i class="fas fa-lungs"></i> Asociación Paraneoplásica (Timoma)</span>
                    Ante hiperexcitabilidad de nervio periférico o clínica compatible con Síndrome de Morvan, realiza un TC de tórax para excluir un timoma oculto.
                </div>
            `;
        }

        if (topResult.etiologia === 'HSV-1') {
            if (!sintomasSeleccionados['LCR_PATOLOGICO']) {
                alertasHtml += `
                    <div style="background:#fff5f5; border:1px solid #feb2b2; border-radius:12px; padding:0.7rem 0.9rem; font-size:0.7rem; color:#c53030; line-height:1.45;">
                        <span style="font-weight:800; text-transform:uppercase; display:block; margin-bottom:2px;"><i class="fas fa-clock"></i> Urgencia Terapéutica</span>
                        Ante sospecha de HSV-1, el aciclovir intravenoso empírico es prioritario y no debe demorarse a la espera de la punción lumbar o la neuroimagen.
                    </div>
                `;
            }
            if (edadPaciente > 60) {
                alertasHtml += `
                    <div style="background:#f5f3ff; border-left:4px solid #7c3aed; padding:0.7rem 0.9rem; border-radius:8px; font-size:0.7rem; color:#5b21b6; line-height:1.45;">
                        <span style="font-weight:800; text-transform:uppercase; display:block; margin-bottom:2px;"><i class="fas fa-brain"></i> HSV-1 en >60 años</span>
                        En este grupo etario y en inmunodeprimidos, el cuadro puede cursar de forma inespecífica, con alteración del nivel de conciencia sin fiebre ni cefalea. Mantén un umbral bajo para el aciclovir empírico.
                    </div>
                `;
            }
        }
    }

    if (alertasHtml) {
        alertsContainer.innerHTML = alertasHtml;
        alertsContainer.style.display = 'flex';
    }
};

/**
 * Modal informativo sobre el fenómeno post-infeccioso de autoinmunidad tras HSV-1
 */
window.openPostHsvFlags = function() {
    const rfModal = document.createElement('div');
    rfModal.id = "enceph-rf-modal";
    rfModal.style = "position:fixed; inset:0; background:rgba(15, 23, 42, 0.85); backdrop-filter: blur(4px); z-index:3000; display:flex; align-items:center; justify-content:center; padding:1.2rem;";
    rfModal.onclick = () => rfModal.remove();

    rfModal.innerHTML = `
        <div style="background: var(--card, var(--card-bg, #ffffff)); padding:1.5rem; border-radius:1.5rem; max-width:420px; width:100%; box-shadow: 0 20px 25px rgba(0,0,0,0.5); border: 1px solid var(--border); font-family: system-ui, -apple-system, sans-serif;" onclick="event.stopPropagation()">
            <h3 style="margin-top:0; color:var(--text-main); font-weight:800; font-size:1.05rem; display:flex; align-items:center; gap:6px;">
                <i class="fas fa-sync-alt" style="color:#3b82f6;"></i> Fenómeno Post-HSV-1
            </h3>
            <p style="font-size:0.78rem; line-height:1.45; color:var(--text-main); margin-bottom: 0.8rem;">
                Hasta el <b>25% de los pacientes pediátricos y adolescentes</b> desarrollan un cuadro secundario de encefalitis autoinmune (predominantemente Anti-NMDAR) entre <b>6 y 12 semanas después</b> de una encefalitis por HSV-1 resuelta con aciclovir (con menor frecuencia en adultos).
            </p>
            <div style="background: #f1f5f9; border: 1px solid var(--border); padding: 0.6rem; border-radius: 8px; font-size: 0.72rem; color: #475569; margin-bottom: 1rem; line-height: 1.35;">
                📌 El cuadro cursa con PCR de LCR negativa para ADN de HSV-1 y responde a inmunoterapia sin necesidad de reinstaurar antivirales.
            </div>
            <button onclick="document.getElementById('enceph-rf-modal').remove()" style="background:var(--primary, #3b82f6); color:white; border:none; width:100%; padding:0.75rem; border-radius:12px; font-weight:700; cursor:pointer;">ENTENDIDO</button>
        </div>
    `;
    document.body.appendChild(rfModal);
};
