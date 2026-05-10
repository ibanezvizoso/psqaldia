/**
 * spi.js - Herramienta de Síntomas Básicos SPI-A
 * VERSIÓN CORREGIDA Y OPTIMIZADA v6.3
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

    container.innerHTML = `<div style="padding:2rem; text-align:center; font-weight:800; opacity:0.5;">${i18nSPI[window.spiLang].loading}</div>`;

    // Inyectar estilos (Mantenemos tu lógica de blindaje)
    if (!document.getElementById('spi-styles')) {
        const style = document.createElement('style');
        style.id = 'spi-styles';
        style.innerHTML = `
            .spi-container { display: flex; flex-direction: column; height: 82vh; font-family: inherit; }
            .spi-nav-ui { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background: var(--card); border-bottom: 1px solid var(--border); }
            .spi-scroll { flex: 1; overflow-y: auto; padding: 15px; background: var(--bg); }
            .spi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; margin-bottom: 20px; }
            .spi-tile { 
                background: var(--card); border: 1px solid var(--border); border-radius: 12px; 
                padding: 10px; cursor: pointer; transition: 0.2s; position: relative; border-left: 4px solid var(--c);
            }
            .spi-tile.active { background: var(--primary-light); border-color: var(--primary); box-shadow: inset 0 0 0 1px var(--primary); }
            .spi-tile h4 { margin: 0; font-size: 0.75rem; font-weight: 700; color: var(--text-main); line-height:1.2; }
            .spi-tile p { display: none; margin: 5px 0 0 0; font-size: 0.65rem; color: var(--text-muted); line-height:1.3; }
            .spi-tile.active p { display: block; }
            .spi-radar-box { height: 220px; background: var(--card); border-top: 1px solid var(--border); padding: 10px; }
            .spi-section-title { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin: 15px 0 8px 0; display: flex; align-items: center; gap: 8px; }
            .spi-section-title::after { content:''; flex:1; height:1px; background: var(--border); }
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
                    // Prioridad al color de la fila, si no, pastel aleatorio
                    color: row[6] || generarColorPastel(cat),
                    es: { cat: cat, nombre: row[1] || '', desc: row[2] || '' },
                    en: { cat: row[3] || 'Misc', nombre: row[4] || '', desc: row[5] || '' }
                };
            });

        // 1. Cargar dependencia primero
        await cargarChartJS();
        // 2. Renderizar Interfaz
        renderInterfazSPI();
        // 3. Inicializar gráfico (con el canvas ya en el DOM)
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
    return `hsl(${h}, 60%, 85%)`;
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
                <h2 style="margin:0; font-size:1rem; font-weight:900;">${t.title}</h2>
                <div style="display:flex; gap:8px;">
                    <div class="lang-toggle">
                        <button class="lang-btn ${window.spiLang==='es'?'active':''}" onclick="setLangSPI('es')">ES</button>
                        <button class="lang-btn ${window.spiLang==='en'?'active':''}" onclick="setLangSPI('en')">EN</button>
                    </div>
                    <button class="btn-mini" onclick="copiarPerfilSPI()" style="cursor:pointer;"><i class="far fa-copy"></i></button>
                    <button class="btn-mini" onclick="resetSPI()" style="cursor:pointer; font-weight:800;">${t.reset}</button>
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

    // --- CORRECCIÓN CLAVE: Destruir gráfico previo si existe ---
    if (window.spiChart) {
        window.spiChart.destroy();
    }

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
    // Actualizar por si ya había algo seleccionado
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
    initSpiChart(); // Esto ahora destruye y recrea correctamente
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
