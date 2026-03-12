/**
 * ADswitch.js - Motor de Conmutación de Antidepresivos PSQALDÍA v3.5
 * Soporte Bilingüe + Lógica de Matriz K14:V25
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

// Estado global de idioma
window.currentLang = 'es';

const i18n = {
    es: {
        title: "AD Switch",
        from: "Fármaco de Origen",
        currentDose: "Dosis Actual",
        to: "Fármaco de Destino",
        targetDose: "Dosis Objetivo",
        btn: "GENERAR PAUTA",
        copy: "COPIAR ESTRATEGIA",
        copied: "¡Copiado!",
        stop: "Suspender",
        start: "Iniciar con",
        reduce: "Reducir a",
        increase: "Subir a",
        reach: "Alcanzar dosis objetivo:",
        same: "Mismo fármaco o pauta no definida.",
        day: "Día",
        disclaimer: "Inspirado en Maudsley 15 edición, características de fármacos y experiencia clínica. En general, se propone un cambio para ámbito ambulatorio en el que se prioriza la tolerabilidad."
    },
    en: {
        title: "AD Switch",
        from: "Origin Drug",
        currentDose: "Current Dose",
        to: "Target Drug",
        targetDose: "Target Dose",
        btn: "GENERATE STRATEGY",
        copy: "COPY STRATEGY",
        copied: "Copied!",
        stop: "Discontinue",
        start: "Start with",
        reduce: "Reduce to",
        increase: "Increase to",
        reach: "Reach target dose:",
        same: "Same drug or strategy not defined.",
        day: "Day",
        disclaimer: "Inspired by Maudsley 15th ed, drug characteristics, and clinical experience. Generally, a switch for outpatient settings prioritizing tolerability is proposed."
    }
};

window.iniciarADSwitch = async function() {
    if (!document.getElementById('switch-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'switch-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
            .calc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
            .calc-ui h2 { margin: 0; font-weight: 800; display: flex; align-items: center; gap: 10px; font-size: 1.2rem; color: #2563eb; }
            .lang-toggle { display: flex; background: #f1f5f9; border-radius: 0.8rem; padding: 2px; }
            .lang-btn { padding: 4px 10px; border-radius: 0.6rem; border: none; cursor: pointer; font-size: 0.7rem; font-weight: 800; background: transparent; color: #64748b; }
            .lang-btn.active { background: white; color: #2563eb; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            .calc-ui label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #64748b; margin-top: 0.8rem; display: block; }
            .calc-ui select { width: 100%; padding: 0.9rem; border-radius: 1rem; border: 2px solid #e2e8f0; background: #fff; color: #1e293b; font-size: 1rem; outline: none; appearance: none; }
            .btn-ejecutar { margin-top: 1.5rem; padding: 1.1rem; background: #2563eb; color: white; border: none; border-radius: 1.2rem; cursor: pointer; font-weight: 900; font-size: 1.1rem; }
            .res-container { margin-top: 1.5rem; border-radius: 1.5rem; display: none; border: 1px solid #e2e8f0; background: white; overflow: hidden; }
            .res-pauta { padding: 1.5rem; }
            .pauta-step { display: flex; gap: 1rem; margin-bottom: 1.2rem; position: relative; }
            .pauta-step:not(:last-child)::after { content: ''; position: absolute; left: 17px; top: 35px; bottom: -15px; width: 2px; background: #e2e8f0; }
            .step-idx { min-width: 36px; height: 36px; background: white; border: 2px solid #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.7rem; color: #2563eb; z-index: 1; }
            .tag-farm { font-weight: 800; font-size: 0.65rem; text-transform: uppercase; padding: 3px 8px; border-radius: 6px; display: inline-block; margin-bottom: 6px; }
            .tag-orig { background: #fee2e2; color: #b91c1c; }
            .tag-dest { background: #dcfce7; color: #15803d; }
            .step-txt { font-size: 0.95rem; line-height: 1.4; color: #1e293b; }
            .disclaimer { font-size: 0.7rem; color: #64748b; padding: 1.2rem; border-top: 1px solid #e2e8f0; background: #f8fafc; font-style: italic; }
            .btn-copiar { margin-top: 1rem; width: 100%; padding: 0.8rem; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 1rem; cursor: pointer; font-weight: 700; }
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
                med: r[CONFIG_SW.COL_MED],
                filaCompleta: r 
            } : null;
        }).filter(item => item !== null);

        renderInterfazSW();
    } catch (e) { console.error("Error loading ADSwitch:", e); }
};

window.setLanguageSW = function(lang) {
    window.currentLang = lang;
    renderInterfazSW();
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
    const nameOrig = document.getElementById('sw_orig').value;
    const nameDest = document.getElementById('sw_dest').value;
    const dActual = parseFloat(document.getElementById('sw_d_orig').value);
    const dTarget = parseFloat(document.getElementById('sw_d_target').value);

    if (nameOrig === nameDest) return alert(t.same);

    const farmOrig = window.dbSwitch.find(f => f.nombre === nameOrig);
    const farmDest = window.dbSwitch.find(f => f.nombre === nameDest);
    
    const colIndex = ORDEN_MATRIZ.indexOf(nameDest);
    const rawCode = farmOrig.filaCompleta[CONFIG_SW.COL_MATRIZ_INICIO + colIndex];

    if (!rawCode || rawCode === 'x') {
        document.getElementById('sw-res-box').style.display = 'block';
        document.getElementById('sw-res-pauta').innerHTML = `<p style="text-align:center;">${t.same}</p>`;
        return;
    }

    procesarGramaticaSW(rawCode, farmOrig, farmDest, dActual, dTarget);
};

function procesarGramaticaSW(code, fOrig, fDest, dAct, dTar) {
    const t = i18n[window.currentLang];
    let workingCode = code;
    const condRegex = /\[O([<>]=?)(\d+)\]\{(.*?)\}/g;
    let m;
    while ((m = condRegex.exec(code)) !== null) {
        if (eval(`${dAct} ${m[1].replace('=','==')} ${m[2]}`)) workingCode = m[3];
    }

    const bloques = workingCode.split('|').map(b => b.trim());
    let hitos = [];
    let ultimoDia = 1;

    bloques.forEach(bloque => {
        const p = bloque.split(':');
        if (p.length < 3) return;

        let diaLabel = p[0], sujeto = p[1], accion = p[2], extra = p[3] || "";
        let f = (sujeto === 'O') ? fOrig : fDest;
        let clase = (sujeto === 'O') ? 'tag-orig' : 'tag-dest';
        
        let diaInicio;
        if (diaLabel.startsWith('d+')) diaInicio = ultimoDia + parseInt(diaLabel.substring(2));
        else if (diaLabel === "@O0") {
            const hO0 = hitos.find(h => h.clase === 'tag-orig' && h.dose === 0);
            diaInicio = hO0 ? hO0.dia : ultimoDia;
        } else diaInicio = parseInt(diaLabel.substring(1));

        if (accion.includes('all') || accion === 'desc_up') {
            const intv = parseInt(extra) || (accion.includes('up') ? 2 : 7);
            let lista = [...f.desescalada].map(Number);
            
            if (accion.includes('up')) {
                const hUlt = [...hitos].reverse().find(h => h.nombre === f.nombre);
                let part = hUlt ? Number(hUlt.dose) : 0;
                let pasos = lista.filter(v => v > part && v <= dTar).reverse();
                pasos.forEach((dose, i) => {
                    let d = diaInicio + (i * intv);
                    hitos.push({ dia: d, nombre: f.nombre, clase, dose, tipo: 'UP' });
                    ultimoDia = Math.max(ultimoDia, d);
                });
            } else {
                let idx = lista.indexOf(dAct);
                let pasos = (idx === -1) ? lista.filter(v => v < dAct) : lista.slice(idx + 1);
                pasos.forEach((dose, i) => {
                    let d = diaInicio + (i * intv);
                    hitos.push({ dia: d, nombre: f.nombre, clase, dose, tipo: 'DOWN' });
                    ultimoDia = Math.max(ultimoDia, d);
                });
                let dFin = diaInicio + (pasos.length * intv);
                hitos.push({ dia: dFin, nombre: f.nombre, clase, dose: 0, tipo: 'STOP' });
                ultimoDia = Math.max(ultimoDia, dFin);
            }
        } else {
            let dose = (accion === 'med') ? f.med : (accion === '0' ? 0 : (accion === 'obj' ? dTar : dAct));
            let tipo = (accion === '0') ? 'STOP' : (accion === 'med' || accion === 'desc_last' ? 'START' : 'FIX');
            hitos.push({ dia: diaInicio, nombre: f.nombre, clase, dose, tipo });
            ultimoDia = Math.max(ultimoDia, diaInicio);
        }
    });

    hitos.sort((a, b) => a.dia - b.dia);
    renderPautaSW(hitos);
}

function renderPautaSW(hitos) {
    const t = i18n[window.currentLang];
    let html = '';
    hitos.forEach(h => {
        let txt = "";
        switch(h.tipo) {
            case 'STOP': txt = `<b>${t.stop}</b>`; break;
            case 'START': txt = `${t.start} <b>${h.dose} mg</b>`; break;
            case 'UP': txt = `${t.increase} <b>${h.dose} mg</b>`; break;
            case 'DOWN': txt = `${t.reduce} <b>${h.dose} mg</b>`; break;
            case 'FIX': txt = `Tomar <b>${h.dose} mg</b>`; break;
            default: txt = `${t.reach} <b>${h.dose} mg</b>`;
        }

        html += `
            <div class="pauta-step">
                <div class="step-idx">${t.day} ${h.dia}</div>
                <div class="step-body">
                    <span class="tag-farm ${h.clase}">${h.nombre}</span>
                    <div class="step-txt">${txt}</div>
                </div>
            </div>`;
    });
    document.getElementById('sw-res-box').style.display = 'block';
    document.getElementById('sw-res-pauta').innerHTML = html + `<button class="btn-copiar" onclick="copiarEstrategiaSW()">${t.copy}</button>`;
}

window.copiarEstrategiaSW = function() {
    const t = i18n[window.currentLang];
    let txt = `${t.title} PSQALDÍA:\n`;
    document.querySelectorAll('.pauta-step').forEach(s => {
        txt += `${s.querySelector('.step-idx').innerText}: [${s.querySelector('.tag-farm').innerText}] ${s.querySelector('.step-txt').innerText}\n`;
    });
    navigator.clipboard.writeText(txt);
    alert(t.copied);
};
