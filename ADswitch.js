/**
 * ADswitch.js - Motor de Conmutación de Antidepresivos PSQALDÍA v3.1
 * Mapeo forzado Filas 14-25 (Índices 12-23 del fetch A2:Z500)
 */

const CONFIG_SW = {
    SHEET_NAME: 'Data_Farmacocinetica',
    COL_NOMBRE: 0,        // A
    COL_CATEGORIA: 5,     // F
    COL_MED: 8,           // I
    COL_DESESCALADA: 9,   // J
    COL_MATRIZ_INICIO: 10 // K
};

const ORDEN_MATRIZ = [
    "Sertralina", "Fluoxetina", "Paroxetina", "Escitalopram", "Citalopram", 
    "Fluvoxamina", "Duloxetina", "Venlafaxina IR", "Vortioxetina", 
    "Clomipramina", "Mirtazapina", "Trazodona"
];

window.iniciarADSwitch = async function() {
    if (!document.getElementById('switch-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'switch-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
            .calc-ui h2 { margin: 0; font-weight: 800; display: flex; align-items: center; gap: 10px; font-size: 1.2rem; color: #2563eb; }
            .calc-ui label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-top: 0.8rem; display: block; }
            .calc-ui select { width: 100%; padding: 0.9rem; border-radius: 1rem; border: 2px solid var(--border); background: var(--bg); color: var(--text-main); font-size: 1rem; outline: none; appearance: none; }
            .btn-ejecutar { margin-top: 1.5rem; padding: 1.1rem; background: #2563eb; color: white; border: none; border-radius: 1.2rem; cursor: pointer; font-weight: 900; font-size: 1.1rem; }
            .res-container { margin-top: 1.5rem; border-radius: 1.5rem; display: none; border: 1px solid rgba(0,0,0,0.08); background: white; overflow: hidden; }
            .res-pauta { padding: 1.5rem; }
            .pauta-step { display: flex; gap: 1rem; margin-bottom: 1.2rem; position: relative; }
            .pauta-step:not(:last-child)::after { content: ''; position: absolute; left: 17px; top: 35px; bottom: -15px; width: 2px; background: var(--border); opacity: 0.5; }
            .step-idx { min-width: 36px; height: 36px; background: white; border: 2px solid var(--border); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.7rem; color: #2563eb; z-index: 1; }
            .tag-farm { font-weight: 800; font-size: 0.65rem; text-transform: uppercase; padding: 3px 8px; border-radius: 6px; display: inline-block; margin-bottom: 6px; }
            .tag-orig { background: #fee2e2; color: #b91c1c; }
            .tag-dest { background: #dcfce7; color: #15803d; }
            .step-txt { font-size: 0.95rem; line-height: 1.4; color: var(--text-main); }
            .disclaimer { font-size: 0.7rem; color: var(--text-muted); padding: 1.2rem; border-top: 1px solid var(--border); background: #f8fafc; font-style: italic; }
            .btn-copiar { margin-top: 1rem; width: 100%; padding: 0.8rem; background: #f1f5f9; border: 1px solid var(--border); border-radius: 1rem; cursor: pointer; font-weight: 700; color: var(--text-main); }
        `;
        document.head.appendChild(styleTag);
    }

    try {
        const response = await fetch(`${window.WORKER_URL}?sheet=${CONFIG_SW.SHEET_NAME}`);
        const data = await response.json();
        const rows = data.values; // Array que empieza en Fila 2 (índice 0)

        // MAPEADO DIRECTO: Fila 14 es índice 12. Fila 25 es índice 23.
        const indicesAD = Array.from({length: 12}, (_, i) => i + 12);
        
        window.dbSwitch = indicesAD.map(idx => {
            const r = rows[idx];
            if (!r) return null;
            return {
                nombre: r[CONFIG_SW.COL_NOMBRE]?.toString().trim(),
                desescalada: r[CONFIG_SW.COL_DESESCALADA] ? r[CONFIG_SW.COL_DESESCALADA].split(',').map(v => v.trim()) : [],
                med: r[CONFIG_SW.COL_MED],
                filaCompleta: r 
            };
        }).filter(item => item !== null);

        console.log("Datos cargados para ADSwitch:", window.dbSwitch);
        renderInterfazSW();
    } catch (e) { console.error("Error en ADSwitch:", e); }
};

function renderInterfazSW() {
    const container = document.getElementById('modalData');
    const farmOptions = window.dbSwitch.map(f => `<option value="${f.nombre}">${f.nombre}</option>`).join('');

    container.innerHTML = `
        <div class="calc-ui">
            <h2><i class="fas fa-exchange-alt"></i> AD Switch</h2>
            <label>Fármaco de Origen</label>
            <select id="sw_orig" onchange="actualizarDosisSW('orig')">${farmOptions}</select>
            <label>Dosis Actual</label>
            <select id="sw_d_orig"></select>
            <label>Fármaco de Destino</label>
            <select id="sw_dest" onchange="actualizarDosisSW('dest')">${farmOptions}</select>
            <label>Dosis Objetivo</label>
            <select id="sw_d_target"></select>
            <button class="btn-ejecutar" onclick="ejecutarSwitch()">GENERAR PAUTA</button>
            <div id="sw-res-box" class="res-container">
                <div id="sw-res-pauta" class="res-pauta"></div>
                <div class="disclaimer">
                    Inspirado en Maudsley 15 edición, características de fármacos y experiencia clínica. En general, se propone un cambio para ámbito ambulatorio en el que se prioriza la tolerabilidad.
                </div>
            </div>
        </div>`;

    actualizarDosisSW('orig');
    actualizarDosisSW('dest');
}

window.actualizarDosisSW = function(tipo) {
    const farmNombre = document.getElementById(tipo === 'orig' ? 'sw_orig' : 'sw_dest').value;
    const farm = window.dbSwitch.find(f => f.nombre === farmNombre);
    const selector = document.getElementById(tipo === 'orig' ? 'sw_d_orig' : 'sw_d_target');
    
    if (farm && farm.desescalada.length > 0) {
        selector.innerHTML = farm.desescalada.map(d => `<option value="${d}">${d} mg</option>`).join('');
    } else {
        selector.innerHTML = `<option value="${farm.med}">${farm.med} mg (med)</option>`;
    }
};

window.ejecutarSwitch = function() {
    const nameOrig = document.getElementById('sw_orig').value;
    const nameDest = document.getElementById('sw_dest').value;
    const dActual = parseFloat(document.getElementById('sw_d_orig').value);
    const dTarget = parseFloat(document.getElementById('sw_d_target').value);

    if (nameOrig === nameDest) return alert("Selecciona fármacos distintos.");

    const farmOrig = window.dbSwitch.find(f => f.nombre === nameOrig);
    const farmDest = window.dbSwitch.find(f => f.nombre === nameDest);
    
    const colIndex = ORDEN_MATRIZ.indexOf(nameDest);
    const rawCode = farmOrig.filaCompleta[CONFIG_SW.COL_MATRIZ_INICIO + colIndex];

    if (!rawCode || rawCode === 'x') {
        document.getElementById('sw-res-box').style.display = 'block';
        document.getElementById('sw-res-pauta').innerHTML = `<p style="text-align:center; color:var(--text-muted);">No hay pauta registrada para este cruce.</p>`;
        return;
    }

    procesarGramatica(rawCode, farmOrig, farmDest, dActual, dTarget);
};

function procesarGramatica(code, fOrig, fDest, dAct, dTar) {
    let workingCode = code;
    // Condicionales [O<150]{...}
    const condRegex = /\[O([<>]=?)(\d+)\]\{(.*?)\}/g;
    let m;
    while ((m = condRegex.exec(code)) !== null) {
        const condition = `${dAct} ${m[1].replace('=','==')} ${m[2]}`;
        if (eval(condition)) workingCode = m[3];
    }

    const bloques = workingCode.split('|').map(b => b.trim());
    let hitos = [];
    let diaSincro = 1;

    bloques.forEach(bloque => {
        const p = bloque.split(':');
        if (p.length < 3) return;

        let diaLabel = p[0], sujeto = p[1], accion = p[2], extra = p[3] || "";
        let diaBase = diaLabel.startsWith('d+') ? "REL_" + diaLabel.substring(2) : (diaLabel === "@O0" ? "SYNC" : parseInt(diaLabel.substring(1)));
        
        const f = (sujeto === 'O') ? fOrig : fDest;
        const clase = (sujeto === 'O') ? 'tag-orig' : 'tag-dest';

        if (accion.includes('all')) {
            const intv = parseInt(extra) || 7;
            let lista = [...f.desescalada].map(Number);
            if (accion.includes('up')) {
                lista = lista.filter(v => v <= dTar).reverse();
            } else {
                let idx = lista.indexOf(dAct);
                lista = (idx === -1) ? lista.filter(v => v < dAct) : lista.slice(idx + 1);
                lista.push(0);
            }
            lista.forEach((dose, i) => {
                let d = (typeof diaBase === 'number') ? diaBase + (i * intv) : { tipo: diaBase, offset: i * intv };
                hitos.push({ dia: d, nombre: f.nombre, clase, dose });
                if (sujeto === 'O' && dose === 0 && typeof d === 'number') diaSincro = d;
            });
        } else {
            let dose = (accion === 'med') ? f.med : (accion === '0' ? 0 : (accion === 'obj' ? dTar : dAct));
            hitos.push({ dia: diaBase, nombre: f.nombre, clase, dose });
            if (sujeto === 'O' && dose === 0 && typeof diaBase === 'number') diaSincro = diaBase;
        }
    });

    // Resolución de días especiales
    hitos = hitos.map(h => {
        if (h.dia === "SYNC") h.dia = diaSincro;
        if (h.dia.tipo === "REL") h.dia = diaSincro + h.dia.offset;
        return h;
    }).sort((a,b) => a.dia - b.dia);

    let html = '';
    hitos.forEach(h => {
        const accionTxt = h.dose == 0 ? "<b>Suspender</b>" : `Tomar <b>${h.dose} mg</b>`;
        html += `<div class="pauta-step">
            <div class="step-idx">D. ${h.dia}</div>
            <div class="step-body">
                <span class="tag-farm ${h.clase}">${h.nombre}</span>
                <div class="step-txt">${accionTxt}</div>
            </div>
        </div>`;
    });
    
    document.getElementById('sw-res-pauta').innerHTML = html + `<button class="btn-copiar" onclick="copiarEstrategiaSW()">COPIAR ESTRATEGIA</button>`;
}

window.copiarEstrategiaSW = function() {
    let txt = "ESTRATEGIA DE CAMBIO PSQALDÍA:\n";
    document.querySelectorAll('.pauta-step').forEach(s => {
        txt += `${s.querySelector('.step-idx').innerText}: [${s.querySelector('.tag-farm').innerText}] ${s.querySelector('.step-txt').innerText}\n`;
    });
    navigator.clipboard.writeText(txt);
    alert("¡Copiado al portapapeles!");
};
