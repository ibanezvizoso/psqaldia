/**
 * SPI-A: Herramienta de Síntomas Básicos - PSQ al día
 * Versión 3.0: Grid Colorido, Radar Inferior y Carga Limpia
 */

window.SpiTool = {
    data: [],
    selected: new Set(),
    chart: null,
    lang: 'es',
    categoryColors: {},

    async init() {
        this.container = document.getElementById('modalData');
        if (!this.container) {
            setTimeout(() => this.init(), 50);
            return;
        }

        // 1. Inyectar estilos ANTES de mostrar nada para evitar el "salto" visual
        this.injectStyles();
        this.container.innerHTML = `
            <div class="spi-loader-container">
                <div class="spi-spinner"></div>
                <div style="margin-top:10px; font-weight:800; font-size:0.7rem; color:var(--primary)">
                    CARGANDO MATRIZ CLÍNICA...
                </div>
            </div>`;

        try {
            await this.loadChartLib();

            const response = await fetch('/?sheet=SPI_A');
            const json = await response.json();
            
            if (!json.values || json.values.length === 0) throw new Error("No data");

            // Mapeo con colores del Sheet
            this.data = json.values.map((row, index) => {
                const catES = row[0] || 'Varios';
                const baseColor = row[6] ? row[6].trim() : this.generatePastel(catES);
                return {
                    id: index,
                    es: { cat: catES, nombre: row[1] || '', desc: row[2] || '' },
                    en: { cat: row[3] || 'Misc', nombre: row[4] || '', desc: row[5] || '' },
                    color: baseColor
                };
            });

            this.render();
            setTimeout(() => this.initChart(), 50);

        } catch (err) {
            this.container.innerHTML = `<div class="psq-error">Error al conectar con SPI-A.</div>`;
        }
    },

    generatePastel(cat) {
        if (!this.categoryColors[cat]) {
            const hue = Math.floor(Math.random() * 360);
            this.categoryColors[cat] = `hsl(${hue}, 70%, 85%)`;
        }
        return this.categoryColors[cat];
    },

    loadChartLib() {
        return new Promise((resolve) => {
            if (window.Chart) return resolve();
            const s = document.createElement('script');
            s.src = "https://cdn.jsdelivr.net/npm/chart.js";
            s.onload = resolve;
            document.head.appendChild(s);
        });
    },

    injectStyles() {
        if (document.getElementById('spi-css')) return;
        const style = document.createElement('style');
        style.id = 'spi-css';
        style.innerHTML = `
            .spi-container { font-family: inherit; display: flex; flex-direction: column; height: 82vh; overflow: hidden; }
            
            /* Cabecera Compacta */
            .spi-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background: var(--bg-alt); border-bottom: 1px solid var(--border); }
            .spi-header h2 { margin: 0; font-size: 1rem; font-weight: 900; color: var(--text-main); }
            .spi-controls { display: flex; gap: 8px; }

            /* Grid de Síntomas */
            .spi-main-scroll { flex: 1; overflow-y: auto; padding: 15px; background: var(--bg); }
            .spi-section { margin-bottom: 20px; }
            .spi-section-title { font-size: 0.6rem; font-weight: 900; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; letter-spacing: 1px; }
            
            .spi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; }
            
            /* Tarjetas Cuadriculadas y Coloridas */
            .spi-card { 
                background: white; border-radius: 8px; padding: 10px; cursor: pointer;
                border: 1.5px solid var(--border); transition: 0.2s;
                display: flex; flex-direction: column; position: relative;
                box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            }
            .spi-card:hover { transform: translateY(-2px); box-shadow: 0 5px 10px rgba(0,0,0,0.05); }
            .spi-card.active { border-color: var(--primary); outline: 2px solid var(--primary); }
            .spi-card h4 { margin: 0; font-size: 0.75rem; font-weight: 800; line-height: 1.2; color: #1e293b; }
            .spi-card p { margin-top: 5px; font-size: 0.65rem; color: #64748b; line-height: 1.1; display: none; }
            .spi-card.active p { display: block; }

            /* Radar Inferior */
            .spi-footer-chart { height: 220px; background: white; border-top: 2px solid var(--border); padding: 10px; display: flex; justify-content: center; align-items: center; }
            
            /* Botones y Otros */
            .spi-btn { padding: 6px 12px; border-radius: 6px; border: none; font-weight: 800; font-size: 0.65rem; cursor: pointer; text-transform: uppercase; transition: 0.2s; }
            .spi-btn-blue { background: var(--primary); color: white; }
            .spi-btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--text-muted); }
            
            .spi-loader-container { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
            .spi-spinner { width: 30px; height: 30px; border: 4px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spi-spin 0.8s linear infinite; }
            @keyframes spi-spin { to { transform: rotate(360deg); } }

            @media (max-width: 600px) { .spi-grid { grid-template-columns: 1fr 1fr; } .spi-header { flex-direction: column; gap: 10px; } }
        `;
        document.head.appendChild(style);
    },

    render() {
        const t = this.lang === 'es' ? 
            { title: "SÍNTOMAS BÁSICOS SPI-A", copy: "Copiar", reset: "Reiniciar" } : 
            { title: "SPI-A BASIC SYMPTOMS", copy: "Copy", reset: "Reset" };

        const grouped = this.data.reduce((acc, s) => {
            const cat = s[this.lang].cat;
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(s);
            return acc;
        }, {});

        this.container.innerHTML = `
            <div class="spi-container">
                <header class="spi-header">
                    <h2>${t.title}</h2>
                    <div class="spi-controls">
                        <button onclick="SpiTool.setLang('es')" class="spi-btn ${this.lang==='es'?'spi-btn-blue':'spi-btn-ghost'}">ES</button>
                        <button onclick="SpiTool.setLang('en')" class="spi-btn ${this.lang==='en'?'spi-btn-blue':'spi-btn-ghost'}">EN</button>
                        <button onclick="SpiTool.copyReport()" class="spi-btn spi-btn-blue" style="margin-left:10px">
                            <i class="far fa-copy"></i> ${t.copy}
                        </button>
                        <button onclick="SpiTool.reset()" class="spi-btn spi-btn-ghost">${t.reset}</button>
                    </div>
                </header>

                <main class="spi-main-scroll">
                    ${Object.keys(grouped).map(cat => `
                        <div class="spi-section">
                            <div class="spi-section-title">${cat}</div>
                            <div class="spi-grid">
                                ${grouped[cat].map(s => `
                                    <div id="card-${s.id}" class="spi-card ${this.selected.has(s.id)?'active':''}" 
                                         onclick="SpiTool.toggle(${s.id})" 
                                         style="background-color: ${s.color}22; border-left: 5px solid ${s.color}">
                                        <h4>${s[this.lang].nombre}</h4>
                                        <p>${s[this.lang].desc}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </main>

                <footer class="spi-footer-chart">
                    <canvas id="spiRadarCanvas"></canvas>
                </footer>
            </div>
        `;
    },

    initChart() {
        const canvas = document.getElementById('spiRadarCanvas');
        if (!canvas) return;

        const cats = [...new Set(this.data.map(s => s[this.lang].cat))];
        this.chart = new Chart(canvas, {
            type: 'radar',
            data: {
                labels: cats,
                datasets: [{
                    data: cats.map(() => 0),
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: '#3498db',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: '#3498db'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { 
                    r: { 
                        min: 0, max: 100, ticks: { display: false },
                        pointLabels: { font: { size: 9, weight: '900' }, color: '#475569' } 
                    } 
                },
                plugins: { legend: { display: false } }
            }
        });
        this.updateChart();
    },

    toggle(id) {
        if (this.selected.has(id)) this.selected.delete(id);
        else this.selected.add(id);
        
        document.getElementById(`card-${id}`).classList.toggle('active');
        this.updateChart();
    },

    updateChart() {
        const cats = [...new Set(this.data.map(s => s[this.lang].cat))];
        const values = cats.map(catName => {
            const group = this.data.filter(s => s[this.lang].cat === catName);
            const sel = group.filter(s => this.selected.has(s.id)).length;
            return (sel / group.length) * 100;
        });
        
        if (this.chart) {
            this.chart.data.labels = cats;
            this.chart.data.datasets[0].data = values;
            this.chart.update();
        }
    },

    setLang(l) { this.lang = l; this.render(); setTimeout(() => this.initChart(), 30); },

    copyReport() {
        const sel = this.data.filter(s => this.selected.has(s.id));
        if (sel.length === 0) return;
        const text = "SPI-A EVALUATION:\n" + sel.map(s => `• [${s[this.lang].cat}] ${s[this.lang].nombre}`).join('\n');
        navigator.clipboard.writeText(text);
        alert(this.lang === 'es' ? "Perfil copiado" : "Profile copied");
    },

    reset() {
        this.selected.clear();
        this.render();
        setTimeout(() => this.initChart(), 30);
    }
};

SpiTool.init();
