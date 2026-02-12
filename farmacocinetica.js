/**
 * Motor Farmacocinético SSS (Start, Stop & Switch)
 * PSQALDÍA © 2026
 */

const PK_ENGINE = {
    RESOLUTION: 150, 

    // Cálculo de constante de absorción (Ka)
    calculateKa(tmax, ke) {
        if (tmax <= 0) return 15;
        let ka = ke * 1.1;
        for (let i = 0; i < 50; i++) {
            let func = (Math.log(ka / ke) / (ka - ke)) - tmax;
            let deriv = (1 / (ka * (ka - ke))) - (Math.log(ka / ke) / Math.pow(ka - ke, 2));
            ka = ka - func / deriv;
            if (Math.abs(func) < 0.0001) break;
        }
        return ka;
    },

    // Ecuación de Bateman
    bateman(t, dose, ke, ka) {
        if (t < 0) return 0;
        return dose * (ka / (ka - ke)) * (Math.exp(-ke * t) - Math.exp(-ka * t));
    },

    // Generador de puntos de la curva
    generateCurve(params, durationHours) {
        const ke = Math.log(2) / params.t12;
        const ka = this.calculateKa(params.tmax, ke);
        const step = durationHours / this.RESOLUTION;
        let points = [];

        for (let t = 0; t <= durationHours; t += step) {
            let totalC = 0;
            params.pauta.forEach(dosis => {
                if (t >= dosis.tiempo) {
                    totalC += this.bateman(t - dosis.tiempo, dosis.cantidad, ke, ka);
                }
            });
            points.push({ x: t, y: totalC });
        }
        
        const refSS = this.calculateSteadyStatePeak(params.pauta[0].cantidad, ke, ka, params.frecuencia || 24);
        return points.map(p => ({ x: p.x, y: (p.y / refSS) * 100 }));
    },

    calculateSteadyStatePeak(dose, ke, ka, tau) {
        const rMax = (1 / (1 - Math.exp(-ke * tau)));
        return dose * (ka / (ka - ke)) * rMax;
    },

    getFamilies(db) {
        return [...new Set(db.map(f => f.familia))].filter(Boolean).sort();
    },

    getFarmacosByFamilia(db, familia) {
        return db.filter(f => f.familia === familia);
    },

    createPauta(mode, initialDose, freq, changeDose, changeDay, durationDays, hasChange) {
        let pauta = [];
        const durationHours = durationDays * 24;
        const interval = freq || 24;

        if (mode === 'START') {
            for (let t = 0; t < durationHours; t += interval) {
                let actualDose = initialDose;
                if (hasChange && t >= changeDay * 24) actualDose = changeDose;
                pauta.push({ tiempo: t, cantidad: actualDose });
            }
        } else {
            const lookback = 5 * 100; 
            for (let t = -lookback; t < durationHours; t += interval) {
                let actualDose = initialDose;
                if (t >= 0 && hasChange && t >= changeDay * 24) actualDose = changeDose;
                if (actualDose > 0 || t < 0) pauta.push({ tiempo: t, cantidad: actualDose });
            }
        }
        return pauta;
    }
};

window.PK_ENGINE = PK_ENGINE;

/**
 * INTERFAZ DE USUARIO SSS
 */
let sssChart = null;

function iniciarInterfazSSS() {
    const container = document.getElementById('modalData');
    container.innerHTML = `
        <style>
            .sss-ui { padding: 1rem; }
            .sss-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; }
            .sss-mode-selector { background: var(--primary); color: white; border: none; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 0.75rem; }
            .sss-card { background: var(--bg); border: 1px solid var(--border); padding: 10px; border-radius: 12px; margin-bottom: 8px; }
            .sss-ui label { font-size: 0.6rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 2px; display: block; }
            .sss-ui select, .sss-ui input { width: 100%; padding: 5px; border-radius: 6px; border: 1px solid var(--border); background: var(--card); color: var(--text-main); font-size: 0.8rem; margin-bottom: 5px; box-sizing: border-box; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .check-row { display: flex; align-items: center; gap: 6px; font-size: 0.7rem; font-weight: 700; margin: 4px 0; color: var(--primary); cursor: pointer; }
            .check-row input { width: auto; margin: 0; }
        </style>
        <div class="sss-ui">
            <div class="sss-header">
                <h2 style="font-size: 1rem; margin: 0;"><i class="fas fa-wave-square"></i> Simulador SSS</h2>
                <select id="sss-mode" class="sss-mode-selector" onchange="actualizarUI_SSS()">
                    <option value="START">MODO: START</option>
                    <option value="STOP">MODO: STOP</option>
                    <option value="SWITCH">MODO: SWITCH</option>
                </select>
            </div>
            <div id="sss-inputs"></div>
            <div style="margin-top:10px; background: white; border-radius:10px; padding:5px; border: 1px solid var(--border);">
                <canvas id="sssChartCanvas" style="max-height: 200px;"></canvas>
            </div>
            <div id="sss-alerts" style="margin-top:8px; padding:8px; border-radius:6px; background:rgba(67, 56, 202, 0.05); font-size:0.7rem; display:none; border-left: 3px solid var(--primary);"></div>
        </div>
    `;
    actualizarUI_SSS();
}

function actualizarUI_SSS() {
    const mode = document.getElementById('sss-mode').value;
    const familias = PK_ENGINE.getFamilies(window.dbPK);
    const container = document.getElementById('sss-inputs');

    const selector = (id) => `
        <div class="grid-2">
            <div><label>Familia</label><select id="${id}-fam" onchange="fillFarmacos('${id}')"><option value="" disabled selected>Elegir...</option>${familias.map(f => `<option value="${f}">${f}</option>`).join('')}</select></div>
            <div><label>Fármaco</label><select id="${id}-sel" onchange="renderSSS()"><option value="" disabled selected>-</option></select></div>
        </div>`;

    if (mode !== 'SWITCH') {
        container.innerHTML = `
            <div class="sss-card">
                ${selector('f1')}
                <div class="grid-2">
                    <div><label>Dosis (mg)</label><input type="number" id="f1-d" value="10" oninput="renderSSS()"></div>
                    <div><label>Cada (h)</label><input type="number" id="f1-f" value="24" oninput="renderSSS()"></div>
                </div>
                <div class="check-row" onclick="document.getElementById('f1-ch').click()"><input type="checkbox" id="f1-ch" onchange="toggleExt(); event.stopPropagation()"> <span>¿Cambio de dosis / Taper?</span></div>
                <div id="f1-ext" style="display:none; margin-top:5px; border-top:1px dashed var(--border); padding-top:5px;">
                    <div class="grid-2">
                        <div><label>Nueva Dosis</label><input type="number" id="f1-d2" value="${mode==='STOP'?'0':'20'}" oninput="renderSSS()"></div>
                        <div><label>Día</label><input type="number" id="f1-day" value="4" oninput="renderSSS()"></div>
                    </div>
                </div>
            </div>`;
    } else {
        container.innerHTML = `
            <div class="sss-card" style="border-left: 3px solid #ef4444;">
                <label style="color:#ef4444; margin-bottom:4px;">Fármaco Saliente (A)</label>
                ${selector('f1')}
            </div>
            <div class="sss-card" style="border-left: 3px solid #3b82f6;">
                <label style="color:#3b82f6; margin-bottom:4px;">Fármaco Entrante (B)</label>
                ${selector('f2')}
                <div class="grid-2">
                    <div><label>Dosis (mg)</label><input type="number" id="f2-d" value="5" oninput="renderSSS()"></div>
                    <div><label>Día inicio</label><input type="number" id="f2-day" value="1" oninput="renderSSS()"></div>
                </div>
            </div>
            <input type="number" id="f1-d" value="10" hidden><input type="number" id="f1-f" value="24" hidden>`;
    }
}

function toggleExt() {
    const ext = document.getElementById('f1-ext');
    if (ext) ext.style.display = document.getElementById('f1-ch').checked ? 'block' : 'none';
    renderSSS();
}

function fillFarmacos(id) {
    const fam = document.getElementById(`${id}-fam`).value;
    const list = PK_ENGINE.getFarmacosByFamilia(window.dbPK, fam);
    const sel = document.getElementById(`${id}-sel`);
    if (sel) {
        sel.innerHTML = `<option value="" disabled selected>Seleccionar...</option>` + list.map(f => `<option value="${f.farmaco}">${f.farmaco}</option>`).join('');
    }
}

function renderSSS() {
    const modeEl = document.getElementById('sss-mode');
    const f1SelEl = document.getElementById('f1-sel');
    
    // Escudo: Si no hay fármaco seleccionado, limpiar gráfica y salir
    if (!modeEl || !f1SelEl || !f1SelEl.value || f1SelEl.value === "") {
        if (sssChart) { sssChart.destroy(); sssChart = null; }
        const alerts = document.getElementById('sss-alerts');
        if (alerts) alerts.style.display = 'none';
        return; 
    }

    const mode = modeEl.value;
    const f1Data = window.dbPK.find(f => f.farmaco === f1SelEl.value);
    if (!f1Data) return;

    const ctx = document.getElementById('sssChartCanvas').getContext('2d');
    const durDays = mode === 'SWITCH' ? 20 : 14;
    
    const p1 = PK_ENGINE.createPauta(
        mode, 
        parseFloat(document.getElementById('f1-d').value), 
        parseFloat(document.getElementById('f1-f').value), 
        parseFloat(document.getElementById('f1-d2')?.value || 0), 
        parseFloat(document.getElementById('f1-day')?.value || 0), 
        durDays, 
        document.getElementById('f1-ch')?.checked || mode === 'SWITCH'
    );

    const d1 = PK_ENGINE.generateCurve({...f1Data, pauta: p1, frecuencia: parseFloat(document.getElementById('f1-f').value)}, durDays * 24);

    let dss = [{ 
        label: f1Data.farmaco, 
        data: d1.map(p => ({x: p.x/24, y: p.y})), 
        borderColor: '#ef4444', 
        backgroundColor: 'rgba(239,68,68,0.1)', 
        fill: true, tension: 0.3, pointRadius: 0 
    }];

    if (mode === 'SWITCH') {
        const f2sel = document.getElementById('f2-sel')?.value;
        const f2Data = window.dbPK.find(f => f.farmaco === f2sel);
        if (f2Data) {
            const p2 = PK_ENGINE.createPauta('START', parseFloat(document.getElementById('f2-d').value), 24, 0, 0, durDays, false);
            const delay = parseFloat(document.getElementById('f2-day').value) * 24;
            p2.forEach(d => d.tiempo += delay);
            const d2 = PK_ENGINE.generateCurve({...f2Data, pauta: p2, frecuencia: 24}, durDays * 24);
            dss.push({ 
                label: f2Data.farmaco, 
                data: d2.map(p => ({x: p.x/24, y: p.y})), 
                borderColor: '#3b82f6', 
                backgroundColor: 'rgba(59,130,246,0.1)', 
                fill: true, tension: 0.3, pointRadius: 0 
            });
        }
    }

    if (sssChart) sssChart.destroy();
    sssChart = new Chart(ctx, { 
        type: 'line', 
        data: { datasets: dss }, 
        options: { 
            responsive: true, 
            scales: { 
                x: { type: 'linear', title: { display: true, text: 'Días', font: {size: 10} } }, 
                y: { min: 0, title: { display: true, text: 'Nivel (%)', font: {size: 10} } } 
            }, 
            plugins: { legend: { labels: { boxWidth: 10, font: {size: 10} } } } 
        } 
    });

    const alerts = document.getElementById('sss-alerts');
    if (f1Data.comentario && f1Data.comentario.trim() !== "") { 
        alerts.innerHTML = `<i class="fas fa-info-circle"></i> ${f1Data.comentario}`; 
        alerts.style.display = 'block'; 
    } else { 
        alerts.style.display = 'none'; 
    }
}

window.iniciarInterfazSSS = iniciarInterfazSSS;
