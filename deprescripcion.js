/**
 * Herramienta de Deprescripción Hiperbólica
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
            // Filtrar: Antidepresivos y Benzos (Exc. Ketazolam en A32 y Antipsicóticos)
            // Asumimos: row[0]=Nombre, row[5]=Familia, row[6]=Taper(G), row[7]=Solución(H)
            dbTaper = data.values.filter((row, index) => {
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

    // 1. Lógica de inicio de Taper
    let planSteps = [];
    const maxTaperDose = drug.steps[0];

    if (currentDose > maxTaperDose) {
        alertBox.innerHTML = `<i class="fas fa-exclamation-triangle"></i> La dosis actual es superior a la recomendada para inicio de taper. Se muestra el plan desde <b>${maxTaperDose} mg</b>.`;
        alertBox.style.display = 'block';
        planSteps = [...drug.steps];
    } else {
        // Buscamos el primer escalón inferior a la dosis actual
        planSteps = drug.steps.filter(s => s < currentDose);
        // Añadimos la dosis actual como punto de partida si no está
        planSteps.unshift(currentDose);
    }

    // 2. Manejo de Solución (Columna H)
    let ratioML = parseFloat(drug.solucion);
    let instructionText = "";
    if (isNaN(ratioML) && drug.solucion.length > 5) {
        instructionText = drug.solucion;
        solutionInfo.innerHTML = `<i class="fas fa-info-circle"></i> <b>Nota de preparación:</b> ${instructionText}`;
    }

    // 3. Generar Datos para Tabla y Gráfica
    const tableBody = document.getElementById('plan-body');
    tableBody.innerHTML = '';
    
    let chartDataHiper = [];
    let chartLabels = [];
    let currentWeek = 0;

    planSteps.forEach((mg, index) => {
        chartLabels.push(`Sem ${currentWeek}`);
        chartDataHiper.push(mg);

        let extraVal = "";
        if (!isNaN(ratioML) && ratioML > 0) {
            extraVal = `${(mg / ratioML).toFixed(2)} mL`;
        } else {
            extraVal = mg === currentDose ? "Dosis Inicial" : "Ver nota";
        }

        tableBody.innerHTML += `
            <tr>
                <td>Semana ${currentWeek}</td>
                <td><b>${mg} mg</b></td>
                <td>${extraVal}</td>
            </tr>
        `;
        currentWeek += weeksInterval;
    });

    // Añadir el punto 0 al final
    if (planSteps[planSteps.length-1] !== 0) {
        chartLabels.push(`Sem ${currentWeek}`);
        chartDataHiper.push(0);
        tableBody.innerHTML += `<tr><td>Semana ${currentWeek}</td><td><b>0 mg</b></td><td>Fin</td></tr>`;
    }

    // 4. Generar Curva Lineal para comparativa
    const totalWeeks = (chartLabels.length - 1) * weeksInterval;
    let chartDataLineal = [];
    const startDose = chartDataHiper[0];
    
    chartDataHiper.forEach((_, i) => {
        const week = i * weeksInterval;
        const valLineal = Math.max(0, startDose - (startDose * (week / (chartDataHiper.length * weeksInterval - weeksInterval))));
        chartDataLineal.push(valLineal);
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
                    label: 'Reducción Hiperbólica (Sugerida)',
                    data: dataHiper,
                    borderColor: '#4338ca',
                    backgroundColor: 'rgba(67, 56, 202, 0.05)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    zIndex: 2
                },
                {
                    label: 'Reducción Lineal (Teórica)',
                    data: dataLineal,
                    borderColor: '#ec4899',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0,
                    pointRadius: 0,
                    zIndex: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { boxWidth: 12, font: { size: 10, weight: 'bold' } }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `Dosis: ${context.raw.toFixed(1)} mg`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Miligramos (mg)', font: { size: 10 } }
                },
                x: {
                    title: { display: true, text: 'Tiempo (Semanas)', font: { size: 10 } }
                }
            }
        }
    });
}
