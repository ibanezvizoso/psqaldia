/**
 * SPI-A: Herramienta de Síntomas Básicos - PSQ al día
 * Versión 5.0: Pro-UI, Fix de Inicialización y Colores Pastel
 */

window.SpiTool = {
    data: [],
    selected: new Set(),
    chart: null,
    lang: 'es',
    categoryColors: {},

    async init() {
        // Aseguramos que el DOM esté listo antes de buscar el contenedor
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => this.init());
            return;
        }

        const target = document.getElementById('modalData');
        if (!target) return; // Salida silenciosa si no es la página correcta

        this.container = target;
        this.injectStyles();
        
        this.container.innerHTML = `<div class="spi-loader-bar"></div>`;

        try {
            await this.loadChartLib();
            const response = await fetch('/?sheet=SPI_A');
            const json = await response.json();
            
            if (!json.values || json.values.length === 0) throw new Error("No data");

            this.data = json.values.map((row, index) => {
                const catES = row[0] || 'Varios';
                return {
                    id: index,
                    es: { cat: catES, nombre: row[1] || '', desc: row[2] || '' },
                    en: { cat: row[3] || 'Misc', nombre: row[4] || '', desc: row[5] || '' },
                    color: row[6] ? row[6].trim() : this.genColor(catES)
                };
            });

            this.render();
            // Eliminamos el setTimeout arbitrario y usamos una comprobación real
            this.waitForChartThenInit();

        } catch (err) {
            console.error("SPI-A Initialization Error:", err);
            this.container.innerHTML = `<p style="padding:20px;text-align:center;color:#64748b;">Error cargando matriz SPI-A. Reintente en unos instantes.</p>`;
        }
    },

    genColor(cat) {
        if (!this.categoryColors[cat]) {
            // Generación de colores pastel basada en el nombre de la categoría
            let hash = 0;
            for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
            const h = Math.abs(hash % 360);
            this.categoryColors[cat] = `hsl(${h}, 70%, 90%)`; 
        }
        return this.categoryColors[cat];
    },

    loadChartLib() {
        return new Promise(res => {
            if (window.Chart) return res();
            const s = document.createElement('script');
            s.src = "https://cdn.jsdelivr.net/npm/chart.js";
            s.async = true;
            s.onload = res;
            document.head.appendChild(s);
        });
    },

    waitForChartThenInit() {
        if (window.Chart) {
            this.initChart();
        } else {
            setTimeout(() => this.waitForChartThenInit(), 50);
        }
    },

    injectStyles() {
        if (document.getElementById('spi-css-v5')) return;
        const style = document.createElement('style');
        style.id = 'spi-css-v5';
        style.innerHTML = `
            .spi-v5 { 
                display: flex; flex-direction: column; height: 85vh; 
                background: #fdfdfe; font-family: 'Inter', system-ui, sans-serif; 
                position: relative; color: #1e293b;
            }
            
            .spi-nav { 
                padding: 16px 20px; background: white; 
                border-bottom: 1px solid #f1f5f9;
                display: flex; justify-content: space-between; align-items: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.02); z-index: 20;
            }
            .spi-nav h2 { margin:0; font-size: 1rem; font-weight: 800; letter-spacing: -0.025em; color: #0f172a; }

            .spi-scroll { flex: 1; overflow-y: auto; padding: 20px; scroll-behavior: smooth; }
            
            .spi-section { margin-bottom: 24px; }
            .spi-section-title { 
                font-size: 0.7rem; font-weight: 700; text-transform: uppercase; 
                color: #94a3b8; margin-bottom: 12px; display: flex; align-items: center; gap: 12px;
            }
            .spi-section-title::after { content:''; flex:1; height:1px; background: #f1f5f9; }

            .spi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
            
            .spi-tile {
                background: white; border: 1px solid #f1f5f9; border-radius: 12px;
                padding: 12px; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex; flex-direction: column; min-height: 60px; position: relative;
            }
            .spi-tile::before { 
                content:''; position:absolute; left:8px; top:12px; bottom:12px; 
                width:4px; border-radius: 4px; background: var(--c); opacity: 0.6;
            }
            .spi-tile:hover { transform: translateY(-3px); border-color: #cbd5e1; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
            .spi-tile.active { background: #f8fafc; border-color: #3b82f6; border-left: 4px solid #3b82f6; }
            .spi-tile.active::before { display: none; }
            
            .spi-tile h4 { margin: 0 0 0 12px; font-size: 0.75rem; font-weight: 600; line-height: 1.3; color: #334155; }
            .spi-tile p { display: none; margin: 8px 0 0 12px; font-size: 0.68rem; color: #64748b; line-height: 1.4; }
            .spi-tile.active p { display: block; animation: fadeIn 0.3s ease; }

            @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

            .spi-radar-box { 
                height: 220px; background: white; border-top: 1px solid #f1f5f9; 
                padding: 15px; display: flex; justify-content: center;
                box-shadow: 0 -4px 6px -1px rgba(0,0,0,0.02);
            }

            .spi-btn-group { display: flex; gap: 6px; }
            .btn-mini { 
                padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0; 
                font-size: 0.7rem; font-weight: 600; cursor: pointer; background: white; transition: 0.2s;
            }
            .btn-mini:hover { background: #f8fafc; }
            .btn-mini.active { background: #0f172a; color: white; border-color: #0f172a; }
            .btn-copy { background: #3b82f6; color: white; border: none; }
            .btn-copy:hover { background: #2563eb; }

            .spi-loader-bar { height: 3px; width: 100%; background: #3b82f6; position: absolute; top:0; left:0; animation: spi-load 2s infinite; }
            @keyframes spi-load { 0% { width: 0%; left: 0; } 50% { width: 100%; left: 0; } 100% { width: 0%; left: 100%; } }
            
            @media (max-width: 600px) {
                .spi-grid { grid-template-columns: 1fr 1fr; }
                .spi-radar-box { height: 180px; }
            }
        `;
        document.head.appendChild(style);
    },

    render() {
        const t = this.lang === 'es' ? 
            { title: "Matriz SPI-A", copy: "Copiar", reset: "Reiniciar" } : 
            { title: "SPI-A Matrix", copy: "Copy", reset: "Reset" };

        const grouped = this.data.reduce((acc, s) => {
            const cat = s[this.lang].cat;
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(s);
            return acc;
        }, {});

        this.container.innerHTML = `
            <div class="spi-v5">
                <nav class="spi-nav">
                    <h2>${t.title}</h2>
                    <div class="spi-btn-group">
                        <button onclick="SpiTool.setLang('es')" class="btn-mini ${this.lang==='es'?'active':''}">ES</button>
                        <button onclick="SpiTool.setLang('en')" class="btn-mini ${this.lang==='en'?'active':''}">EN</button>
                        <button onclick="SpiTool.copy()" class="btn-mini btn-copy"><i class="far fa-copy"></i> ${t.copy}</button>
                        <button onclick="SpiTool.reset()" class="btn-mini">${t.reset}</button>
                    </div>
                </nav>
                
                <div class="spi-scroll" id="spiScrollBody">
                    ${Object.keys(grouped).map(cat => `
                        <div class="spi-section">
                            <div class="spi-section-title">${cat}</div>
                            <div class="spi-grid">
                                ${grouped[cat].map(s => `
                                    <div id="tile-${s.id}" class="spi-tile ${this.selected.has(s.id)?'active':''}" 
                                         onclick="SpiTool.toggle(${s.id})" style="--c: ${s.color}">
                                        <h4>${s[this.lang].nombre}</h4>
                                        <p>${s[this.lang].desc}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="spi-radar-box">
                    <canvas id="spiChartV5"></canvas>
                </div>
            </div>
        `;
    },

    initChart() {
        const ctx = document.getElementById('spiChartV5');
        if (!ctx) return;
        const cats = [...new Set(this.data.map(s => s[this.lang].cat))];
        
        if (this.chart) this.chart.destroy();

        this.chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: cats,
                datasets: [{
                    data: cats.map(() => 0),
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    pointBackgroundColor: '#3b82f6',
                    pointRadius: 3
                }]
            },
            options: {
                maintainAspectRatio: false,
                scales: { 
                    r: { 
                        min: 0, max: 100, 
                        ticks: { display: false }, 
                        grid: { color: '#f1f5f9' },
                        angleLines: { color: '#f1f5f9' },
                        pointLabels: { font: { size: 10, weight: '600', family: 'Inter' }, color: '#64748b' } 
                    } 
                },
                plugins: { legend: { display: false } }
            }
        });
        this.updateChart();
    },

    toggle(id) {
        if (this.selected.has(id)) {
            this.selected.delete(id);
        } else {
            this.selected.add(id);
        }
        this.renderContentOnly(); // Renderizado parcial para no perder el foco
        this.updateChart();
    },

    // Nueva función para no refrescar TODO el HTML y evitar saltos de scroll
    renderContentOnly() {
        this.data.forEach(s => {
            const el = document.getElementById(`tile-${s.id}`);
            if (el) {
                if (this.selected.has(s.id)) el.classList.add('active');
                else el.classList.remove('active');
            }
        });
    },

    updateChart() {
        if (!this.chart) return;
        const cats = [...new Set(this.data.map(s => s[this.lang].cat))];
        const values = cats.map(cat => {
            const pool = this.data.filter(s => s[this.lang].cat === cat);
            const sel = pool.filter(s => this.selected.has(s.id)).length;
            return (sel / pool.length) * 100;
        });
        this.chart.data.datasets[0].data = values;
        this.chart.update();
    },

    setLang(l) { this.lang = l; this.render(); this.initChart(); },

    copy() {
        const sel = this.data.filter(s => this.selected.has(s.id));
        if (!sel.length) return;
        const report = "SPI-A EVALUATION:\n" + sel.map(s => `• [${s[this.lang].cat}] ${s[this.lang].nombre}`).join('\n');
        navigator.clipboard.writeText(report);
        // Toast minimalista en lugar de alert
        const btn = document.querySelector('.btn-copy');
        const originalText = btn.innerHTML;
        btn.innerHTML = "¡Copiado!";
        setTimeout(() => btn.innerHTML = originalText, 2000);
    },

    reset() { this.selected.clear(); this.render(); this.initChart(); }
};

// Disparo seguro
SpiTool.init();
