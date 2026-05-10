/**
 * SPI-A: Herramienta de Síntomas Básicos
 * PSQ al día - Versión Pro
 */

let spiData = [];
let selectedSymptoms = new Set();

async function initSPI() {
    const container = document.getElementById('tool-container');
    if (!container) return;

    // Loader visual
    container.innerHTML = '<div class="loader-psq">Cargando dominios clínicos...</div>';

    try {
        // Llamada a tu Worker con el parámetro sheet
        const response = await fetch('/?sheet=SPI_A');
        const json = await response.json();
        
        // Procesamos datos (fila 0 son cabeceras)
        spiData = json.values.slice(1).map((row, index) => ({
            id: index,
            cat: row[0],
            nombre: row[1],
            desc: row[2],
            color: row[6] || '#3498db'
        }));

        renderInterface();
    } catch (e) {
        container.innerHTML = '<p>Error al conectar con el servidor de Sheets.</p>';
    }
}

function renderInterface() {
    const container = document.getElementById('tool-container');
    
    // Obtenemos categorías únicas para el Dashboard
    const categorias = [...new Set(spiData.map(s => s.cat))];

    container.innerHTML = `
        <div class="spi-layout">
            <aside class="spi-sidebar">
                <div class="spi-card sticky-sidebar">
                    <h3>Perfil de Afectación</h3>
                    <div id="spi-chart" class="spi-chart-container">
                        ${categorias.map(cat => `
                            <div class="chart-row">
                                <span class="chart-label">${cat}</span>
                                <div class="chart-bar-bg">
                                    <div id="bar-${slugify(cat)}" class="chart-bar-fill" style="width: 0%; background: ${spiData.find(s=>s.cat === cat).color}"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="spi-summary-actions">
                        <button onclick="copySPIText()" class="btn-psq-primary">Copiar Informe</button>
                        <button onclick="resetSPI()" class="btn-psq-outline">Reiniciar</button>
                    </div>
                </div>
            </aside>

            <main class="spi-main">
                <div class="spi-grid">
                    ${spiData.map(s => `
                        <div id="card-${s.id}" class="symptom-card" onclick="toggleSymptom(${s.id})" style="--accent-color: ${s.color}">
                            <div class="card-header">
                                <span class="cat-tag">${s.cat}</span>
                                <div class="check-mark"></div>
                            </div>
                            <h4>${s.nombre}</h4>
                            <p class="symptom-desc">${s.desc}</p>
                        </div>
                    `).join('')}
                </div>
            </main>
        </div>
    `;
}

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

function updateDashboard() {
    const counts = {};
    const totals = {};

    spiData.forEach(s => {
        totals[s.cat] = (totals[s.cat] || 0) + 1;
        if (selectedSymptoms.has(s.id)) {
            counts[s.cat] = (counts[s.cat] || 0) + 1;
        }
    });

    for (const cat in totals) {
        const percent = ((counts[cat] || 0) / totals[cat]) * 100;
        const bar = document.getElementById(`bar-${slugify(cat)}`);
        if (bar) bar.style.width = `${percent}%`;
    }
}

function copySPIText() {
    if (selectedSymptoms.size === 0) return alert("Selecciona algún síntoma primero");

    const selected = spiData.filter(s => selectedSymptoms.has(s.id));
    const grouped = selected.reduce((acc, curr) => {
        acc[curr.cat] = acc[curr.cat] || [];
        acc[curr.cat].push(curr.nombre);
        return acc;
    }, {});

    let text = "EXPLORACIÓN DE SÍNTOMAS BÁSICOS (SPI-A):\n";
    for (const cat in grouped) {
        text += `\n[${cat}]\n- ${grouped[cat].join('\n- ')}\n`;
    }
    text += "\nEvaluación realizada mediante PSQ al día.";

    navigator.clipboard.writeText(text);
    alert("Informe copiado al portapapeles");
}

function slugify(text) {
    return text.toString().toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
}

function resetSPI() {
    selectedSymptoms.clear();
    document.querySelectorAll('.symptom-card').forEach(c => c.classList.remove('is-selected'));
    updateDashboard();
}
