/**
 * Herramienta: Enceph-Match v3.0 (Calculadora de Afinidad Clínica de Encefalitis)
 * Plataforma: PSQ al día (psqaldia.com)
 * Fuente de datos: Binks SNM, Saylor D, Easton A, Thakur KT, Irani SR.
 * Encephalitis. Lancet 2026; 407: 1968-83 (Seminar, Fig. 1-3)
 * INTEGRACIÓN ENCAPSULADA: Conexión automatizada mediante Cloudflare Worker (Hoja: encefalitisDD)
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
        { id: 'NIVEL_CON', label: 'Alteración del nivel de conciencia (Estupor / Somnolencia)' },
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

// Mapeo riguroso de índices de columnas de la hoja "encefalitisDD"
const COL_INDEX = {
    ETIOLOGIA: 0, TIPO: 1, MEDIANA_EDAD: 2, PCT_VARON: 3, BLANCO: 4, 
    FIEBRE: 5, CEFALEA: 6, SINT_MENINGEOS: 7, RESPIRATORIO: 8, ALT_MENTAL_PSQ: 9,
    CRISIS_COMICIALES: 10, FOCALIDAD: 11, VOMITOS: 12, RASH: 13, CRISIS_FBDS: 14,
    COGNITIVO_AMNESIA: 15, SIST_NERV_PERIFERICO: 16, DISAUTONOMIA: 17, NIVEL_CON: 18,
    TRAST_MOVIMIENTO: 19, ALT_SUENO: 20, HIPONATREMIA: 21, RMN_PATOLOGICA: 22,
    LCR_PATOLOGICO: 23, EEG_PATOLOGICO: 24 
};

// Distribución de edad no-unimodales mapeadas de la evidencia de series del Seminar
const PERFILES_EDAD_BIMODAL = {
    'HSV-1': [
        { mediana: 24, sigma: 10 },
        { mediana: 66, sigma: 12 }
    ]
};

// Descriptores clínicos breves para tooltips nativos en el listado de afinidad
const DESCRIPCIONES_BREVES = {
    'JEV': 'Neurotropismo por tálamo/ganglios basales; trastornos del movimiento; principal causa epidémica en Asia.',
    'HSV-1': 'Distribución de edad bimodal (<30a o >60a). El aciclovir precoz reduce la mortalidad de ~70% a ~20%.',
    'WNV': 'Puede afectar el asta anterior medular con parálisis flácida asimétrica. Sin antiviral específico.',
    'Enterovirus': 'Predomina en la infancia; cepas como EV-A71 se asocian a afectación troncoencefálica grave.',
    'VZV': 'Frecuente vasculopatía (ictus isquémico/hemorrágico); puede acompañarse de rash vesicular.',
    'Anti-LGI1': 'Varón >60a; crisis focales frecuentes con FBDS patognomónicas; hiponatremia frecuente.',
    'Anti-CASPR2': 'Varón >60a; más disautonomía y afectación de nervio periférico; descartar timoma (Sd. Morvan).',
    'Anti-NMDAR': 'Predomina en mujeres jóvenes; clínica psiquiátrica florida seguida de trastorno del movimiento; cribar teratoma ovárico si 18-40a.',
    'Anti-MOG': 'Más frecuente en la infancia; RM característica con afectación cortical/subcortical; puede asociar neuritis óptica o mielitis.'
};

window.currentSheetRows = [];

/**
 * FUNCIÓN INICIALIZADORA: Establece el canal con el Cloudflare Worker de forma relativa
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

        const response = await fetch('/?sheet=encefalitisDD');
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
                <b>Error de comunicación</b><br>No se pudieron precargar los datos fenotípicos necesarios para la ejecución.
            </div>
        `;
    }
};

/**
 * Renderiza la interfaz limpia y simplificada dentro del modal común
 */
window.openEncephalitisUI = function(sheetRows) {
    const modalData = document.getElementById('modalData');

    modalData.innerHTML = `
        <div class="calc-ui" style="padding: 1.2rem; display: flex; flex-direction: column; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-height: 90vh; overflow-y: auto; box-sizing: border-box; background: var(--bg-main, #ffffff); gap: 12px;">

            <div style="text-align:center; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border, #e2e8f0);">
                <h2 style="font-weight:800; font-size: 1.15rem; margin:0 0 0.15rem 0; color: var(--text-main, #1e293b); display:flex; align-items:center; justify-content:center; gap:6px;">
                    <i class="fas fa-brain" style="color:#7c3aed;"></i> Enceph-Match 
                </h2>
                <p style="font-size:0.7rem; color:var(--text-muted, #64748b); font-weight: 500; margin:0;">Calculadora de Afinidad Clínica de Encefalitis</p>
            </div>

            <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:12px; padding:0.7rem 0.9rem; font-size:0.7rem; color:#92400e; line-height:1.45;">
                <span style="font-weight:800; text-transform:uppercase; display:block; margin-bottom: 2px; font-size:0.62rem; letter-spacing:0.5px;"><i class="fas fa-stethoscope"></i> Paso 0: Excluir Encefalopatías Puras</span>
                Antes de evaluar el ranking, confirma que el paciente no se encuentra en un cuadro de <b>Encefalopatía</b> (séptica, metabólica, tóxica): típicamente cursan <i>sin</i> focalidad neurológica, con RM y LCR normales, y un EEG con enlentecimiento difuso inespecífico.
            </div>

            <div style="display: flex; gap: 12px; background: #f0fdf4; padding: 0.85rem; border-radius: 12px; border: 1px solid #bbf7d0; align-items: flex-end; flex-wrap:wrap;">
                <div style="flex: 1; min-width:80px;">
                    <span style="font-size: 0.65rem; font-weight: 800; color: #166534; display: block; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Edad</span>
                    <input type="number" id="p-edad" placeholder="Años" style="width: 100%; padding: 6px 8px; border-radius: 6px; border: 1px solid #22c55e; font-size: 0.85rem; box-sizing: border-box; outline: none; background: #ffffff; font-weight: 600; color: #14532d;">
                </div>
                <div style="flex: 1.4; min-width:140px;">
                    <span style="font-size: 0.65rem; font-weight: 800; color: #166534; display: block; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Sexo biológico</span>
                    <div id="sexo-toggle" style="display:flex; gap:4px; background:#ffffff; padding:2px; border-radius:8px; border:1px solid #22c55e;">
                        <button type="button" id="btn-sexo-varon" onclick="window.setSexoPaciente('varon')" style="flex:1; padding:5px; border-radius:6px; border:none; background:#166534; font-size:0.7rem; font-weight:700; color:#fff; cursor:pointer; outline:none; transition:0.1s;">Hombre</button>
                        <button type="button" id="btn-sexo-mujer" onclick="window.setSexoPaciente('mujer')" style="flex:1; padding:5px; border-radius:6px; border:none; background:transparent; font-size:0.7rem; font-weight:700; color:#166534; cursor:pointer; outline:none; transition:0.1s;">Mujer</button>
                    </div>
                </div>
                <div style="flex: 1.2; min-width:130px;">
                    <span style="font-size: 0.65rem; font-weight: 800; color: #166534; display: block; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Etnia</span>
                    <div id="raza-toggle" style="display:flex; gap:4px; background:#ffffff; padding:2px; border-radius:8px; border:1px solid #22c55e;">
                        <button type="button" id="btn-raza-blanca" onclick="window.setRazaPaciente('blanca')" style="flex:1; padding:5px; border-radius:6px; border:none; background:#166534; font-size:0.7rem; font-weight:700; color:#fff; cursor:pointer; outline:none; transition:0.1s;">Blanca</button>
                        <button type="button" id="btn-raza-otro" onclick="window.setRazaPaciente('otro')" style="flex:1; padding:5px; border-radius:6px; border:none; background:transparent; font-size:0.7rem; font-weight:700; color:#166534; cursor:pointer; outline:none; transition:0.1s;">Otro</button>
                    </div>
                </div>
            </div>

            <div>
                <p style="font-size:0.65rem; font-weight:800; color:var(--text-muted, #64748b); margin: 0 0 0.4rem 0; text-transform: uppercase; letter-spacing: 0.6px;">Manifestaciones Clínicas Presentes</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                    ${CAMPOS_ENCEPHALITIS.clinicos.map(s => window.renderEncephCheck(s, 'enceph-sintoma')).join('')}
                </div>
            </div>

            <div>
                <p style="font-size:0.65rem; font-weight:800; color:var(--text-muted, #64748b); margin: 0 0 0.4rem 0; text-transform: uppercase; letter-spacing: 0.6px;">Resultados de Exploración Inicial</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                    ${CAMPOS_ENCEPHALITIS.paraclinicos.map(s => window.renderEncephCheck(s, 'enceph-paraclinico')).join('')}
                </div>
            </div>

            <div style="margin-top: 0.4rem;">
                <button type="button" onclick="window.updateEncephalitis()" style="width:100%; background: #7c3aed; color: #ffffff; border: none; padding: 10px; border-radius: 12px; font-size: 0.85rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.2); transition: background 0.15s; outline:none;">
                    <i class="fas fa-calculator" style="margin-right:4px;"></i> CALCULAR AFINIDAD CLÍNICA
                </button>
            </div>

            <div id="results-panel" style="display: none; padding: 0.9rem; background: #f8fafc; border-radius: 12px; border: 1px solid var(--border, #e2e8f0); flex-direction: column; gap: 8px;">
                <div style="font-size:0.65rem; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:0.3rem; text-align:center; letter-spacing: 0.6px;">Índice de Afinidad Clínica Relativa</div>
                <div id="results-bars-container" style="display: flex; flex-direction: column; gap: 7px;"></div>
                <div id="discriminacion-warning" style="display:none; margin-top:0.5rem; font-size:0.68rem; color:#334155; background:#f1f5f9; border-left:3px solid #94a3b8; padding:0.6rem; border-radius:4px; line-height:1.4;"></div>
            </div>

            <div id="alerts-container" style="display:none; flex-direction: column; gap: 6px;"></div>

            <div style="margin-top:0.8rem; border-top:1px dashed var(--border, #e2e8f0); padding-top:0.8rem; font-size:0.65rem; color:var(--text-muted, #64748b); text-align:justify; line-height:1.5; font-style: italic;">
                <b>Nota científica y metodológica:</b> Esta herramienta implementa un modelo matemático, ideado por IA, estructurado mediante análisis multidimensional de subespacios vectoriales (Similitud de Coseno). Los coeficientes se nutren directamente de las tablas recopiladas por Binks et al. en el seminario de revisión para <i>The Lancet</i> (2026; 407: 1968-83). El índice resultante cuantifica el grado de afinidad fenotípica pretest del paciente con los patrones epidemiológicos y clínico-paraclínicos descritos en la literatura indexada, sirviendo como soporte docente para el diagnóstico diferencial. No sustituye el criterio clínico ni la confirmación mediante PPCC. 
        </div>
    `;

    // Inicializar variables globales de estado con la selección binaria por defecto
    window.encephSexoPaciente = 'varon';
    window.encephRazaPaciente = 'blanca';
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

window.setRazaPaciente = function(valor) {
    window.encephRazaPaciente = valor;
    const btnBlanca = document.getElementById('btn-raza-blanca');
    const btnOtro = document.getElementById('btn-raza-otro');
    
    if (valor === 'blanca') {
        btnBlanca.style.background = '#166534'; btnBlanca.style.color = '#fff';
        btnOtro.style.background = 'transparent'; btnOtro.style.color = '#166534';
    } else {
        btnOtro.style.background = '#166534'; btnOtro.style.color = '#fff';
        btnBlanca.style.background = 'transparent'; btnBlanca.style.color = '#166534';
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
 * Ponderación modulada de Sexo: Evaluación estricta Hombre vs Mujer (Afinidad 0.4 - 1.0)
 */
window.calcularFactorSexo = function(pctVaronFila, sexoPaciente) {
    if (pctVaronFila === null || isNaN(pctVaronFila)) return 1;
    const afinidad = (sexoPaciente === 'varon') ? (pctVaronFila / 100) : (1 - pctVaronFila / 100);
    return 0.4 + 0.6 * afinidad;
};

/**
 * Ponderación modulada de Etnia: Evaluación estricta Blanco vs Otro (Afinidad 0.5 - 1.0)
 */
window.calcularFactorRaza = function(pctRazaFila, razaPaciente) {
    if (pctRazaFila === null || isNaN(pctRazaFila)) return 1;
    const afinidad = (razaPaciente === 'blanca') ? (pctRazaFila / 100) : (1 - pctRazaFila / 100);
    return 0.5 + 0.5 * afinidad;
};

/**
 * Motor Algorítmico Central de PSQ al día: Ejecución por demanda
 */
window.updateEncephalitis = function() {
    const edadInput = document.getElementById('p-edad').value;
    const sexoPaciente = window.encephSexoPaciente || 'varon';
    const razaPaciente = window.encephRazaPaciente || 'blanca';

    if (!edadInput || isNaN(edadInput) || parseFloat(edadInput) < 0) {
        alert("Por favor, introduce una edad válida para realizar el cálculo.");
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

        if (row[COL_INDEX.ETIOLOGIA].toLowerCase().includes('etiolog') || row[COL_INDEX.ETIOLOGIA].toLowerCase().includes('fármaco')) continue;

        const etiologia = row[COL_INDEX.ETIOLOGIA];
        const tipo = row[COL_INDEX.TIPO] || 'Desconocido';

        // 1. AJUSTES MODULADORES DEMOGRÁFICOS
        const medianaEdad = parseFloat(row[COL_INDEX.MEDIANA_EDAD]) || 0;
        const factorEdad = window.calcularFactorEdad(etiologia, medianaEdad, pacienteEdad);

        const pctVaronFila = (row[COL_INDEX.PCT_VARON] !== undefined && row[COL_INDEX.PCT_VARON] !== '') ? parseFloat(row[COL_INDEX.PCT_VARON]) : null;
        const factorSexo = window.calcularFactorSexo(pctVaronFila, sexoPaciente);

        const pctRazaFila = (row[COL_INDEX.BLANCO] !== undefined && row[COL_INDEX.BLANCO] !== '') ? parseFloat(row[COL_INDEX.BLANCO]) : null;
        const factorRaza = window.calcularFactorRaza(pctRazaFila, razaPaciente);

        // 2. SIMILITUD DE COSENO VECTORIAL (SUBESPACIO CLÍNICO, DESDE ÍNDICE 5)
        let vectorPaciente = [];
        let vectorEnfermedad = [];
        let penalizacionAusenciaCritica = 1.0;

        for (const [key, colIdx] of Object.entries(COL_INDEX)) {
            if (colIdx >= 5) {
                const celdaRaw = row[colIdx];

                // Principio de exclusión vectorial de celdas vacías (datos no conocidos por Lancet)
                if (celdaRaw === undefined || celdaRaw === null || celdaRaw.toString().trim() === '') {
                    continue; 
                }

                const pacienteTieneSintoma = totalInputsActivos.includes(key) ? 1 : 0;
                const porcentajeMatriz = parseFloat(celdaRaw) / 100;

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

        let scoreAjustado = similitudCoseno * factorEdad * factorSexo * factorRaza * penalizacionAusenciaCritica;

        // 3. INDEXACIÓN DE SIGNOS EXCLUSIVOS (OVERRIDES)
        if (totalInputsActivos.includes('CRISIS_FBDS') && etiologia === 'Anti-LGI1') {
            scoreAjustado *= 2.5; 
        }
        if (totalInputsActivos.includes('SIST_NERV_PERIFERICO') && etiologia === 'Anti-CASPR2') {
            scoreAjustado *= 2.0; 
        }

        rawScores.push({ etiologia, tipo, score: scoreAjustado });
        totalSumScores += scoreAjustado;
    }

    // 4. NORMALIZACIÓN Y APERTURA DINÁMICA DEL PANEL DE RESULTADOS
    let listadoFinal = rawScores.map(item => {
        const porcentajeFinal = totalSumScores > 0 ? (item.score / totalSumScores) * 100 : 0;
        return { etiologia: item.etiologia, tipo: item.tipo, probabilidad: parseFloat(porcentajeFinal.toFixed(1)) };
    }).sort((a, b) => b.probabilidad - a.probabilidad);

    const resultsPanel = document.getElementById('results-panel');
    const barsContainer = document.getElementById('results-bars-container');
    const discrimWarning = document.getElementById('discriminacion-warning');

    resultsPanel.style.display = 'flex'; // Hacemos visible el recuadro de afinidad al calcular

    if (listadoFinal.length === 0 || totalSumScores === 0) {
        barsContainer.innerHTML = `<div style="text-align:center; font-size:0.75rem; color:var(--text-muted); padding:0.5rem;">Introduce manifestaciones clínicas para realizar la proyección.</div>`;
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
            ? '<span style="font-size:0.55rem; font-weight:800; background:#fee2e2; color:#b91c1c; padding:1px 6px; border-radius:20px; letter-spacing:0.3px;">INFECCIOSO</span>'
            : '<span style="font-size:0.55rem; font-weight:800; background:#dbeafe; color:#1d4ed8; padding:1px 6px; border-radius:20px; letter-spacing:0.3px;">AUTOINMUNE</span>';
        const descripcion = (DESCRIPCIONES_BREVES[res.etiologia] || '').replace(/"/g, '&quot;');

        return `
            <div style="display: flex; flex-direction: column; font-size: 0.75rem; margin-bottom: 2px;" title="${descripcion}">
                <div style="display: flex; justify-content: space-between; align-items:center; font-weight: 700; color: var(--text-main, #1e293b); margin-bottom: 2px;">
                    <span style="display:flex; align-items:center; gap:6px; font-weight:600;"><i class="fas ${icono}" style="color:${colorBarra}; font-size:0.7rem;"></i>${res.etiologia} ${chip}</span>
                    <span style="font-variant-numeric: tabular-nums;">${res.probabilidad}%</span>
                </div>
                <div style="width: 100%; background: ${colorFondoBarra}; height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${res.probabilidad}%; background: linear-gradient(90deg, ${colorBarra}, ${colorBarra}cc); height: 100%; border-radius: 4px;"></div>
                </div>
            </div>
        `;
    }).join('');

    // 5. EVALUACIÓN DE DISCRIMINACIÓN DIAGNÓSTICA
    if (listadoFinal.length >= 2) {
        const gap = listadoFinal[0].probabilidad - listadoFinal[1].probabilidad;
        if (listadoFinal[0].probabilidad > 0 && gap < 8) {
            discrimWarning.style.display = 'block';
            discrimWarning.innerHTML = `<i class="fas fa-scale-balanced" style="color:#64748b; margin-right:2px;"></i> <b>Complejo sindrómico superpuesto:</b> "${listadoFinal[0].etiologia}" y "${listadoFinal[1].etiologia}" arrojan índices muy aproximados (${listadoFinal[0].probabilidad}% vs ${listadoFinal[1].probabilidad}%). El perfil actual requiere mayor refinamiento clínico o paraclínico específico (LCR/Anticuerpos/RM).`;
        } else {
            discrimWarning.style.display = 'none';
        }
    }

    // 6. GESTOR DE ALERTAS DE ALTO RIGOR (INLINE INYECTADO)
    const alertsContainer = document.getElementById('alerts-container');
    let alertasHTML = [];
    const maxEtiologia = listadoFinal[0];

    // Recordatorio de Mimetismo Secundario (Fijo tras presionar calcular)
    alertasHTML.push(`
        <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-left: 4px solid #6366f1; padding: 0.65rem 0.8rem; border-radius: 8px; font-size: 0.68rem; color: #334155; line-height:1.45;">
            <span style="font-weight:700; color:#4f46e5; display:block; margin-bottom:1px; font-size:0.62rem; text-transform:uppercase; letter-spacing:0.3px;"><i class="fas fa-arrows-spin"></i> Recordatorio de Mimetismo Post-HSV-1</span>
            Hasta un <b>25% de pacientes jóvenes</b> desarrollan encefalitis autoinmune secundaria (típicamente anti-NMDAR) entre <b>6 y 12 semanas después</b> de una encefalitis viral por HSV-1 resuelta. El cuadro cursa con PCR en LCR negativa para el virus y responde estrictamente a inmunoterapia.
        </div>
    `);

    if (maxEtiologia && maxEtiologia.probabilidad > 15) {
        const rmnNormal = !totalInputsActivos.includes('RMN_PATOLOGICA');

        if ((maxEtiologia.etiologia === 'Anti-NMDAR' || maxEtiologia.etiologia === 'Anti-LGI1' || maxEtiologia.etiologia === 'Anti-CASPR2') && rmnNormal) {
            alertasHTML.push(`
                <div style="background: #fef3c7; border-left: 4px solid #d97706; padding: 0.65rem 0.8rem; border-radius: 8px; font-size: 0.68rem; color: #92400e; line-height:1.45;">
                    ⚠️ <b>Firma de Rigor (RMN Normal):</b> Una neuroimagen estructural normal NO excluye el origen autoinmune. Más del 50% de los debuts clínicos por anticuerpos comunes (NMDAR, LGI1, CASPR2) cursan con resonancias cerebrales completamente anodinas en fase inicial.
                </div>
            `);
        }

        if (maxEtiologia.etiologia === 'Anti-NMDAR') {
            if (pacienteEdad >= 18 && pacienteEdad <= 40 && sexoPaciente === 'mujer') {
                alertasHTML.push(`
                    <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 0.65rem 0.8rem; border-radius: 8px; font-size: 0.68rem; color: #991b1b; line-height:1.45;">
                        🧬 <b>Cribado Oncológico Mandatorio:</b> Se aconseja descartar de forma preferente la presencia de un teratoma ovárico mediante ecografía o TC abdominopélvica, debido a la asociación patogénica del 30% descrita en la literatura (tejidos del tumor sintetizan los anticuerpos).
                    </div>
                `);
            } else if (pacienteEdad > 50) {
                alertasHTML.push(`
                    <div style="background: #fff1f2; border-left: 4px solid #f43f5e; padding: 0.65rem 0.8rem; border-radius: 8px; font-size: 0.68rem; color: #9f1239; line-height:1.45;">
                        🚨 <b>Debut Geriátrico (Anti-NMDAR):</b> En mayores de 50 años la incidencia de teratomas ováricos es baja, pero cursa con un riesgo marcadamente elevado de otras neoplasias malignas sistémicas concomitantes y un peor pronóstico evolutivo global.
                    </div>
                `);
            }
        }

        if (maxEtiologia.etiologia === 'Anti-CASPR2' && totalInputsActivos.includes('SIST_NERV_PERIFERICO')) {
            alertasHTML.push(`
                <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 0.65rem 0.8rem; border-radius: 8px; font-size: 0.68rem; color: #1e40af; line-height:1.45;">
                    🫁 <b>Asociación Paraneoplásica (Timoma):</b> Ante la presencia documentada de manifestaciones de hiperexcitabilidad axonal periférica o clínica compatible con Síndrome de Morvan, resulta indispensable realizar un TC de tórax para excluir un timoma oculto.
                </div>
            `);
        }

        if (maxEtiologia.etiologia === 'HSV-1' && pacienteEdad > 60) {
            alertasHTML.push(`
                <div style="background: #f5f3ff; border-left: 4px solid #7c3aed; padding: 0.65rem 0.8rem; border-radius: 8px; font-size: 0.68rem; color: #5b21b6; line-height:1.45;">
                    🧠 <b>Atipicidad Geriátrica (HSV-1):</b> En pacientes ancianos e inmunodeprimidos, el herpes simple tipo 1 puede cursar de forma inespecífica con alteración del nivel de consciencia <i>sin</i> fiebre ni cefalea. Mantén un umbral bajo para iniciar aciclovir empírico.
                </div>
            `);
        }
    }

    alertsContainer.style.display = 'flex';
    alertsContainer.innerHTML = alertasHTML.join('');
    
    // Auto-scroll suave para enfocar los resultados generados en pantallas compactas
    resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};
