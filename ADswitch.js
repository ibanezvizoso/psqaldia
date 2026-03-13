/**
 * ADswitch.js - Motor de Conmutación de Antidepresivos PSQALDÍA v5.0
 * AJUSTES: Centrado de UI, Lógica de verbos Origen/Destino, Fix Mirtazapina/Trazodona.
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

window.currentLang = 'es';

const i18n = {
    es: {
        title: "AD Switch",
        from: "Fármaco de Origen",
        currentDose: "Dosis Actual",
        to: "Fármaco de Destino",
        targetDose: "Dosis Objetivo",
        btn: "GENERAR PAUTA",
        copy: "COPIAR",
        stop: "Suspender",
        start: "Iniciar con",
        reduce: "Reducir a",
        increase: "Subir a",
        keep: "Tomar",
        target: "Dosis objetivo:",
        day: "Día",
        disclaimer: "Basado en Maudsley prescribing 15 edition, fichas técnicas y experiencia clínica. Debe considerarse como una propuesta de switch \"tipo\" para ámbito ambulatorio."
    },
    en: {
        title: "AD Switch",
        from: "Origin Drug",
        currentDose: "Current Dose",
        to: "Target Drug",
        targetDose: "Target Dose",
        btn: "GENERATE STRATEGY",
        copy: "COPY",
        stop: "Discontinue",
        start: "Start with",
        reduce: "Reduce to",
        increase: "Increase to",
        keep: "Take",
        target: "Target dose:",
        day: "Day",
        disclaimer: "Based on Maudsley prescribing 15th edition, technical data sheets and clinical experience. It should be considered as a \"standard\" switch proposal for outpatient settings."
    }
};

window.iniciarADSwitch = async function() {
    if (!document.getElementById('switch-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'switch-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; position: relative; }
            /* Cabecera centrada para evitar la X de cierre del modal */
            .calc-header { display: flex; flex-direction: column; align-items: center; gap: 0.8rem; margin-bottom: 1rem; width: 100%; }
            .calc-ui h2 { margin: 0; font-weight: 800; font-size: 1.2rem; color: #2563eb; }
            .lang-toggle { display: flex; background: #f1f5f9; border-radius: 0.8rem; padding: 2px; align-self: center; }
            .lang-btn { padding: 4px 12px; border-radius: 0.6rem; border: none; cursor: pointer; font-size: 0.7rem; font-weight: 800; color: #64748b; background: transparent; transition: all 0.2s; }
            .lang-btn.active { background: white; color: #2563eb; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            
            .calc-ui label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #64748b; margin-top: 0.8rem; }
            .calc-ui select { width: 100%; padding: 0.9rem; border-radius: 1rem; border: 2px solid #e2e8f0; font-size: 1rem; outline: none; background: #fff; appearance: none; }
            .btn-ejecutar { margin-top: 1.5rem; padding: 1.1rem; background: #2563eb; color: white; border: none; border-radius: 1.2rem; cursor: pointer; font-weight: 900; font-size: 1.1rem; }
            
            .res-container { margin-top: 1.5rem; border-radius: 1.5rem; display: none; border: 1px solid #e2e8f0; background: white; overflow: hidden; }
            .res-pauta { padding: 1.5rem; }
            .pauta-step { display: flex; gap: 1rem; margin-bottom: 1.2rem; position: relative; }
            .pauta-step:not(:last-child)::after { content: ''; position: absolute; left: 17px; top: 35px; bottom: -15px; width: 2px; background: #e2e8f0; }
            .step-idx { min-width: 36px; height: 36px; background: white; border: 2px solid #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.7rem; color: #2563eb; z-index: 1; }
            .tag-farm { font-weight: 800; font-size: 0.65rem; text-transform: uppercase; padding: 3px 8px; border-radius: 6px; display: inline-block; margin-bottom: 4px; }
            .tag-orig { background: #fee2e2; color: #b91c1c; }
            .tag-dest { background: #dcfce7; color: #15803d; }
            .step-txt { font-size: 0.95rem; line-height: 1.4; color: #1e293b; }
            .disclaimer { font-size: 0.65rem; color: #64748b; padding: 1rem; border-top: 1px solid #e2e8f0; background: #f8fafc; font-style: italic; line-height: 1.4; }
            .btn-copiar { margin-top: 1rem; width: 100%; padding: 0.8rem; background: #f1f5f9; border-radius: 1rem; border: 1px solid #e2e8f0; cursor: pointer; font-weight: 700; }
        `;
        document.head.appendChild(styleTag);
    }

    try {
        const response = await fetch(`${window.WORKER_URL}?sheet=${CONFIG_SW.SHEET_NAME}`);
        const data = await response.json();
        const rows = data.values;

        // Mapeo Filas 14 a 25
        const indicesAD = Array.from({length: 12}, (_, i) => i + 12);
        
        window.dbSwitch = indicesAD.map(idx => {
            const r = rows[idx];
            return r ? {
                nombre: r[CONFIG_SW.COL_NOMBRE]?.toString().trim(),
                desescalada: r[CONFIG_SW.COL_DESESCALADA] ? r[CONFIG_SW.COL_DESESCALADA].split(',').map(v => v.trim()) : [],
                med: r[CONFIG_SW.COL_MED],
                filaCompleta: r 
            } : null;
        }).filter(f => f !== null);

        renderInterfazSW();
    } catch (e) { console.error("Error loading data:", e); }
};

window.setLanguageSW = function(lang) {
    window.currentLang = lang;
    renderInterfazSW();
    // Si ya hay una pauta generada, se refresca
    if (document.getElementById('sw-res-box').style.display === 'block') {
        ejecutarSwitch();
    }
};

function renderInterfazSW() {
    const t = i18n[window.currentLang];
    const container = document.getElementById('modalData');
    const farmOptions = window.dbSwitch.map(f => `<option value="${f.nombre}">${f.nombre}</option>`).join('');

    container.innerHTML = `
        <div class="calc-ui">
            <div class="calc-header">
                <h2><i class="fas fa-exchange-alt"></i> ${t.title}</h2>
                <div class="lang-toggle">
                    <button class="lang-btn ${window.currentLang === 'es' ? 'active' : ''}" onclick="setLanguageSW('es')">ES</button>
                    <button class="lang-btn ${window.currentLang === 'en' ? 'active' : ''}" onclick="setLanguageSW('en')">EN</button>
                </div>
            </div>
            <label>${t.from}</label>
            <select id="sw_orig" onchange="actualizarDosisSW('orig')">${farmOptions}</select>
            <label>${t.currentDose}</label>
            <select id="sw_d_orig"></select>
            <label>${t.to}</label>
            <select id="sw_dest" onchange="actualizarDosisSW('dest')">${farmOptions}</select>
            <label>${t.targetDose}</label>
            <select id="sw_d_target"></select>
            <button class="btn-ejecutar" onclick="ejecutarSwitch()">${t.btn}</button>
            <div id="sw-res-box" class="res-container">
                <div id="sw-res-pauta" class="res-pauta"></div>
                <div class="disclaimer">${t.disclaimer}</div>
            </div>
        </div>`;
    actualizarDosisSW('orig');
    actualizarDosisSW('dest');
}

window.actualizarDosisSW = function(tipo) {
    const farmNombre = document.getElementById(tipo === 'orig' ? 'sw_orig' : 'sw_dest').value;
    const farm = window.dbSwitch.find(f => f.nombre === farmNombre);
    const selector = document.getElementById(tipo === 'orig' ? 'sw_d_orig' : 'sw_d_target');
    if (farm) {
        selector.innerHTML = farm.desescalada.map(d => `<option value="${d}">${d} mg</option>`).join('');
    }
};

window.ejecutarSwitch = function() {
    const t = i18n[window.currentLang];
    const nOrig = document.getElementById('sw_orig').value;
    const nDest = document.getElementById('sw_dest').value;
    const dAct = parseFloat(document.getElementById('sw_d_orig').value);
    const dTar = parseFloat(document.getElementById('sw_d_target').value);

    const fOrig = window.dbSwitch.find(f => f.nombre === nOrig);
    const fDest = window.dbSwitch.find(f => f.nombre === nDest);
    
    // Fix para búsqueda de columna (limpiando posibles espacios en nombres de la matriz)
    const colIdx = ORDEN_MATRIZ.map(s => s.toLowerCase()).indexOf(nDest.toLowerCase());
    const rawCode = fOrig.filaCompleta[CONFIG_SW.COL_MATRIZ_INICIO + colIdx];

    if (!rawCode || rawCode === 'x') {
        document.getElementById('sw-res-box').style.display = 'block';
        document.getElementById('sw-res-pauta').innerHTML = `<p style="text-align:center; padding: 2rem; color: #64748b;">${t.same}</p>`;
        return;
    }

    procesarGramaticaSW(rawCode.toString(), fOrig, fDest, dAct, dTar);
};

function procesarGramaticaSW(code, fOrig, fDest, dAct, dTar) {
    let workingCode = code;
    // Condicionales [O<150]{...}
    const condRegex = /\[O([<>]=?)(\d+)\]\{(.*?)\}/g;
    let m;
    while ((m = condRegex.exec(code)) !== null) {
        const op = m[1].replace('=', '==');
        if (eval(`${dAct} ${op} ${m[2]}`)) {
            workingCode = m[3];
        }
    }

    const bloques = workingCode.split('|').map(b => b.trim()).filter(Boolean);
    let hitos = [];
    let ultimoDia = 1;

    bloques.forEach(bloque => {
        const p = bloque.split(':');
        if (p.length < 3) return;

        let diaLabel = p[0], sujeto = p[1], accion = p[2], extra = p[3] || "";
        const farmObj = (sujeto === 'O') ? fOrig : fDest;
        const clase = (sujeto === 'O') ? 'tag-orig' : 'tag-dest';
        
        let diaInicio;
        if (diaLabel.startsWith('d+')) diaInicio = ultimoDia + parseInt(diaLabel.substring(2));
        else if (diaLabel === "@O0") {
            const hO0 = hitos.find(h => h.tag === 'tag-orig' && h.dose === 0);
            diaInicio = hO0 ? hO0.dia : ultimoDia;
        } else diaInicio = parseInt(diaLabel.substring(1));

        if (accion.includes('all') || accion === 'desc_up' || accion === 'desc_auto') {
            const intv = parseInt(extra) || (accion.includes('up') ? 2 : 7);
            let lista = [...farmObj.desescalada].map(Number);
            
            if (accion.includes('up')) {
                const hUlt = [...hitos].reverse().find(h => h.nombre === farmObj.nombre);
                let actualEnCuerpo = hUlt ? Number(hUlt.dose) : 0;
                let pasos = lista.filter(v => v > actualEnCuerpo && v <= dTar).sort((a,b) => a-b);
                pasos.forEach((dose, i) => {
                    let d = diaInicio + (i * intv);
                    hitos.push({ dia: d, nombre: farmObj.nombre, tag: clase, dose, tipo: 'VAL' });
                    ultimoDia = Math.max(ultimoDia, d);
                });
            } else {
                let idx = lista.indexOf(dAct);
                let pasos = (idx === -1) ? lista.filter(v => v < dAct) : lista.slice(idx + 1);
                pasos.forEach((dose, i) => {
                    let d = diaInicio + (i * intv);
                    hitos.push({ dia: d, nombre: farmObj.nombre, tag: clase, dose, tipo: 'VAL' });
                    ultimoDia = Math.max(ultimoDia, d);
                });
                let dFin = diaInicio + (pasos.length * intv);
                hitos.push({ dia: dFin, nombre: farmObj.nombre, tag: clase, dose: 0, tipo: 'STOP' });
                ultimoDia = Math.max(ultimoDia, dFin);
            }
        } else {
            let dose = (accion === 'med') ? farmObj.med : (accion === '0' ? 0 : (accion === 'obj' ? dTar : (accion === 'desc_last' ? farmObj.desescalada[farmObj.desescalada.length-1] : dAct)));
            let tipo = (dose == 0) ? 'STOP' : (accion === 'obj' ? 'OBJ' : 'VAL');
            hitos.push({ dia: diaInicio, nombre: farmObj.nombre, tag: clase, dose, tipo });
            ultimoDia = Math.max(ultimoDia, diaInicio);
        }
    });

    hitos.sort((a, b) => a.dia - b.dia);
    renderPautaSW(hitos, dTar, dAct);
}

function renderPautaSW(hitos, dTar, dActOrigen) {
    const t = i18n[window.currentLang];
    let html = '';
    let started = {}; // Control de inicio para Destino solamente

    hitos.forEach(h => {
        let accionTxt = "";
        let doseNum = Number(h.dose);

        if (h.tag === 'tag-orig') {
            // Lógica para ORIGEN: Nunca usa "Iniciar". Solo Reducir, Tomar o Suspender.
            if (h.tipo === 'STOP') {
                accionTxt = `<b>${t.stop}</b>`;
            } else if (doseNum < dActOrigen) {
                accionTxt = `${t.reduce} <b>${doseNum} mg</b>`;
            } else {
                accionTxt = `${t.keep} <b>${doseNum} mg</b>`;
            }
        } else {
            // Lógica para DESTINO: Iniciar, Subir, Reducir o Objetivo.
            if (h.tipo === 'STOP') {
                accionTxt = `<b>${t.stop}</b>`;
            } else if (h.tipo === 'OBJ' || doseNum === dTar) {
                accionTxt = `${t.target} <b>${doseNum} mg</b>`;
            } else {
                if (!started[h.nombre] && doseNum > 0) {
                    accionTxt = `${t.start} <b>${doseNum} mg</b>`;
                    started[h.nombre] = doseNum;
                } else {
                    let prevDose = started[h.nombre] || 0;
                    if (doseNum > prevDose) accionTxt = `${t.increase} <b>${doseNum} mg</b>`;
                    else if (doseNum < prevDose) accionTxt = `${t.reduce} <b>${doseNum} mg</b>`;
                    else accionTxt = `${t.keep} <b>${doseNum} mg</b>`;
                    started[h.nombre] = doseNum;
                }
            }
        }

        html += `<div class="pauta-step">
            <div class="step-idx">${t.day} ${h.dia}</div>
            <div class="step-body">
                <span class="tag-farm ${h.tag}">${h.nombre}</span>
                <div class="step-txt">${accionTxt}</div>
            </div>
        </div>`;
    });
    document.getElementById('sw-res-box').style.display = 'block';
    document.getElementById('sw-res-pauta').innerHTML = html + `<button class="btn-copiar" onclick="copiarEstrategiaSW()">${t.copy}</button>`;
}

window.copiarEstrategiaSW = function() {
    let txt = `AD SWITCH PSQALDÍA:\n`;
    document.querySelectorAll('.pauta-step').forEach(s => {
        txt += `${s.querySelector('.step-idx').innerText}: [${s.querySelector('.tag-farm').innerText}] ${s.querySelector('.step-txt').innerText}\n`;
    });
    navigator.clipboard.writeText(txt);
    alert(i18n[window.currentLang].copied);
};
