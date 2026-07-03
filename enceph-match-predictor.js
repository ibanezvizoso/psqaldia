/**
 * Herramienta: Enceph-Match Predictor (Calculadora de Probabilidad Pre-test de Encefalitis)
 * Plataforma: PSQ al día (psqaldia.com)
 * Fuente de datos: Lancet Seminar (2026)
 * INTEGRACIÓN ENCAPSULADA: Conexión automatizada mediante Cloudflare Worker
 */

// Estructura de metadatos para la renderización automática de la interfaz
const CAMPOS_ENCEPHALITIS = {
    demograficos: [
        { id: 'edad', label: 'Edad del paciente', type: 'number', placeholder: 'Años' },
        { id: 'sexo_varon', label: 'Sexo biológico Varón', type: 'checkbox' }
    ],
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
                <i class="fas fa-spinner fa-spin" style="margin-bottom:12px; font-size:1.5rem; color:var(--primary);"></i>
                <span>Conectando con la base de datos encefalitisDD...</span>
            </div>
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
                <h2 style="font-weight:800; font-size: 1.1rem; margin:0 0 0.2rem 0; color: var(--text-main);">Enceph-Match Predictor</h2>
                <p style="font-size:0.7rem; color:var(--text-muted); margin:0 0 0.8rem 0;">Probabilidad diferencial pre-test (Pestaña: encefalitisDD)</p>
                
                <div style="display: flex; justify-content: center;">
                    <button onclick="window.openPostHsvFlags()" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 5px 14px; border-radius: 50px; font-size: 0.65rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: 0.2s;">
                        <i class="fas fa-history"></i> NOTA SOBRE AUTOINMUNIDAD POST-HSV
                    </button>
                </div>
            </div>

            <div id="results-panel" style="margin-top: 1rem; padding: 0.8rem; background: #f8fafc; border-radius: 12px; border: 1px solid var(--border);">
                <div style="font-size:0.65rem; font-weight:800; color:#64748b; text-transform:uppercase; margin-bottom:0.6rem; text-align:center; letter-spacing: 0.5px;">Estratificación de Sospecha Diagnóstica</div>
                <div id="results-bars-container" style="display: flex; flex-direction: column; gap: 6px;">
                    <div style="text-align:center; font-size:0.75rem; color:var(--text-muted); padding:0.5rem;">Introduce la edad del paciente para activar el motor clínico.</div>
                </div>
            </div>

            <div id="alerts-container" style="margin-top: 0.8rem; display:none; flex-direction: column; gap: 6px;"></div>

            <div style="margin-top: 1rem; display: flex; gap: 12px; background: #f0fdf4; padding: 0.8rem; border-radius: 12px; border: 1px solid #bbf7d0; align-items: center;">
                <div style="flex: 1;">
                    <span style="font-size: 0.65rem; font-weight: 800; color: #166534; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.3px;">Edad</span>
                    <input type="number" id="p-edad" oninput="window.updateEncephalitis()" placeholder="Años" style="width: 100%; padding: 6px 8px; border-radius: 6px; border: 1px solid #22c55e; font-size: 0.85rem; box-sizing: border-box; outline: none;">
                </div>
                <div style="flex: 1; display: flex; align-items: center; height: 100%; margin-top: 14px;">
                    <label style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 700; color: #166534; cursor: pointer; user-select: none;">
                        <input type="checkbox" id="p-sexo" onchange="window.updateEncephalitis()" style="width:16px; height:16px; accent-color: #22c55e;"> Varón Biológico
                    </label>
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

        </div>
    `;
};

window.renderEncephCheck = function(s, className) {
    return `
        <label style="display: flex; align-items: center; gap: 6px; background: var(--bg, #fdfdfd); padding: 0.5rem; border-radius: 8px; cursor: pointer; border: 1px solid var(--border, #e2e8f0); font-size: 0.7rem; color: var(--text-main); height: 100%; box-sizing: border-box; min-height: 40px; user-select:none; transition: background 0.15s;">
            <input type="checkbox" class="${className}" value="${s.id}" onchange="window.updateEncephalitis()" style="width:14px; height:14px; min-width:14px; accent-color: var(--primary);">
            <span style="line-height:1.2; font-weight: 500;">${s.label}</span>
        </label>
    `;
};

/**
 * Motor Algorítmico Central: Ejecuta Coseno + Gauss + Filtros Críticos + Overrides de Patognomonicidad
 */
window.updateEncephalitis = function() {
    const edadInput = document.getElementById('p-edad').value;
    if (!edadInput || isNaN(edadInput) || parseFloat(edadInput) < 0) {
        document.getElementById('results-bars-container').innerHTML = `<div style="text-align:center; font-size:0.75rem; color:var(--text-muted); padding:0.5rem;">Introduce la edad del paciente para activar el motor clínico.</div>`;
        document.getElementById('alerts-container').style.display = 'none';
        return;
    }

    const pacienteEdad = parseFloat(edadInput);
    const sintomasChecked = Array.from(document.querySelectorAll('.enceph-sintoma:checked')).map(c => c.value);
    const paraclinicosChecked = Array.from(document.querySelectorAll('.enceph-paraclinico:checked')).map(c => c.value);
    
    const totalInputsActivos = [...sintomasChecked, ...paraclinicosChecked];

    let rawScores = [];
    let totalSumScores = 0;

    // Evaluamos desde i = 0. Saltamos de forma inteligente solo si el texto contiene términos de cabecera.
    for (let i = 0; i < window.currentSheetRows.length; i++) {
        const row = window.currentSheetRows[i];
        if (!row || row.length === 0 || !row[COL_INDEX.ETIOLOGIA]) continue;

        // Protección anti-cabeceras dinámica por si viene texto descriptivo en la primera fila devuelta
        if (row[COL_INDEX.ETIOLOGIA].toLowerCase().includes('etiolog') || row[COL_INDEX.ETIOLOGIA].toLowerCase().includes('fármaco')) continue;

        const etiologia = row[COL_INDEX.ETIOLOGIA];
        const tipo = row[COL_INDEX.TIPO] || 'Desconocido';

        // 1. ANÁLISIS EXHAUSTIVO DE EDAD (Campana Gaussiana) con salvaguarda para vacíos
        const medianaEdad = parseFloat(row[COL_INDEX.MEDIANA_EDAD]) || 0;
        const sigma = (medianaEdad <= 5) ? 6 : 15; // Cohorte marcadamente pediátrica vs adulta
        const factorEdad = Math.exp(-Math.pow(pacienteEdad - medianaEdad, 2) / (2 * Math.pow(sigma, 2)));

        // 2. CONSTRUCCIÓN DE MATRIZ DE COSENO VECTORIAL
        let vectorPaciente = [];
        let vectorEnfermedad = [];
        let penalizacionAusenciaCritica = 1.0;

        for (const [key, colIdx] of Object.entries(COL_INDEX)) {
            if (colIdx >= 4) {
                const pacienteTieneSintoma = totalInputsActivos.includes(key) ? 1 : 0;
                
                // Resiliencia contra celdas vacías o caracteres no numéricos en la sábana de datos
                const celdaRaw = row[colIdx];
                const porcentajeMatriz = (celdaRaw && !isNaN(parseFloat(celdaRaw))) ? parseFloat(celdaRaw) / 100 : 0;

                vectorPaciente.push(pacienteTieneSintoma);
                vectorEnfermedad.push(porcentajeMatriz);

                // Penalización ante Ausencia Crítica: Ataca el valor predictivo negativo (Prevalencia >80%)
                if (porcentajeMatriz > 0.80 && pacienteTieneSintoma === 0) {
                    penalizacionAusenciaCritica *= 0.2;
                }
            }
        }

        // Producto escalar y módulos vectoriales
        let dotProduct = 0;
        let magPaciente = 0;
        let magEnfermedad = 0;

        for (let j = 0; j < vectorPaciente.length; j++) {
            dotProduct += vectorPaciente[j] * vectorEnfermedad[j];
            magPaciente += vectorPaciente[j] * vectorPaciente[j];
            magEnfermedad += vectorEnfermedad[j] * vectorEnfermedad[j];
        }

        let similitudCoseno = 0;
        if (magPaciente > 0 && magEnfermedad > 0) {
            similitudCoseno = dotProduct / (Math.sqrt(magPaciente) * Math.sqrt(magEnfermedad));
        }

        let scoreAjustado = similitudCoseno * factorEdad * penalizacionAusenciaCritica;

        // 3. INDEXACIÓN DE SIGNOS PATOGNOMÓNICOS (Overrides)
        if (totalInputsActivos.includes('CRISIS_FBDS') && etiologia === 'Anti-LGI1') {
            scoreAjustado *= 2.5; 
        }
        if (totalInputsActivos.includes('SIST_NERV_PERIFERICO') && etiologia === 'Anti-CASPR2') {
            scoreAjustado *= 2.0; 
        }

        rawScores.push({ etiologia, tipo, score: scoreAjustado });
        totalSumScores += scoreAjustado;
    }

    // 4. NORMALIZACIÓN BAYESIANA RELATIVA Y AJUSTE DE INTERFAZ
    let listadoFinal = rawScores.map(item => {
        const porcentajeFinal = totalSumScores > 0 ? (item.score / totalSumScores) * 100 : 0;
        return {
            etiologia: item.etiologia,
            tipo: item.tipo,
            probabilidad: parseFloat(porcentajeFinal.toFixed(1))
        };
    }).sort((a, b) => b.probabilidad - a.probabilidad);

    const barsContainer = document.getElementById('results-bars-container');
    
    if (listadoFinal.length === 0 || totalSumScores === 0) {
        barsContainer.innerHTML = `<div style="text-align:center; font-size:0.75rem; color:var(--text-muted); padding:0.5rem;">Introduce manifestaciones clínicas para calcular afinidades diferenciales.</div>`;
        document.getElementById('alerts-container').style.display = 'none';
        return;
    }

    barsContainer.innerHTML = listadoFinal.map(res => {
        const colorBarra = res.tipo === 'Infeccioso' ? '#ef4444' : '#3b82f6';
        const colorFondoBarra = res.tipo === 'Infeccioso' ? '#fee2e2' : '#dbeafe';
        
        return `
            <div style="display: flex; flex-direction: column; font-size: 0.75rem; margin-bottom: 2px;">
                <div style="display: flex; justify-content: space-between; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">
                    <span>${res.etiologia} <span style="font-size:0.6rem; font-weight:normal; color:var(--text-muted);">(${res.tipo})</span></span>
                    <span>${res.probabilidad}%</span>
                </div>
                <div style="width: 100%; background: ${colorFondoBarra}; height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${res.probabilidad}%; background: ${colorBarra}; height: 100%; transition: width 0.4s ease-out; border-radius: 4px;"></div>
                </div>
            </div>
        `;
    }).join('');

    // 5. GESTOR DE ALERTAS DE ALTO RIGOR (The Lancet 2026)
    const alertsContainer = document.getElementById('alerts-container');
    let alertasHTML = [];
    const maxEtiologia = listadoFinal[0];

    if (maxEtiologia && maxEtiologia.probabilidad > 15) {
        const rmnNormal = !totalInputsActivos.includes('RMN_PATOLOGICA');

        if ((maxEtiologia.etiologia === 'Anti-NMDAR' || maxEtiologia.etiologia === 'Anti-LGI1' || maxEtiologia.etiologia === 'Anti-CASPR2') && rmnNormal) {
            alertasHTML.push(`
                <div style="background: #fef3c7; border-left: 4px solid #d97706; padding: 0.6rem; border-radius: 6px; font-size: 0.7rem; color: #92400e; line-height:1.3; font-family:system-ui, sans-serif;">
                    ⚠️ <b>RMN Normal:</b> Una neuroimagen estructural normal NO excluye el origen autoinmune. Más del 50% de los debuts clínicos por anticuerpos comunes (NMDAR, LGI1, CASPR2) cursan con resonancias magnéticas cerebrales completamente anodinas.
                </div>
            `);
        }

        if (maxEtiologia.etiologia === 'Anti-NMDAR') {
            const pacienteSexoVaron = document.getElementById('p-sexo').checked;
            if (pacienteEdad >= 18 && pacienteEdad <= 40 && !pacienteSexoVaron) {
                alertasHTML.push(`
                    <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 0.6rem; border-radius: 6px; font-size: 0.7rem; color: #991b1b; line-height:1.3; font-family:system-ui, sans-serif;">
                        🧬 <b>Cribado Oncológico Mandatorio:</b> Se aconseja descartar de forma preferente la presencia de un teratoma ovárico mediante ecografía o TC abdominopélvica. Existe una asociación patogénica del 30% debido a que las estructuras germinales del propio tumor sintetizan los anticuerpos.
                    </div>
                `);
            } else if (pacienteEdad > 50) {
                alertasHTML.push(`
                    <div style="background: #fff1f2; border-left: 4px solid #f43f5e; padding: 0.6rem; border-radius: 6px; font-size: 0.7rem; color: #9f1239; line-height:1.3; font-family:system-ui, sans-serif;">
                        🚨 <b>Debut Geriátrico (Anti-NMDAR):</b> En pacientes mayores de 50 años la incidencia de teratomas ováricos es baja, pero cursa con un riesgo marcadamente elevado de otras neoplasias malignas sistémicas concomitantes y un peor pronóstico evolutivo global.
                    </div>
                `);
            }
        }

        if (maxEtiologia.etiologia === 'Anti-CASPR2' && totalInputsActivos.includes('SIST_NERV_PERIFERICO')) {
            alertasHTML.push(`
                <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 0.6rem; border-radius: 6px; font-size: 0.7rem; color: #1e40af; line-height:1.3; font-family:system-ui, sans-serif;">
                    🫁 <b>Asociación Paraneoplásica (Timoma):</b> Ante la presencia documentada de manifestaciones de hiperexcitabilidad axonal periférica o clínica compatible con Síndrome de Morvan, resulta indispensable realizar un TC de tórax para excluir un timoma oculto.
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
