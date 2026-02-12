/**
 * Motor Farmacocinético SSS (Start, Stop & Switch) - Versión Final Corregida
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
        
        const refSS = this.calculateSteadyStatePeak(params.refDose || params.pauta[0].cantidad, ke, ka, params.frecuencia || 24);
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

    createPauta(mode, initialDose, freq, changeDose, changeDay, durationDays, hasChange, isF2 = false) {
        let pauta = [];
        const durationHours = durationDays * 24;
        const interval = freq || 24;
        const startT = (isF2 || mode === 'START') ? 0 : -500;

        for (let t = startT; t < durationHours; t += interval) {
            let actualDose = initialDose;
            if (hasChange && t >= (changeDay * 24)) {
                actualDose = changeDose;
            }
            if (actualDose > 0 || t < 0) {
                pauta.push({ tiempo: t, cantidad: actualDose });
            }
        }
        return pauta;
    }
};

window.PK_ENGINE = PK_ENGINE;

let sssChart = null;

function iniciarInterfazSSS() {
    const container = document.getElementById('modalData');
    container.innerHTML = `
        <style>
            .sss-ui { padding: 1rem; }
            .sss-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; }
            .sss-mode-selector { background: var(--primary); color: white; border: none; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 0.75rem; }
            .sss-card { background: var(--bg); border: 1px solid var(--border); padding: 8px; border-radius: 10px; margin-bottom: 8px; }
            .sss-ui label { font-size: 0.58rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 1px; display: block; }
            .sss-ui select, .sss-ui input { width: 100%; padding: 4px; border-radius: 5px; border: 1px solid var(--border); background: var(--card); color: var(--text-main); font-size: 0.78rem; margin-bottom: 4px; box-sizing: border-box; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
            .check-row { display: flex; align-items: center; gap: 5px; font-size: 0.65rem; font-weight: 700; color: var(--primary); cursor: pointer; margin: 4px 0; }
            .check-row input { pointer-events: none; }
            .chart-box { margin-top: 8px; background: white; border-radius: 10px; padding: 5px; border: 1px solid var(--border); }
        </style>
        <div class="sss-ui">
            <div class="sss-header">
                <h2 style="font-size: 0.95rem; margin: 0;"><i class="fas fa-wave-square"></i> Simulador SSS</h2>
                <select id="sss-mode" class="sss-mode-selector" onchange="actualizarUI_SSS()">
                    <option value="START">START</option>
                    <option value="STOP">STOP</option>
                    <option value="SWITCH">SWITCH</option>
                </select>
            </div>
            <div id="sss-inputs"></div>
            <div class="chart-box"><canvas id="sssChartCanvas" style="max-height: 190px;"></canvas></div>
            <div id="sss-alerts" style="margin-top:8px; padding:8px; border-radius:6px; background:rgba(67, 56, 202, 0.05); font-size:0.65rem; display:none; border-left: 3px solid var(--primary);"></div>
        </div>
    `;
    actualizarUI_SSS();
}

function actualizarUI_SSS() {
    const mode = document.getElementById('sss-mode').value;
    const familias = PK_ENGINE.getFamilies(window.dbPK);
    const container = document.getElementById('sss-inputs');

    const renderF1 = (label, color) => `
        <div class="sss-card" style="border-left: 3px solid ${color};">
            <label style="color:${color};">${label}</label>
            <div class="grid-2">
                <div><label>Familia</label><select id="f1-fam" onchange="fillFarmacos('f1')"><option value="" disabled selected>Elegir...</option>${familias.map(f => `<option value="${f}">${f}</option>`).join('')}</select></div>
                <div><label>Fármaco</label><select id="f1-sel" onchange="renderSSS()"><option value="" disabled selected>-</option></select></div>
            </div>
            <div class="grid-2">
                <div><label>Dosis (mg)</label><input type="number" id="f1-d" value="10" oninput="renderSSS()"></div>
                <div><label>Cada (h)</label><input type="number" id="f1-f" value="24" oninput="renderSSS()"></div>
            </div>
            <div class="check-row" onclick="toggleExt('f1')">
                <input type="checkbox" id="f1-ch"> <span>Cambio de dosis / Taper</span>
            </div>
            <div id="f1-ext" style="display:none; border-top:1px dashed var(--border); padding-top:4px;">
                <div class="grid-2">
                    <div><label>Nueva Dosis</label><input type="number" id="f1-d2" value="${mode==='STOP'?'5':'20'}" oninput="renderSSS()"></div>
                    <div><label>Día Cambio</label><input type="number" id="f1-day" value="4" oninput="renderSSS()"></div>
                </div>
            </div>
            ${mode !== 'START' ? `<div><label>Día STOP Total</label><input type="number" id="f1-stop" value="7" oninput="renderSSS()"></div>` : ''}
        </div>`;

    const renderF2 = () => `
        <div class="sss-card" style="border-left: 3px solid #3b82f6;">
            <label style="color:#3b82f6;">Fármaco Entrante (B)</label>
            <div class="grid-2">
                <div><label>Día Inicio B</label><input type="number" id="f2-start" value="3" oninput="renderSSS()"></div>
                <div style="visibility:hidden"></div>
            </div>
            <div class="grid-2">
                <div><label>Familia</label><select id="f2-fam" onchange="fillFarmacos('f2')"><option value="" disabled selected>Elegir...</option>${familias.map(f => `<option value="${f}">${f}</option>`).join('')}</select></div>
                <div><label>Fármaco</label><select id="f2-sel" onchange="renderSSS()"><option value="" disabled selected>-</option></select></div>
            </div>
            <div class="grid-2">
                <div><label>Dosis (mg)</label><input type="number" id="f2-d" value="5" oninput="renderSSS()"></div>
                <div><label>Cada (h)</label><input type="number" id="f2-f" value="24" oninput="renderSSS()"></div>
            </div>
            <div class="check-row" onclick="toggleExt('f2')">
                <input type="checkbox" id="f2-ch"> <span>Escalada / Titulación</span>
            </div>
            <div id="f2-ext" style="display:none; border-top:1px dashed var(--border); padding-top:4px;">
                <div class="grid-2">
                    <div><label>Nueva Dosis</label><input type="number" id="f2-d2" value="10" oninput="renderSSS()"></div>
                    <div><label>Día Cambio</label><input type="number" id="f2-day" value="10" oninput="renderSSS()"></div>
                </div>
            </div>
        </div>`;

    if (mode !== 'SWITCH') {
        container.innerHTML = renderF1(mode === 'STOP' ? 'Fármaco a retirar' : 'Fármaco a iniciar', 'var(--primary)');
    } else {
        container.innerHTML = renderF1('Fármaco Saliente (A)', '#ef4444') + renderF2();
    }
}

function toggleExt(id) {
    const cb = document.getElementById(`${id}-ch`);
    const ext = document.getElementById(`${id}-ext`);
    if (cb && ext) {
        cb.checked = !cb.checked;
        ext.style.display = cb.checked ? 'block' : 'none';
        renderSSS();
    }
}

function fillFarmacos(id) {
    const famSelect = document.getElementById(`${id}-fam`);
    if (!famSelect) return;
    const fam = famSelect.value;
    const list = PK_ENGINE.getFarmacosByFamilia(window.dbPK, fam);
    const sel = document.getElementById(`${id}-sel`);
    sel.innerHTML = `<option value="" disabled selected>Seleccionar...</option>` + list.map(f => `<option value="${f.farmaco}">${f.farmaco}</option>`).join('');
    renderSSS();
}

function renderSSS() {
    const modeEl = document.getElementById('sss-mode');
    const f1selEl = document.getElementById('f1-sel');
    if (!modeEl || !f1selEl || !f1selEl.value) {
        if (sssChart) { sssChart.destroy(); sssChart = null; }
        return;
    }

    const mode = modeEl.value;
    const f1Data = window.dbPK.find(f => f.farmaco === f1selEl.value);
    if (!f1Data) return;

    const ctx = document.getElementById('sssChartCanvas').getContext('2d');
    const durDays = 30; 
    
    let p1 = PK_ENGINE.createPauta(
        mode, 
        parseFloat(document.getElementById('f1-d').value), 
        parseFloat(document.getElementById('f1-f').value), 
        parseFloat(document.getElementById('f1-d2')?.value || 0), 
        parseFloat(document.getElementById('f1-day')?.value || 0), 
        durDays, 
        document.getElementById('f1-ch')?.checked
    );

    if (mode !== 'START') {
        const stopDay = parseFloat(document.getElementById('f1-stop').value);
        p1 = p1.filter(d => d.tiempo < (stopDay * 24));
    }

    const d1 = PK_ENGINE.generateCurve({...f1Data, pauta: p1, frecuencia: parseFloat(document.getElementById('f1-f').value), refDose: parseFloat(document.getElementById('f1-d').value)}, durDays * 24);

    let datasets = [{ 
        label: f1Data.farmaco, 
        data: d1.map(p => ({x: p.x/24, y: p.y})), 
        borderColor: mode === 'SWITCH' ? '#ef4444' : '#4338ca', 
        backgroundColor: mode === 'SWITCH' ? 'rgba(239,68,68,0.1)' : 'rgba(67,56,202,0.1)', 
        fill: true, tension: 0.3, pointRadius: 0 
    }];

    if (mode === 'SWITCH') {
        const f2selEl = document.getElementById('f2-sel');
        if (f2selEl && f2selEl.value) {
            const f2Data = window.dbPK.find(f => f.farmaco === f2selEl.value);
            if (f2Data) {
                const startDayB = parseFloat(document.getElementById('f2-start').value);
                let p2 = PK_ENGINE.createPauta(
                    'START', 
                    parseFloat(document.getElementById('f2-d').value), 
                    parseFloat(document.getElementById('f2-f').value), 
                    parseFloat(document.getElementById('f2-d2').value), 
                    parseFloat(document.getElementById('f2-day').value), 
                    durDays, 
                    document.getElementById('f2-ch').checked,
                    true
                );
                p2.forEach(d => d.tiempo += (startDayB * 24));
                p2 = p2.filter(d => d.tiempo >= (startDayB * 24));

                const d2 = PK_ENGINE.generateCurve({...f2Data, pauta: p2, frecuencia: parseFloat(document.getElementById('f2-f').value), refDose: parseFloat(document.getElementById('f2-d2').value || document.getElementById('f2-d').value)}, durDays * 24);
                datasets.push({ 
                    label: f2Data.farmaco, data: d2.map(p => ({x: p.x/24, y: p.y})), 
                    borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.3, pointRadius: 0 
                });
            }
        }
    }

    if (sssChart) sssChart.destroy();
    sssChart = new Chart(ctx, { 
        type: 'line', 
        data: { datasets }, 
        options: { 
            responsive: true, 
            scales: { 
                x: { type: 'linear', title: { display: true, text: 'Días', font: {size: 9} } }, 
                y: { min: 0, title: { display: true, text: 'Nivel Relativo (%)', font: {size: 9} } } 
            }, 
            plugins: { legend: { labels: { boxWidth: 8, font: {size: 9} } } } 
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
