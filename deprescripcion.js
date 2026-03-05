/**
 * Herramienta de Deprescripción Hiperbólica - v1.1
 */

let dbTaper = [];
let taperChart = null;

async function initTool() {
    const drugSelect = document.getElementById('drug-select');
    drugSelect.innerHTML = '<option>Cargando fármacos...</option>';

    try {
        const res = await fetch(`${window.WORKER_URL}?sheet=Data_Farmacocinetica`);
        const data = await res.json();

        if (data.values) {
            dbTaper = data.values.filter((row) => {
                const nombre = (row[0] || '').toLowerCase();
                const familia = (row[5] || '').toLowerCase();
                const tieneTaper = row[6] && row[6].length > 1;

                // Filtro mejorado para capturar AD y BZ (independientemente de tildes o plurales)
                const esAD = familia.includes('antidepresivo');
                const esBZ = familia.includes('benzo'); // Captura benzodiacepina, benzodiazepina, etc.
                const esKetazolam = nombre.includes('ketazolam');
                const esAntipsicotico = familia.includes('antipsicótico');

                return (esAD || esBZ) && !esAntipsicotico && !esKetazolam && tieneTaper;
            }).map(row => ({
                nombre: row[0],
                steps: row[6].split(',').map(s => parseFloat(s.trim())).sort((a,b) => b-a),
                solucion: row[7] || ''
            }));

            renderDrugSelect();
            updatePlan();
        }
    } catch (e) {
        console.error("Error cargando datos:", e);
    }
}

function renderDrugSelect() {
    const sel = document.getElementById('drug-select');
    sel.innerHTML = dbTaper.map(d => `<option value="${d.nombre}">${d.nombre}</option>`).sort().join('');
}

function updatePlan() {
    const drugName = document.getElementById('drug-select').value;
    const currentDose = parseFloat(document.getElementById('current-dose').value) || 0;
    const weeksInterval = parseInt(document.getElementById('interval-select').value);
    const drug = dbTaper.find(d => d.nombre === drugName);
    
    if (!drug) return;

    const alertBox = document.getElementById('alert-msg');
    const solutionInfo = document.getElementById('solution-info');
    alertBox.style.display = 'none';
    solutionInfo.innerHTML = '';

    let planSteps = [];
    const maxTaperDose = drug.steps[0];

    if (currentDose > maxTaperDose) {
        alertBox.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Dosis superior al protocolo. Iniciando desde <b>${maxTaperDose} mg</b>.`;
        alertBox.style.display = 'block';
        planSteps = [...drug.steps];
    } else {
        planSteps = drug.steps.filter(s => s < currentDose);
        planSteps.unshift(currentDose);
    }

    // Manejo de la frase o el cálculo
    let ratioML = parseFloat(drug.solucion.replace(',', '.'));
    let esFrase = isNaN(ratioML) && drug.solucion.trim() !== "" && drug.solucion !== "PROTECTED";

    if (esFrase) {
        solutionInfo.innerHTML = `<i class="fas fa-info-circle"></i> <b>Nota:</b> ${drug.solucion}`;
    } else if (drug.solucion === "PROTECTED") {
        solutionInfo.innerHTML = `<i class="fas fa-lock"></i> <b>Error:</b> Debes actualizar el Worker para permitir ver la columna H.`;
    }

    const tableBody = document.getElementById('plan-body');
    tableBody.innerHTML = '';
    
    let chartDataHiper = [];
    let chartLabels = [];
    let currentWeek = 0;

    planSteps.forEach((mg) => {
        chartLabels.push(`Sem ${currentWeek}`);
        chartDataHiper.push(mg);

        // Lógica de la tercera columna de la tabla
        let infoExtra = "";
        if (!isNaN(ratioML) && ratioML > 0) {
            infoExtra = `<b>${(mg / ratioML).toFixed(2)} mL</b>`;
        } else if (esFrase) {
            infoExtra = "Ver nota arriba";
        } else {
            infoExtra = "-";
        }

        tableBody.innerHTML += `
            <tr>
                <td>Semana ${currentWeek}</td>
                <td><b>${mg} mg</b></td>
                <td>${infoExtra}</td>
            </tr>
        `;
        currentWeek += weeksInterval;
    });

    // Punto final 0
    if (planSteps[planSteps.length-1] !== 0) {
        chartLabels.push(`Sem ${currentWeek}`);
        chartDataHiper.push(0);
        tableBody.innerHTML += `<tr><td>Semana ${currentWeek}</td><td><b>0 mg</b></td><td>Fin</td></tr>`;
    }

    // Lineal rápida (8 semanas fija)
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
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        // AQUÍ LA CORRECCIÓN: Solo muestra los mg, no el nombre del dataset
                        label: function(context) {
                            return ` ${context.raw.toFixed(1)} mg`;
                        },
                        title: function(context) {
                            return context[0].label;
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true },
                x: { ticks: { maxRotation: 0 } }
            }
        }
    });
}
