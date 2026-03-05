/**
 * Herramienta de Deprescripción Hiperbólica - v1.3
 * PSQALDÍA - Mostrando mensajes reales del Excel
 */

let dbTaper = [];
let taperChart = null;
const API_URL = window.location.origin;

async function initTool() {
    const drugSelect = document.getElementById('drug-select');
    drugSelect.innerHTML = '<option>Cargando fármacos...</option>';

    try {
        const res = await fetch(`${API_URL}?sheet=Data_Farmacocinetica`);
        const data = await res.json();

        if (data.values) {
            dbTaper = data.values.filter((row) => {
                const nombre = (row[0] || '').toLowerCase();
                const familia = (row[5] || '').toLowerCase();
                const tieneTaper = row[6] && row[6].length > 1;

                const esAD = familia.includes('antidepresivo');
                const esBZ = familia.includes('benzo');
                const esAntipsicotico = familia.includes('antipsicótico');
                const esKetazolam = nombre.includes('ketazolam');

                return (esAD || esBZ) && !esAntipsicotico && !esKetazolam && tieneTaper;
            }).map(row => ({
                nombre: row[0],
                steps: row[6].split(',').map(s => parseFloat(s.trim())).sort((a,b) => b-a),
                solucion: (row[7] || '').trim() // Aquí está tu mensaje del Excel
            }));

            renderDrugSelect();
        }
    } catch (e) {
        console.error("Error:", e);
        drugSelect.innerHTML = '<option>Error al cargar</option>';
    }
}

function renderDrugSelect() {
    const sel = document.getElementById('drug-select');
    const sortedDrugs = dbTaper.sort((a, b) => a.nombre.localeCompare(b.nombre));
    let html = '<option value="" selected disabled>Seleccione un fármaco...</option>';
    html += sortedDrugs.map(d => `<option value="${d.nombre}">${d.nombre}</option>`).join('');
    sel.innerHTML = html;
}

function updatePlan() {
    const drugName = document.getElementById('drug-select').value;
    const tableBody = document.getElementById('plan-body');
    const solutionInfo = document.getElementById('solution-info');
    const alertBox = document.getElementById('alert-msg');

    if (!drugName) {
        tableBody.innerHTML = '';
        solutionInfo.style.display = 'none';
        alertBox.style.display = 'none';
        if (taperChart) { taperChart.destroy(); taperChart = null; }
        return;
    }

    const drug = dbTaper.find(d => d.nombre === drugName);
    const currentDose = parseFloat(document.getElementById('current-dose').value) || 0;
    const weeksInterval = parseInt(document.getElementById('interval-select').value);

    // 1. Mostrar/Ocultar el mensaje del Excel
    let ratioML = parseFloat(drug.solucion.replace(',', '.'));
    let esMensajeTexto = isNaN(ratioML) && drug.solucion !== "" && drug.solucion !== "PROTECTED";

    if (esMensajeTexto) {
        // AQUÍ SE LEE EL MENSAJE REAL DEL EXCEL
        solutionInfo.innerHTML = `
            <div style="display:flex; gap:10px; align-items:center;">
                <i class="fas fa-info-circle" style="font-size:1.5rem;"></i>
                <div>
                    <strong style="display:block; margin-bottom:2px; text-transform:uppercase; font-size:0.7rem;">Instrucciones específicas:</strong>
                    ${drug.solucion}
                </div>
            </div>`;
        solutionInfo.style.display = 'block';
    } else {
        solutionInfo.style.display = 'none';
    }

    // 2. Calcular pasos
    let planSteps = [];
    const maxTaperDose = drug.steps[0];
    if (currentDose > maxTaperDose) {
        alertBox.innerHTML = `Iniciando pauta desde el máximo recomendado: <b>${maxTaperDose} mg</b>.`;
        alertBox.style.display = 'block';
        planSteps = [...drug.steps];
    } else {
        alertBox.style.display = 'none';
        planSteps = drug.steps.filter(s => s < currentDose);
        planSteps.unshift(currentDose);
    }

    // 3. Rellenar Tabla
    tableBody.innerHTML = '';
    let chartDataHiper = [];
    let chartLabels = [];
    let currentWeek = 0;
    let mensajeMostradoEnTabla = false;

    planSteps.forEach((mg, index) => {
        chartLabels.push(`Sem ${currentWeek}`);
        chartDataHiper.push(mg);

        let colExtra = "-";
        if (!isNaN(ratioML) && ratioML > 0) {
            // Si es número (mg/mL), calculamos mL
            colExtra = `<b>${(mg / ratioML).toFixed(2)} mL</b>`;
        } else if (esMensajeTexto && !mensajeMostradoEnTabla) {
            // Si es texto, ponemos un aviso solo en la primera fila
            colExtra = `<span style="color:var(--primary); font-size:0.75rem; font-weight:800;">INSTRUCCIONES ARRIBA</span>`;
            mensajeMostradoEnTabla = true;
        }

        tableBody.innerHTML += `
            <tr>
                <td>Semana ${currentWeek}</td>
                <td><b>${mg} mg</b></td>
                <td>${colExtra}</td>
            </tr>
        `;
        currentWeek += weeksInterval;
    });

    // Punto final
    if (planSteps[planSteps.length - 1] !== 0) {
        chartLabels.push(`Sem ${currentWeek}`);
        chartDataHiper.push(0);
        tableBody.innerHTML += `<tr><td>Semana ${currentWeek}</td><td><b>0 mg</b></td><td>Fin</td></tr>`;
    }

    // 4. Gráfica
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
                {
                    label: 'Deprescripción hiperbólica lenta',
                    data: dataHiper,
                    borderColor: '#4338ca',
                    backgroundColor: 'rgba(67, 56, 202, 0.05)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Deprescripción lineal rápida (2 meses)',
                    data: dataLineal,
                    borderColor: '#ec4899',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { font: { size: 11, weight: '600' } } },
                tooltip: { callbacks: { label: (c) => ` ${c.raw.toFixed(1)} mg` } }
            },
            scales: { y: { beginAtZero: true }, x: { title: { display: true, text: 'Tiempo' } } }
        }
    });
}
