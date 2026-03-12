/**
 * ADswitch.js - Motor de Conmutación de Antidepresivos PSQALDÍA
 * Basado en lógica de matrices de Sheets y gramática de hitos temporales.
 */

const CONFIG_SW = {
    SHEET_NAME: 'Data_Farmacocinetica',
    COL_NOMBRE: 0,        // A
    COL_CATEGORIA: 5,     // F
    COL_DESESCALADA: 7,   // H
    COL_MED: 8,           // I
    COL_MATRIZ_INICIO: 10 // K (La matriz empieza en la columna 11 del array, índice 10)
};

window.currentLang = 'es';

window.iniciarADSwitch = async function() {
    const container = document.getElementById('modalData');

    // Estilos heredados y adaptados de calculadora.js
    if (!document.getElementById('switch-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'switch-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
            .calc-header { display: flex; justify-content: flex-start; align-items: center; gap: 1.5rem; margin-bottom: 1rem; }
            .calc-ui h2 { margin: 0; font-weight: 800; display: flex; align-items: center; gap: 10px; font-size: 1.2rem; color: var(--primary); }
            .lang-toggle { display: flex; background: var(--border); border-radius: 0.8rem; padding: 2px; gap: 2px; }
            .lang-btn { padding: 4px 10px; border-radius: 0.6rem; border: none; cursor: pointer; font-size: 0.7rem; font-weight: 800; background: transparent; color: var(--text-muted); transition: all 0.2s; }
            .lang-btn.active { background: white; color: var(--primary); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .calc-ui label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-top: 0.6rem; display: block; }
            .calc-ui select, .calc-ui input { width: 100%; padding: 0.9rem; border-radius: 1rem; border: 2px solid var(--border); background: var(--bg); color: var(--text-main); font-size: 1rem; outline: none; box-sizing: border-box; }
            .btn-ejecutar { margin-top: 1rem; padding: 1.1rem; background: var(--primary); color: white; border: none; border-radius: 1.2rem; cursor: pointer; font-weight: 900; font-size: 1.1rem; transition: opacity 0.2s; }
            .res-container { margin-top: 1.5rem; border-radius: 1.5rem; display: none; border: 1px solid rgba(0,0,0,0.08); overflow: hidden; background: white; }
            .res-pauta { padding: 1.5rem; }
            .pauta-step { display: flex; gap: 1rem; margin-bottom: 1.2rem; position: relative; }
            .pauta-step:not(:last-child)::after { content: ''; position: absolute; left: 17px; top: 35px; bottom: -15px; width: 2px; background: var(--border); opacity: 0.5; }
            .step-idx { min-width: 36px; height: 36px; background: white; border: 2px solid var(--border); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.7rem; z-index: 1; color: var(--primary); }
            .tag-farm { font-weight: 800; font-size: 0.65rem; text-transform: uppercase; padding: 3px 8px; border-radius: 6px; display: inline-block; margin-bottom: 6px; }
            .tag-orig { background: #fee2e2; color: #b91c1c; }
            .tag-dest { background: #dcfce7; color: #15803d; }
            .step-txt { font-size: 0.95rem; line-height: 1.4; color: var(--text-main); }
            .disclaimer { margin-top: 1.5rem; font-size: 0.7rem; color: var(--text-muted); line-height: 1.4; font-style: italic; padding: 10px; border-top: 1px solid var(--border); }
            .btn-copiar { margin-top: 1rem; width: 100%; padding: 0.8rem; background: rgba(0,0,0,0.03); border: 1px solid var(--border); border-radius: 1rem; cursor: pointer; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--text-main); }
        `;
        document.head.appendChild(styleTag);
    }

    // Carga de datos
    if (!window.dbSwitch) {
        try {
            const response = await fetch(`${window.WORKER_URL}?sheet=${CONFIG_SW.SHEET_NAME}`);
            const data = await response.json();
            const rows = data.values;

            // Filtrar solo antidepresivos
            window.dbSwitch = rows.filter(r => r[CONFIG_SW.COL_CATEGORIA] === "Antidepresivos").map(r => ({
                nombre: r[CONFIG_SW.COL_NOMBRE],
                desescalada: r[CONFIG_SW.COL_DESESCALADA] ? r[CONFIG_SW.COL_DESESCALADA].split(',').map(v => v.trim()) : [],
                med: r[CONFIG_SW.COL_MED],
                instruccionesRaw: r.slice(CONFIG_SW.COL_MATRIZ_INICIO) // Todas las celdas de la matriz desde K
            }));
            
            window.listaNombresSW = window.dbSwitch.map(d => d.nombre);
        } catch (e) { console.error("Error cargando matriz:", e); }
    }

    renderInterfazSW();
};

window.setLanguageSW = function(lang) {
    window.currentLang = lang;
    renderInterfazSW();
};

function renderInterfazSW() {
    const isEs = window.currentLang === 'es';
    const container = document.getElementById('modalData');
    if (!window.listaNombresSW) return;

    const options = window.listaNombresSW.map(n => `<option value="${n}">${n}</option>`).join('');

    container.innerHTML = `
        <div class="calc-ui">
            <div class="calc-header">
                <h2><i class="fas fa-exchange-alt"></i> AD Switch</h2>
                <div class="lang-toggle">
                    <button class="lang-btn ${isEs ? 'active' : ''}" onclick="setLanguageSW('es')">ES</button>
                    <button class="lang-btn ${!isEs ? 'active' : ''}" onclick="setLanguageSW('en')">EN</button>
                </div>
            </div>

            <label>${isEs ? 'De (Fármaco Origen)' : 'From (Origin Drug)'}</label>
            <select id="sw_orig">${options}</select>

            <label>${isEs ? 'Dosis Actual (mg/día)' : 'Current Dose (mg/day)'}</label>
            <input type="number" id="sw_d_orig" value="50">

            <label>${isEs ? 'A (Fármaco Destino)' : 'To (Target Drug)'}</label>
            <select id="sw_dest">${options}</select>

            <label>${isEs ? 'Dosis Objetivo (mg/día)' : 'Target Dose (mg/day)'}</label>
            <input type="number" id="sw_d_target" value="20">

            <button class="btn-ejecutar" onclick="ejecutarSwitch()">
                ${isEs ? 'GENERAR PAUTA' : 'GENERATE STRATEGY'}
            </button>

            <div id="sw-res-box" class="res-container">
                <div id="sw-res-pauta" class="res-pauta"></div>
                <div class="disclaimer">
                    ${isEs ? 'Inspirado en Maudsley 15 edición, características de fármacos y experiencia clínica. En general, se propone un cambio para ámbito ambulatorio en el que se prioriza la tolerabilidad.' 
                           : 'Inspired by Maudsley 15th ed, drug characteristics, and clinical experience. Generally, a switch for outpatient settings prioritizing tolerability is proposed.'}
                </div>
            </div>
        </div>`;
}

window.ejecutarSwitch = function() {
    const isEn = window.currentLang === 'en';
    const nameOrig = document.getElementById('sw_orig').value;
    const nameDest = document.getElementById('sw_dest').value;
    const dActual = parseFloat(document.getElementById('sw_d_orig').value);
    const dTarget = parseFloat(document.getElementById('sw_d_target').value);

    if (nameOrig === nameDest) {
        document.getElementById('sw-res-box').style.display = 'block';
        document.getElementById('sw-res-pauta').innerHTML = isEn ? "Same drug selected." : "Se ha seleccionado el mismo fármaco.";
        return;
    }

    const objOrig = window.dbSwitch.find(f => f.nombre === nameOrig);
    const idxDest = window.listaNombresSW.indexOf(nameDest);
    
    // Obtener la celda de la matriz
    let rawCode = objOrig.instruccionesRaw[idxDest] || "";

    if (rawCode === "x" || !rawCode) {
        document.getElementById('sw-res-box').style.display = 'block';
        document.getElementById('sw-res-pauta').innerHTML = isEn ? "No specific data for this switch." : "No hay datos específicos para este cambio.";
        return;
    }

    const pautaHtml = decodificarGramatica(rawCode, objOrig, window.dbSwitch.find(f => f.nombre === nameDest), dActual, dTarget);
    
    document.getElementById('sw-res-box').style.display = 'block';
    document.getElementById('sw-res-pauta').innerHTML = pautaHtml;
};

/**
 * EL MOTOR DE DECODIFICACIÓN
 */
function decodificarGramatica(code, farmOrig, farmDest, dActual, dTarget) {
    const isEn = window.currentLang === 'en';
    const t = {
        es: { stop: "Suspender", start: "Iniciar", reduce: "Bajar a", increase: "Subir a", obj: "Dosis objetivo", med: "Dosis mín. efectiva", day: "D." },
        en: { stop: "Discontinue", start: "Start", reduce: "Reduce to", increase: "Increase to", obj: "Target dose", med: "Min. effective dose", day: "D." }
    }[window.currentLang];

    // 1. Manejo de condicionales [O<150]{...}
    let workingCode = code;
    const condRegex = /\[O([<>]=?)(\d+)\]\{(.*?)\}/g;
    let match;
    while ((match = condRegex.exec(code)) !== null) {
        const [full, op, val, content] = match;
        const condition = `${dActual} ${op.replace('=', '==')} ${val}`;
        if (eval(condition)) {
            workingCode = workingCode.replace(full, content);
        } else {
            workingCode = workingCode.replace(full, "");
        }
    }
    // Limpiar posibles dobles pipes ||
    workingCode = workingCode.replace(/\|\|+/g, '|').replace(/^\||\|$/g, '');

    const bloques = workingCode.split('|').map(b => b.trim());
    let hitos = [];
    let diaMaxOrigin = 0;

    // Procesar bloques para construir cronograma
    bloques.forEach(bloque => {
        const parts = bloque.split(':');
        if (parts.length < 3) return;

        let diaLabel = parts[0]; 
        let sujeto = parts[1]; // O o D
        let accion = parts[2];
        let param = parts[3] || "";

        let diaInicio = 1;
        if (diaLabel.startsWith('d+')) diaInicio = "RELATIVE_" + diaLabel.replace('d+', '');
        else if (diaLabel.startsWith('d')) diaInicio = parseInt(diaLabel.substring(1));
        else if (diaLabel.startsWith('@O0')) diaInicio = "SYNC_O0";

        const dataFarm = (sujeto === 'O') ? farmOrig : farmDest;
        const nombreFarm = dataFarm.nombre;
        const tagClase = (sujeto === 'O') ? 'tag-orig' : 'tag-dest';

        // Lógica de acciones complejas
        if (accion === 'desc_all' || accion === 'desc_up_all') {
            const intervalo = parseInt(param) || 7;
            const lista = [...dataFarm.desescalada];
            if (accion === 'desc_up_all') lista.reverse();

            // Encontrar punto de inicio en la lista
            let subLista = [];
            if (accion === 'desc_all') {
                const idx = lista.findIndex(v => parseFloat(v) < dActual);
                subLista = idx === -1 ? [] : lista.slice(idx);
                subLista.push("0");
            } else {
                // Para subida, filtramos las que son menores a la objetivo
                subLista = lista.filter(v => parseFloat(v) <= dTarget);
            }

            subLista.forEach((dose, i) => {
                let d = (typeof diaInicio === 'number') ? diaInicio + (i * intervalo) : diaInicio; 
                hitos.push({ dia: d, farmaco: nombreFarm, tag: tagClase, txt: generarTextoAccion(dose, accion, t), valNum: parseFloat(dose) });
            });
        } else {
            // Acciones simples: med, 0, obj, desc_last, desc_up
            let doseFinal = "";
            if (accion === 'med') doseFinal = dataFarm.med;
            else if (accion === '0') doseFinal = "0";
            else if (accion === 'obj') doseFinal = dTarget.toString();
            else if (accion === 'desc_last') doseFinal = dataFarm.desescalada[dataFarm.desescalada.length - 1];
            else if (accion === 'desc_up') {
                // Lógica de subir un peldaño (simplificada para matriz)
                doseFinal = dTarget.toString(); 
            }

            hitos.push({ dia: diaInicio, farmaco: nombreFarm, tag: tagClase, txt: generarTextoAccion(doseFinal, accion, t), valNum: parseFloat(doseFinal) });
        }
    });

    // Resolución de SYNC y RELATIVE
    // 1. Encontrar cuándo llega el origen a 0
    let diaO0 = 1;
    hitos.forEach(h => { if(h.tag === 'tag-orig' && h.valNum === 0 && typeof h.dia === 'number') diaO0 = h.dia; });
    
    // 2. Aplicar sincronización
    hitos = hitos.map(h => {
        if (h.dia === "SYNC_O0") h.dia = diaO0;
        if (typeof h.dia === 'string' && h.dia.startsWith("RELATIVE_")) {
            // Esto es una simplificación, en un motor real necesitaría trackear el último día por sujeto
            h.dia = diaO0 + parseInt(h.dia.split('_')[1]); 
        }
        return h;
    });

    // Ordenar por día
    hitos.sort((a, b) => a.dia - b.dia);

    // Renderizar HTML
    let html = '';
    hitos.forEach(h => {
        html += `
            <div class="pauta-step">
                <div class="step-idx">${t.day} ${h.dia}</div>
                <div class="step-body">
                    <span class="tag-farm ${h.tag}">${h.farmaco}</span>
                    <div class="step-txt">${h.txt}</div>
                </div>
            </div>`;
    });

    html += `<button class="btn-copiar" onclick="copiarEstrategiaSW()"><i class="far fa-copy"></i> ${isEn ? 'COPY' : 'COPIAR'}</button>`;
    return html;
}

function generarTextoAccion(dose, type, t) {
    if (dose === "0") return `<b>${t.stop}</b>`;
    if (type === 'obj') return `${t.obj}: <b>${dose} mg</b>`;
    return `${parseFloat(dose) > 0 ? t.reduce : t.start} <b>${dose} mg</b>`;
}

window.copiarEstrategiaSW = function() {
    const isEn = window.currentLang === 'en';
    const steps = document.querySelectorAll('.pauta-step');
    let texto = (isEn ? "SWITCH STRATEGY:\n" : "ESTRATEGIA DE CAMBIO:\n") + "------------------\n";
    steps.forEach(s => {
        texto += `${s.querySelector('.step-idx').innerText}: [${s.querySelector('.tag-farm').innerText}] ${s.querySelector('.step-txt').innerText}\n`;
    });
    navigator.clipboard.writeText(texto);
    alert(isEn ? "Copied to clipboard" : "Copiado al portapapeles");
};
