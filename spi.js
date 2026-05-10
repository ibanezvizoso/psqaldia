/**
 * spi.js - Herramienta de Síntomas Básicos SPI-A
 * Estructura simétrica a aes.js - Optimizado para Worker PSQALDÍA v6.1
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
        copied: "¡Perfil copiado al portapapeles!",
        error: "Error de conexión con la matriz SPI-A."
    },
    en: {
        title: "SPI-A MATRIX",
        copy: "COPY PROFILE",
        reset: "RESET",
        copied: "Profile copied to clipboard!",
        error: "Connection error with SPI-A matrix."
    }
};

// ENSEÑANZA 1: Hook de entrada único (llamado por el Index)
window.iniciarSPI = async function() {
    const container = document.getElementById('modalData');
    if (!container) return;

    // Inyectar Estilos (Enseñanza AES)
    if (!document.getElementById('spi-styles')) {
        const style = document.createElement('style');
        style.id = 'spi-styles';
        style.innerHTML = `
            .spi-container { display: flex; flex-direction: column; height: 82vh; font-family: inherit; position: relative; }
            .spi-nav-ui { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background: var(--card); border-bottom: 1px solid var(--border); z-index: 10; }
            .spi-scroll { flex: 1; overflow-y: auto; padding: 15px; background: var(--bg); }
            .spi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin-bottom: 20px; }
            .spi-tile { 
                background: var(--card); border: 1px solid var(--border); border-radius: 12px; 
                padding: 12px; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden;
            }
            .spi-tile::before { content:''; position:absolute; left:0; top:0; bottom:0; width:4px; background: var(--c); }
            .spi-tile.active { border-color: var(--primary); background: var(--primary-light); box-shadow: inset 0 0 0 1px var(--primary); }
            .spi-tile h4 { margin: 0; font-size: 0.8rem; font-weight: 700; color: var(--text-main); }
            .spi-tile p { display: none; margin: 5px 0 0 0; font-size: 0.7rem; color: var(--text-muted); font-style: italic; }
            .spi-tile.active p { display: block; }
            .spi-radar-box { height: 200px; background: var(--card); border-top: 1px solid var(--border); padding: 10px; display: flex; justify-content: center; }
            .spi-section-title { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin: 15px 0 10px 0; display: flex; align-items: center; gap: 8px; }
            .spi-section-title::after { content:''; flex:1; height:1px; background: var(--border); }
        `;
        document.head.appendChild(style);
    }

    // ENSEÑANZA 2: Carga de datos mediante el Worker
    try {
        const response = await fetch(`/?sheet=SPI_A`);
        const json = await response.json();
        
        // Mapeo de datos (Enseñanza AES: Guardar en global)
        window.dbSPI = json.values.map((row, index) => {
            const cat = row[0] || 'Varios';
            return {
                id: index,
                color: row[6] || generarColorPastel(cat),
                es: { cat: cat, nombre: row[1] || '', desc: row[2] || '' },
                en: { cat: row[3] || 'Misc', nombre: row[4] || '', desc: row[5] || '' }
            };
        });

        renderInterfazSPI();
        await cargarChartJS();
        initSpiChart();

    } catch (e) {
        container.innerHTML = `<div style="padding:20px; text-align:center;">${i18nSPI[window.spiLang].error}</div>`;
    }
};

function generarColorPastel(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 70%, 85%)`;
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
    
    // Agrupar por categoría
    const grouped = window.dbSPI.reduce((acc, item) => {
        const c = item[window.spiLang].cat;
        if (!acc[c]) acc[c] = [];
        acc[c].push(item);
        return acc;
    }, {});

    container.innerHTML = `
        <div class="spi-container">
            <div class="spi-nav-ui">
                <h2 style="margin:0; font-size:1.1rem; font-weight:900;">${t.title}</h2>
                <div style="display:flex; gap:8px;">
                    <div class="lang-toggle">
                        <button class="lang-btn ${window.spiLang==='es'?'active':''}" onclick="setLangSPI('es')">ES</button>
                        <button class="lang-btn ${window.spiLang==='en'?'active':''}" onclick="setLangSPI('en')">EN</button>
                    </div>
                    <button class="btn-copiar" onclick="copiarPerfilSPI()"><i class="far fa-copy"></i></button>
                    <button class="btn-mini" onclick="resetSPI()" style="padding:5px 10px; border-radius:8px; border:1px solid var(--border); font-weight:800; cursor:pointer;">${t.reset}</button>
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

function initSpiChart() {
    const ctx = document.getElementById('spiCanvas');
    if (!ctx) return;
    
    const cats = [...new Set(window.dbSPI.map(i => i[window.spiLang].cat))];
    
    window.spiChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: cats,
            datasets: [{
                data: cats.map(() => 0),
                backgroundColor: 'rgba(67, 56, 202, 0.2)',
                borderColor: '#4338ca',
                borderWidth: 2,
                pointRadius: 2
            }]
        },
        options: {
            maintainAspectRatio: false,
            scales: { r: { min: 0, max: 100, ticks: { display: false }, pointLabels: { font: { size: 9, weight: '700' } } } },
            plugins: { legend: { display: false } }
        }
    });
}

function actualizarRadarSPI() {
    if (!window.spiChart) return;
    const cats = [...new Set(window.dbSPI.map(i => i[window.spiLang].cat))];
    const values = cats.map(cat => {
        const total = window.dbSPI.filter(i => i[window.spiLang].cat === cat).length;
        const sel = window.dbSPI.filter(i => i[window.spiLang].cat === cat && window.spiSelected.has(i.id)).length;
        return (sel / total) * 100;
    });
    window.spiChart.data.datasets[0].data = values;
    window.spiChart.update();
}

window.setLangSPI = function(l) { window.spiLang = l; renderInterfazSPI(); initSpiChart(); actualizarRadarSPI(); };
window.resetSPI = function() { window.spiSelected.clear(); renderInterfazSPI(); initSpiChart(); };
window.copiarPerfilSPI = function() {
    const sel = window.dbSPI.filter(i => window.spiSelected.has(i.id));
    if (sel.length === 0) return;
    const txt = "EVALUACIÓN SPI-A:\n" + sel.map(i => `• [${i[window.spiLang].cat}] ${i[window.spiLang].nombre}`).join('\n');
    navigator.clipboard.writeText(txt);
    alert(i18nSPI[window.spiLang].copied);
};
