/**
 * spi.js - Herramienta de Síntomas Básicos SPI-A
 * VERSIÓN FINAL v7.0 - ESTÉTRICA PRO + RADAR MULTICOLOR
 */

window.spiLang = 'es';
window.dbSPI = [];
window.spiSelected = new Set();
window.spiChart = null;

const i18nSPI = {
    es: {
        title: "MATRIZ SPI-A",
        copy: "COPIAR PERFIL",
        reset: "REINICIAR",
        copied: "¡Perfil copiado!",
        error: "Error: No se pudo cargar la pestaña SPI_A.",
        loading: "Cargando matriz..."
    },
    en: {
        title: "SPI-A MATRIX",
        copy: "COPY PROFILE",
        reset: "RESET",
        copied: "Profile copied!",
        error: "Error: SPI_A sheet not found.",
        loading: "Loading matrix..."
    }
};

window.iniciarSPI = async function() {
    const container = document.getElementById('modalData');
    if (!container) return;

    container.innerHTML = `<div style="padding:3rem; text-align:center; font-weight:700; opacity:0.4; letter-spacing:1px;">${i18nSPI[window.spiLang].loading}</div>`;

    // Inyección de Estilos Mejorados
    if (!document.getElementById('spi-styles')) {
        const style = document.createElement('style');
        style.id = 'spi-styles';
        style.innerHTML = `
            :root {
                --spi-radius: 12px;
                --spi-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
            }
            .spi-container { display: flex; flex-direction: column; height: 85vh; font-family: inherit; background: var(--bg); }
            .spi-nav-ui { 
                display: flex; justify-content: space-between; align-items: center; 
                padding: 12px 20px; background: var(--card); border-bottom: 1px solid var(--border);
            }
            .spi-scroll { flex: 1; overflow-y: auto; padding: 20px; }
            .spi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; margin-bottom: 30px; }
            
            /* TILE ESTÉTICA */
            .spi-tile { 
                background: var(--card); border: 1px solid var(--border); border-radius: var(--spi-radius); 
                padding: 14px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative; border-left: 5px solid var(--c);
                display: flex; flex-direction: column;
            }
            .spi-tile:hover { transform: translateY(-2px); box-shadow: var(--spi-shadow); border-color: var(--primary-light); }
            .spi-tile.active { 
                background: var(--card); border-color: var(--primary); 
                box-shadow: inset 0 0 0 1px var(--primary), var(--spi-shadow);
            }
            
            .spi-tile h4 { margin: 0; font-size: 0.8rem; font-weight: 700; color: var(--text-main); line-height: 1.2; }
            .spi-tile.active h4 { color: var(--primary); }

            /* DESCRIPCIÓN COLAPSABLE */
            .spi-tile p { 
                max-height: 0; opacity: 0; margin: 0; overflow: hidden;
                font-size: 0.7rem; color: var(--text-muted); line-height: 1.4;
                transition: max-height 0.4s ease, opacity 0.3s ease, margin-top 0.3s ease;
            }
            .spi-tile.active p { max-height: 120px; opacity: 1; margin-top: 10px; }

            .spi-radar-box { height: 260px; background: var(--card); border-top: 1px solid var(--border); padding: 15px; }
            .spi-section-title { 
                font-size: 0.65rem; font-weight: 800; text-transform: uppercase; 
                color: var(--text-muted); margin: 25px 0 12px 0; display: flex; align-items: center; gap: 10px; 
            }
            .spi-section-title::after { content:''; flex:1; height:1px; background: var(--border); opacity: 0.6; }

            /* BOTONES */
            .btn-mini { padding: 6px 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--card); color: var(--text-main); cursor: pointer; font-size: 0.7rem; }
            .lang-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
        `;
        document.head.appendChild(style);
    }

    try {
        const response = await fetch(`/?sheet=SPI_A`);
        const json = await response.json();
        
        if (!json.values) throw new Error("No values");

        window.dbSPI = json.values
            .filter(row => row[0] && row[1]) 
            .map((row, index) => {
                const cat = row[0] || 'Varios';
                return {
                    id: index,
                    color: row[6] || generarColorPastel(cat),
                    es: { cat: cat, nombre: row[1] || '', desc: row[2] || '' },
                    en: { cat: row[3] || 'Misc', nombre: row[4] || '', desc: row[5] || '' }
                };
            });

        await cargarChartJS();
        renderInterfazSPI();
        initSpiChart();

    } catch (e) {
        console.error("SPI Error:", e);
        container.innerHTML = `<div style="padding:2rem; text-align:center; color:red;">${i18nSPI[window.spiLang].error}</div>`;
    }
};

function generarColorPastel(str) {
    if (!str) return 'hsl(0, 0%, 90%)';
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 65%, 80%)`;
}

async function cargarChartJS() {
    if (window.Chart) return Promise.resolve();
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
                <h2 style="margin:0; font-size:1.1rem; font-weight:900; letter-spacing:-0.5px;">${t.title}</h2>
                <div style="display:flex; gap:10px; align-items:center;">
                    <div style="display:flex; border-radius:8px; overflow:hidden; border:1px solid var(--border);">
                        <button class="btn-mini ${window.spiLang==='es'?'active':''}" onclick="setLangSPI('es')" style="border:none; border-radius:0;">ES</button>
                        <button class="btn-mini ${window.spiLang==='en'?'active':''}" onclick="setLangSPI('en')" style="border:none; border-radius:0; border-left:1px solid var(--border);">EN</button>
                    </div>
                    <button class="btn-mini" onclick="copiarPerfilSPI()"><i class="far fa-copy"></i></button>
                    <button class="btn-mini" onclick="resetSPI()" style="font-weight:800; color:var(--primary);">${t.reset}</button>
                </div>
            </div>
            
            <div class="spi-scroll">
                ${Object.keys(grouped).map(cat => `
                    <div class="spi-section-title">${cat}</div>
                    <div class="spi-grid">
                        ${grouped[cat].map(item => `
                            <div id="spi-t-${item.id}" class="spi-tile ${window.spiSelected.has(item.id)?'active':''}" 
                                 onclick="toggleSPI(${item.id})" style="--c: ${item.color}">
                                <h4>${item[window.spiLang].nombre}</h4>
                                <p>${item[window.spiLang].desc}</p>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>

            <div class="spi-radar-box">
                <canvas id="spiCanvas"></canvas>
            </div>
        </div>
    `;
}

window.initSpiChart = function() {
    const ctx = document.getElementById('spiCanvas');
    if (!ctx) return;

    if (window.spiChart) window.spiChart.destroy();

    const cats = [...new Set(window.dbSPI.map(i => i[window.spiLang].cat))];
    
    // Obtener colores por categoría para los puntos del radar
    const pointColors = cats.map(catName => {
        const firstItem = window.dbSPI.find(i => i[window.spiLang].cat === catName);
        return firstItem ? firstItem.color : '#4338ca';
    });

    window.spiChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: cats,
            datasets: [{
                data: cats.map(() => 0),
                backgroundColor: 'rgba(67, 56, 202, 0.05)',
                borderColor: 'rgba(67, 56, 202, 0.3)',
                borderWidth: 1.5,
                pointBackgroundColor: pointColors, // Color de cada categoría
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            maintainAspectRatio: false,
            scales: { 
                r: { 
                    min: 0, max: 100, 
                    ticks: { display: false },
                    grid: { color: 'rgba(0,0,0,0.04)' },
                    pointLabels: { 
                        font: { size: 9, weight: '700' },
                        color: '#94a3b8'
                    } 
                } 
            },
            plugins: { legend: { display: false } }
        }
    });
    actualizarRadarSPI();
};

window.toggleSPI = function(id) {
    const el = document.getElementById(`spi-t-${id}`);
    if (!el) return;
    
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

window.setLangSPI = function(l) { 
    window.spiLang = l; 
    renderInterfazSPI(); 
    initSpiChart(); 
};

window.resetSPI = function() { 
    window.spiSelected.clear(); 
    renderInterfazSPI(); 
    initSpiChart(); 
};

window.copiarPerfilSPI = function() {
    const sel = window.dbSPI.filter(i => window.spiSelected.has(i.id));
    if (sel.length === 0) return;
    const txt = "SPI-A EVALUATION:\n" + sel.map(i => `• [${i[window.spiLang].cat}] ${i[window.spiLang].nombre}`).join('\n');
    navigator.clipboard.writeText(txt);
    
    const btn = document.querySelector('.fa-copy').parentElement;
    const original = btn.innerHTML;
    btn.innerHTML = 'OK';
    setTimeout(() => { btn.innerHTML = original; }, 1000);
};
