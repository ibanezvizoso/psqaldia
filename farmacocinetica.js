/**
 * Motor Farmacocinético SSS (Start, Stop & Switch)
 * PSQALDÍA © 2026
 */

const PK_ENGINE = {
    RESOLUTION: 150, 

    calculateKa(tmax, ke) {
        if (tmax <= 0) return 10;
        let ka = ke * 1.1;
        for (let i = 0; i < 50; i++) {
            let func = (Math.log(ka / ke) / (ka - ke)) - tmax;
            let deriv = (1 / (ka * (ka - ke))) - (Math.log(ka / ke) / Math.pow(ka - ke, 2));
            ka = ka - func / deriv;
            if (Math.abs(func) < 0.0001) break;
        }
        return ka;
    },

    bateman(t, dose, ke, ka, vd) {
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
                    totalC += this.bateman(t - dosis.tiempo, dosis.cantidad, ke, ka, params.vd || 1);
                }
            });
            points.push({ x: t, y: totalC });
        }
        
        const refSS = this.calculateSteadyStatePeak(params.pauta[0].cantidad, ke, ka, params.frecuencia);
        return points.map(p => ({ x: p.x, y: (p.y / refSS) * 100 }));
    },

    calculateSteadyStatePeak(dose, ke, ka, tau) {
        const rMax = (1 / (1 - Math.exp(-ke * tau)));
        return dose * (ka / (ka - ke)) * rMax;
    },

    getFamilies(db) {
        return [...new Set(db.map(f => f.familia))].filter(Boolean);
    },

    getFarmacosByFamilia(db, familia) {
        return db.filter(f => f.familia === familia);
    },

    createPauta(mode, initialDose, freq, changeDose, changeDay, durationDays) {
        let pauta = [];
        const durationHours = durationDays * 24;
        const interval = freq;

        if (mode === 'START') {
            for (let t = 0; t < durationHours; t += interval) {
                let actualDose = initialDose;
                if (changeDose !== undefined && t >= changeDay * 24) actualDose = changeDose;
                pauta.push({ tiempo: t, cantidad: actualDose });
            }
        }
        
        if (mode === 'STOP' || mode === 'SWITCH') {
            const lookback = 5 * 100; 
            for (let t = -lookback; t < durationHours; t += interval) {
                let actualDose = initialDose;
                if (t >= 0 && changeDay !== undefined && t >= changeDay * 24) {
                    actualDose = changeDose;
                }
                if (actualDose > 0 || t < 0) {
                    pauta.push({ tiempo: t, cantidad: actualDose });
                }
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
        <div class="calc-ui">
            <h2 style="margin-bottom:1.5rem;"><i class="fas fa-chart-line"></i> Visualizador SSS</h2>
            <label>Escenario</label>
            <select id="sss-mode" onchange="actualizarUI_SSS()">
                <option value="START">START (Inicio)</option>
                <option value="STOP">STOP (Interrupción)</option>
                <option value="SWITCH">SWITCH (Cambio)</option>
            </select>
            <div id="sss-inputs-container"></div>
            <div style="margin-top:2rem; background: var(--bg); border-radius:15px; padding:10px; border: 1px solid var(--border);">
                <canvas id="sssChartCanvas"></canvas>
            </div>
            <div id="sss-alerts" style="margin-top:1.5rem; padding:1rem; border-radius:10px; background:rgba(67, 56, 202, 0.1); font-size:0.85rem; display:none;"></div>
        </div>
    `;
    actualizarUI_SSS();
}

function actualizarUI_SSS() {
    const mode = document.getElementById('sss-mode').value;
    const inputArea = document.getElementById('sss-inputs-container');
    const familias = PK_ENGINE.getFamilies(window.dbPK);

    const getSelector = (id) => `
        <label>Familia</label>
        <select id="${id}-familia" onchange="refrescarListaFarmacos('${id}')">
            ${familias.map(f => `<option value="${f}">${f}</option>`).join('')}
        </select>
        <label>Fármaco</label>
        <select id="${id}-select" onchange="renderizarGraficaSSS()"></select>
    `;

    if (mode === 'START' || mode === 'STOP') {
        inputArea.innerHTML = `
            ${getSelector('f1')}
            <label>Dosis (mg)</label>
            <input type="number" id="f1-dose" value="10" oninput="renderizarGraficaSSS()">
            <label>Frecuencia (h)</label>
            <input type="number" id="f1-freq" value="24" oninput="renderizarGraficaSSS()">
            <label>${mode === 'STOP' ? 'Nueva dosis (0 = Stop)' : 'Cambio a dosis'} (mg)</label>
            <input type="number" id="f1-dose2" value="${mode === 'STOP' ? '0' : '20'}" oninput="renderizarGraficaSSS()">
            <label>Día del cambio</label>
            <input type="number" id="f1-day" value="4" oninput="renderizarGraficaSSS()">
        `;
    } else {
        inputArea.innerHTML = `
            <div style="border-left: 4px solid #ef4444; padding-left:15px; margin-bottom:1.5rem;">
                <p style="font-size:0.75rem; font-weight:800; color:#ef4444;">FÁRMACO A (Saliente)</p>
                ${getSelector('f1')}
                <input type="number" id="f1-dose" value="10" hidden><input type="number" id="f1-freq" value="24" hidden>
            </div>
            <div style="border-left: 4px solid #3b82f6; padding-left:15px;">
                <p style="font-size:0.75rem; font-weight:800; color:#3b82f6;">FÁRMACO B (Entrante)</p>
                ${getSelector('f2')}
                <label>Dosis (mg)</label>
                <input type="number" id="f2-dose" value="5" oninput="renderizarGraficaSSS()">
                <label>Día inicio cambio</label>
                <input type="number" id="f2-day" value="1" oninput="renderizarGraficaSSS()">
            </div>
        `;
    }
    refrescarListaFarmacos('f1');
    if (mode === 'SWITCH') refrescarListaFarmacos('f2');
}

function refrescarListaFarmacos(id) {
    const familia = document.getElementById(`${id}-familia`).value;
    const lista = PK_ENGINE.getFarmacosByFamilia(window.dbPK, familia);
    const select = document.getElementById(`${id}-select`);
    select.innerHTML = lista.map(f => `<option value="${f.farmaco}">${f.farmaco}</option>`).join('');
    renderizarGraficaSSS();
}

function renderizarGraficaSSS() {
    const mode = document.getElementById('sss-mode').value;
    const f1Data = window.dbPK.find(f => f.farmaco === document.getElementById('f1-select').value);
    if (!f1Data) return;

    const ctx = document.getElementById('sssChartCanvas').getContext('2d');
    const durationDays = mode === 'SWITCH' ? 20 : 15;
    
    const pauta1 = PK_ENGINE.createPauta(mode, parseFloat(document.getElementById('f1-dose').value), parseFloat(document.getElementById('f1-freq').value), parseFloat(document.getElementById('f1-dose2')?.value || 0), parseFloat(document.getElementById('f1-day')?.value || 4), durationDays);
    const dataset1 = PK_ENGINE.generateCurve({...f1Data, pauta: pauta1, frecuencia: parseFloat(document.getElementById('f1-freq').value)}, durationDays * 24);

    let datasets = [{
        label: f1Data.farmaco,
        data: dataset1.map(p => ({x: p.x / 24, y: p.y})),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true, tension: 0.3, pointRadius: 0
    }];

    if (mode === 'SWITCH') {
        const f2Data = window.dbPK.find(f => f.farmaco === document.getElementById('f2-select').value);
        if (f2Data) {
            const pauta2 = PK_ENGINE.createPauta('START', parseFloat(document.getElementById('f2-dose').value), 24, undefined, undefined, durationDays);
            const delay = parseFloat(document.getElementById('f2-day').value) * 24;
            pauta2.forEach(d => d.tiempo += delay);
            const dataset2 = PK_ENGINE.generateCurve({...f2Data, pauta: pauta2, frecuencia: 24}, durationDays * 24);
            datasets.push({
                label: f2Data.farmaco,
                data: dataset2.map(p => ({x: p.x / 24, y: p.y})),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true, tension: 0.3, pointRadius: 0
            });
        }
    }

    if (sssChart) sssChart.destroy();
    sssChart = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            scales: {
                x: { type: 'linear', title: { display: true, text: 'Días' } },
                y: { title: { display: true, text: 'Nivel (%)' }, min: 0 }
            }
        }
    });

    const alertas = document.getElementById('sss-alerts');
    if (f1Data.comentario) {
        alertas.innerHTML = `<i class="fas fa-info-circle"></i> ${f1Data.comentario}`;
        alertas.style.display = 'block';
    } else {
        alertas.style.display = 'none';
    }
}
