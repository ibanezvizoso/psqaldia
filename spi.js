/**
 * spi.js - Herramienta de Síntomas Básicos SPI-A
 * VERSIÓN v8.0 - COMPACT MATRIX + INFO-BAR
 */

window.spiLang = 'es';
window.dbSPI = [];
window.spiSelected = new Set();
window.spiChart = null;

const i18nSPI = {
    es: {
        title: "MATRIZ SÍNTOMAS BÁSICOS",
        copy: "COPIAR PERFIL",
        reset: "REINICIAR",
        info: "Pasa el cursor sobre un síntoma para ver detalles"
    },
    en: {
        title: "BASIC SYMPTOMS MATRIX",
        copy: "COPY PROFILE",
        reset: "RESET",
        info: "Hover over a symptom to see details"
    }
};

window.iniciarSPI = async function() {
    const container = document.getElementById('modalData');
    if (!container) return;

    if (!document.getElementById('spi-styles')) {
        const style = document.createElement('style');
        style.id = 'spi-styles';
        style.innerHTML = `
            .spi-container { display: flex; flex-direction: column; height: 85vh; font-family: inherit; background: var(--bg); color: var(--text-main); }
            .spi-nav-ui { 
                display: flex; justify-content: space-between; align-items: center; 
                padding: 10px 15px; background: var(--card); border-bottom: 1px solid var(--border);
            }
            .spi-scroll { flex: 1; overflow-y: auto; padding: 12px; }
            
            /* GRID COMPACTO */
            .spi-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fill, minmax(105px, 1fr)); 
                gap: 6px; 
                margin-bottom: 20px; 
            }
            
            .spi-tile { 
                background: var(--card); border: 1px solid var(--border); border-radius: 6px; 
                padding: 6px 8px; cursor: pointer; transition: 0.2s;
                border-left: 3px solid var(--c); min-height: 42px;
                display: flex; align-items: center; justify-content: center; text-align: center;
            }
            .spi-tile:hover { background: var(--border); }
            .spi-tile.active { 
                background: var(--primary-light); border-color: var(--primary);
                box-shadow: inset 0 0 0 1px var(--primary);
            }
            
            .spi-tile h4 { margin: 0; font-size: 0.65rem; font-weight: 700; line-height: 1.1; pointer-events: none; }

            /* BARRA DE DESCRIPCIÓN DINÁMICA */
            .spi-info-display {
                background: var(--card); border-top: 1px solid var(--border);
                padding: 8px 15px; min-height: 45px; font-size: 0.75rem;
                display: flex; align-items: center; color: var(--text-muted);
                font-style: italic; border-left: 5px solid var(--primary);
            }

            .spi-radar-box { height: 230px; background: var(--card); padding: 10px; border-top: 1px solid var(--border); }
            
            .spi-section-title { 
                font-size: 0.6rem; font-weight: 800; text-transform: uppercase; 
                color: var(--text-muted); margin: 15px 0 6px 0; display: flex; align-items: center; gap: 8px; 
            }
            .spi-section-title::after { content:''; flex:1; height:1px; background: var(--border); }

            .btn-mini { padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--card); cursor: pointer; font-size: 0.7rem; }
            .lang-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
        `;
        document.head.appendChild(style);
    }

    try {
        const response = await fetch(`/?sheet=SPI_A`);
        const json = await response.json();
        window.dbSPI = json.values.filter(row => row[0] && row[1]).map((row, index) => ({
            id: index,
            color: row[6] || generarColorPastel(row[0]),
            es: { cat: row[0], nombre: row[1], desc: row[2] },
            en: { cat: row[3] || 'Misc', nombre: row[4], desc: row[5] }
        }));

        await cargarChartJS();
        renderInterfazSPI();
        initSpiChart();
    } catch (e) {
        container.innerHTML = `<div style="padding:2rem; text-align:center; color:red;">${i18nSPI[window.spiLang].error}</div>`;
    }
};

function generarColorPastel(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash % 360)}, 60%, 80%)`;
}

async function cargarChartJS() {
    if (window.Chart) return;
    return new Promise(res => {
        const s = document.createElement('script');
        s.src = "https://cdn.jsdelivr.net/npm/chart.js";
        s.onload = res;
        document.head.appendChild(s);
    });
}

function renderInterfazSPI() {
    const t = i18nSPI[window.spiLang];
    const container = document.getElementById('modalData');
    const grouped = window.dbSPI.reduce((acc, item) => {
        const c = item[window.spiLang].cat;
        if (!acc[c]) acc[c] = [];
        acc[c].push(item);
        return acc;
    }, {});

    container.innerHTML = `
        <div class="spi-container">
            <div class="spi-nav-ui">
                <h2 style="margin:0; font-size:0.9rem; font-weight:900;">${t.title}</h2>
                <div style="display:flex; gap:8px;">
                    <button class="btn-mini ${window.spiLang==='es'?'active':''}" onclick="setLangSPI('es')">ES</button>
                    <button class="btn-mini ${window.spiLang==='en'?'active':''}" onclick="setLangSPI('en')">EN</button>
                    <button class="btn-mini" onclick="copiarPerfilSPI()"><i class="far fa-copy"></i></button>
                    <button class="btn-mini" onclick="resetSPI()">${t.reset}</button>
                </div>
            </div>
            
            <div class="spi-scroll">
                ${Object.keys(grouped).map(cat => `
                    <div class="spi-section-title">${cat}</div>
                    <div class="spi-grid">
                        ${grouped[cat].map(item => `
                            <div id="spi-t-${item.id}" class="spi-tile ${window.spiSelected.has(item.id)?'active':''}" 
                                 onclick="toggleSPI(${item.id})" 
                                 onmouseover="showSpiDesc(${item.id})"
                                 style="--c: ${item.color}">
                                <h4>${item[window.spiLang].nombre}</h4>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>

            <div class="spi-info-display" id="spiInfoBox">
                ${t.info}
            </div>

            <div class="spi-radar-box">
                <canvas id="spiCanvas"></canvas>
            </div>
        </div>
    `;
}

window.showSpiDesc = function(id) {
    const item = window.dbSPI.find(i => i.id === id);
    const box = document.getElementById('spiInfoBox');
    if (item && box) {
        box.innerHTML = `<strong>${item[window.spiLang].nombre}:</strong> &nbsp; ${item[window.spiLang].desc}`;
        box.style.color = "var(--text-main)";
        box.style.borderLeftColor = item.color;
    }
};

window.initSpiChart = function() {
    const ctx = document.getElementById('spiCanvas');
    if (!ctx) return;
    if (window.spiChart) window.spiChart.destroy();

    const cats = [...new Set(window.dbSPI.map(i => i[window.spiLang].cat))];
    const pointColors = cats.map(cat => window.dbSPI.find(i => i[window.spiLang].cat === cat).color);

    window.spiChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: cats,
            datasets: [{
                data: cats.map(() => 0),
                backgroundColor: 'rgba(67, 56, 202, 0.05)',
                borderColor: 'rgba(67, 56, 202, 0.2)',
                pointBackgroundColor: pointColors,
                pointRadius: 4
            }]
        },
        options: {
            maintainAspectRatio: false,
            scales: { r: { min: 0, max: 100, ticks: { display: false }, pointLabels: { font: { size: 8, weight: '700' } } } },
            plugins: { legend: { display: false } }
        }
    });
    actualizarRadarSPI();
};

window.toggleSPI = function(id) {
    const el = document.getElementById(`spi-t-${id}`);
    if (window.spiSelected.has(id)) {
        window.spiSelected.delete(id);
        el.classList.remove('active');
    } else {
        window.spiSelected.add(id);
        el.classList.add('active');
    }
    actualizarRadarSPI();
};

function actualizarRadarSPI() {
    if (!window.spiChart) return;
    const cats = [...new Set(window.dbSPI.map(i => i[window.spiLang].cat))];
    const values = cats.map(cat => {
        const items = window.dbSPI.filter(i => i[window.spiLang].cat === cat);
        const sel = items.filter(i => window.spiSelected.has(i.id)).length;
        return (sel / items.length) * 100;
    });
    window.spiChart.data.datasets[0].data = values;
    window.spiChart.update();
}

window.setLangSPI = function(l) { window.spiLang = l; renderInterfazSPI(); initSpiChart(); };
window.resetSPI = function() { window.spiSelected.clear(); renderInterfazSPI(); initSpiChart(); };

window.copiarPerfilSPI = function() {
    const sel = window.dbSPI.filter(i => window.spiSelected.has(i.id));
    if (!sel.length) return;
    const txt = "MATRIZ SÍNTOMAS:\n" + sel.map(i => `• [${i[window.spiLang].cat}] ${i[window.spiLang].nombre}`).join('\n');
    navigator.clipboard.writeText(txt);
};
