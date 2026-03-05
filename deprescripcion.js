/**
 * Herramienta de Deprescripción Hiperbólica - v1.4 (MODAL READY)
 * PSQALDÍA - Adaptada para inyectarse en index.html
 */

let dbTaper = [];
let taperChart = null;

// Esta es la función que llamará tu index.html desde el botón "ACCEDER" del modal
async function iniciarDeprescripcion() {
    const modalData = document.getElementById('modalData');
    
    // 1. Inyectamos el HTML de la herramienta dentro del modal
    modalData.innerHTML = `
        <div style="padding:1.5rem; font-family:'Plus Jakarta Sans', sans-serif;">
            <h2 style="margin-bottom:1rem; color:var(--primary); font-weight:800;">Deprescripción Hiperbólica</h2>
            
            <div id="alert-msg" style="padding:1rem; border-radius:1rem; background:#fff7ed; border-left:4px solid #f97316; font-size:0.85rem; margin-bottom:1rem; display:none;"></div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:1rem;">
                <div>
                    <label style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Fármaco</label>
                    <select id="drug-select" onchange="updatePlan()" style="width:100%; padding:8px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text-main);"></select>
                </div>
                <div>
                    <label style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Dosis Actual (mg)</label>
                    <input type="number" id="current-dose" value="20" oninput="updatePlan()" style="width:100%; padding:8px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text-main);">
                </div>
            </div>

            <div style="margin-bottom:1rem;">
                <label style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Intervalo de reducción</label>
                <select id="interval-select" onchange="updatePlan()" style="width:100%; padding:8px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text-main);">
                    <option value="2">Cada 2 semanas</option>
                    <option value="4" selected>Cada 4 semanas</option>
                </select>
            </div>

            <div id="solution-info" style="font-size:0.85rem; color:var(--primary); background:var(--primary-light); padding:1rem; border-radius:0.75rem; margin-bottom:1rem; display:none;"></div>

            <div style="height:250px; margin-bottom:1.5rem; background:white; padding:10px; border-radius:12px; border:1px solid var(--border);">
                <canvas id="taperChart"></canvas>
            </div>

            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                    <thead>
                        <tr style="text-align:left; background:#f8fafc; color:var(--text-muted); font-size:0.7rem;">
                            <th style="padding:8px; border-bottom:2px solid var(--border);">SEMANA</th>
                            <th style="padding:8px; border-bottom:2px solid var(--border);">DOSIS (MG)</th>
                            <th style="padding:8px; border-bottom:2px solid var(--border);">PRESENTACIÓN</th>
                        </tr>
                    </thead>
                    <tbody id="plan-body"></tbody>
                </table>
            </div>

            <div style="margin-top:2rem; padding-top:1rem; border-top:1px solid var(--border); font-size:0.75rem; color:var(--text-muted); font-style:italic;">
                Ref: The Maudsley Deprescribing Guidelines. Horowitz & Taylor, 2024.
            </div>
        </div>
    `;

    // 2. Cargamos los datos de la hoja y arrancamos
    await cargarDatosExcel();
}

async function cargarDatosExcel() {
    const drugSelect = document.getElementById('drug-select');
    if(!drugSelect) return;
    drugSelect.innerHTML = '<option>Cargando...</option>';

    try {
        const res = await fetch(`/?sheet=Data_Farmacocinetica`);
        const data = await res.json();

        if (data.values) {
            dbTaper = data.values.filter((row) => {
                const nombre = (row[0] || '').toLowerCase();
                const familia = (row[5] || '').toLowerCase();
                const tieneTaper = row[6] && row[6].length > 1;
                return (familia.includes('antidepresivo') || familia.includes('benzo')) && 
                       !familia.includes('antipsicótico') && !nombre.includes('ketazolam') && tieneTaper;
            }).map(row => ({
                nombre: row[0],
                steps: row[6].split(',').map(s => parseFloat(s.trim())).sort((a,b) => b-a),
                solucion: (row[7] || '').trim()
            }));

            const sortedDrugs = dbTaper.sort((a, b) => a.nombre.localeCompare(b.nombre));
            let html = '<option value="" selected disabled>Seleccione un fármaco...</option>';
            html += sortedDrugs.map(d => `<option value="${d.nombre}">${d.nombre}</option>`).join('');
            drugSelect.innerHTML = html;
        }
    } catch (e) {
        console.error(e);
        drugSelect.innerHTML = '<option>Error</option>';
    }
}

function updatePlan() {
    const drugName = document.getElementById('drug-select').value;
    const tableBody = document.getElementById('plan-body');
    const solutionInfo = document.getElementById('solution-info');
    const alertBox = document.getElementById('alert-msg');

    if (!drugName) return;

    const drug = dbTaper.find(d => d.nombre === drugName);
    const currentDose = parseFloat(document.getElementById('current-dose').value) || 0;
    const weeksInterval = parseInt(document.getElementById('interval-select').value);

    // Mensaje del Excel
    let ratioML = parseFloat(drug.solucion.replace(',', '.'));
    if (isNaN(ratioML) && drug.solucion !== "" && drug.solucion !== "PROTECTED") {
        solutionInfo.innerHTML = `<i class="fas fa-info-circle"></i> ${drug.solucion}`;
        solutionInfo.style.display = 'block';
    } else {
        solutionInfo.style.display = 'none';
    }

    // Calcular pasos
    let planSteps = [];
    const maxTaperDose = drug.steps[0];
    if (currentDose > maxTaperDose) {
        alertBox.innerHTML = `Inicio desde máximo recomendado: <b>${maxTaperDose} mg</b>.`;
        alertBox.style.display = 'block';
        planSteps = [...drug.steps];
    } else {
        alertBox.style.display = 'none';
        planSteps = drug.steps.filter(s => s < currentDose);
        planSteps.unshift(currentDose);
    }

    // Tabla
    tableBody.innerHTML = '';
    let chartDataHiper = [];
    let chartLabels = [];
    let currentWeek = 0;
    let instruccionPuesta = false;

    planSteps.forEach((mg) => {
        chartLabels.push(`Sem ${currentWeek}`);
        chartDataHiper.push(mg);

        let colExtra = "-";
        if (!isNaN(ratioML) && ratioML > 0) {
            colExtra = `<b>${(mg / ratioML).toFixed(2)} mL</b>`;
        } else if (isNaN(ratioML) && drug.solucion !== "" && !instruccionPuesta) {
            colExtra = `<span style="font-size:0.7rem; font-weight:800; color:var(--primary);">VER NOTA</span>`;
            instruccionPuesta = true;
        }

        tableBody.innerHTML += `<tr><td style="padding:8px; border-bottom:1px solid var(--border);">Semana ${currentWeek}</td><td style="padding:8px; border-bottom:1px solid var(--border);"><b>${mg} mg</b></td><td style="padding:8px; border-bottom:1px solid var(--border);">${colExtra}</td></tr>`;
        currentWeek += weeksInterval;
    });

    if (planSteps[planSteps.length-1] !== 0) {
        chartLabels.push(`Sem ${currentWeek}`);
        chartDataHiper.push(0);
        tableBody.innerHTML += `<tr><td style="padding:8px;">Semana ${currentWeek}</td><td style="padding:8px;"><b>0 mg</b></td><td style="padding:8px;">Fin</td></tr>`;
    }

    // Gráfica
    const startDose = chartDataHiper[0];
    let chartDataLineal = chartLabels.map((_, i) => {
        const week = i * weeksInterval;
        return week >= 8 ? 0 : startDose - (startDose * (week / 8));
    });

    renderChart(chartLabels, chartDataHiper, chartDataLineal);
}

function renderChart(labels, dataHiper, dataLineal) {
    const ctx = document.getElementById('taperChart').getContext('2d');
    if (taperChart) taperChart.destroy();
    taperChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Hiperbólica', data: dataHiper, borderColor: '#4338ca', backgroundColor: 'rgba(67, 56, 202, 0.05)', fill: true, tension: 0.4 },
                { label: 'Lineal (2m)', data: dataLineal, borderColor: '#ec4899', borderDash: [5, 5], fill: false, tension: 0, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } } },
            scales: { y: { beginAtZero: true }, x: { ticks: { font: { size: 9 } } } }
        }
    });
}
