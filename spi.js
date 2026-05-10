/**
 * SPI-A: Herramienta de Síntomas Básicos - Versión Pro Autónoma
 * PSQ al día | Multilingüe | Gráfico Radar | Auto-Inyectable
 */

(function() {
    // --- CONFIGURACIÓN GLOBAL ---
    let spiData = [];
    let selectedSymptoms = new Set();
    let spiChart = null;
    let currentLang = 'es';

    // --- 1. AUTO-INYECCIÓN DE ESTILOS (CSS) ---
    const injectStyles = () => {
        if (document.getElementById('spi-styles')) return;
        const style = document.createElement('style');
        style.id = 'spi-styles';
        style.innerHTML = `
            :root { --psq-blue: #3498db; --psq-bg: #f8f9fa; }
            #tool-container { max-width: 1200px; margin: 20px auto; font-family: 'Segoe UI', system-ui, sans-serif; color: #2c3e50; }
            .spi-layout { display: grid; grid-template-columns: 320px 1fr; gap: 25px; }
            
            .spi-sidebar { position: sticky; top: 20px; height: fit-content; }
            .spi-card { background: white; padding: 20px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
            
            .sidebar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
            .lang-selector span { cursor: pointer; padding: 2px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; }
            .lang-selector span.active { background: var(--psq-blue); color: white; border-color: var(--psq-blue); }

            .spi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 15px; }
            .symptom-card { 
                background: white; border-radius: 12px; padding: 15px; cursor: pointer;
                border-left: 6px solid var(--accent-color); transition: 0.2s; position: relative;
                box-shadow: 0 4px 6px rgba(0,0,0,0.03);
            }
            .symptom-card:hover { transform: translateY(-3px); box-shadow: 0 8px 15px rgba(0,0,0,0.1); }
            .symptom-card.is-selected { background: #ebf5ff; outline: 2px solid var(--psq-blue); }
            .check-mark { position: absolute; top: 10px; right: 10px; font-weight: bold; color: var(--psq-blue); display: none; }
            .symptom-card.is-selected .check-mark { display: block; }

            .cat-tag { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; opacity: 0.6; }
            .symptom-desc { font-size: 13px; color: #666; line-height: 1.4; margin-top: 8px; }
            
            .btn-psq-primary { width: 100%; background: var(--psq-blue); color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 15px; }
            .btn-psq-outline { width: 100%; background: transparent; border: 1px solid #ddd; padding: 8px; border-radius: 8px; cursor: pointer; margin-top: 8px; font-size: 13px; }
            
            @media (max-width: 850px) { .spi-layout { grid-template-columns: 1fr; } .spi-sidebar { position: relative; top: 0; } }
            .loader-psq { text-align: center; padding: 50px; font-style: italic; }
        `;
        document.head.appendChild(style);
    };

    // --- 2. CARGA DINÁMICA DE CHART.JS ---
    const loadChartJS = () => {
        return new Promise((resolve) => {
            if (window.Chart) return resolve();
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/chart.js";
            script.onload = resolve;
            document.head.appendChild(script);
        });
    };

    // --- 3. LÓGICA PRINCIPAL ---
    window.initSPI = async function() {
        let container = document.getElementById('tool-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'tool-container';
            document.body.appendChild(container);
        }

        injectStyles();
        container.innerHTML = '<div class="loader-psq">Iniciando dominios clínicos...</div>';

        try {
            await loadChartJS();
            const response = await fetch('/?sheet=SPI_A');
            const json = await response.json();
            
            if (!json.values) throw new Error();

            // Mapeo: 0:Cat, 1:NombreES, 2:DescES, 3:NombreEN, 4:DescEN, 6:Color
            spiData = json.values.map((row, index) => ({
                id: index,
                cat: row[0] || 'Misc',
                es: { nombre: row[1] || '', desc: row[2] || '' },
                en: { nombre: row[3] || '', desc: row[4] || '' },
                color: row[6] || '#3498db'
            }));

            renderInterface();
            initRadarChart();
        } catch (e) {
            container.innerHTML = '<p style="text-align:center">Error de conexión. Verifica la hoja SPI_A.</p>';
        }
    };

    function renderInterface() {
        const container = document.getElementById('tool-container');
        const t = translateLabels();

        container.innerHTML = `
            <div class="spi-layout">
                <aside class="spi-sidebar">
                    <div class="spi-card">
                        <div class="sidebar-header">
                            <h3 style="margin:0">${t.title}</h3>
                            <div class="lang-selector">
                                <span class="${currentLang==='es'?'active':''}" onclick="switchLang('es')">ES</span>
                                <span class="${currentLang==='en'?'active':''}" onclick="switchLang('en')">EN</span>
                            </div>
                        </div>
                        <canvas id="radarChart"></canvas>
                        <button onclick="copySPIText()" class="btn-psq-primary">${t.btnCopy}</button>
                        <button onclick="resetSPI()" class="btn-psq-outline">${t.btnReset}</button>
                    </div>
                </aside>
                <main class="spi-main">
                    <div class="spi-grid">
                        ${spiData.map(s => `
                            <div id="card-${s.id}" class="symptom-card ${selectedSymptoms.has(s.id)?'is-selected':''}" 
                                 onclick="toggleSymptom(${s.id})" style="--accent-color: ${s.color}">
                                <div class="cat-tag">${s.cat}</div>
                                <div class="check-mark">✓</div>
                                <h4 style="margin: 8px 0 5px 0">${s[currentLang].nombre}</h4>
                                <p class="symptom-desc">${s[currentLang].desc}</p>
                            </div>
                        `).join('')}
                    </div>
                </main>
            </div>
        `;
    }

    function initRadarChart() {
        const ctx = document.getElementById('radarChart');
        const categorias = [...new Set(spiData.map(s => s.cat))];
        if (spiChart) spiChart.destroy();

        spiChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: categorias,
                datasets: [{
                    data: categorias.map(() => 0),
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: '#3498db',
                    pointRadius: 2
                }]
            },
            options: {
                scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: '#eee' } } },
                plugins: { legend: { display: false } }
            }
        });
    }

    window.toggleSymptom = (id) => {
        const card = document.getElementById(`card-${id}`);
        if (selectedSymptoms.has(id)) {
            selectedSymptoms.delete(id);
            card.classList.remove('is-selected');
        } else {
            selectedSymptoms.add(id);
            card.classList.add('is-selected');
        }
        updateDashboard();
    };

    function updateDashboard() {
        const categorias = [...new Set(spiData.map(s => s.cat))];
        const scores = categorias.map(cat => {
            const total = spiData.filter(s => s.cat === cat).length;
            const active = spiData.filter(s => s.cat === cat && selectedSymptoms.has(s.id)).length;
            return (active / total) * 100;
        });
        spiChart.data.datasets[0].data = scores;
        spiChart.update();
    }

    window.switchLang = (lang) => {
        currentLang = lang;
        renderInterface();
        initRadarChart();
        updateDashboard();
    };

    window.copySPIText = () => {
        if (selectedSymptoms.size === 0) return alert("Selecciona síntomas");
        const t = translateLabels();
        const selected = spiData.filter(s => selectedSymptoms.has(s.id));
        const grouped = selected.reduce((acc, curr) => {
            acc[curr.cat] = acc[curr.cat] || [];
            acc[curr.cat].push(curr[currentLang].nombre);
            return acc;
        }, {});

        let text = `${t.reportTitle}\n`;
        for (const cat in grouped) text += `\n[${cat}] -> ${grouped[cat].join(', ')}`;
        text += `\n\n${t.footer}`;
        
        navigator.clipboard.writeText(text);
        alert(currentLang === 'es' ? "Informe copiado" : "Report copied");
    };

    window.resetSPI = () => {
        selectedSymptoms.clear();
        renderInterface();
        initRadarChart();
    };

    function translateLabels() {
        const labels = {
            es: { title: "Perfil SPI-A", btnCopy: "Copiar Informe", btnReset: "Reiniciar", reportTitle: "EXPLORACIÓN DE SÍNTOMAS BÁSICOS (SPI-A)", footer: "Evaluación vía PSQ al día." },
            en: { title: "SPI-A Profile", btnCopy: "Copy Report", btnReset: "Reset", reportTitle: "BASIC SYMPTOMS EXAMINATION (SPI-A)", footer: "Assessment via PSQ al día." }
        };
        return labels[currentLang];
    }

    // Ejecución automática
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSPI);
    } else {
        initSPI();
    }
})();
