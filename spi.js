/**
 * spi.js - Herramienta de Síntomas Básicos SPI-A
 * VERSIÓN v9.2 - Optimización de Espacio y Layout
 */

window.ToolSPI = {
    lang: 'es',
    db: [],
    selected: new Set(),
    chart: null,
    iaActiva: false,
    i18n: {
        es: { 
            title: "SÍNTOMAS BÁSICOS", 
            reset: "Reiniciar",
            copy: "COPIAR",
            copied: "✓ COPIADO",
            ia: "✦ IA",
            iaGenerando: "Generando...",
            iaVacio: "Selecciona al menos un síntoma",
            info: "Pulsa el nombre para marcar · (i) para descripción",
            error: "Error al cargar la hoja 'spi'"
        },
        en: { 
            title: "BASIC SYMPTOMS", 
            reset: "Reset",
            copy: "COPY",
            copied: "✓ COPIED",
            ia: "✦ AI",
            iaGenerando: "Generating...",
            iaVacio: "Select at least one symptom",
            info: "Tap name to select · (i) for description",
            error: "Error loading 'spi' sheet"
        }
    }
};

window.iniciarSPI = async function() {
    const container = document.getElementById('modalData');
    if (!container) return;

    if (!document.getElementById('spi-unique-styles')) {
        const style = document.createElement('style');
        style.id = 'spi-unique-styles';
        style.innerHTML = `
            .spi-container { 
                display: flex; flex-direction: column; height: 85vh; 
                font-family: inherit; background: var(--bg); color: var(--text-main); 
                overflow: hidden;
            }

            /* NAV */
            .spi-nav-ui { 
                display: flex; justify-content: space-between; align-items: center; 
                padding: 10px 15px; background: var(--card); 
                border-bottom: 1px solid var(--border);
                flex-shrink: 0;
            }
            
            /* Desplazamos los botones a la izquierda para evitar la cruz del modal */
            .spi-nav-right { 
                display: flex; 
                gap: 6px; 
                align-items: center; 
                margin-right: 35px; 
            }

            /* SCROLL AREA */
            .spi-scroll { flex: 1; overflow-y: auto; padding: 12px 12px 0 12px; }

            /* GRID */
            .spi-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); 
                gap: 8px; margin-bottom: 20px; 
            }

            /* TILES */
            .spi-tile { 
                position: relative; background: var(--card); border: 1px solid var(--border); 
                border-radius: 10px; transition: transform 0.15s, box-shadow 0.15s; 
                border-left: 4px solid var(--c); min-height: 52px;
                display: flex; align-items: center; justify-content: center; overflow: hidden;
            }
            .spi-tile:hover { transform: translateY(-1px); box-shadow: 0 3px 10px rgba(0,0,0,0.08); }
            .spi-tile-btn { 
                flex: 1; height: 100%; display: flex; align-items: center; justify-content: center; 
                padding: 7px 26px 7px 10px; cursor: pointer; text-align: center;
            }
            .spi-tile-info { 
                position: absolute; right: 0; top: 0; bottom: 0; width: 26px; 
                display: flex; align-items: center; justify-content: center;
                background: rgba(0,0,0,0.02); color: var(--text-muted); font-size: 0.7rem; cursor: help;
                border-left: 1px solid var(--border); transition: background 0.15s;
            }
            .spi-tile-info:hover { background: var(--border); color: var(--primary); }
            .spi-tile.active { 
                background: var(--c) !important; color: #111 !important;
                border-color: rgba(0,0,0,0.15); font-weight: bold;
                box-shadow: 0 2px 8px rgba(0,0,0,0.12);
            }
            .spi-tile h4 { margin: 0; font-size: 0.68rem; font-weight: 700; line-height: 1.2; pointer-events: none; }

            /* SECTION TITLES */
            .spi-section-title { 
                font-size: 0.6rem; font-weight: 800; text-transform: uppercase; 
                color: var(--text-muted); margin: 15px 0 6px 0; 
                display: flex; align-items: center; gap: 8px; letter-spacing: 0.05em;
            }
            .spi-section-title::after { content:''; flex:1; height:1px; background: var(--border); }

            /* BOTTOM PANEL */
            .spi-bottom { flex-shrink: 0; border-top: 1px solid var(--border); }

            /* INFO BOX */
            .spi-info-display {
                background: var(--card);
                padding: 10px 15px; min-height: 52px; font-size: 0.78rem;
                display: flex; align-items: center; color: var(--text-muted);
                font-style: italic; border-left: 5px solid var(--primary);
                transition: border-left-color 0.3s, color 0.2s;
                line-height: 1.4;
            }

            /* IA OUTPUT */
            .spi-ia-output {
                display: none;
                background: var(--bg);
                border-top: 1px solid var(--border);
                padding: 10px 15px;
                font-size: 0.78rem;
                line-height: 1.6;
                color: var(--text-main);
                font-style: normal;
                max-height: 120px;
                overflow-y: auto;
                border-left: 5px solid var(--primary);
            }
            .spi-ia-output.visible { display: block; }
            .spi-ia-output.loading { color: var(--text-muted); font-style: italic; }

            /* IA FOOTER */
            .spi-ia-footer {
                display: none;
                padding: 6px 15px;
                background: var(--card);
                border-top: 1px solid var(--border);
                justify-content: flex-end;
            }
            .spi-ia-footer.visible { display: flex; }

            /* RADAR */
            .spi-radar-box { 
                height: 200px; background: var(--card); padding: 8px; 
                border-top: 1px solid var(--border); 
            }

            /* BUTTONS */
            .btn-mini { 
                padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border); 
                background: var(--card); cursor: pointer; font-size: 0.7rem; font-weight: 700;
                transition: all 0.15s; color: var(--text-main);
                display: flex; align-items: center; justify-content: center;
            }
            .btn-mini:hover { background: var(--border); }
            .btn-mini.active { background: var(--primary); color: white; border-color: var(--primary); }
            .btn-mini.ia { border-color: var(--primary); color: var(--primary); }
            .btn-mini.ia:hover { background: var(--primary); color: white; }
            .btn-mini.copy-sm { font-size: 0.65rem; padding: 3px 8px; }

            @media (max-width: 400px) {
                .spi-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); }
            }
        `;
        document.head.appendChild(style);
    }

    try {
        const response = await fetch(`/?sheet=spi`);
        const json = await response.json();
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
    
    const grouped = window.ToolSPI.db.reduce((acc, item) => {
        const c = item[window.ToolSPI.lang].cat;
        if (!acc[c]) acc[c] = [];
        acc[c].push(item);
        return acc;
    }, {});

    container.innerHTML = `
        <div class="spi-container">

            <div class="spi-nav-ui">
                <h2 style="margin:0; font-size:0.88rem; font-weight:900; letter-spacing:0.02em;">
                    ${t.title}
                </h2>
                <div class="spi-nav-right">
                    <button class="btn-mini ${window.ToolSPI.lang==='es'?'active':''}" onclick="setLangSPI('es')">ES</button>
                    <button class="btn-mini ${window.ToolSPI.lang==='en'?'active':''}" onclick="setLangSPI('en')">EN</button>
                    <button class="btn-mini ia" onclick="generarNarrativaSPI()">${t.ia}</button>
                    <button class="btn-mini" onclick="resetSPI()" title="${t.reset}">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>

            <div class="spi-scroll">
                ${Object.keys(grouped).map(cat => `
                    <div class="spi-section-title">${cat}</div>
                    <div class="spi-grid">
                        ${grouped[cat].map(item => `
                            <div id="spi-t-${item.id}" 
                                 class="spi-tile ${window.ToolSPI.selected.has(item.id)?'active':''}" 
                                 style="--c: ${item.color}">
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

            <div class="spi-bottom">
                <div class="spi-info-display" id="spiInfoBox">${t.info}</div>
                <div class="spi-ia-output" id="spiIaOutput"></div>
                <div class="spi-ia-footer" id="spiIaFooter">
                    <button class="btn-mini copy-sm" onclick="copiarNarrativaSPI()">${t.copy}</button>
                </div>
                <div class="spi-radar-box">
                    <canvas id="spiCanvas"></canvas>
                </div>
            </div>

        </div>
    `;
}

// --- Resto de funciones idénticas ---
window.showSpiDesc = function(id) {
    const item = window.ToolSPI.db.find(i => i.id === id);
    const box = document.getElementById('spiInfoBox');
    if (!item || !box) return;
    box.innerHTML = `<strong>${item[window.ToolSPI.lang].nombre}:</strong>&nbsp;${item[window.ToolSPI.lang].desc}`;
    box.style.color = "var(--text-main)";
    box.style.borderLeftColor = item.color;
    box.style.fontStyle = "normal";
};

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
                backgroundColor: 'rgba(67, 56, 202, 0.15)',
                borderColor: 'var(--primary)',
                borderWidth: 2,
                pointBackgroundColor: pointColors,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            maintainAspectRatio: false,
            animation: { duration: 300 },
            scales: { 
                r: { 
                    min: 0, max: 100, 
                    ticks: { display: false },
                    grid: { color: 'rgba(0,0,0,0.06)' },
                    pointLabels: { font: { size: 8, weight: '700' } }
                } 
            },
            plugins: { legend: { display: false } }
        }
    });
    actualizarRadarSPI();
};

window.toggleSPI = function(id) {
    const el = document.getElementById(`spi-t-${id}`);
    if (window.ToolSPI.selected.has(id)) {
        window.ToolSPI.selected.delete(id);
        el.classList.remove('active');
    } else {
        window.ToolSPI.selected.add(id);
        el.classList.add('active');
    }
    showSpiDesc(id);
    actualizarRadarSPI();
};

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

window.generarNarrativaSPI = async function() {
    const t = window.ToolSPI.i18n[window.ToolSPI.lang];
    const iaOutput = document.getElementById('spiIaOutput');
    const iaFooter = document.getElementById('spiIaFooter');
    if (window.ToolSPI.selected.size === 0) {
        iaOutput.textContent = t.iaVacio;
        iaOutput.className = 'spi-ia-output visible loading';
        iaFooter.className = 'spi-ia-footer';
        return;
    }
    const seleccionados = window.ToolSPI.db.filter(i => window.ToolSPI.selected.has(i.id)).map(i => `[${i[window.ToolSPI.lang].cat}] ${i[window.ToolSPI.lang].nombre}`).join('\n');
    iaOutput.textContent = t.iaGenerando;
    iaOutput.className = 'spi-ia-output visible loading';
    iaFooter.className = 'spi-ia-footer';
    try {
        const res = await fetch('/api/ia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toolId: 'spi', context: seleccionados })
        });
        const data = await res.json();
        const texto = (data.response || '').replace(/\*\*|###|##|\*/g, '').trim();
        iaOutput.textContent = texto;
        iaOutput.className = 'spi-ia-output visible';
        iaFooter.className = 'spi-ia-footer visible';
    } catch (e) {
        iaOutput.textContent = 'Error al conectar con la IA.';
        iaOutput.className = 'spi-ia-output visible loading';
    }
};

window.copiarNarrativaSPI = function() {
    const t = window.ToolSPI.i18n[window.ToolSPI.lang];
    const texto = document.getElementById('spiIaOutput').textContent;
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    const btn = document.querySelector('.spi-ia-footer .btn-mini');
    if (!btn) return;
    btn.textContent = t.copied;
    setTimeout(() => btn.textContent = t.copy, 2000);
};

window.setLangSPI = function(l) { window.ToolSPI.lang = l; renderInterfazSPI(); initSpiChart(); };
window.resetSPI = function() { window.ToolSPI.selected.clear(); renderInterfazSPI(); initSpiChart(); };
