/**
 * Motor de Deprescripción Hiperbólica v1.9
 * PSQALDÍA © 2026 - Edición Profesional Bilingüe con Traducción de Notas
 */

window.dbTaper = [];
window.taperChart = null;
window.depreLang = 'es'; 

// 1. DICCIONARIO DE TRADUCCIONES
const i18n = {
    es: {
        drug: "Fármaco",
        initDose: "Dosis Inicial (mg)",
        speed: "Velocidad de reducción",
        speedFast: "Cada 2 semanas",
        speedStd: "Cada 4 semanas",
        placeholder: "Seleccione un fármaco...",
        thWeek: "SEMANA",
        thDose: "DOSIS (MG)",
        thPres: "PRESENTACIÓN",
        alertMax: "Dosis superior al protocolo. Iniciando desde",
        seeNote: "VER NOTA",
        week: "Semana",
        end: "Fin",
        labelHiper: "Hiperbólica lenta",
        labelLineal: "Lineal rápida (2 meses)",
        copyBtn: "Copiar Pauta",
        copySuccess: "¡Pauta copiada al portapapeles!",
        headerPlan: "PLAN DE REDUCCIÓN",
        noteLabel: "Nota",
        infoBtn: "¿Qué es la deprescripción hiperbólica?",
        infoTitle: "Deprescripción Hiperbólica",
        excelNotes: {} 
    },
    en: {
        drug: "Drug",
        initDose: "Initial Dose (mg)",
        speed: "Tapering Speed",
        speedFast: "Every 2 weeks (Fast)",
        speedStd: "Every 4 weeks (Standard)",
        placeholder: "Select a drug...",
        thWeek: "WEEK",
        thDose: "DOSE (MG)",
        thPres: "PRESENTATION",
        alertMax: "Dose exceeds protocol. Starting from",
        seeNote: "SEE NOTE",
        week: "Week",
        end: "End",
        labelHiper: "Slow Hyperbolic",
        labelLineal: "Fast Linear (2 months)",
        copyBtn: "Copy Plan",
        copySuccess: "Plan copied to clipboard!",
        headerPlan: "REDUCTION PLAN",
        noteLabel: "Note",
        infoBtn: "What is hyperbolic deprescribing?",
        infoTitle: "Hyperbolic Deprescribing",
        excelNotes: {
            "Partir comprimidos, romperlos y disolverlos, abrir cápsulas, etc.": "Split tablets, break and dissolve them, open capsules, etc.",
            "PROTECTED": "PROTECTED"
        }
    }
};

const estilosDepre = `
<style>
    .depre-container { padding: 1.5rem; font-family: 'Plus Jakarta Sans', sans-serif; position: relative; }
    .depre-lang-tabs { display: flex; gap: 5px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; align-items: center; }
    .depre-tab { padding: 6px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; cursor: pointer; border: 1px solid var(--border); background: var(--bg); color: var(--text-muted); transition: 0.2s; }
    .depre-tab.active { background: var(--primary); color: white; border-color: var(--primary); }
    
    .depre-info-trigger { margin-left: auto; font-size: 0.7rem; font-weight: 800; color: var(--primary); cursor: pointer; display: flex; align-items: center; gap: 5px; background: var(--primary-light); padding: 5px 12px; border-radius: 20px; transition: 0.2s; }
    .depre-info-trigger:hover { filter: brightness(0.95); }

    .depre-modal-overlay { display: none; position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 9999; align-items: center; justify-content: center; padding: 20px; }
    .depre-modal-content { background: white; padding: 2rem; border-radius: 1.5rem; max-width: 600px; width: 100%; position: relative; font-size: 0.85rem; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
    .depre-modal-content h3 { color: var(--primary); margin-top: 0; font-weight: 800; }
    .depre-modal-content ul { padding-left: 1.2rem; margin: 15px 0; }
    .depre-modal-content li { margin-bottom: 10px; }
    .depre-modal-close { position: absolute; top: 1rem; right: 1rem; cursor: pointer; color: var(--text-muted); font-size: 1.2rem; }

    .depre-label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 5px; display: block; }
    .depre-input { width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg); color: var(--text-main); font-size: 0.9rem; margin-bottom: 15px; box-sizing: border-box; }
    .depre-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .depre-alert { padding: 12px; border-radius: 12px; background: #fff7ed; border-left: 4px solid #f97316; font-size: 0.8rem; margin-bottom: 15px; display: none; }
    .depre-note { padding: 12px; border-radius: 12px; background: var(--primary-light); color: var(--primary); font-size: 0.85rem; margin-bottom: 15px; display: none; border-left: 4px solid var(--primary); }
    .depre-chart-box { background: white; border-radius: 15px; border: 1px solid var(--border); padding: 10px; height: 250px; margin-bottom: 20px; }
    .depre-table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .depre-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .depre-table th { text-align: left; padding: 10px; background: #f8fafc; font-size: 0.7rem; color: var(--text-muted); border-bottom: 2px solid var(--border); }
    .depre-table td { padding: 10px; border-bottom: 1px solid var(--border); }
    .btn-copy { padding: 8px 15px; border-radius: 10px; background: var(--primary-light); color: var(--primary); border: 1px solid var(--primary); font-size: 0.75rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
    .btn-copy:hover { background: var(--primary); color: white; }
    .depre-biblio { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px dashed var(--border); font-size: 0.75rem; color: var(--text-muted); font-style: italic; }
</style>
`;

window.toggleDepreInfo = function(show) {
    const modal = document.getElementById('depre-info-modal');
    if (modal) modal.style.display = show ? 'flex' : 'none';
};

window.cambiarIdiomaDepre = function(nuevoIdioma) {
    window.depreLang = nuevoIdioma;
    const dose = document.getElementById('current-dose')?.value;
    const drug = document.getElementById('drug-select')?.value;
    const interval = document.getElementById('interval-select')?.value;
    
    window.iniciarDeprescripcion().then(() => {
        if(drug) document.getElementById('drug-select').value = drug;
        if(dose) document.getElementById('current-dose').value = dose;
        if(interval) document.getElementById('interval-select').value = interval;
        window.updatePlan();
    });
};

window.iniciarDeprescripcion = async function() {
    const container = document.getElementById('modalData');
    if (!container) return;
    const t = i18n[window.depreLang];

    container.innerHTML = estilosDepre + `
        <div class="depre-container">
            <div class="depre-lang-tabs">
                <div class="depre-tab ${window.depreLang === 'es' ? 'active' : ''}" onclick="window.cambiarIdiomaDepre('es')">ESP</div>
                <div class="depre-tab ${window.depreLang === 'en' ? 'active' : ''}" onclick="window.cambiarIdiomaDepre('en')">ENG</div>
                
                <div class="depre-info-trigger" onclick="window.toggleDepreInfo(true)">
                    <i class="fas fa-info-circle"></i> ${t.infoBtn}
                </div>
            </div>
            
            <div id="depre-info-modal" class="depre-modal-overlay" onclick="if(event.target === this) window.toggleDepreInfo(false)">
                <div class="depre-modal-content">
                    <span class="depre-modal-close" onclick="window.toggleDepreInfo(false)">&times;</span>
                    <h3>${t.infoTitle}</h3>
                    <p>Es un método de retirada gradual basado en la farmacodinámica de saturación de receptores, diseñado para minimizar el riesgo de síndrome de discontinuación.</p>
                    <ul>
                        <li><strong>Relación Dosis-Ocupación:</strong> La unión del fármaco a sus receptores no es lineal, sino hiperbólica. A dosis altas, los receptores están saturados; a dosis bajas, la pendiente es máxima: reducciones mínimas de dosis provocan caídas drásticas en la ocupación de receptores.</li>
                        <li><strong>El riesgo de la reducción lineal:</strong> Las pautas clásicas (ej. bajar siempre 5 mg) son desproporcionadas. El salto final (de una dosis mínima a cero) genera una caída de la ocupación de receptores masiva comparada con los primeros pasos, desestabilizando la homeostasis neuroquímica.</li>
                        <li><strong>Objetivo de la desocupación:</strong> Para que la retirada sea tolerable, se debe intentar reducir la ocupación de receptores en pasos constantes y similares, en lugar de reducir cantidades fijas de miligramos. Esto se puede lograr de forma aproximada reduciendo un porcentaje de la dosis actual (ej. 10-25%), lo que genera pasos de miligramos cada vez más pequeños a medida que nos acercamos a cero.</li>
                    </ul>
                    <p style="background:var(--primary-light); padding:10px; border-radius:10px; border-left:4px solid var(--primary); font-size:0.8rem;">
                        <strong>Regla de oro:</strong> A menor dosis, mayor es la sensibilidad del sistema y más pequeños deben ser los pasos de reducción para mantener una desocupación de receptores estable.
                    </p>
                </div>
            </div>

            <div id="depre-alert" class="depre-alert"></div>
            <div class="depre-grid">
                <div>
                    <label class="depre-label">${t.drug}</label>
                    <select id="drug-select" class="depre-input" onchange="window.updatePlan()"></select>
                </div>
                <div>
                    <label class="depre-label">${t.initDose}</label>
                    <input type="number" id="current-dose" class="depre-input" value="20" oninput="window.updatePlan()">
                </div>
            </div>
            <label class="depre-label">${t.speed}</label>
            <select id="interval-select" class="depre-input" onchange="window.updatePlan()">
                <option value="2">${t.speedFast}</option>
                <option value="4" selected>${t.speedStd}</option>
            </select>
            <div id="solution-info" class="depre-note"></div>
            <div class="depre-chart-box">
                <canvas id="taperChart"></canvas>
            </div>
            <div class="depre-table-header">
                <span class="depre-label" style="margin:0">${t.headerPlan}</span>
                <button class="btn-copy" onclick="window.copiarPauta()"><i class="far fa-copy"></i> ${t.copyBtn}</button>
            </div>
            <table class="depre-table">
                <thead>
                    <tr><th>${t.thWeek}</th><th>${t.thDose}</th><th>${t.thPres}</th></tr>
                </thead>
                <tbody id="plan-body"></tbody>
            </table>
            <div class="depre-biblio">
                <i class="fas fa-book-medical"></i> Bibliografía: The Maudsley Deprescribing Guidelines. Mark Horowitz y David Taylor, 2024.
            </div>
        </div>
    `;

    if (window.dbTaper.length === 0) {
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
            }
        } catch (e) { console.error(e); }
    }

    const sel = document.getElementById('drug-select');
    sel.innerHTML = `<option value="" selected disabled>${t.placeholder}</option>` + 
                    window.dbTaper.sort((a,b)=>a.nombre.localeCompare(b.nombre))
                    .map(d => `<option value="${d.nombre}">${d.nombre}</option>`).join('');
};

window.updatePlan = function() {
    const t = i18n[window.depreLang];
    const drugName = document.getElementById('drug-select').value;
    if (!drugName) return;

    const drug = window.dbTaper.find(d => d.nombre === drugName);
    const dose = parseFloat(document.getElementById('current-dose').value) || 0;
    const weeks = parseInt(document.getElementById('interval-select').value);
    
    const alertBox = document.getElementById('depre-alert');
    const noteBox = document.getElementById('solution-info');
    const tableBody = document.getElementById('plan-body');

    let steps = [];
    if (dose > drug.steps[0]) {
        alertBox.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${t.alertMax} ${drug.steps[0]} mg.`;
        alertBox.style.display = 'block';
        steps = [...drug.steps];
    } else {
        alertBox.style.display = 'none';
        steps = drug.steps.filter(s => s < dose);
        steps.unshift(dose);
    }

    let ratio = parseFloat(drug.solucion.replace(',', '.'));
    let esTexto = isNaN(ratio) && drug.solucion !== "" && drug.solucion !== "PROTECTED";
    
    if (esTexto) {
        // --- LÓGICA DE TRADUCCIÓN DE LA NOTA DEL EXCEL ---
        let notaMostrada = drug.solucion;
        if (window.depreLang === 'en' && t.excelNotes[drug.solucion]) {
            notaMostrada = t.excelNotes[drug.solucion];
        }
        noteBox.innerHTML = `<i class="fas fa-info-circle"></i> ${notaMostrada}`;
        noteBox.style.display = 'block';
    } else { noteBox.style.display = 'none'; }

    tableBody.innerHTML = '';
    let hData = []; let labels = []; let curW = 0; let msgPut = false;

    steps.forEach(mg => {
        labels.push(`S${curW}`);
        hData.push(mg);
        let extra = "-";
        if (!isNaN(ratio) && ratio > 0) extra = `${(mg/ratio).toFixed(2)} mL`;
        else if (esTexto && !msgPut) { extra = t.seeNote; msgPut = true; }

        tableBody.innerHTML += `<tr><td>${t.week} ${curW}</td><td><b>${mg} mg</b></td><td>${extra}</td></tr>`;
        curW += weeks;
    });

    if (hData[hData.length-1] !== 0) {
        labels.push(`S${curW}`); hData.push(0);
        tableBody.innerHTML += `<tr><td>${t.week} ${curW}</td><td><b>0 mg</b></td><td>${t.end}</td></tr>`;
    }

    const startMg = hData[0];
    let lData = labels.map((_, i) => {
        const w = i * weeks;
        return w >= 8 ? 0 : startMg - (startMg * (w / 8));
    });

    window.renderChart(labels, hData, lData);
};

window.copiarPauta = function() {
    const t = i18n[window.depreLang];
    const drugName = document.getElementById('drug-select').value;
    if (!drugName) return;

    let texto = `${t.headerPlan}: ${drugName}\n--------------------------\n`;
    const rows = document.querySelectorAll('#plan-body tr');
    
    rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        texto += `${cols[0].innerText}: ${cols[1].innerText} (${cols[2].innerText})\n`;
    });

    const note = document.getElementById('solution-info');
    if (note.style.display === 'block') {
        texto += `\n${t.noteLabel}: ${note.innerText}`;
    }

    navigator.clipboard.writeText(texto).then(() => {
        alert(t.copySuccess);
    });
};

window.renderChart = function(labels, hData, lData) {
    const t = i18n[window.depreLang];
    const ctx = document.getElementById('taperChart').getContext('2d');
    if (window.taperChart) window.taperChart.destroy();
    window.taperChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: t.labelHiper, data: hData, borderColor: '#4338ca', backgroundColor: 'rgba(67, 56, 202, 0.05)', fill: true, tension: 0.4 },
                { label: t.labelLineal, data: lData, borderColor: '#ec4899', borderDash: [5, 5], pointRadius: 0, tension: 0 }
            ]
        },
        options: { 
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { font: { size: 10, weight: '800' } } }, tooltip: { callbacks: { label: (c) => ` ${c.raw.toFixed(1)} mg` } } },
            scales: { y: { beginAtZero: true }, x: { ticks: { font: { size: 9 } } } }
        }
    });
};
