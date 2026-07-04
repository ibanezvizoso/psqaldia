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
        { id: 'FIEBRE', label: 'Fiebre o febrícula' },
        { id: 'CEFALEA', label: 'Cefalea' },
        { id: 'SINT_MENINGEOS', label: 'Signos meníngeos (rigidez de nuca, Kernig/Brudzinski)' },
        { id: 'RESPIRATORIO', label: 'Pródromo viral (respiratorio o gastrointestinal)' },
        { id: 'ALT_MENTAL_PSQ', label: 'Alteración del estado mental / Síntomas psicóticos acentuados' },
        { id: 'CRISIS_COMICIALES', label: 'Crisis epilépticas (focales o generalizadas)' },
        { id: 'FOCALIDAD', label: 'Déficit neurológico focal (paresias, afasia, etc.)' },
        { id: 'VOMITOS', label: 'Náuseas / Vómitos' },
        { id: 'RASH', label: 'Exantema / Erupción cutánea vesicular' },
        { id: 'CRISIS_FBDS', label: 'Crisis distónicas faciobraquiales (FBDS)' },
        { id: 'COGNITIVO_AMNESIA', label: 'Déficit cognitivo agudo / Amnesia anterógrada marcada' },
        { id: 'SIST_NERV_PERIFERICO', label: 'Síntomas del SNP (neuromiotonía o hiperexcitabilidad)' },
        { id: 'DISAUTONOMIA', label: 'Disfunción autonómica (inestabilidad cardiovascular o sudoración)' },
        { id: 'NIVEL_CON', label: 'Alteración del nivel de conciencia (somnolencia, estupor o coma)' },
        { id: 'TRAST_MOVIMIENTO', label: 'Trastornos del movimiento complejos (corea, disquinesias) / Catatonia' },
        { id: 'ALT_SUENO', label: 'Trastorno del sueño grave (insomnio agudo pertinaz / agitación nocturna)' },
        { id: 'HIPONATREMIA', label: 'Hiponatremia sistémica' }
    ],
    paraclinicos: [
        { id: 'RMN_PATOLOGICA', label: 'RM cerebral anómala (hiperintensidades en T2/FLAIR en lóbulo temporal mesial u otras regiones)' },
        { id: 'LCR_PATOLOGICO', label: 'LCR patológico (pleocitosis >5 cél/µL o hiperproteinorraquia)' },
        { id: 'EEG_PATOLOGICO', label: 'EEG anómalo (enlentecimiento focal/difuso o actividad epileptiforme)' }
    ]
};

// Mapeo riguroso de índices de columnas de la hoja "encefalitisDD"
// Nota: Se conserva BLANCO para mantener la integridad de índices del Sheets original sin romper la lectura.
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
    'JEV': 'Neurotropismo marcado por tálamo y ganglios basales; frecuente disfunción extrapiramidal. Principal etiología epidémica en Asia.',
    'HSV-1': 'Distribución de edad bimodal. Afectación necrótica del lóbulo temporal. El tratamiento precoz con aciclovir reduce drásticamente la morbimortalidad.',
    'WNV': 'Puede provocar afectación experimental de astas anteriores medulares causando parálisis flácida asimétrica aguda.',
    'Enterovirus': 'Mayor incidencia en la infancia; subtipos como el EV-A71 muestran predilección por el tronco del encéfalo.',
    'VZV': 'Asociada frecuentemente a vasculopatía mediada por virus (riesgo de ictus isquémico o hemorrágico concomitante).',
    'Anti-LGI1': 'Típica en varones >60 años. Cursa con crisis distónicas faciobraquiales patognomónicas e hiponatremia refractaria (SIADH).',
    'Anti-CASPR2': 'Predominio en varones. Mayor asociación a disautonomía, afectación de nervio periférico y riesgo de timoma concomitante (Síndrome de Morvan).',
    'Anti-NMDAR': 'Frecuente en mujeres jóvenes. Presentación psicopatológica abigarrada inicial que progresa a disquinesias faciales y catatonia. Cribado obligatorio de teratoma ovárico.',
    'Anti-MOG': 'Elevada prevalencia en población pediátrica. RM característica con lesiones desmielinizantes corticales/subcorticales difusas; asocia frecuentemente neuritis óptica.'
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
 * Renderiza la interfaz limpia y simplificada dentro del modal
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
                        <button type="button" id="btn-sexo-varon" onclick="window.setSexoPaciente('varon')" style="flex:1; padding:5px; border-radius:6px; border:none; background:#166534; font-size:0.7rem; font-weight:700; color:#fff; cursor:pointer; outline:none; transition:0.1s;">Hombre</button>
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
                <div style="font-size:0.65rem; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:0.3rem; text-align:center; letter-spacing: 0.6px;">Índice de Similitud Fenotípica Relativa</div>
                <div id="results-bars-container" style="display: flex; flex-direction: column; gap: 7px;"></div>
                <div id="discriminacion-warning" style="display:none; margin-top:0.5rem; font-size:0.68rem; color:#b91c1c; background:#fef2f2; border-left:3px solid #ef4444; padding:0.6rem; border-radius:4px; line-height:1.4;"></div>
            </div>

            <div id="alerts-container" style="display:none; flex-direction: column; gap: 6px;"></div>

            <div style="margin-top:0.8rem; border-top:1px dashed var(--border, #e2e8f0); padding-top:0.8rem; font-size:0.65rem; color:var(--text-muted, #64748b); text-align:justify; line-height:1.5; font-style: italic;">
                <b>Nota científica y metodológica:</b> Esta herramienta orientativa calcula la aproximación fenotípica multivariable mediante Similitud de Coseno. Los pesos específicos están aproximados según la distribución clínica reportada por Binks et al. en el seminario de revisión de <i>The Lancet</i> (2026). El índice refleja la afinidad clínica pretest frente a perfiles típicos de la literatura médica indexada para soporte docente en el diagnóstico diferencial. No reemplaza en ningún caso el juicio clínico independiente ni la confirmación serológica/molecular (PCR, anticuerpos específicos en LCR/suero).
            </div>
        </div>
    `;

    window.encephSexoPaciente = 'varon';
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

window.calcularFactorEdad = function(etiologia, medianaEdadFila, edadPaciente) {
    if (PERFILES_EDAD_BIMODAL[etiologia]) {
        const picos = PERFILES_EDAD_BIMODAL[etiologia];
        return Math.max(...picos.map(p => Math.exp(-Math.pow(edadPaciente - p.mediana, 2) / (2 * Math.pow(p.sigma, 2)))));
    }
    const sigma = (medianaEdadFila <= 5) ? 6 : 15; 
    return Math.exp(-Math.pow(edadPaciente - medianaEdadFila, 2) / (2 * Math.pow(sigma, 2)));
};

window.calcularFactorSexo = function(pctVaronFila, sexoPaciente) {
    if (pctVaronFila === null || isNaN(pctVaronFila)) return 1;
    const afinidad = (sexoPaciente === 'varon') ? (pctVaronFila / 100) : (1 - pctVaronFila / 100);
    return 0.4 + 0.6 * afinidad;
};

/**
 * Motor Algorítmico Central de PSQ al día
 */
window.updateEncephalitis = function() {
    const edadInput = document.getElementById('p-edad').value;
    const sexoPaciente = window.encephSexoPaciente || 'varon';

    if (!edadInput || isNaN(edadInput) || parseFloat(edadInput) < 0) {
        alert("Por favor, introduce una edad válida para realizar la evaluación.");
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
    
    let sumaUserCuadrado = 0;
    todosLosCampos.forEach(f => {
        sumaUserCuadrado += Math.pow(sintomasSeleccionados[f.id], 2);
    });

    if (!window.currentSheetRows || window.currentSheetRows.length === 0) {
        alert("Base de datos no disponible temporalmente.");
        return;
    }

    const resultados = [];
    const primeraCelda = String(window.currentSheetRows[0]?.[0]).toUpperCase().trim();
    const inicioFila = (primeraCelda === 'ETIOLOGIA' || primeraCelda === 'ETIOLOGÍA') ? 1 : 0;

    // 2. Iterar sobre las filas fenotípicas de la hoja
    for (let i = inicioFila; i < window.currentSheetRows.length; i++) {
        const row = window.currentSheetRows[i];
        if (!row || row.length === 0 || !row[COL_INDEX.ETIOLOGIA]) continue;

        const etiologia = row[COL_INDEX.ETIOLOGIA].trim();
        const tipo = row[COL_INDEX.TIPO] || 'Desconocido';
        const medianaEdadFila = parseFloat(row[COL_INDEX.MEDIANA_EDAD]) || 0;
        const pctVaronFila = parseFloat(row[COL_INDEX.PCT_VARON]) || null;

        // Factores demográficos basados estrictamente en el Lancet Seminar
        const fEdad = window.calcularFactorEdad(etiologia, medianaEdadFila, edadPaciente);
        const fSexo = window.calcularFactorSexo(pctVaronFila, sexoPaciente);
        const multDemografico = fEdad * fSexo;

        // Similitud de Coseno en subespacios vectoriales
        let dotProduct = 0;
        let sumaEtiolCuadrado = 0;

        todosLosCampos.forEach(f => {
            const idx = COL_INDEX[f.id];
            let valCelda = parseFloat(row[idx]);
            
            // Mitigación robusta de celdas vacías o lógicas booleanas de Sheets
            if (isNaN(valCelda)) {
                const celdaStr = String(row[idx] || '').toUpperCase().trim();
                valCelda = (celdaStr === 'TRUE' || celdaStr === '1') ? 100 : 0;
            }
            
            const valEtiol = valCelda / 100; // Normalización a rango [0, 1]
            const valUser = sintomasSeleccionados[f.id];

            dotProduct += valUser * valEtiol;
            sumaEtiolCuadrado += Math.pow(valEtiol, 2);
        });

        let similitudCoseno = 0;
        if (sumaUserCuadrado > 0 && sumaEtiolCuadrado > 0) {
            similitudCoseno = dotProduct / (Math.sqrt(sumaUserCuadrado) * Math.sqrt(sumaEtiolCuadrado));
        }

        // Ponderación integrada final
        const afinidadRelativa = similitudCoseno * multDemografico * 100;

        resultados.push({
            etiologia: etiologia,
            tipo: tipo,
            afinidad: afinidadRelativa,
            descripcion: DESCRIPCIONES_BREVES[etiologia] || ''
        });
    }

    // 3. Ordenación descendente por afinidad
    resultados.sort((a, b) => b.afinidad - a.afinidad);

    // 4. Renderización dinámica en los paneles
    const resultsPanel = document.getElementById('results-panel');
    const containerBars = document.getElementById('results-bars-container');
    const warningBox = document.getElementById('discriminacion-warning');
    const alertsContainer = document.getElementById('alerts-container');

    resultsPanel.style.display = 'flex';
    containerBars.innerHTML = '';
    alertsContainer.innerHTML = '';
    alertsContainer.style.display = 'none';

    if (resultados.length === 0 || (sumaUserCuadrado === 0 && resultados[0].afinidad === 0)) {
        containerBars.innerHTML = '<div style="font-size:0.72rem; color:var(--text-muted); text-align:center; padding:10px;">Selecciona al menos una manifestación clínica para iniciar la alineación estructural.</div>';
        return;
    }

    resultados.forEach(res => {
        let barColor = '#a78bfa'; // Violeta corporativo
        if (res.tipo.toLowerCase().includes('inmune') || res.tipo.toLowerCase().includes('auto')) {
            barColor = '#3b82f6'; // Azul autoinmune
        } else if (res.tipo.toLowerCase().includes('viral') || res.tipo.toLowerCase().includes('infec')) {
            barColor = '#ef4444'; // Rojo infeccioso
        }

        const barHtml = `
            <div style="display: flex; flex-direction: column; gap: 2px; margin-bottom: 2px;">
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; font-weight: 700; color: var(--text-main, #1e293b);">
                    <span>${res.etiologia} <span style="font-size:0.58rem; color:var(--text-muted, #64748b); font-weight:500;">(${res.tipo})</span></span>
                    <span style="color:${barColor}; font-weight:800;">${res.afinidad.toFixed(1)}%</span>
                </div>
                <div style="width: 100%; height: 7px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${Math.min(res.afinidad, 100)}%; height: 100%; background: ${barColor}; transition: width 0.3s ease-in-out;"></div>
                </div>
                ${res.descripcion ? `<div style="font-size: 0.62rem; color: #64748b; line-height: 1.2; font-style: italic; margin-top: 1px;">${res.descripcion}</div>` : ''}
            </div>
        `;
        containerBars.insertAdjacentHTML('beforeend', barHtml);
    });

    // 5. Alertas críticas dirigidas según Lancet Seminar
    let alertasHtml = '';
    const topResult = resultados[0];

    if (topResult && topResult.afinidad > 15) {
        if (topResult.etiologia === 'Anti-NMDAR' && edadPaciente >= 18 && edadPaciente <= 40 && sexoPaciente === 'mujer') {
            alertasHtml += `
                <div style="background:#fef2f2; border:1px solid #fca5a5; border-radius:12px; padding:0.7rem 0.9rem; font-size:0.7rem; color:#991b1b; line-height:1.45;">
                    <span style="font-weight:800; text-transform:uppercase; display:block; margin-bottom: 2px;"><i class="fas fa-exclamation-circle"></i> Alerta de Cribado Oncológico</span>
                    Alta afinidad por sospecha de encefalitis <b>Anti-NMDAR</b> en mujer joven. Se aconseja priorizar cribado urgente de <b>teratoma ovárico</b> mediante ecografía transvaginal y/o RM pélvica.
                </div>
            `;
        }
        if (topResult.etiologia === 'Anti-LGI1' && sintomasSeleccionados['HIPONATREMIA']) {
            alertasHtml += `
                <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:0.7rem 0.9rem; font-size:0.7rem; color:#1e40af; line-height:1.45;">
                    <span style="font-weight:800; text-transform:uppercase; display:block; margin-bottom: 2px;"><i class="fas fa-info-circle"></i> Correlación Clinico-Analítica</span>
                    La presentación combinada de alta afinidad por <b>Anti-LGI1</b> e <b>Hiponatremia</b> sistémica apoya fuertemente la sospecha diagnóstica. Monitorice natremia basal y rastree activamente crisis distónicas distales sutiles.
                </div>
            `;
        }
        if (topResult.etiologia === 'HSV-1' && !sintomasSeleccionados['LCR_PATOLOGICO']) {
            alertasHtml += `
                <div style="background:#fff5f5; border:1px solid #feb2b2; border-radius:12px; padding:0.7rem 0.9rem; font-size:0.7rem; color:#c53030; line-height:1.45;">
                    <span style="font-weight:800; text-transform:uppercase; display:block; margin-bottom: 2px;"><i class="fas fa-clock"></i> Urgencia Terapéutica</span>
                    Ante sospecha clínica moderada-alta de encefalitis por <b>HSV-1</b>, la instauración de <b>Aciclovir iv empírico</b> es prioritaria y no debe demorarse a la espera de la punción lumbar o resultados de neuroimagen.
                </div>
            `;
        }
    }

    if (alertasHtml) {
        alertsContainer.innerHTML = alertasHtml;
        alertsContainer.style.display = 'flex';
    }

    // 6. Mensaje dinámico de discriminación diagnóstica (Corrección de error de propiedad .style.style)
    if (resultados.length > 1 && (resultados[0].afinidad - resultados[1].afinidad) < 10 && resultados[0].afinidad > 5) {
        warningBox.innerHTML = `<i class="fas fa-random"></i> <b>Solapamiento fenotípico estrecho</b> entre ${resultados[0].etiologia} y ${resultados[1].etiologia} (diferencia menor al 10%). Se sugiere ampliar el estudio diferencial mediante PCR multiplex viral ampliada en LCR y panel extendido de autoanticuerpos neuronales en suero y LCR.`;
        warningBox.style.display = 'block';
    } else {
        warningBox.style.display = 'none';
    }
};
