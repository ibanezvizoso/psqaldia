/**
 * Motor Farmacocinético SSS (Start, Stop & Switch)
 * PSQALDÍA © 2026
 */

const PK_ENGINE = {
    RESOLUTION: 150, 

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

    bateman(t, dose, ke, ka) {
        if (t < 0) return 0;
        return dose * (ka / (ka - ke)) * (Math.exp(-ke * t) - Math.exp(-ka * t));
    },

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
        }
        
        if (mode === 'STOP' || mode === 'SWITCH') {
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
            .sss-ui { padding: 1.2rem; font-family: 'Inter', sans-serif; }
            .sss-ui h2 { font-size: 1.1rem; margin-bottom: 1rem; color: var(--primary); }
            .sss-ui label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; display: block; margin-bottom: 2px; }
            .sss-ui select, .sss-ui input { 
                width: 100%; padding: 0.4rem; border-radius: 8px; border: 1px solid var(--border); 
                background: var(--bg); color: var(--text-main); font-size: 0.85rem; margin-bottom: 8px; 
            }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .opt-extra { border-top: 1px dashed var(--border); padding-top: 8px; margin-top: 5px; display: none; }
            .check-row { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; margin: 5px 0; cursor: pointer; }
            .check-row input { width: auto; margin: 0; }
            .chart-wrap { margin-top: 1rem; background: var(--bg); border-radius: 12px; padding: 5px; border: 1px solid var(--border); }
        </style>
        <div class="sss-ui">
            <h2><i class="fas fa-wave-square"></i> Visualizador SSS</h2>
            <label>Escenario</label>
            <select id="sss-mode" onchange="actualizarUI_SSS()">
                <option value="" disabled selected>Seleccionar...</option>
                <option value="START">START (Inicio)</option>
                <option value="STOP">STOP (Interrupción)</option>
                <option value="SWITCH">SWITCH (Cambio)</option>
            </select>
            <div id="sss-inputs"></div>
            <div class="chart-wrap"><canvas id="sssChartCanvas"></canvas></div>
            <div id="sss-alerts" style="margin-top:10px; padding:10px; border-radius:8px; background:rgba(67, 56, 202, 0.1); font-size:0.75rem; display:none; border-left: 3px solid var(--primary);"></div>
        </div>
    `;
}

function actualizarUI_SSS() {
    const mode = document.getElementById('sss-mode').value;
    const familias = PK_ENGINE.getFamilies(window.dbPK);
    const container = document.getElementById('sss-inputs');

    const selector = (id) => `
        <div class="grid-2">
            <div><label>Familia</label><select id="${id}-fam" onchange="fillFarmacos('${id}')"><option value="" disabled selected>-</option>${familias.map(f => `<option value="${f}">${f}</option>`).join('')}</select></div>
            <div><label>Fármaco</label><select id="${id}-sel" onchange="renderSSS()"></select></div>
        </div>`;

    if (mode === 'START' || mode === 'STOP') {
        container.innerHTML = `
            ${selector('f1')}
            <div class="grid-2">
                <div><label>Dosis (mg)</label><input type="number" id="f1-d" value="10" oninput="renderSSS()"></div>
                <div><label>Cada (h)</label><input type="number" id="f1-f" value="24" oninput="renderSSS()"></div>
            </div>
            <div class="check-row"><input type="checkbox" id="f1-ch" onchange="document.getElementById('f1-ext').style.display = this.checked ? 'block' : 'none'; renderSSS()"> ¿Cambio de dosis?</div>
            <div id="f1-ext" class="opt-extra">
                <div class="grid-2">
                    <div><label>${mode==='STOP'?'Nueva':'Siguiente'}</label><input type="number" id="f1-d2" value="${mode==='STOP'?'0':'20'}" oninput="renderSSS()"></div>
                    <div><label>Día</label><input type="number" id="f1-day" value="4" oninput="renderSSS()"></div>
                </div>
            </div>`;
    } else {
        container.innerHTML = `
            <div style="background:rgba(239,68,68,0.05); padding:8px; border-radius:8px; margin-bottom:8px;">
                <label style="color:#ef4444;">Fármaco A (Saliente)</label>${selector('f1')}
            </div>
            <div style="background:rgba(59,130,246,0.05); padding:8px; border-radius:8px;">
                <label style="color:#3b82f6;">Fármaco B (Entrante)</label>${selector('f2')}
                <div class="grid-2">
                    <div><label>Dosis (mg)</label><input type="number" id="f2-d" value="5" oninput="renderSSS()"></div>
                    <div><label>Día inicio</label><input type="number" id="f2-day" value="1" oninput="renderSSS()"></div>
                </div>
            </div>
            <input type="number" id="f1-d" value="10" hidden><input type="number" id="f1-f" value="24" hidden>`;
    }
}

function fillFarmacos(id) {
    const fam = document.getElementById(`${id}-fam`).value;
    const list = PK_ENGINE.getFarmacosByFamilia(window.dbPK, fam);
    const sel = document.getElementById(`${id}-sel`);
    sel.innerHTML = list.map(f => `<option value="${f.farmaco}">${f.farmaco}</option>`).join('');
    renderSSS();
}

function renderSSS() {
    const mode = document.getElementById('sss-mode').value;
    const f1Data = window.dbPK.find(f => f.farmaco === document.getElementById('f1-sel').value);
    if (!f1Data) return;

    const ctx = document.getElementById('sssChartCanvas').getContext('2d');
    const durDays = mode === 'SWITCH' ? 21 : 14;
    
    const p1 = PK_ENGINE.createPauta(mode, parseFloat(document.getElementById('f1-d').value), parseFloat(document.getElementById('f1-f').value), parseFloat(document.getElementById('f1-d2')?.value || 0), parseFloat(document.getElementById('f1-day')?.value || 0), durDays, document.getElementById('f1-ch')?.checked || (mode === 'SWITCH'));
    const d1 = PK_ENGINE.generateCurve({...f1Data, pauta: p1, frecuencia: parseFloat(document.getElementById('f1-f').value)}, durDays * 24);

    let dss = [{ label: f1Data.farmaco, data: d1.map(p => ({x: p.x/24, y: p.y})), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.3, pointRadius: 0 }];

    if (mode === 'SWITCH') {
        const f2Data = window.dbPK.find(f => f.farmaco === document.getElementById('f2-sel').value);
        if (f2Data) {
            const p2 = PK_ENGINE.createPauta('START', parseFloat(document.getElementById('f2-d').value), 24, 0, 0, durDays, false);
            const delay = parseFloat(document.getElementById('f2-day').value) * 24;
            p2.forEach(d => d.tiempo += delay);
            const d2 = PK_ENGINE.generateCurve({...f2Data, pauta: p2, frecuencia: 24}, durDays * 24);
            dss.push({ label: f2Data.farmaco, data: d2.map(p => ({x: p.x/24, y: p.y})), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.3, pointRadius: 0 });
        }
    }

    if (sssChart) sssChart.destroy();
    sssChart = new Chart(ctx, { type: 'line', data: { datasets: dss }, options: { scales: { x: { type: 'linear', title: { display: true, text: 'Días' } }, y: { min: 0, title: { display: true, text: '%' } } }, plugins: { legend: { position: 'bottom' } } } });

    const alerts = document.getElementById('sss-alerts');
    if (f1Data.comentario) { alerts.innerHTML = `<i class="fas fa-info-circle"></i> ${f1Data.comentario}`; alerts.style.display = 'block'; } 
    else { alerts.style.display = 'none'; }
}
