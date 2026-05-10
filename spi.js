/**
 * SPI-A: Herramienta de Síntomas Básicos - PSQ al día
 * ESTRUCTURA AUTÓNOMA (Estilo Catatonia/Autoinmune)
 */

// 1. Encapsulamiento para evitar conflictos de variables
(function() {
    let spiData = [];
    let selectedSymptoms = new Set();
    let spiChart = null;
    let currentLang = 'es';

    // 2. Función de Inicio (Auto-ejecutable o llamada externamente)
    async function startTool() {
        const container = document.getElementById('tool-container');
        if (!container) return;

        container.innerHTML = '<div class="loader-psq">Cargando SPI-A...</div>';

        // Carga dinámica de Chart.js si no existe (Crucial para autonomía)
        if (!window.Chart) {
            await new Promise(resolve => {
                const s = document.createElement('script');
                s.src = "https://cdn.jsdelivr.net/npm/chart.js";
                s.onload = resolve;
                document.head.appendChild(s);
            });
        }

        try {
            // El Worker v6.1 ya filtra A2:Z500, así que row[0] es tu primer dato
            const response = await fetch('/?sheet=SPI_A');
            const json = await response.json();
            
            if (!json.values || json.values.length === 0) throw "No hay datos";

            // MAPEO SEGÚN TU EXCEL (A: Cat, B/C: ES, D/E: EN, G: Color)
            spiData = json.values.map((row, index) => ({
                id: index,
                cat: row[0] || 'Varios',
                es: { nombre: row[1] || '', desc: row[2] || '' },
                en: { nombre: row[3] || '', desc: row[4] || '' },
                color: row[6] || '#3498db'
            }));

            renderUI();
            initChart();
        } catch (e) {
            container.innerHTML = '<p class="error">Error al cargar datos desde Sheets.</p>';
        }
    }

    // 3. Renderizado de Interfaz
    function renderUI() {
        const container = document.getElementById('tool-container');
        const categorias = [...new Set(spiData.map(s => s.cat))];
        
        // Inyectamos el CSS directamente (Estilo autónomo)
        if (!document.getElementById('spi-css')) {
            const style = document.createElement('style');
            style.id = 'spi-css';
            style.innerHTML = `
                .spi-layout { display: flex; gap: 20px; flex-wrap: wrap; }
                .spi-sidebar { flex: 1; min-width: 300px; position: sticky; top: 10px; height: fit-content; }
                .spi-main { flex: 2; min-width: 400px; }
                .spi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; }
                .symptom-card { 
                    padding: 15px; border-radius: 8px; border-left: 5px solid var(--accent); 
                    background: #fff; cursor: pointer; transition: 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                .symptom-card.is-selected { background: #e3f2fd; transform: scale(0.98); box-shadow: inset 0 0 5px rgba(0,0,0,0.1); }
                .cat-tag { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #888; }
                .btn-psq { width: 100%; padding: 12px; margin-top: 10px; cursor: pointer; border-radius: 5px; border: none; font-weight: bold; }
                .btn-primary { background: #3498db; color: white; }
                .lang-switch { margin-bottom: 10px; display: flex; gap: 5px; }
                .lang-switch span { cursor: pointer; padding: 2px 5px; border: 1px solid #ccc; border-radius: 3px; font-size: 12px; }
                .active-lang { background: #3498db; color: white; border-color: #3498db !important; }
            `;
            document.head.appendChild(style);
        }

        container.innerHTML = `
            <div class="spi-layout">
                <aside class="spi-sidebar">
                    <div class="spi-card" style="background:white; padding:15px; border-radius:10px;">
                        <div class="lang-switch">
                            <span class="${currentLang==='es'?'active-lang':''}" onclick="window.spiTool.setLang('es')">ES</span>
                            <span class="${currentLang==='en'?'active-lang':''}" onclick="window.spiTool.setLang('en')">EN</span>
                        </div>
                        <h3>${currentLang==='es'?'Perfil Clínico':'Clinical Profile'}</h3>
                        <canvas id="spiRadar"></canvas>
                        <button onclick="window.spiTool.copy()" class="btn-psq btn-primary">${currentLang==='es'?'Copiar Informe':'Copy Report'}</button>
                        <button onclick="window.spiTool.reset()" class="btn-psq">${currentLang==='es'?'Reiniciar':'Reset'}</button>
                    </div>
                </aside>
                <main class="spi-main">
                    <div class="spi-grid">
                        ${spiData.map(s => `
                            <div id="card-${s.id}" class="symptom-card ${selectedSymptoms.has(s.id)?'is-selected':''}" 
                                 onclick="window.spiTool.toggle(${s.id})" style="--accent: ${s.color}">
                                <div class="cat-tag">${s.cat}</div>
                                <h4 style="margin:5px 0">${s[currentLang].nombre}</h4>
                                <p style="font-size:13px; color:#666">${s[currentLang].desc}</p>
                            </div>
                        `).join('')}
                    </div>
                </main>
            </div>
        `;
    }

    // 4. Lógica del Gráfico
    function initChart() {
        const ctx = document.getElementById('spiRadar');
        const labels = [...new Set(spiData.map(s => s.cat))];
        
        spiChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    data: labels.map(() => 0),
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: '#3498db',
                    pointBackgroundColor: '#3498db'
                }]
            },
            options: {
                scales: { r: { min: 0, max: 100, ticks: { display: false } } },
                plugins: { legend: { display: false } }
            }
        });
    }

    function updateChart() {
        const labels = [...new Set(spiData.map(s => s.cat))];
        const values = labels.map(cat => {
            const items = spiData.filter(s => s.cat === cat);
            const selected = items.filter(s => selectedSymptoms.has(s.id)).length;
            return (selected / items.length) * 100;
        });
        spiChart.data.datasets[0].data = values;
        spiChart.update();
    }

    // 5. Exponer funciones al objeto global (Como en tus otras herramientas)
    window.spiTool = {
        toggle: (id) => {
            const card = document.getElementById(`card-${id}`);
            if (selectedSymptoms.has(id)) {
                selectedSymptoms.delete(id);
                card.classList.remove('is-selected');
            } else {
                selectedSymptoms.add(id);
                card.classList.add('is-selected');
            }
            updateChart();
        },
        setLang: (lang) => {
            currentLang = lang;
            renderUI();
            initChart();
            updateChart();
        },
        copy: () => {
            const selected = spiData.filter(s => selectedSymptoms.has(s.id));
            if (selected.length === 0) return;
            const text = selected.map(s => `- ${s.cat}: ${s[currentLang].nombre}`).join('\n');
            navigator.clipboard.writeText("SPI-A REPORT:\n" + text);
            alert("Copiado!");
        },
        reset: () => {
            selectedSymptoms.clear();
            renderUI();
            initChart();
        }
    };

    // Auto-inicio por si el DOM ya está listo
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        startTool();
    } else {
        document.addEventListener('DOMContentLoaded', startTool);
    }

})();
