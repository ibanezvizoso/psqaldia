/**
 * Herramienta: Enceph-Match Predictor (Calculadora de Afinidad Clínica Diferencial)
 * Plataforma: PSQ al día (psqaldia.com)
 * Fuente de datos: Binks SNM, Saylor D, Easton A, Thakur KT, Irani SR.
 *                   Encephalitis. Lancet 2026; 407: 1968-83 (Seminar, Fig. 1-3)
 * INTEGRACIÓN ENCAPSULADA: Conexión automatizada mediante Cloudflare Worker
 *
 * ─────────────────────────────────────────────────────────────────────────
 * CHANGELOG v2.0
 * - Sexo biológico incorporado como factor multiplicativo (antes solo se
 *   usaba en la alerta de teratoma NMDAR, no en el ranking).
 * - Edad de HSV-1 modelada como distribución BIMODAL (<30a / >60a), en vez
 *   de una única campana de Gauss centrada en la mediana global, que
 *   penalizaba injustamente a pacientes ancianos (fig. 2C, texto: "bimodal
 *   age distribution").
 * - Aviso permanente recordando descartar ENCEFALOPATÍA (Fig. 1) antes de
 *   interpretar el ranking de etiologías.
 * - Indicador de "discriminación diagnóstica": si el 1º y 2º diagnóstico
 *   quedan muy próximos, se avisa de que el perfil clínico no es
 *   suficientemente específico.
 * - Reformulación de "probabilidad pre-test" → "afinidad clínica relativa",
 *   con descargo explícito de que no es una probabilidad bayesiana
 *   calibrada ni sustituye a la confirmación con LCR/RM/autoanticuerpos.
 * - Tooltips con un descriptor breve por entidad.
 * - Selector de sexo biológico de 3 estados (Varón / Mujer / No especificado)
 *   en lugar de checkbox único, para no forzar un sexo por defecto.
 * - GAD65 NO se ha añadido: el Seminar no ofrece una fila cuantitativa
 *   comparable a las de LGI1/CASPR2/NMDAR/MOG (Fig. 3B). Si se añade a la
 *   hoja `encefalitisDD` en el futuro, el motor la procesará sin cambios
 *   de código (usa la campana de edad estándar, mujeres 18-40a, curso de
 *   meses, LCR/RM habitualmente normales — ver texto, ref. 60-61).
 * ─────────────────────────────────────────────────────────────────────────
 */

// Estructura de metadatos para la renderización automática de la interfaz
const CAMPOS_ENCEPHALITIS = {
    clinicos: [
        { id: 'FIEBRE', label: 'Fiebre' },
        { id: 'CEFALEA', label: 'Cefalea' },
        { id: 'SINT_MENINGEOS', label: 'Síntomas meníngeos (rigidez de nuca...)' },
        { id: 'RESPIRATORIO', label: 'Pródromo respiratorio / viral' },
        { id: 'ALT_MENTAL_PSQ', label: 'Alt. estado mental / Manifestaciones psicóticas' },
        { id: 'CRISIS_COMICIALES', label: 'Crisis comiciales (focales o generalizadas)' },
        { id: 'FOCALIDAD', label: 'Focalidad neurológica / Paresias' },
        { id: 'VOMITOS', label: 'Vómitos' },
        { id: 'RASH', label: 'Exantema / Rash cutáneo vesicular' },
        { id: 'CRISIS_FBDS', label: 'Crisis distónicas faciobraquiales (FBDS)' },
        { id: 'COGNITIVO_AMNESIA', label: 'Déficit cognitivo marcado / Amnesia anterógrada' },
        { id: 'SIST_NERV_PERIFERICO', label: 'Síntomas SNP (Neuromiotonía / Dolor neuropático)' },
        { id: 'DISAUTONOMIA', label: 'Disfunción autonómica cardiovascular/sudoración' },
        { id: 'TRAST_MOVIMIENTO', label: 'Trastornos del movimiento complejos / Catatonia' },
        { id: 'ALT_SUENO', label: 'Insomnio agudo grave / Agitación nocturna' },
        { id: 'HIPONATREMIA', label: 'Hiponatremia sistémica' }
    ],
    paraclinicos: [
        { id: 'RMN_PATOLOGICA', label: 'RM Cerebral Patológica (Lóbulo temporal mesial u otros)' },
        { id: 'LCR_PATOLOGICO', label: 'LCR: Pleocitosis leucocitaria (>5 cél/µL)' },
        { id: 'EEG_PATOLOGICO', label: 'EEG Patológico (Enlentecimiento focal/difuso)' }
    ]
};

// Mapeo de índices de columnas de la hoja "encefalitisDD"
const COL_INDEX = {
    ETIOLOGIA: 0, TIPO: 1, MEDIANA_EDAD: 2, PCT_VARON: 3, FIEBRE: 4, CEFALEA: 5,
    SINT_MENINGEOS: 6, RESPIRATORIO: 7, ALT_MENTAL_PSQ: 8, CRISIS_COMICIALES: 9,
    FOCALIDAD: 10, VOMITOS: 11, RASH: 12, CRISIS_FBDS: 13, COGNITIVO_AMNESIA: 14,
    SIST_NERV_PERIFERICO: 15, DISAUTONOMIA: 16, TRAST_MOVIMIENTO: 17, ALT_SUENO: 18,
    HIPONATREMIA: 19, RMN_PATOLOGICA: 20, LCR_PATOLOGICO: 21, EEG_PATOLOGICO: 22
};

// Perfiles de edad no-unimodales (Fig. 2C, texto: "HSV-1 ... bimodal age
// distribution mostly affecting people younger than 30 years, or older
// than 60 years"). Se toma el máximo de las dos campanas.
const PERFILES_EDAD_BIMODAL = {
    'HSV-1': [
        { mediana: 24, sigma: 10 },
        { mediana: 66, sigma: 12 }
    ]
};

// Descriptores breves (propios, no citas textuales) para tooltip por entidad
const DESCRIPCIONES_BREVES = {
    'JEV': 'Neurotropismo por tálamo/ganglios basales; trastornos del movimiento; principal causa epidémica en Asia.',
    'HSV-1': 'Distribución de edad bimodal (<30a o >60a). El aciclovir precoz reduce la mortalidad de ~70% a ~20%.',
    'WNV': 'Puede afectar el asta anterior medular con parálisis flácida asimétrica. Sin antiviral específico.',
    'Enterovirus': 'Predomina en la infancia; cepas como EV-A71 se asocian a afectación troncoencefálica grave.',
    'VZV': 'Frecuente vasculopatía (ictus isquémico/hemorrágico); puede acompañarse de rash vesicular.',
    'Anti-LGI1': 'Varón >60a; crisis focales frecuentes con FBDS patognomónicas; hiponatremia frecuente.',
    'Anti-CASPR2': 'Varón >60a; más disautonomia y afectación de nervio periférico; descartar timoma (Sd. Morvan).',
    'Anti-NMDAR': 'Predomina en mujeres jóvenes; clínica psiquiátrica florida seguida de trastorno del movimiento; cribar teratoma ovárico si 18-40a.',
    'Anti-MOG': 'Más frecuente en la infancia; RM característica con afectación cortical/subcortical; puede asociar neuritis óptica o mielitis.'
};

// Memoria global asignada a la ventana para las filas de "encefalitisDD"
window.currentSheetRows = [];

/**
 * FUNCIÓN INICIALIZADORA: Llama al Cloudflare Worker de forma relativa garantizando compatibilidad
 */
window.iniciarEncephMatch = async function() {
    try {
        const modal = document.getElementById('modal');
        if (modal) modal.style.display = 'flex';

        const container = document.getElementById('modalData');
        if (!container) return;

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:200px; font-family:system-ui, sans-serif; font-size:0.85rem; color:var(--text-muted);">
                <div style="width:180px; height:10px; border-radius:5px; background:linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 37%, #e2e8f0 63%); background-size:400% 100%; animation: enceph-shimmer 1.2s ease-in-out infinite; margin-bottom:14px;"></div>
                <span>Conectando con la base de datos encefalitisDD...</span>
            </div>
            <style>@keyframes enceph-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }</style>
        `;

        // Petición al endpoint relativo administrado por tu Worker
        const response = await fetch('/?sheet=encefalitisDD');
        const data = await response.json();

        // Validación estricta del payload de Google Sheets obtenido
        if (data && data.values) {
            window.openEncephalitisUI(data.values);
        } else {
            throw new Error("Estructura de datos 'values' no encontrada.");
        }

    } catch (error) {
        console.error("Error al conectar con la hoja encefalitisDD:", error);
        document.getElementById('modalData').innerHTML = `
            <div style="padding:2rem; text-align:center; font-family:system-ui, sans-serif; font-size:0.85rem; color:#dc2626;">
                <i class="fas fa-exclamation-circle" style="margin-bottom:8px; font-size:1.8rem;"></i><br>
                <b>Error de sincronización</b><br>No se pudieron precargar los datos de la hoja <i>encefalitisDD</i>.
            </div>
        `;
    }
};

/**
 * Construye la interfaz gráfica dentro del modal de la plataforma
 */
window.openEncephalitisUI = function(sheetRows) {
    window.currentSheetRows = sheetRows;
    const modalData = document.getElementById('modalData');

    modalData.innerHTML = `
        <div class="calc-ui" style="padding: 1.2rem; display: flex; flex-direction: column; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-height: 90vh; overflow-y: auto; box-sizing: border-box;">

            <div style="position: sticky; top: 0; background: var(--card, var(--card-bg, #ffffff)); z-index: 10; padding-bottom: 0.8rem; border-bottom: 1px solid var(--border); text-align:center;">
                <h2 style="font-weight:800; font-size: 1.1rem; margin:0 0 0.2rem 0; color: var(--text-main); display:flex; align-items:center; justify-content:center; gap:6px;">
                    <i class="fas fa-brain" style="color:#7c3aed;"></i> Enceph-Match Predictor
                </h2>
                <p style="font-size:0.7rem; color:var(--text-muted); margin:0 0 0.6rem 0;">Afinidad clínica diferencial (Pestaña: encefalitisDD)</p>

                <div style="display: flex; justify-content: center; gap:8px; flex-wrap:wrap;">
                    <button onclick="window.openPostHsvFlags()" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 5px 14px; border-radius: 50px; font-size: 0.65rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        <i class="fas fa-history"></i> NOTA SOBRE AUTOINMUNIDAD POST-HSV
                    </button>
                </div>
            </div>

            <div style="margin-top:0.8rem; background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:0.6rem 0.8rem; font-size:0.68rem; color:#92400e; line-height:1.4;">
                <i class="fas fa-circle-info"></i> Este índice muestra la <b>similitud relativa</b> del perfil introducido con los patrones descritos en Binks et al. (<i>The Lancet</i>, 2026). No es una probabilidad diagnóstica validada ni sustituye la confirmación con LCR, RM y autoanticuerpos.
            </div>

            <div style="margin-top:0.5rem; background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:0.6rem 0.8rem; font-size:0.68rem; color:#1e40af; line-height:1.4;">
                <i class="fas fa-stethoscope"></i> Antes de interpretar el ranking, descarta <b>encefalopatía</b>: cuadro sin focalidad, con RM y LCR habitualmente normales y EEG con enlentecimiento difuso.
            </div>

            <div id="results-panel" style="margin-top: 0.8rem; padding: 0.8rem; background: #f8fafc; border-radius: 12px; border: 1px solid var(--border);">
                <div style="font-size:0.65rem; font-weight:800; color:#64748b; text-transform:uppercase; margin-bottom:0.6rem; text-align:center; letter-spacing: 0.5px;">Índice de Afinidad Clínica Relativa</div>
                <div id="results-bars-container" style="display: flex; flex-direction: column; gap: 6px;">
                    <div style="text-align:center; font-size:0.75rem; color:var(--text-muted); padding:0.5rem;">Introduce la edad del paciente para activar el motor clínico.</div>
                </div>
                <div id="discriminacion-warning" style="display:none; margin-top:0.6rem; font-size:0.68rem; color:#334155; background:#f1f5f9; border-left:3px solid #94a3b8; padding:0.5rem 0.6rem; border-radius:6px; line-height:1.35;"></div>
            </div>

            <div id="alerts-container" style="margin-top: 0.8rem; display:none; flex-direction: column; gap: 6px;"></div>

            <div style="margin-top: 1rem; display: flex; gap: 12px; background: #f0fdf4; padding: 0.8rem; border-radius: 12px; border: 1px solid #bbf7d0; align-items: flex-end; flex-wrap:wrap;">
                <div style="flex: 1; min-width:100px;">
                    <span style="font-size: 0.65rem; font-weight: 800; color: #166534; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.3px;">Edad</span>
                    <input type="number" id="p-edad" oninput="window.updateEncephalitis()" placeholder="Años" style="width: 100%; padding: 6px 8px; border-radius: 6px; border: 1px solid #22c55e; font-size: 0.85rem; box-sizing: border-box; outline: none;">
                </div>
                <div style="flex: 1.4; min-width:180px;">
                    <span style="font-size: 0.65rem; font-weight: 800; color: #166534; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.3px;">Sexo biológico</span>
                    <div id="sexo-toggle" style="display:flex; gap:4px;">
                        <button type="button" data-sexo="varon" onclick="window.setSexoPaciente('varon')" class="enceph-sexo-btn" style="flex:1; padding:6px 4px; border-radius:6px; border:1px solid #22c55e; background:#fff; font-size:0.7rem; font-weight:700; color:#166534; cursor:pointer;">Varón</button>
                        <button type="button" data-sexo="mujer" onclick="window.setSexoPaciente('mujer')" class="enceph-sexo-btn" style="flex:1; padding:6px 4px; border-radius:6px; border:1px solid #22c55e; background:#fff; font-size:0.7rem; font-weight:700; color:#166534; cursor:pointer;">Mujer</button>
                        <button type="button" data-sexo="no_especificado" onclick="window.setSexoPaciente('no_especificado')" class="enceph-sexo-btn" style="flex:1; padding:6px 4px; border-radius:6px; border:1px solid #22c55e; background:#166534; font-size:0.7rem; font-weight:700; color:#fff; cursor:pointer;">No consta</button>
                    </div>
                </div>
            </div>

            <p style="font-size:0.65rem; font-weight:800; color:var(--text-muted); margin: 1.2rem 0 0.4rem; text-transform: uppercase; letter-spacing: 0.5px;">Manifestaciones Clínicas Presentes</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                ${CAMPOS_ENCEPHALITIS.clinicos.map(s => window.renderEncephCheck(s, 'enceph-sintoma')).join('')}
            </div>

            <p style="font-size:0.65rem; font-weight:800; color:var(--text-muted); margin: 1.2rem 0 0.4rem; text-transform: uppercase; letter-spacing: 0.5px;">Resultados de Exploración Inicial</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                ${CAMPOS_ENCEPHALITIS.paraclinicos.map(s => window.renderEncephCheck(s, 'enceph-paraclinico')).join('')}
            </div>

            <p style="font-size:0.6rem; color:var(--text-muted); text-align:center; margin-top:1.4rem; line-height:1.4;">
                Fuente: Binks SNM, Saylor D, Easton A, Thakur KT, Irani SR. Encephalitis. <i>Lancet</i> 2026; 407: 1968–83.
            </p>
        </div>
    `;

    // Estado de sexo por defecto: no especificado
    window.encephSexoPaciente = 'no_especificado';
};

window.setSexoPaciente = function(valor) {
    window.encephSexoPaciente = valor;
    document.querySelectorAll('.enceph-sexo-btn').forEach(btn => {
        const activo = btn.getAttribute('data-sexo') === valor;
        btn.style.background = activo ? '#166534' : '#fff';
        btn.style.color = activo ? '#fff' : '#166534';
    });
    window.updateEncephalitis();
};

window.renderEncephCheck = function(s, className) {
    return `
        <label style="display: flex; align-items: center; gap: 6px; background: var(--bg, #fdfdfd); padding: 0.5rem; border-radius: 8px; cursor: pointer; border: 1px solid var(--border, #e2e8f0); font-size: 0.7rem; color: var(--text-main); height: 100%; box-sizing: border-box; min-height: 40px; user-select:none;">
            <input type="checkbox" class="${className}" value="${s.id}" onchange="window.updateEncephalitis()" style="width:14px; height:14px; min-width:14px; accent-color: var(--primary);">
            <span style="line-height:1.2; font-weight: 500;">${s.label}</span>
        </label>
    `;
};

/**
 * Calcula el factor de ajuste por edad, usando distribución bimodal cuando aplica (ej. HSV-1)
 */
window.calcularFactorEdad = function(etiologia, medianaEdadFila, edadPaciente) {
    if (PERFILES_EDAD_BIMODAL[etiologia]) {
        const picos = PERFILES_EDAD_BIMODAL[etiologia];
        return Math.max(...picos.map(p =>
            Math.exp(-Math.pow(edadPaciente - p.mediana, 2) / (2 * Math.pow(p.sigma, 2)))
        ));
    }
    const sigma = (medianaEdadFila <= 5) ? 6 : 15; // Cohorte marcadamente pediátrica vs adulta
    return Math.exp(-Math.pow(edadPaciente - medianaEdadFila, 2) / (2 * Math.pow(sigma, 2)));
};

/**
 * Calcula el factor de ajuste por sexo biológico. Amortiguado (0.4-1.0) para que
 * nunca anule por completo una entidad solo por el sexo del paciente.
 */
window.calcularFactorSexo = function(pctVaronFila, sexoPaciente) {
    if (sexoPaciente === 'no_especificado' || pctVaronFila === null || isNaN(pctVaronFila)) return 1;
    const afinidad = (sexoPaciente === 'varon') ? (pctVaronFila / 100) : (1 - pctVaronFila / 100);
    return 0.4 + 0.6 * afinidad;
};

/**
 * Motor Algorítmico Central: Coseno + Gauss(edad, bimodal si aplica) + Sexo + Filtros críticos + Overrides
 */
window.updateEncephalitis = function() {
    const edadInput = document.getElementById('p-edad').value;
    const sexoPaciente = window.encephSexoPaciente || 'no_especificado';

    if (!edadInput || isNaN(edadInput) || parseFloat(edadInput) < 0) {
        document.getElementById('results-bars-container').innerHTML = `<div style="text-align:center; font-size:0.75rem; color:var(--text-muted); padding:0.5rem;">Introduce la edad del paciente para activar el motor clínico.</div>`;
        document.getElementById('alerts-container').style.display = 'none';
        document.getElementById('discriminacion-warning').style.display = 'none';
        return;
    }

    const pacienteEdad = parseFloat(edadInput);
    const sintomasChecked = Array.from(document.querySelectorAll('.enceph-sintoma:checked')).map(c => c.value);
    const paraclinicosChecked = Array.from(document.querySelectorAll('.enceph-paraclinico:checked')).map(c => c.value);
    const totalInputsActivos = [...sintomasChecked, ...paraclinicosChecked];

    let rawScores = [];
    let totalSumScores = 0;

    for (let i = 0; i < window.currentSheetRows.length; i++) {
        const row = window.currentSheetRows[i];
        if (!row || row.length === 0 || !row[COL_INDEX.ETIOLOGIA]) continue;

        // Protección anti-cabeceras dinámica
        if (row[COL_INDEX.ETIOLOGIA].toLowerCase().includes('etiolog') || row[COL_INDEX.ETIOLOGIA].toLowerCase().includes('fármaco')) continue;

        const etiologia = row[COL_INDEX.ETIOLOGIA];
        const tipo = row[COL_INDEX.TIPO] || 'Desconocido';

        // 1. FACTOR EDAD (Gauss estándar o bimodal, ej. HSV-1)
        const medianaEdad = parseFloat(row[COL_INDEX.MEDIANA_EDAD]) || 0;
        const factorEdad = window.calcularFactorEdad(etiologia, medianaEdad, pacienteEdad);

        // 2. FACTOR SEXO (amortiguado, nunca anula por completo)
        const pctVaronFila = (row[COL_INDEX.PCT_VARON] !== undefined && row[COL_INDEX.PCT_VARON] !== '') ? parseFloat(row[COL_INDEX.PCT_VARON]) : null;
        const factorSexo = window.calcularFactorSexo(pctVaronFila, sexoPaciente);

        // 3. MATRIZ DE COSENO VECTORIAL (solo clínica/paraclínica, no demografía)
        let vectorPaciente = [];
        let vectorEnfermedad = [];
        let penalizacionAusenciaCritica = 1.0;

        for (const [key, colIdx] of Object.entries(COL_INDEX)) {
            if (colIdx >= 4) {
                const pacienteTieneSintoma = totalInputsActivos.includes(key) ? 1 : 0;
                const celdaRaw = row[colIdx];
                const porcentajeMatriz = (celdaRaw && !isNaN(parseFloat(celdaRaw))) ? parseFloat(celdaRaw) / 100 : 0;

                vectorPaciente.push(pacienteTieneSintoma);
                vectorEnfermedad.push(porcentajeMatriz);

                if (porcentajeMatriz > 0.80 && pacienteTieneSintoma === 0) {
                    penalizacionAusenciaCritica *= 0.2;
                }
            }
        }

        let dotProduct = 0, magPaciente = 0, magEnfermedad = 0;
        for (let j = 0; j < vectorPaciente.length; j++) {
            dotProduct += vectorPaciente[j] * vectorEnfermedad[j];
            magPaciente += vectorPaciente[j] * vectorPaciente[j];
            magEnfermedad += vectorEnfermedad[j] * vectorEnfermedad[j];
        }

        let similitudCoseno = 0;
        if (magPaciente > 0 && magEnfermedad > 0) {
            similitudCoseno = dotProduct / (Math.sqrt(magPaciente) * Math.sqrt(magEnfermedad));
        }

        let scoreAjustado = similitudCoseno * factorEdad * factorSexo * penalizacionAusenciaCritica;

        // 4. OVERRIDES DE SIGNOS PATOGNOMÓNICOS
        if (totalInputsActivos.includes('CRISIS_FBDS') && etiologia === 'Anti-LGI1') {
            scoreAjustado *= 2.5;
        }
        if (totalInputsActivos.includes('SIST_NERV_PERIFERICO') && etiologia === 'Anti-CASPR2') {
            scoreAjustado *= 2.0;
        }

        rawScores.push({ etiologia, tipo, score: scoreAjustado });
        totalSumScores += scoreAjustado;
    }

    // 5. NORMALIZACIÓN RELATIVA
    let listadoFinal = rawScores.map(item => {
        const porcentajeFinal = totalSumScores > 0 ? (item.score / totalSumScores) * 100 : 0;
        return { etiologia: item.etiologia, tipo: item.tipo, probabilidad: parseFloat(porcentajeFinal.toFixed(1)) };
    }).sort((a, b) => b.probabilidad - a.probabilidad);

    const barsContainer = document.getElementById('results-bars-container');
    const discrimWarning = document.getElementById('discriminacion-warning');

    if (listadoFinal.length === 0 || totalSumScores === 0) {
        barsContainer.innerHTML = `<div style="text-align:center; font-size:0.75rem; color:var(--text-muted); padding:0.5rem;">Introduce manifestaciones clínicas para calcular afinidades diferenciales.</div>`;
        document.getElementById('alerts-container').style.display = 'none';
        discrimWarning.style.display = 'none';
        return;
    }

    barsContainer.innerHTML = listadoFinal.map(res => {
        const esInfeccioso = res.tipo === 'Infeccioso';
        const colorBarra = esInfeccioso ? '#ef4444' : '#3b82f6';
        const colorFondoBarra = esInfeccioso ? '#fee2e2' : '#dbeafe';
        const icono = esInfeccioso ? 'fa-virus' : 'fa-dna';
        const chip = esInfeccioso
            ? '<span style="font-size:0.55rem; font-weight:800; background:#fee2e2; color:#b91c1c; padding:1px 6px; border-radius:20px;">INF</span>'
            : '<span style="font-size:0.55rem; font-weight:800; background:#dbeafe; color:#1d4ed8; padding:1px 6px; border-radius:20px;">AI</span>';
        const descripcion = (DESCRIPCIONES_BREVES[res.etiologia] || '').replace(/"/g, '&quot;');

        return `
            <div style="display: flex; flex-direction: column; font-size: 0.75rem; margin-bottom: 2px;" title="${descripcion}">
                <div style="display: flex; justify-content: space-between; align-items:center; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">
                    <span style="display:flex; align-items:center; gap:5px;"><i class="fas ${icono}" style="color:${colorBarra}; font-size:0.7rem;"></i>${res.etiologia} ${chip}</span>
                    <span>${res.probabilidad}%</span>
                </div>
                <div style="width: 100%; background: ${colorFondoBarra}; height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${res.probabilidad}%; background: linear-gradient(90deg, ${colorBarra}, ${colorBarra}cc); height: 100%; transition: width 0.4s ease-out; border-radius: 4px;"></div>
                </div>
            </div>
        `;
    }).join('');

    // 6. INDICADOR DE DISCRIMINACIÓN DIAGNÓSTICA
    if (listadoFinal.length >= 2) {
        const gap = listadoFinal[0].probabilidad - listadoFinal[1].probabilidad;
        if (listadoFinal[0].probabilidad > 0 && gap < 8) {
            discrimWarning.style.display = 'block';
            discrimWarning.innerHTML = `<i class="fas fa-scale-balanced"></i> <b>Perfil poco discriminante:</b> "${listadoFinal[0].etiologia}" y "${listadoFinal[1].etiologia}" obtienen puntuaciones muy próximas (${listadoFinal[0].probabilidad}% vs ${listadoFinal[1].probabilidad}%). Amplía la anamnesis o espera resultados de LCR/RM/autoanticuerpos antes de orientar el diagnóstico.`;
        } else {
            discrimWarning.style.display = 'none';
        }
    }

    // 7. GESTOR DE ALERTAS DE ALTO RIGOR
    const alertsContainer = document.getElementById('alerts-container');
    let alertasHTML = [];
    const maxEtiologia = listadoFinal[0];

    if (maxEtiologia && maxEtiologia.probabilidad > 15) {
        const rmnNormal = !totalInputsActivos.includes('RMN_PATOLOGICA');

        if ((maxEtiologia.etiologia === 'Anti-NMDAR' || maxEtiologia.etiologia === 'Anti-LGI1' || maxEtiologia.etiologia === 'Anti-CASPR2') && rmnNormal) {
            alertasHTML.push(`
                <div style="background: #fef3c7; border-left: 4px solid #d97706; padding: 0.6rem; border-radius: 6px; font-size: 0.7rem; color: #92400e; line-height:1.3;">
                    ⚠️ <b>RMN Normal:</b> Una neuroimagen estructural normal NO excluye el origen autoinmune. Más del 50% de los debuts clínicos por anticuerpos comunes (NMDAR, LGI1, CASPR2) cursan con resonancias magnéticas cerebrales completamente anodinas.
                </div>
            `);
        }

        if (maxEtiologia.etiologia === 'Anti-NMDAR') {
            const pacienteEsVaron = sexoPaciente === 'varon';
            if (pacienteEdad >= 18 && pacienteEdad <= 40 && !pacienteEsVaron) {
                alertasHTML.push(`
                    <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 0.6rem; border-radius: 6px; font-size: 0.7rem; color: #991b1b; line-height:1.3;">
                        🧬 <b>Cribado Oncológico Mandatorio:</b> Se aconseja descartar de forma preferente la presencia de un teratoma ovárico mediante ecografía o TC abdominopélvica. Existe una asociación patogénica del 30% debido a que las estructuras germinales del propio tumor sintetizan los anticuerpos.
                    </div>
                `);
            } else if (pacienteEdad > 50) {
                alertasHTML.push(`
                    <div style="background: #fff1f2; border-left: 4px solid #f43f5e; padding: 0.6rem; border-radius: 6px; font-size: 0.7rem; color: #9f1239; line-height:1.3;">
                        🚨 <b>Debut Geriátrico (Anti-NMDAR):</b> En pacientes mayores de 50 años la incidencia de teratomas ováricos es baja, pero cursa con un riesgo marcadamente elevado de otras neoplasias malignas sistémicas concomitantes y un peor pronóstico evolutivo global.
                    </div>
                `);
            }
        }

        if (maxEtiologia.etiologia === 'Anti-CASPR2' && totalInputsActivos.includes('SIST_NERV_PERIFERICO')) {
            alertasHTML.push(`
                <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 0.6rem; border-radius: 6px; font-size: 0.7rem; color: #1e40af; line-height:1.3;">
                    🫁 <b>Asociación Paraneoplásica (Timoma):</b> Ante la presencia documentada de manifestaciones de hiperexcitabilidad axonal periférica o clínica compatible con Síndrome de Morvan, resulta indispensable realizar un TC de tórax para excluir un timoma oculto.
                </div>
            `);
        }

        if (maxEtiologia.etiologia === 'HSV-1' && pacienteEdad > 60) {
            alertasHTML.push(`
                <div style="background: #f5f3ff; border-left: 4px solid #7c3aed; padding: 0.6rem; border-radius: 6px; font-size: 0.7rem; color: #5b21b6; line-height:1.3;">
                    🧠 <b>HSV-1 en paciente >60a:</b> En este grupo etario y en inmunodeprimidos, el cuadro puede cursar de forma inespecífica, con alteración del nivel de consciencia sin fiebre ni cefalea. Mantén un umbral bajo para iniciar aciclovir empírico.
                </div>
            `);
        }
    }

    if (alertasHTML.length > 0) {
        alertsContainer.style.display = 'flex';
        alertsContainer.innerHTML = alertasHTML.join('');
    } else {
        alertsContainer.style.display = 'none';
    }
};

/**
 * Despliega información sobre el fenómeno post-infeccioso de mimetismo inmunológico
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
                Hasta el <b>25% de los pacientes pediátricos y adolescentes</b> desarrollan un cuadro secundario de encefalitis autoinmune (principalmente mediada por anticuerpos anti-NMDAR) entre <b>6 y 12 semanas después</b> de una encefalitis viral por HSV-1 resuelta con aciclovir.
            </p>
            <div style="background: #f1f5f9; border: 1px solid var(--border); padding: 0.6rem; border-radius: 8px; font-size: 0.72rem; color: #475569; margin-bottom: 1rem; line-height: 1.35;">
                📌 El cuadro cursa con PCR en LCR negativa para el ADN viral del HSV-1 y responde estrictamente a ciclos de inmunoterapia sin necesidad de reinstaurar antivirales.
            </div>
            <button onclick="document.getElementById('enceph-rf-modal').remove()" style="background:var(--primary, #3b82f6); color:white; border:none; width:100%; padding:0.75rem; border-radius:12px; font-weight:700; cursor:pointer;">ENTENDIDO</button>
        </div>
    `;
    document.body.appendChild(rfModal);
};
