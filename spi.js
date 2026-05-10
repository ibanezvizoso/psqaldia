/**
 * spi.js - Herramienta de Síntomas Básicos SPI-A
 * VERSIÓN v8.2.1 - ANTI-CONFLICT & DUAL-ZONE UX (SHEET: spi)
 */

// Encapsulamiento total para evitar conflictos con aes.js u otros scripts
window.ToolSPI = {
    lang: 'es',
    db: [],
    selected: new Set(),
    chart: null,
    i18n: {
        es: { 
            title: "MATRIZ SÍNTOMAS BÁSICOS", 
            reset: "REINICIAR", 
            info: "Pulsa el nombre para marcar, o el icono (i) para leer descripción",
            error: "Error al cargar la hoja 'spi'"
        },
        en: { 
            title: "BASIC SYMPTOMS MATRIX", 
            reset: "RESET", 
            info: "Tap name to select, or (i) icon just to read description",
            error: "Error loading 'spi' sheet"
        }
    }
};

window.iniciarSPI = async function() {
    const container = document.getElementById('modalData');
    if (!container) return;

    // Estilos únicos para evitar colisiones CSS
    if (!document.getElementById('spi-unique-styles')) {
        const style = document.createElement('style');
        style.id = 'spi-unique-styles';
        style.innerHTML = `
            .spi-container { display: flex; flex-direction: column; height: 85vh; font-family: inherit; background: var(--bg); color: var(--text-main); }
            .spi-nav-ui { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background: var(--card); border-bottom: 1px solid var(--border); }
            .spi-scroll { flex: 1; overflow-y: auto; padding: 12px; }
            .spi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px; margin-bottom: 20px; }
            
            /* TILE DUAL-ZONE: Mejora para móvil */
            .spi-tile { 
                position: relative; background: var(--card); border: 1px solid var(--border); border-radius: 8px; 
                transition: 0.2s; border-left: 4px solid var(--c); min-height: 50px;
                display: flex; align-items: center; justify-content: center; overflow: hidden;
            }
            .spi-tile-btn { 
                flex: 1; height: 100%; display: flex; align-items: center; justify-content: center; 
                padding: 6px 22px 6px 8px; cursor: pointer; text-align: center;
            }
            .spi-tile-info { 
                position: absolute; right: 0; top: 0; bottom: 0; width: 24px; 
                display: flex; align-items: center; justify-content: center;
                background: rgba(0,0,0,0.03); color: var(--text-muted); font-size: 0.75rem; cursor: help;
                border-left: 1px solid var(--border);
            }
            .spi-tile-info:hover { background: var(--border); color: var(--primary); }

            .spi-tile.active { 
                background: var(--c) !important; color: #111 !important;
                border-color: rgba(0,0,0,0.2); font-weight: bold;
            }
            .spi-tile h4 { margin: 0; font-size: 0.65rem; font-weight: 700; line-height: 1.1; pointer-events: none; }

            .spi-info-display {
                background: var(--card); border-top: 1px solid var(--border);
                padding: 10px 15px; min-height: 55px; font-size: 0.78rem;
                display: flex; align-items: center; color: var(--text-muted);
                font-style: italic; border-left: 5px solid var(--primary);
            }
            .spi-radar-box { height: 230px; background: var(--card); padding: 10px; border-top: 1px solid var(--border); }
            .spi-section-title { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin: 15px 0 6px 0; display: flex; align-items: center; gap: 8px; }
            .spi-section-title::after { content:''; flex:1; height:1px; background: var(--border); }
            .btn-mini { padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--card); cursor: pointer; font-size: 0.7rem; }
            .btn-mini.active { background: var(--primary); color: white; border-color: var(--primary); }
        `;
        document.head.appendChild(style);
    }

    try {
        // CAMBIO: Ahora llama a la hoja "spi"
        const response = await fetch(`/?sheet=spi`);
        const json = await response.json();
        
        // Manejo robusto del JSON (por si viene en .values o directo)
        const rows = json.values ? json.values : json;

        window.ToolSPI.db = rows.slice(1).filter(row => row[0] && row[1]).map((row, index) => ({
            id: index,
            color: row[6] || '#e0e0e0',
            es: { cat: row[0], nombre: row[1], desc: row[2] },
            en: { cat: row[3] || 'Misc', nombre: row[4], desc: row[5] }
        }));

        await spi_cargarChartJS();
        renderInterfazSPI();
        initSpiChart();
    } catch (e) {
        container.innerHTML = `<div style="padding:2rem; text-align:center; color:red;">${window.ToolSPI.i18n[window.ToolSPI.lang].error}</div>`;
        console.error("Error en iniciarSPI:", e);
    }
};

// Carga asíncrona de Chart.js específica para esta herramienta
async function spi_cargarChartJS() {
    if (window.Chart) return;
    return new Promise(res => {
        const s = document.createElement('script');
        s.src = "https://cdn.jsdelivr.net/npm/chart.js";
        s.onload = res;
        document.head.appendChild(s);
    });
}

function renderInterfazSPI() {
    const t = window.ToolSPI.i18n[window.ToolSPI.lang];
    const container = document.getElementById('modalData');
    
    // Agrupación por categorías para los títulos de sección
    const grouped = window.ToolSPI.db.reduce((acc, item) => {
        const c = item[window.ToolSPI.lang].cat;
        if (!acc[c]) acc[c] = [];
        acc[c].push(item);
        return acc;
    }, {});

    container.innerHTML = `
        <div class="spi-container">
            <div class="spi-nav-ui">
                <h2 style="margin:0; font-size:0.9rem; font-weight:900;">${t.title}</h2>
                <div style="display:flex; gap:6px;">
                    <button class="btn-mini ${window.ToolSPI.lang==='es'?'active':''}" onclick="setLangSPI('es')">ES</button>
                    <button class="btn-mini ${window.ToolSPI.lang==='en'?'active':''}" onclick="setLangSPI('en')">EN</button>
                    <button class="btn-mini" onclick="resetSPI()">${t.reset}</button>
                </div>
            </div>
            
            <div class="spi-scroll">
                ${Object.keys(grouped).map(cat => `
                    <div class="spi-section-title">${cat}</div>
                    <div class="spi-grid">
                        ${grouped[cat].map(item => `
                            <div id="spi-t-${item.id}" class="spi-tile ${window.ToolSPI.selected.has(item.id)?'active':''}" style="--c: ${item.color}">
                                <div class="spi-tile-btn" onclick="toggleSPI(${item.id})">
                                    <h4>${item[window.ToolSPI.lang].nombre}</h4>
                                </div>
                                <div class="spi-tile-info" onclick="showSpiDesc(${item.id})">
                                    <i class="fas fa-info-circle"></i>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>

            <div class="spi-info-display" id="spiInfoBox">${t.info}</div>
            
            <div class="spi-radar-box">
                <canvas id="spiCanvas"></canvas>
            </div>
        </div>
    `;
}

// Muestra la descripción en la barra inferior sin seleccionar el síntoma
window.showSpiDesc = function(id) {
    const item = window.ToolSPI.db.find(i => i.id === id);
    const box = document.getElementById('spiInfoBox');
    if (item && box) {
        box.innerHTML = `<strong>${item[window.ToolSPI.lang].nombre}:</strong> &nbsp; ${item[window.ToolSPI.lang].desc}`;
        box.style.color = "var(--text-main)";
        box.style.borderLeftColor = item.color;
    }
};

// Lógica del Radar Chart
window.initSpiChart = function() {
    const ctx = document.getElementById('spiCanvas');
    if (!ctx) return;
    if (window.ToolSPI.chart) window.ToolSPI.chart.destroy();

    const cats = [...new Set(window.ToolSPI.db.map(i => i[window.ToolSPI.lang].cat))];
    const pointColors = cats.map(cat => window.ToolSPI.db.find(i => i[window.ToolSPI.lang].cat === cat).color);

    window.ToolSPI.chart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: cats,
            datasets: [{
                data: cats.map(() => 0),
                backgroundColor: 'rgba(67, 56, 202, 0.2)',
                borderColor: 'var(--primary)',
                pointBackgroundColor: pointColors,
                pointRadius: 4
            }]
        },
        options: {
            maintainAspectRatio: false,
            scales: { 
                r: { 
                    min: 0, 
                    max: 100, 
                    ticks: { display: false }, 
                    pointLabels: { font: { size: 8, weight: '700' } } 
                } 
            },
            plugins: { legend: { display: false } }
        }
    });
    actualizarRadarSPI();
};

// Seleccionar/Deseleccionar síntoma
window.toggleSPI = function(id) {
    const el = document.getElementById(`spi-t-${id}`);
    if (window.ToolSPI.selected.has(id)) {
        window.ToolSPI.selected.delete(id);
        el.classList.remove('active');
    } else {
        window.ToolSPI.selected.add(id);
        el.classList.add('active');
    }
    showSpiDesc(id); // Actualiza info al marcar
    actualizarRadarSPI();
};

// Calcula porcentajes por categoría para el radar
function actualizarRadarSPI() {
    if (!window.ToolSPI.chart) return;
    const cats = [...new Set(window.ToolSPI.db.map(i => i[window.ToolSPI.lang].cat))];
    const values = cats.map(cat => {
        const items = window.ToolSPI.db.filter(i => i[window.ToolSPI.lang].cat === cat);
        const sel = items.filter(i => window.ToolSPI.selected.has(i.id)).length;
        return (sel / items.length) * 100;
    });
    window.ToolSPI.chart.data.datasets[0].data = values;
    window.ToolSPI.chart.update();
}

// Funciones de control de interfaz
window.setLangSPI = function(l) { window.ToolSPI.lang = l; renderInterfazSPI(); initSpiChart(); };
window.resetSPI = function() { window.ToolSPI.selected.clear(); renderInterfazSPI(); initSpiChart(); };
