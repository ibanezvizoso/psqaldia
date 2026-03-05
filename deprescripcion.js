/**
 * Motor de Deprescripción Hiperbólica
 * PSQALDÍA © 2026
 */

window.dbTaper = [];
window.taperChart = null;

// Estilos específicos que se inyectarán
const estilosDepre = `
<style>
    .depre-container { padding: 1.5rem; }
    .depre-label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 5px; display: block; }
    .depre-input { width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg); color: var(--text-main); font-size: 0.9rem; margin-bottom: 15px; box-sizing: border-box; }
    .depre-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .depre-alert { padding: 12px; border-radius: 12px; background: #fff7ed; border-left: 4px solid #f97316; font-size: 0.8rem; margin-bottom: 15px; display: none; }
    .depre-note { padding: 12px; border-radius: 12px; background: var(--primary-light); color: var(--primary); font-size: 0.85rem; margin-bottom: 15px; display: none; }
    .depre-chart-box { background: white; border-radius: 15px; border: 1px solid var(--border); padding: 10px; height: 250px; margin-bottom: 20px; }
    .depre-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .depre-table th { text-align: left; padding: 10px; background: #f8fafc; font-size: 0.7rem; color: var(--text-muted); border-bottom: 2px solid var(--border); }
    .depre-table td { padding: 10px; border-bottom: 1px solid var(--border); }
    .depre-biblio { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px dashed var(--border); font-size: 0.75rem; color: var(--text-muted); font-style: italic; }
</style>
`;

window.iniciarDeprescripcion = async function() {
    const container = document.getElementById('modalData');
    if (!container) return;

    // Inyectar Estructura Inicial
    container.innerHTML = estilosDepre + `
        <div class="depre-container">
            <div id="depre-alert" class="depre-alert"></div>
            
            <div class="depre-grid">
                <div>
                    <label class="depre-label">Fármaco</label>
                    <select id="drug-select" class="depre-input" onchange="window.updatePlan()"></select>
                </div>
                <div>
                    <label class="depre-label">Dosis Inicial (mg)</label>
                    <input type="number" id="current-dose" class="depre-input" value="20" oninput="window.updatePlan()">
                </div>
            </div>

            <label class="depre-label">Velocidad de reducción</label>
            <select id="interval-select" class="depre-input" onchange="window.updatePlan()">
                <option value="2">Cada 2 semanas (Rápida)</option>
                <option value="4" selected>Cada 4 semanas (Estándar)</option>
            </select>

            <div id="solution-info" class="depre-note"></div>

            <div class="depre-chart-box">
                <canvas id="taperChart"></canvas>
            </div>

            <table class="depre-table">
                <thead>
                    <tr><th>SEMANA</th><th>DOSIS (MG)</th><th>PRESENTACIÓN</th></tr>
                </thead>
                <tbody id="plan-body"></tbody>
            </table>

            <div class="depre-biblio">
                <i class="fas fa-book-medical"></i> Bibliografía: The Maudsley Deprescribing Guidelines. Mark Horowitz y David Taylor, 2024.
            </div>
        </div>
    `;

    // Cargar Datos
    try {
        const res = await fetch(`/?sheet=Data_Farmacocinetica`);
        const data = await res.json();
        if (data.values) {
            window.dbTaper = data.values.filter(row => {
                const fam = (row[5] || '').toLowerCase();
                const nom = (row[0] || '').toLowerCase();
                return (fam.includes('antidepresivo') || fam.includes('benzo')) && 
                       !fam.includes('antipsicótico') && !nom.includes('ketazolam') && row[6];
            }).map(row => ({
                nombre: row[0],
                steps: row[6].split(',').map(s => parseFloat(s.trim())).sort((a,b) => b-a),
                solucion: (row[7] || '').trim()
            }));

            const sel = document.getElementById('drug-select');
            sel.innerHTML = '<option value="" selected disabled>Seleccione un fármaco...</option>' + 
                            window.dbTaper.sort((a,b)=>a.nombre.localeCompare(b.nombre))
                            .map(d => `<option value="${d.nombre}">${d.nombre}</option>`).join('');
        }
    } catch (e) { console.error(e); }
};

window.updatePlan = function() {
    const drugName = document.getElementById('drug-select').value;
    if (!drugName) return;

    const drug = window.dbTaper.find(d => d.nombre === drugName);
    const dose = parseFloat(document.getElementById('current-dose').value) || 0;
    const weeks = parseInt(document.getElementById('interval-select').value);
    
    const alertBox = document.getElementById('depre-alert');
    const noteBox = document.getElementById('solution-info');
    const tableBody = document.getElementById('plan-body');

    // 1. Lógica de pasos
    let steps = [];
    if (dose > drug.steps[0]) {
        alertBox.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Dosis superior al protocolo. Iniciando desde ${drug.steps[0]} mg.`;
        alertBox.style.display = 'block';
        steps = [...drug.steps];
    } else {
        alertBox.style.display = 'none';
        steps = drug.steps.filter(s => s < dose);
        steps.unshift(dose);
    }

    // 2. Mensaje de solución
    let ratio = parseFloat(drug.solucion.replace(',', '.'));
    let esTexto = isNaN(ratio) && drug.solucion !== "" && drug.solucion !== "PROTECTED";
    if (esTexto) {
        noteBox.innerHTML = `<i class="fas fa-info-circle"></i> ${drug.solucion}`;
        noteBox.style.display = 'block';
    } else { noteBox.style.display = 'none'; }

    // 3. Tabla y Datos Gráfica
    tableBody.innerHTML = '';
    let hData = []; let labels = []; let curW = 0; let msgPut = false;

    steps.forEach(mg => {
        labels.push(`S${curW}`);
        hData.push(mg);
        let extra = "-";
        if (!isNaN(ratio) && ratio > 0) extra = `<b>${(mg/ratio).toFixed(2)} mL</b>`;
        else if (esTexto && !msgPut) { extra = "VER NOTA"; msgPut = true; }

        tableBody.innerHTML += `<tr><td>Semana ${curW}</td><td><b>${mg} mg</b></td><td>${extra}</td></tr>`;
        curW += weeks;
    });

    if (hData[hData.length-1] !== 0) {
        labels.push(`S${curW}`); hData.push(0);
        tableBody.innerHTML += `<tr><td>Semana ${curW}</td><td><b>0 mg</b></td><td>Fin</td></tr>`;
    }

    // 4. Lineal (2 meses = 8 semanas)
    const startMg = hData[0];
    let lData = labels.map((_, i) => {
        const w = i * weeks;
        return w >= 8 ? 0 : startMg - (startMg * (w / 8));
    });

    window.renderChart(labels, hData, lData);
};

window.renderChart = function(labels, hData, lData) {
    const ctx = document.getElementById('taperChart').getContext('2d');
    if (window.taperChart) window.taperChart.destroy();
    window.taperChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Hiperbólica lenta', data: hData, borderColor: '#4338ca', backgroundColor: 'rgba(67, 56, 202, 0.05)', fill: true, tension: 0.4 },
                { label: 'Lineal rápida (2m)', data: lData, borderColor: '#ec4899', borderDash: [5, 5], pointRadius: 0, tension: 0 }
            ]
        },
        options: { 
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { font: { size: 10, weight: '800' } } }, tooltip: { callbacks: { label: (c) => ` ${c.raw.toFixed(1)} mg` } } },
            scales: { y: { beginAtZero: true }, x: { ticks: { font: { size: 9 } } } }
        }
    });
};
