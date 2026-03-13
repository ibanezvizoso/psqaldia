/**
 * ADswitch.js - Motor de Conmutación de Antidepresivos PSQALDÍA v11.0
 * FIX: Escalada progresiva garantizada (todos los pasos) si se indica intervalo (:X).
 * FIX: Sincronización de días d+X corregida.
 * FIX: Soporte para bloques cortos (D:obj) sin pérdida de día.
 */

const CONFIG_SW = {
    SHEET_NAME: 'Data_Farmacocinetica',
    COL_NOMBRE: 0,
    COL_CATEGORIA: 5,
    COL_MED: 8,
    COL_DESESCALADA: 9,
    COL_MATRIZ_INICIO: 10
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
        copied: "¡Copiado al portapapeles!",
        disclaimer: "Basado en The Maudsley's Prescribing Guidelines 15th edition, fichas técnicas y experiencia clínica. Debe considerarse como una propuesta de switch \"tipo\" para ámbito ambulatorio."
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
        copied: "Copied to clipboard!",
        disclaimer: "Based on The Maudsley's Prescribing Guidelines 15th edition, technical data sheets and clinical experience."
    }
};

window.iniciarADSwitch = async function() {
    if (!document.getElementById('switch-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'switch-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
            .calc-header { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; margin-bottom: 1.5rem; width: 100%; }
            .calc-ui h2 { margin: 0; font-weight: 800; font-size: 1.2rem; color: #2563eb; grid-column: 1; }
            .lang-toggle { display: flex; background: #f1f5f9; border-radius: 0.8rem; padding: 2px; grid-column: 2; }
            .lang-btn { padding: 4px 12px; border-radius: 0.6rem; border: none; cursor: pointer; font-size: 0.7rem; font-weight: 800; color: #64748b; background: transparent; }
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
        const indicesAD = Array.from({length: 12}, (_, i) => i + 12);
        
        window.dbSwitch = indicesAD.map(idx => {
            const r = rows[idx];
            return r ? {
                nombre: r[CONFIG_SW.COL_NOMBRE]?.toString().trim(),
                desescalada: r[CONFIG_SW.COL_DESESCALADA] ? r[CONFIG_SW.COL_DESESCALADA].split(',').map(v => v.trim()) : [],
                med: parseFloat(r[CONFIG_SW.COL_MED]),
                filaCompleta: r 
            } : null;
        }).filter(f => f !== null);

        renderInterfazSW();
    } catch (e) { console.error("Error loading data:", e); }
};

window.setLanguageSW = function(lang) {
    window.currentLang = lang;
    renderInterfazSW();
    if (document.getElementById('sw-res-box').style.display === 'block') ejecutarSwitch();
};

function renderInterfazSW() {
    const t = i18n[window.currentLang];
    const container = document.getElementById('modalData');
    const farmOptions = window.dbSwitch.map(f => `<option value="${f.nombre}">${f.nombre}</option>`).join('');

    container.innerHTML = `
        <div class="calc-ui">
            <div class="calc-header">
                <h2>${t.title}</h2>
                <div class="lang-toggle">
                    <button class="lang-btn ${window.currentLang === 'es' ? 'active' : ''}" onclick="setLanguageSW('es')">ES</button>
                    <button class="lang-btn ${window.currentLang === 'en' ? 'active' : ''}" onclick="setLanguageSW('en')">EN</button>
                </div>
                <div></div>
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
    const nOrig = document.getElementById('sw_orig').value;
    const nDest = document.getElementById('sw_dest').value;
    const dAct = parseFloat(document.getElementById('sw_d_orig').value);
    const dTar = parseFloat(document.getElementById('sw_d_target').value);

    const fOrig = window.dbSwitch.find(f => f.nombre === nOrig);
    const fDest = window.dbSwitch.find(f => f.nombre === nDest);
    
    const colIdx = ORDEN_MATRIZ.map(s => s.toLowerCase()).indexOf(nDest.toLowerCase());
    const rawCode = fOrig.filaCompleta[CONFIG_SW.COL_MATRIZ_INICIO + colIdx];

    if (!rawCode || rawCode === 'x') {
        document.getElementById('sw-res-box').style.display = 'block';
        document.getElementById('sw-res-pauta').innerHTML = `<p style="text-align:center; padding: 2rem; color: #64748b;">Mismo fármaco o cambio no requiere pauta especial.</p>`;
        return;
    }
    procesarGramaticaSW(rawCode.toString(), fOrig, fDest, dAct, dTar);
};

function procesarGramaticaSW(code, fOrig, fDest, dAct, dTar) {
    let workingCode = code;
    // Condicionales [O<150]{...}
    const matches = [...code.matchAll(/\[O([<>]=?)(\d+)\]\{(.*?)\}/g)];
    matches.forEach(m => {
        const op = m[1].replace('=', '==');
        if (eval(`${dAct} ${op} ${m[2]}`)) workingCode = workingCode.replace(m[0], m[3]);
        else workingCode = workingCode.replace(m[0], "");
    });

    const bloques = workingCode.split('|').map(b => b.trim()).filter(Boolean);
    let hitos = [];
    let ultimoDiaGlobal = 1;
    let estadoDosis = { [fOrig.nombre]: dAct, [fDest.nombre]: 0 };

    bloques.forEach(bloque => {
        const p = bloque.split(':');
        let diaLabel, sujeto, accion, extra = "";

        // SOPORTE BLOQUES 2 PARTES (D:obj)
        if (p.length === 2) {
            sujeto = p[0]; accion = p[1]; diaLabel = "d" + ultimoDiaGlobal;
        } else if (p.length >= 3) {
            diaLabel = p[0]; sujeto = p[1]; accion = p[2]; extra = p[3] || "";
        } else return;

        const farmObj = (sujeto === 'O') ? fOrig : fDest;
        const clase = (sujeto === 'O') ? 'tag-orig' : 'tag-dest';
        const lista = farmObj.desescalada.map(Number);
        
        let diaInicio;
        if (diaLabel.startsWith('d+')) diaInicio = ultimoDiaGlobal + parseInt(diaLabel.substring(2));
        else if (diaLabel === "@O0") {
            const hO0 = hitos.find(h => h.tag === 'tag-orig' && h.dose === 0);
            diaInicio = hO0 ? hO0.dia : ultimoDiaGlobal;
        } else diaInicio = parseInt(diaLabel.substring(1)) || ultimoDiaGlobal;

        if (accion.includes('desc_up') || accion.includes('desc_auto') || accion.includes('all')) {
            const intv = parseInt(extra) || (accion.includes(':') ? parseInt(accion.split(':')[1]) : 7);
            let current = estadoDosis[farmObj.nombre];
            
            if (accion.includes('up')) {
                // ESCALADA COMPLETA (Clomipramina Fix)
                let pasos = lista.filter(v => v > current && v <= dTar).sort((a,b) => a-b);
                if (pasos.length > 0) {
                    // Si hay intervalo (:X) o dice 'all', se hacen todos. Si no, solo uno.
                    const hacerTodos = extra !== "" || accion.includes('all') || accion.includes(':');
                    if (!hacerTodos) pasos = [pasos[0]];
                    
                    pasos.forEach((dose, i) => {
                        let d = diaInicio + (i * intv);
                        hitos.push({ dia: d, nombre: farmObj.nombre, tag: clase, dose, tipo: (dose === dTar ? 'OBJ' : 'VAL') });
                        ultimoDiaGlobal = Math.max(ultimoDiaGlobal, d);
                        estadoDosis[farmObj.nombre] = dose;
                    });
                }
            } else {
                // DESESCALADA COMPLETA
                let idx = lista.indexOf(current);
                let pasos = (idx === -1) ? lista.filter(v => v < current).sort((a,b) => b-a) : lista.slice(idx + 1);
                if (pasos.length > 0) {
                    const hacerTodos = extra !== "" || accion.includes('all') || accion.includes(':');
                    if (!hacerTodos) {
                        hitos.push({ dia: diaInicio, nombre: farmObj.nombre, tag: clase, dose: pasos[0], tipo: 'VAL' });
                        ultimoDiaGlobal = Math.max(ultimoDiaGlobal, diaInicio);
                        estadoDosis[farmObj.nombre] = pasos[0];
                    } else {
                        pasos.forEach((dose, i) => {
                            let d = diaInicio + (i * intv);
                            hitos.push({ dia: d, nombre: farmObj.nombre, tag: clase, dose, tipo: 'VAL' });
                            ultimoDiaGlobal = Math.max(ultimoDiaGlobal, d);
                            estadoDosis[farmObj.nombre] = dose;
                        });
                        // Asegurar el Suspender (0)
                        if (estadoDosis[farmObj.nombre] > 0) {
                            let dFin = ultimoDiaGlobal + intv;
                            hitos.push({ dia: dFin, nombre: farmObj.nombre, tag: clase, dose: 0, tipo: 'STOP' });
                            ultimoDiaGlobal = dFin;
                            estadoDosis[farmObj.nombre] = 0;
                        }
                    }
                }
            }
        } else {
            // DOSIS FIJAS
            let dose;
            if (!isNaN(accion) && accion.trim() !== "") dose = parseFloat(accion);
            else if (accion === 'med') dose = farmObj.med;
            else if (accion === '0') dose = 0;
            else if (accion === 'obj') dose = dTar;
            else if (accion === 'desc_last') dose = parseFloat(farmObj.desescalada[farmObj.desescalada.length-1]);
            else dose = estadoDosis[farmObj.nombre];

            hitos.push({ dia: diaInicio, nombre: farmObj.nombre, tag: clase, dose, tipo: (dose === 0 ? 'STOP' : (dose === dTar ? 'OBJ' : 'VAL')) });
            ultimoDiaGlobal = Math.max(ultimoDiaGlobal, diaInicio);
            estadoDosis[farmObj.nombre] = dose;
        }
    });

    hitos.sort((a, b) => a.dia - b.dia);
    renderPautaSW(hitos, dTar, dAct);
}

function renderPautaSW(hitos, dTar, dActOrigen) {
    const t = i18n[window.currentLang];
    let html = '';
    let memory = {}; 

    hitos.forEach(h => {
        let accionTxt = "";
        let doseNum = Number(h.dose);

        if (h.tag === 'tag-orig') {
            if (h.dose === 0) accionTxt = `<b>${t.stop}</b>`;
            else if (doseNum < dActOrigen) accionTxt = `${t.reduce} <b>${doseNum} mg</b>`;
            else accionTxt = `${t.keep} <b>${doseNum} mg</b>`;
        } else {
            if (h.dose === 0) accionTxt = `<b>${t.stop}</b>`;
            else if (h.tipo === 'OBJ' || doseNum === dTar) accionTxt = `${t.target} <b>${doseNum} mg</b>`;
            else {
                if (memory[h.nombre] === undefined) {
                    accionTxt = `${t.start} <b>${doseNum} mg</b>`;
                } else {
                    if (doseNum > memory[h.nombre]) accionTxt = `${t.increase} <b>${doseNum} mg</b>`;
                    else if (doseNum < memory[h.nombre]) accionTxt = `${t.reduce} <b>${doseNum} mg</b>`;
                    else accionTxt = `${t.keep} <b>${doseNum} mg</b>`;
                }
            }
            memory[h.nombre] = doseNum;
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
