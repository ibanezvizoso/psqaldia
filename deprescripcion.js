/**
 * Herramienta de Deprescripción Hiperbólica - Versión Actualizada
 * PSQALDÍA © 2026
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
            // Filtrado de fármacos (Antidepresivos y Benzos, excluyendo Ketazolam y Antipsicóticos)
            dbTaper = data.values.filter((row) => {
                const nombre = (row[0] || '').toLowerCase();
                const familia = (row[5] || '').toLowerCase();
                const tieneTaper = row[6] && row[6].length > 1;

                const esValido = (familia.includes('antidepresivo') || familia.includes('benzodiacepina')) && 
                                 !familia.includes('antipsicótico') && 
                                 nombre !== 'ketazolam';
                
                return esValido && tieneTaper;
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
    sel.innerHTML = dbTaper.map(d => `<option value="${d.nombre}">${d.nombre}</option>`).join('');
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

    // 1. Lógica de dosis inicial
    let planSteps = [];
    const maxTaperDose = drug.steps[0];

    if (currentDose > maxTaperDose) {
        alertBox.innerHTML = `<i class="fas fa-exclamation-triangle"></i> La dosis actual es superior a la recomendada. Se muestra el plan desde <b>${maxTaperDose} mg</b>.`;
        alertBox.style.display = 'block';
        planSteps = [...drug.steps];
    } else {
        planSteps = drug.steps.filter(s => s < currentDose);
        planSteps.unshift(currentDose);
    }

    // 2. Manejo de Solución
    let ratioML = parseFloat(drug.solucion);
    if (isNaN(ratioML) && drug.solucion.length > 5) {
        solutionInfo.innerHTML = `<i class="fas fa-info-circle"></i> <b>Instrucciones:</b> ${drug.solucion}`;
    }

    // 3. Generar Datos para Tabla y Gráfica Hiperbólica
    const tableBody = document.getElementById('plan-body');
    tableBody.innerHTML = '';
    
    let chartDataHiper = [];
    let chartLabels = [];
    let currentWeek = 0;

    planSteps.forEach((mg) => {
        chartLabels.push(`Sem ${currentWeek}`);
        chartDataHiper.push(mg);

        let extraVal = (!isNaN(ratioML) && ratioML > 0) ? `${(mg / ratioML).toFixed(2)} mL` : "Ver nota";
        
        tableBody.innerHTML += `
            <tr>
                <td>Semana ${currentWeek}</td>
                <td><b>${mg} mg</b></td>
                <td>${extraVal}</td>
            </tr>
        `;
        currentWeek += weeksInterval;
    });

    // Añadir punto final 0
    if (planSteps[planSteps.length-1] !== 0) {
        chartLabels.push(`Sem ${currentWeek}`);
        chartDataHiper.push(0);
        tableBody.innerHTML += `<tr><td>Semana ${currentWeek}</td><td><b>0 mg</b></td><td>Fin</td></tr>`;
    }

    // 4. Lógica Lineal Rápida (8 semanas / 2 meses)
    // Calculamos los puntos lineales sobre la misma escala de tiempo de la hiperbólica
    const startDose = chartDataHiper[0];
    const WEEKS_LINEAL = 8;
    let chartDataLineal = [];

    chartLabels.forEach((label, index) => {
        const week = index * weeksInterval;
        let doseLineal;
        
        if (week >= WEEKS_LINEAL) {
            doseLineal = 0;
        } else {
            // Ecuación de recta: Dosis = Inicial - (Pendiente * semana)
            doseLineal = startDose - (startDose * (week / WEEKS_LINEAL));
        }
        chartDataLineal.push(doseLineal);
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
                    tension: 0.4,
                    pointRadius: 4
                },
                {
                    label: 'Deprescripción lineal rápida',
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
                legend: {
                    position: 'top',
                    labels: { boxWidth: 15, font: { size: 11, weight: 'bold' } }
                }
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'mg' } },
                x: { title: { display: true, text: 'Tiempo' } }
            }
        }
    });
}
