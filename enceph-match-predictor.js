/**
 * Herramienta: Enceph-Match Predictor v2.5 (Calculadora de Afinidad Clínica Diferencial)
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

// Mapeo riguroso de índices de columnas adaptado a la nueva estructura de la hoja "encefalitisDD"
const COL_INDEX = {
    ETIOLOGIA: 0, TIPO: 1, MEDIANA_EDAD: 2, PCT_VARON: 3, BLANCO: 4, // Bloque demográfico/epidemiológico (0-4)
    FIEBRE: 5, CEFALEA: 6, SINT_MENINGEOS: 7, RESPIRATORIO: 8, ALT_MENTAL_PSQ: 9,
    CRISIS_COMICIALES: 10, FOCALIDAD: 11, VOMITOS: 12, RASH: 13, CRISIS_FBDS: 14,
    COGNITIVO_AMNESIA: 15, SIST_NERV_PERIFERICO: 16, DISAUTONOMIA: 17, NIVEL_CON: 18,
    TRAST_MOVIMIENTO: 19, ALT_SUENO: 20, HIPONATREMIA: 21, RMN_PATOLOGICA: 22,
    LCR_PATOLOGICO: 23, EEG_PATOLOGICO: 24 // Bloque clínico y paraclínico desplazado (5-24)
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
 * FUNCIÓN INICIALIZADORA: Llama de forma asíncrona y reactiva al Worker de Cloudflare
 */
window.iniciarEncephMatch = async function() {
    try {
        const modal = document.getElementById('modal');
        if (modal) modal.style.display = 'flex';

        const container = document.getElementById('modalData');
        if (!container) return;

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:220px; font-family:system-ui, sans-serif; font-size:0.85rem; color:var(--text-muted);">
                <div style="width:180px; height:8px; border-radius:5px; background:linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 37%, #e2e8f0 63%); background-size:400% 100%; animation: enceph-shimmer 1.2s ease-in-out infinite; margin-bottom:14px;"></div>
                <span style="font-weight: 500; letter-spacing: 0.2px;">Sincronizando matriz encefalitisDD...</span>
            </div>
            <style>@keyframes enceph-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }</style>
        `;

        const response = await fetch('/?sheet=encefalitisDD');
        const data = await response.json();

        if (data && data.values) {
            window.openEncephalitisUI(data.values);
        } else {
            throw new Error("Payload 'values' no encontrado en el origen.");
        }

    } catch (error) {
        console.error("Error en la conexión con la hoja encefalitisDD:", error);
        document.getElementById('modalData').innerHTML = `
            <div style="padding:2.5rem; text-align:center; font-family:system-ui, sans-serif; font-size:0.85rem; color:#dc2626; line-height: 1.4;">
                <i class="fas fa-exclamation-triangle" style="margin-bottom:12px; font-size:2rem;"></i><br>
                <b style="font-size: 0.95rem;">Error de sincronización de datos</b><br>
                No se pudo establecer el canal con la hoja <i>encefalitisDD</i>. Comprueba la configuración de tu Worker.
            </div>
        `;
    }
};

/**
 * Renderiza la interfaz encapsulada siguiendo la línea estética de PSQ al día
 */
window.openEncephalitisUI = function(sheetRows) {
    window.currentSheetRows = sheetRows;
    const modalData = document.getElementById('modalData');

    modalData.innerHTML = `
        <div class="calc-ui" style="padding: 1.2rem; display: flex; flex-direction: column; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-height: 90vh; overflow-y: auto; box-sizing: border-box; background: var(--bg-main, #ffffff);">

            <div style="position: sticky; top: 0; background: var(--card, var(--card-bg, #ffffff)); z-index: 10; padding-bottom: 0.8rem; border-bottom: 1px solid var(--border, #e2e8f0); text-align:center;">
                <h2 style="font-weight:800; font-size: 1.15rem; margin:0 0 0.15rem 0; color: var(--text-main, #1e293b); display:flex; align-items:center; justify-content:center; gap:6px;">
                    <i class="fas fa-brain" style="color:#7c3aed;"></i> Enceph-Match Predictor
                </h2>
                <p style="font-size:0.7rem; color:var(--text-muted, #64748b); font-weight: 500; margin:0;">Calculadora de Afinidad Clínica Diferencial (Matriz: encefalitisDD)</p>
            </div>

            <div style="margin-top:0.8rem; background:#fffbeb; border:1px solid #fde68a; border-radius:12px; padding:0.7rem 0.9rem; font-size:0.7rem; color:#92400e; line-height:1.45; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                <span style="font-weight:800; text-transform:uppercase; display:block; margin-bottom: 2px; font-size:0.62rem; letter-spacing:0.5px;"><i class="fas fa-stethoscope"></i> Paso 0: Excluir Encefalopatías Puras</span>
                Antes de interpretar el índice de afinidad, confirma que el paciente no se encuentra en un cuadro de <b>Encefalopatía</b> (séptica, metabólica, tóxica): típicamente cursan <i>sin</i> focalidad neurológica, con RM y LCR normales, y un EEG con enlentecimiento difuso inespecífico.
            </div>

            <div id="results-panel" style="margin-top: 0.8rem; padding: 0.9rem; background: #f8fafc; border-radius: 12px; border: 1px solid var(--border, #e2e8f0);">
                <div style="font-size:0.65rem; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:0.65rem; text-align:center; letter-spacing: 0.6px;">Afinidad Clínica Relativa con Patrones Lancet</div>
                <div id="results-bars-container" style="display: flex; flex-direction: column; gap: 7px;">
                    <div style="text-align:center; font-size:0.75rem; color:var(--text-muted, #64748b); padding:0.5rem; font-weight:500;">Introduce la edad del paciente para iniciar el análisis adaptativo.</div>
                </div>
                <div id="discriminacion-warning" style="display:none; margin-top:0.75rem; font-size:0.68rem; color:#334155; background:#f1f5f9; border-left:3px solid #94a3b8; padding:0.6rem; border-radius:4px; line-height:1.4;"></div>
            </div>

            <div id="alerts-container" style="margin-top: 0.8rem; display:none; flex-direction: column; gap: 6px;"></div>

            <div style="margin-top: 1rem; display: flex; gap: 12px; background: #f0fdf4; padding: 0.85rem; border-radius: 12px; border: 1px solid #bbf7d0; align-items: flex-end; flex-wrap:wrap; box-shadow: 0 1px 2px rgba(0,0,0,0.01);">
                <div style="flex: 1; min-width:80px;">
                    <span style="font-size: 0.65rem; font-weight: 800; color: #166534; display: block; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Edad</span>
                    <input type="number" id="p-edad" oninput="window.updateEncephalitis()" placeholder="Años" style="width: 100%; padding: 6px 8px; border-radius: 6px; border: 1px solid #22c55e; font-size: 0.85rem; box-sizing: border-box; outline: none; background: #ffffff; font-weight: 600; color: #14532d;">
                </div>
                <div style="flex: 1.5; min-width:180px;">
                    <span style="font-size: 0.65rem; font-weight: 800; color: #166534; display: block; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Sexo biológico</span>
                    <div id="sexo-toggle" style="display:flex; gap:4px;">
                        <button type="button" data-sexo="varon" onclick="window.setSexoPaciente('varon')" class="enceph-sexo-btn" style="flex:1; padding:6px 4px; border-radius:6px; border:1px solid #22c55e; background:#fff; font-size:0.7rem; font-weight:700; color:#166534; cursor:pointer; transition: 0.15s; outline:none;">Varón</button>
                        <button type="button" data-sexo="mujer" onclick="window.setSexoPaciente('mujer')" class="enceph-sexo-btn" style="flex:1; padding:6px 4px; border-radius:6px; border:1px solid #22c55e; background:#fff; font-size:0.7rem; font-weight:700; color:#166534; cursor:pointer; transition: 0.15s; outline:none;">Mujer</button>
                        <button type="button" data-sexo="no_especificado" onclick="window.setSexoPaciente('no_especificado')" class="enceph-sexo-btn" style="flex:1; padding:6px 4px; border-radius:6px; border:1px solid #22c55e; background:#166534; font-size:0.7rem; font-weight:700; color:#fff; cursor:pointer; transition: 0.15s; outline:none;">No consta</button>
                    </div>
                </div>
                <div style="flex: 1.2; min-width:140px;">
                    <span style="font-size: 0.65rem; font-weight: 800; color: #166534; display: block; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Etnia cohorte</span>
                    <div id="raza-toggle" style="display:flex; gap:4px;">
                        <button type="button" data-raza="blanca" onclick="window.setRazaPaciente('blanca')" class="enceph-raza-btn" style="flex:1; padding:6px 4px; border-radius:6px; border:1px solid #22c55e; background:#fff; font-size:0.7rem; font-weight:700; color:#166534; cursor:pointer; transition: 0.15s; outline:none;">Blanca</button>
                        <button type="button" data-raza="no_consta" onclick="window.setRazaPaciente('no_consta')" class="enceph-raza-btn" style="flex:1; padding:6px 4px; border-radius:6px; border:1px solid #22c55e; background:#166534; font-size:0.7rem; font-weight:700; color:#fff; cursor:pointer; transition: 0.15s; outline:none;">No consta</button>
                    </div>
                </div>
            </div>

            <p style="font-size:0.65rem; font-weight:800; color:var(--text-muted, #64748b); margin: 1.2rem 0 0.4rem; text-transform: uppercase; letter-spacing: 0.6px;">Manifestaciones Clínicas Presentes</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                ${CAMPOS_ENCEPHALITIS.clinicos.map(s => window.renderEncephCheck(s, 'enceph-sintoma')).join('')}
            </div>

            <p style="font-size:0.65rem; font-weight:800; color:var(--text-muted, #64748b); margin: 1.2rem 0 0.4rem; text-transform: uppercase; letter-spacing: 0.6px;">Resultados de Exploración Inicial</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                ${CAMPOS_ENCEPHALITIS.paraclinicos.map(s => window.renderEncephCheck(s, 'enceph-paraclinico')).join('')}
            </div>

            <div style="margin-top:1.4rem; border-top:1px dashed var(--border, #e2e8f0); padding-top:0.8rem; font-size:0.62rem; color:var(--text-muted, #64748b); text-align:center; line-height:1.45;">
                Ajuste matemático: Similitud de Coseno vectorial sobre subespacios dinámicos con exclusión de celdas nulas.<br>
                Descargo: Este módulo evalúa similitud fenotípica relativa frente a literatura indexada; no provee un cálculo bayesiano calibrado de probabilidad diagnóstica absoluta.
            </div>
        </div>
    `;

    // Estados por defecto de los selectores triestatales
    window.encephSexoPaciente = 'no_especificado';
    window.encephRazaPaciente = 'no_consta';
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

window.setRazaPaciente = function(valor) {
    window.encephRazaPaciente = valor;
    document.querySelectorAll('.enceph-raza-btn').forEach(btn => {
        const activo = btn.getAttribute('data-raza') === valor;
        btn.style.background = activo ? '#166534' : '#fff';
        btn.style.color = activo ? '#fff' : '#166534';
    });
    window.updateEncephalitis();
};

window.renderEncephCheck = function(s, className) {
    return `
        <label style="display: flex; align-items: center; gap: 6px; background: var(--bg, #fdfdfd); padding: 0.5rem; border-radius: 8px; cursor: pointer; border: 1px solid var(--border, #e2e8f0); font-size: 0.7rem; color: var(--text-main, #334155); height: 100%; box-sizing: border-box; min-height: 40px; user-select:none; transition: background 0.1s;">
            <input type="checkbox" class="${className}" value="${s.id}" onchange="window.updateEncephalitis()" style="width:14px; height:14px; min-width:14px; accent-color: #7c3aed;">
            <span style="line-height:1.2; font-weight: 500;">${s.label}</span>
        </label>
    `;
};

/**
 * Modela el factor de ajuste por edad (curvas gaussianas simples o bimodales complejas)
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
 * Modela el factor amortiguado de sexo biológico
 */
window.calcularFactorSexo = function(pctVaronFila, sexoPaciente) {
    if (sexoPaciente === 'no_especificado' || pctVaronFila === null || isNaN(pctVaronFila)) return 1;
    const afinidad = (sexoPaciente === 'varon') ? (pctVaronFila / 100) : (1 - pctVaronFila / 100);
    return 0.4 + 0.6 * afinidad;
};

/**
 * Modela el factor amortiguado de distribución por raza de la cohorte
 */
window.calcularFactorRaza = function(pctRazaFila, razaPaciente) {
    if (razaPaciente === 'no_consta' || pctRazaFila === null || isNaN(pctRazaFila)) return 1;
    const afinidad = (razaPaciente === 'blanca') ? (pctRazaFila / 100) : (1 - pctRazaFila / 100);
    return 0.5 + 0.5 * afinidad;
};

/**
 * Motor Algorítmico Central de PSQ al día: Cruce matricial dinámico sobre subespacios continuos
 */
window.updateEncephalitis = function() {
    const edadInput = document.getElementById('p-edad').value;
    const sexoPaciente = window.encephSexoPaciente || 'no_especificado';
    const razaPaciente = window.encephRazaPaciente || 'no_consta';

    if (!edadInput || isNaN(edadInput) || parseFloat(edadInput) < 0) {
        document.getElementById('results-bars-container').innerHTML = `<div style="text-align:center; font-size:0.75rem; color:var(--text-muted); padding:0.5rem; font-weight:500;">Introduce la edad del paciente para activar el motor clínico.</div>`;
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

        // Limpieza pasiva de cabeceras de tabla
        if (row[COL_INDEX.ETIOLOGIA].toLowerCase().includes('etiolog') || row[COL_INDEX.ETIOLOGIA].toLowerCase().includes('fármaco')) continue;

        const etiologia = row[COL_INDEX.ETIOLOGIA];
        const tipo = row[COL_INDEX.TIPO] || 'Desconocido';

        // 1. AJUSTES DEMOGRÁFICOS / EPIDEMIOLÓGICOS (FACTORES MODULADORES)
        const medianaEdad = parseFloat(row[COL_INDEX.MEDIANA_EDAD]) || 0;
        const factorEdad = window.calcularFactorEdad(etiologia, medianaEdad, pacienteEdad);

        const pctVaronFila = (row[COL_INDEX.PCT_VARON] !== undefined && row[COL_INDEX.PCT_VARON] !== '') ? parseFloat(row[COL_INDEX.PCT_VARON]) : null;
        const factorSexo = window.calcularFactorSexo(pctVaronFila, sexoPaciente);

        const pctRazaFila = (row[COL_INDEX.BLANCO] !== undefined && row[COL_INDEX.BLANCO] !== '') ? parseFloat(row[COL_INDEX.BLANCO]) : null;
        const factorRaza = window.calcularFactorRaza(pctRazaFila, razaPaciente);

        // 2. CONSTRUCCIÓN DE SUBESPACIOS VECTORIALES DE COSENO (SOLO SÍNTOMAS / EXTRAS DE EXAMEN)
        let vectorPaciente = [];
        let vectorEnfermedad = [];
        let penalizacionAusenciaCritica = 1.0;

        for (const [key, colIdx] of Object.entries(COL_INDEX)) {
            // Evaluamos desde la columna 5 (FIEBRE) en adelante para ignorar los datos demográficos en el vector clínico
            if (colIdx >= 5) {
                const celdaRaw = row[colIdx];

                // RIGOR TÉCNICO: Si la celda está vacía en la hoja "encefalitisDD" (porque es un dato desconocido),
                // aplicamos un 'continue' para excluir esta dimensión sintomática del cálculo de ESTA fila.
                if (celdaRaw === undefined || celdaRaw === null || celdaRaw.toString().trim() === '') {
                    continue; 
                }

                const pacienteTieneSintoma = totalInputsActivos.includes(key) ? 1 : 0;
                const porcentajeMatriz = parseFloat(celdaRaw) / 100;

                vectorPaciente.push(pacienteTieneSintoma);
                vectorEnfermedad.push(porcentajeMatriz);

                // Filtro clínico estricto: Penalización por valor predictivo negativo (Prevalencia >80%)
                if (porcentajeMatriz > 0.80 && pacienteTieneSintoma === 0) {
                    penalizacionAusenciaCritica *= 0.2;
                }
            }
        }

        // Producto escalar y magnitudes de subespacio
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

        // Combinación lineal de puntuación multiplicativa
        let scoreAjustado = similitudCoseno * factorEdad * factorSexo * factorRaza * penalizacionAusenciaCritica;

        // 3. OVERRIDES INDEPENDIENTES DE SIGNOS EXCLUSIVOS
        if (totalInputsActivos.includes('CRISIS_FBDS') && etiologia === 'Anti-LGI1') {
            scoreAjustado *= 2.5; // Multiplicador crítico por crisis faciobraquiales patognomónicas
        }
        if (totalInputsActivos.includes('SIST_NERV_PERIFERICO') && etiologia === 'Anti-CASPR2') {
            scoreAjustado *= 2.0; // Multiplicador por afectación nerviosa periférica (Morvan)
        }

        rawScores.push({ etiologia, tipo, score: scoreAjustado });
        totalSumScores += scoreAjustado;
    }

    // 4. NORMALIZACIÓN RELATIVA DE LOS MARCADORES
    let listadoFinal = rawScores.map(item => {
        const porcentajeFinal = totalSumScores > 0 ? (item.score / totalSumScores) * 100 : 0;
        return { etiologia: item.etiologia, tipo: item.tipo, probabilidad: parseFloat(porcentajeFinal.toFixed(1)) };
    }).sort((a, b) => b.probabilidad - a.probabilidad);

    const barsContainer = document.getElementById('results-bars-container');
    const discrimWarning = document.getElementById('discriminacion-warning');

    if (listadoFinal.length === 0 || totalSumScores === 0) {
        barsContainer.innerHTML = `<div style="text-align:center; font-size:0.75rem; color:var(--text-muted); padding:0.5rem; font-weight:500;">Introduce manifestaciones clínicas para calcular afinidades diferenciales.</div>`;
        document.getElementById('alerts-container').style.display = 'none';
        discrimWarning.style.display = 'none';
        return;
    }

    // Renderizar listado de afinidad clínica
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
            <div style="display: flex; flex-direction: column; font-size: 0.75rem; margin-bottom: 3px;" title="${descripcion}">
                <div style="display: flex; justify-content: space-between; align-items:center; font-weight: 700; color: var(--text-main, #1e293b); margin-bottom: 2px;">
                    <span style="display:flex; align-items:center; gap:6px; font-weight:600;"><i class="fas ${icono}" style="color:${colorBarra}; font-size:0.7rem;"></i>${res.etiologia} ${chip}</span>
                    <span style="font-variant-numeric: tabular-nums;">${res.probabilidad}%</span>
                </div>
                <div style="width: 100%; background: ${colorFondoBarra}; height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${res.probabilidad}%; background: linear-gradient(90deg, ${colorBarra}, ${colorBarra}cc); height: 100%; transition: width 0.4s ease-out; border-radius: 4px;"></div>
                </div>
            </div>
        `;
    }).join('');

    // 5. EVALUACIÓN DE DISCRIMINACIÓN DE PERFIL SINDROMÁTICO
    if (listadoFinal.length >= 2) {
        const gap = listadoFinal[0].probabilidad - listadoFinal[1].probabilidad;
        if (listadoFinal[0].probabilidad > 0 && gap < 8) {
            discrimWarning.style.display = 'block';
            discrimWarning.innerHTML = `<i class="fas fa-scale-balanced" style="color:#64748b; margin-right:2px;"></i> <b>Complejo sindrómico superpuesto:</b> "${listadoFinal[0].etiologia}" y "${listadoFinal[1].etiologia}" arrojan índices muy aproximados (${listadoFinal[0].probabilidad}% vs ${listadoFinal[1].probabilidad}%). El perfil actual requiere mayor refinamiento clínico o paraclínico específico (LCR/Anticuerpos/RM).`;
        } else {
            discrimWarning.style.display = 'none';
        }
    }

    // 6. GESTOR DE ADVERTENCIAS Y RECOMENDACIONES DE RIGOR CIENTÍFICO (ALERTA POST-HERPES FIJA)
    const alertsContainer = document.getElementById('alerts-container');
    let alertasHTML = [];
    const maxEtiologia = listadoFinal[0];

    // INYECCIÓN VISUAL Y PERMANENTE DE LA PERLA DE MIMETISMO POST-HSV-1
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
};
