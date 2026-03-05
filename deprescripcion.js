/**
 * Herramienta de Deprescripción Hiperbólica - v1.2
 * PSQALDÍA - Programado para el proyecto de deprescripción segura.
 */

let dbTaper = [];
let taperChart = null;

// URL base del Worker (se asume que el JS corre en el mismo dominio o usa la ruta absoluta)
const API_URL = window.location.origin;

async function initTool() {
    const drugSelect = document.getElementById('drug-select');
    drugSelect.innerHTML = '<option>Cargando fármacos...</option>';

    try {
        // Consultamos la hoja de Farmacocinética a través del Worker
        const res = await fetch(`${API_URL}?sheet=Data_Farmacocinetica`);
        const data = await res.json();

        if (data.values) {
            // Filtrado: Antidepresivos y Benzos. Excluimos Antipsicóticos y Ketazolam.
            dbTaper = data.values.filter((row) => {
                const nombre = (row[0] || '').toLowerCase();
                const familia = (row[5] || '').toLowerCase();
                const tieneTaper = row[6] && row[6].length > 1;

                const esAD = familia.includes('antidepresivo');
                const esBZ = familia.includes('benzo'); // Captura cualquier variante de benzodiacepina
                const esAntipsicotico = familia.includes('antipsicótico');
                const esKetazolam = nombre.includes('ketazolam');

                return (esAD || esBZ) && !esAntipsicotico && !esKetazolam && tieneTaper;
            }).map(row => ({
                nombre: row[0],
                // Columna G (índice 6): Pasos de mg
                steps: row[6].split(',').map(s => parseFloat(s.trim())).sort((a,b) => b-a),
                // Columna H (índice 7): Solución o instrucciones
                solucion: row[7] || ''
            }));

            renderDrugSelect();
        }
    } catch (e) {
        console.error("Error cargando base de datos:", e);
        drugSelect.innerHTML = '<option>Error al cargar datos</option>';
    }
}

function renderDrugSelect() {
    const sel = document.getElementById('drug-select');
    // Ordenamos alfabéticamente los nombres
    const sortedDrugs = dbTaper.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    // Placeholder inicial deshabilitado
    let html = '<option value="" selected disabled>Seleccione un fármaco...</option>';
    html += sortedDrugs.map(d => `<option value="${d.nombre}">${d.nombre}</option>`).join('');
    
    sel.innerHTML = html;
}

function updatePlan() {
    const drugName = document.getElementById('drug-select').value;
    const tableBody = document.getElementById('plan-body');
    const solutionInfo = document.getElementById('solution-info');
    const alertBox = document.getElementById('alert-msg');

    // 1. Si no hay nada seleccionado, limpiamos todo y salimos
    if (!drugName) {
        tableBody.innerHTML = '';
        solutionInfo.innerHTML = '';
        alertBox.style.display = 'none';
        if (taperChart) {
            taperChart.destroy();
            taperChart = null;
        }
        return;
    }

    const drug = dbTaper.find(d => d.nombre === drugName);
    const currentDose = parseFloat(document.getElementById('current-dose').value) || 0;
    const weeksInterval = parseInt(document.getElementById('interval-select').value);

    alertBox.style.display = 'none';
    solutionInfo.innerHTML = '';

    // 2. Determinar pasos de mg
    let planSteps = [];
    const maxTaperDose = drug.steps[0];

    if (currentDose > maxTaperDose) {
        alertBox.innerHTML = `<i class="fas fa-exclamation-triangle"></i> La dosis actual es superior al protocolo estándar. Iniciando pauta desde <b>${maxTaperDose} mg</b>.`;
        alertBox.style.display = 'block';
        planSteps = [...drug.steps];
    } else {
        // Filtramos pasos menores a la dosis actual y añadimos la dosis actual al inicio
        planSteps = drug.steps.filter(s => s < currentDose);
        planSteps.unshift(currentDose);
    }

    // 3. Procesar Columna H (Solución)
    let ratioML = parseFloat(drug.solucion.toString().replace(',', '.'));
    let esInstruccionTexto = isNaN(ratioML) && drug.solucion.trim() !== "" && drug.solucion !== "PROTECTED";

    if (esInstruccionTexto) {
        solutionInfo.innerHTML = `<i class="fas fa-info-circle"></i> <b>Nota de preparación:</b> ${drug.solucion}`;
    }

    // 4. Generar Tabla y Datos de Gráfica
    tableBody.innerHTML = '';
    let chartDataHiper = [];
    let chartLabels = [];
    let currentWeek = 0;

    planSteps.forEach((mg) => {
        chartLabels.push(`Sem ${currentWeek}`);
        chartDataHiper.push(mg);

        let colExtra = "-";
        if (!isNaN(ratioML) && ratioML > 0) {
            colExtra = `<b>${(mg / ratioML).toFixed(2)} mL</b>`;
        } else if (esInstruccionTexto) {
            colExtra = "Ver nota";
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

    // Añadir punto final a 0
    if (planSteps[planSteps.length - 1] !== 0) {
        chartLabels.push(`Sem ${currentWeek}`);
        chartDataHiper.push(0);
        tableBody.innerHTML += `<tr><td>Semana ${currentWeek}</td><td><b>0 mg</b></td><td>Fin</td></tr>`;
    }

    // 5. Cálculo Lineal Rápido (Siempre a 8 semanas / 2 meses)
    const startDose = chartDataHiper[0];
    const WEEKS_LINEAL = 8;
    
    let chartDataLineal = chartLabels.map((_, i) => {
        const week = i * weeksInterval;
        if (week >= WEEKS_LINEAL) return 0;
        // Recta: Dosis = Inicial - (Inicial * (semana / total_semanas))
        return startDose - (startDose * (week / WEEKS_LINEAL));
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
                    pointRadius: 4,
                    pointHoverRadius: 6
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
                legend: {
                    position: 'top',
                    labels: { font: { size: 11, weight: '600' }, boxWidth: 15 }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    padding: 10,
                    callbacks: {
                        // Limpieza: Solo muestra "X mg" al pasar el ratón
                        label: function(context) {
                            return ` ${context.raw.toFixed(1)} mg`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Dosis (mg)', font: { size: 11 } }
                },
                x: {
                    title: { display: true, text: 'Tiempo', font: { size: 11 } }
                }
            }
        }
    });
}
