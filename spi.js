/**
 * SPI-A: Herramienta de Síntomas Básicos - Versión Pro Multilingüe
 * Optimizada para Worker v6.1 | Sin IA | Gráfico Radar
 */

let spiData = [];
let selectedSymptoms = new Set();
let spiChart = null;
let currentLang = 'es'; // Idioma por defecto

async function initSPI() {
    const container = document.getElementById('tool-container');
    if (!container) return;

    container.innerHTML = '<div class="loader-psq">Cargando datos clínicos...</div>';

    try {
        const response = await fetch('/?sheet=SPI_A');
        const json = await response.json();
        
        if (!json.values) throw new Error("No data found");

        // Mapeo dinámico: guardamos ambos idiomas para cambiar al vuelo si hace falta
        spiData = json.values.map((row, index) => ({
            id: index,
            cat: row[0],
            es: { nombre: row[1], desc: row[2] },
            en: { nombre: row[3], desc: row[4] },
            color: row[6] || '#3498db'
        }));

        renderInterface();
        initRadarChart();
    } catch (e) {
        container.innerHTML = '<div class="error-psq">Error de conexión con Google Sheets.</div>';
    }
}

function renderInterface() {
    const container = document.getElementById('tool-container');
    const categorias = [...new Set(spiData.map(s => s.cat))];
    const t = translateLabels(); // Traducciones de la interfaz

    container.innerHTML = `
        <div class="spi-layout">
            <aside class="spi-sidebar">
                <div class="spi-card sticky-sidebar">
                    <div class="sidebar-header">
                        <h3>${t.title}</h3>
                        <div class="lang-selector">
                            <span class="${currentLang==='es'?'active':''}" onclick="switchLang('es')">ES</span>
                            <span class="${currentLang==='en'?'active':''}" onclick="switchLang('en')">EN</span>
                        </div>
                    </div>
                    
                    <div class="chart-container">
                        <canvas id="radarChart"></canvas>
                    </div>
                    
                    <div class="spi-summary-actions">
                        <button onclick="copySPIText()" class="btn-psq-primary">${t.btnCopy}</button>
                        <button onclick="resetSPI()" class="btn-psq-outline">${t.btnReset}</button>
                    </div>
                </div>
            </aside>

            <main class="spi-main">
                <div class="spi-grid">
                    ${spiData.map(s => `
                        <div id="card-${s.id}" class="symptom-card ${selectedSymptoms.has(s.id)?'is-selected':''}" 
                             onclick="toggleSymptom(${s.id})" 
                             style="--accent-color: ${s.color}">
                            <div class="card-header">
                                <span class="cat-tag">${s.cat}</span>
                                <div class="check-mark"></div>
                            </div>
                            <h4>${s[currentLang].nombre}</h4>
                            <p class="symptom-desc">${s[currentLang].desc}</p>
                        </div>
                    `).join('')}
                </div>
            </main>
        </div>
    `;
}

// --- LÓGICA DE TRADUCCIÓN E IDIOMA ---

function translateLabels() {
    const labels = {
        es: { title: "Perfil de Afectación", btnCopy: "Copiar Informe", btnReset: "Reiniciar", reportTitle: "EXPLORACIÓN DE SÍNTOMAS BÁSICOS (SPI-A)", footer: "Evaluación realizada en PSQ al día." },
        en: { title: "Affection Profile", btnCopy: "Copy Report", btnReset: "Reset", reportTitle: "BASIC SYMPTOMS EXAMINATION (SPI-A)", footer: "Assessment conducted via PSQ al día." }
    };
    return labels[currentLang];
}

function switchLang(lang) {
    if (currentLang === lang) return;
    currentLang = lang;
    renderInterface();
    initRadarChart(); // Reiniciamos gráfico para actualizar labels
    updateDashboard(); // Mantenemos los datos seleccionados
}

// --- LÓGICA DEL GRÁFICO ---

function initRadarChart() {
    const ctx = document.getElementById('radarChart');
    const categorias = [...new Set(spiData.map(s => s.cat))];
    
    if(spiChart) spiChart.destroy(); // Destruir anterior para evitar duplicados

    spiChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: categorias,
            datasets: [{
                label: '%',
                data: categorias.map(() => 0),
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderColor: '#3498db',
                borderWidth: 2,
                pointBackgroundColor: '#3498db'
            }]
        },
        options: {
            scales: { r: { beginAtZero: true, max: 100, ticks: { display: false } } },
            plugins: { legend: { display: false } }
        }
    });
}

function updateDashboard() {
    const categorias = [...new Set(spiData.map(s => s.cat))];
    const dataUpdate = categorias.map(cat => {
        const totalCat = spiData.filter(s => s.cat === cat).length;
        const selectedInCat = spiData.filter(s => s.cat === cat && selectedSymptoms.has(s.id)).length;
        return (selectedInCat / totalCat) * 100;
    });

    spiChart.data.datasets[0].data = dataUpdate;
    spiChart.update();
}

// --- ACCIONES ---

function toggleSymptom(id) {
    const card = document.getElementById(`card-${id}`);
    if (selectedSymptoms.has(id)) {
        selectedSymptoms.delete(id);
        card.classList.remove('is-selected');
    } else {
        selectedSymptoms.add(id);
        card.classList.add('is-selected');
    }
    updateDashboard();
}

function copySPIText() {
    if (selectedSymptoms.size === 0) return;
    const t = translateLabels();
    const selected = spiData.filter(s => selectedSymptoms.has(s.id));
    
    const grouped = selected.reduce((acc, curr) => {
        acc[curr.cat] = acc[curr.cat] || [];
        acc[curr.cat].push(curr[currentLang].nombre);
        return acc;
    }, {});

    let text = `${t.reportTitle}\n`;
    for (const cat in grouped) {
        text += `\n[${cat}] -> ${grouped[cat].join(', ')}`;
    }
    text += `\n\n${t.footer}`;

    navigator.clipboard.writeText(text);
    alert(currentLang === 'es' ? "Copiado" : "Copied");
}

function resetSPI() {
    selectedSymptoms.clear();
    renderInterface(); // Re-renderiza para limpiar clases visuales
    initRadarChart();
}

document.addEventListener('DOMContentLoaded', initSPI);
