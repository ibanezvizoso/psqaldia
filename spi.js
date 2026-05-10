/**
 * SPI-A: Herramienta de Síntomas Básicos - PSQ al día
 * Versión 4.0: Silent-Boot, Grid Dinámico y Radar Sticky
 */

window.SpiTool = {
    data: [],
    selected: new Set(),
    chart: null,
    lang: 'es',
    categoryColors: {},

    async init() {
        const target = document.getElementById('modalData');
        
        // PENSAMIENTO LATERAL: Si no hay contenedor, morimos en silencio. 
        // No hay error, simplemente esperamos el siguiente ciclo.
        if (!target) {
            setTimeout(() => this.init(), 100);
            return;
        }

        this.container = target;
        this.injectStyles();
        
        // Loader minimalista (solo un pulso de color en el borde superior)
        this.container.innerHTML = `<div class="spi-boot-loader"></div>`;

        try {
            await this.loadChartLib();
            const response = await fetch('/?sheet=SPI_A');
            const json = await response.json();
            
            if (!json.values || json.values.length === 0) return;

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
            setTimeout(() => this.initChart(), 50);

        } catch (err) {
            // Error silencioso: solo log en consola para no ensuciar la UI del usuario
            console.warn("SPI-A Silent Fail:", err);
        }
    },

    genColor(cat) {
        if (!this.categoryColors[cat]) {
            const h = Math.floor(Math.random() * 360);
            this.categoryColors[cat] = `hsl(${h}, 75%, 85%)`;
        }
        return this.categoryColors[cat];
    },

    loadChartLib() {
        return new Promise(res => {
            if (window.Chart) return res();
            const s = document.createElement('script');
            s.src = "https://cdn.jsdelivr.net/npm/chart.js";
            s.onload = res;
            document.head.appendChild(s);
        });
    },

    injectStyles() {
        if (document.getElementById('spi-css-v4')) return;
        const style = document.createElement('style');
        style.id = 'spi-css-v4';
        style.innerHTML = `
            .spi-v4 { display: flex; flex-direction: column; height: 85vh; background: #f8fafc; font-family: system-ui, sans-serif; position: relative; }
            
            /* Zona de seguridad para la X del modal */
            .spi-nav { 
                padding: 12px 60px 12px 15px; 
                background: white; border-bottom: 1px solid #e2e8f0;
                display: flex; justify-content: space-between; align-items: center;
                z-index: 10;
            }
            .spi-nav h2 { margin:0; font-size: 0.9rem; font-weight: 900; color: #1e293b; letter-spacing: -0.5px; }

            .spi-scroll { flex: 1; overflow-y: auto; padding: 15px; }
            
            .spi-section { margin-bottom: 20px; }
            .spi-section-title { 
                font-size: 0.65rem; font-weight: 900; text-transform: uppercase; 
                color: #64748b; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;
            }
            .spi-section-title::after { content:''; flex:1; height:1px; background:#e2e8f0; }

            /* Grid Cuadriculado Compacto */
            .spi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
            
            .spi-tile {
                background: white; border: 1px solid #e2e8f0; border-radius: 8px;
                padding: 10px; cursor: pointer; transition: 0.15s;
                display: flex; flex-direction: column; justify-content: center;
                min-height: 50px; position: relative; overflow: hidden;
            }
            .spi-tile::before { content:''; position:absolute; left:0; top:0; bottom:0; width:4px; background: var(--c); }
            .spi-tile:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-color: var(--c); }
            .spi-tile.active { background: #f1f5f9; border-color: #3b82f6; box-shadow: inset 0 0 0 1px #3b82f6; }
            
            .spi-tile h4 { margin: 0; font-size: 0.72rem; font-weight: 700; line-height: 1.2; color: #334155; }
            .spi-tile p { display: none; margin: 5px 0 0 0; font-size: 0.65rem; color: #64748b; font-style: italic; }
            .spi-tile.active p { display: block; }

            /* Radar Inferior Sticky */
            .spi-radar-box { 
                height: 200px; background: white; border-top: 1px solid #e2e8f0; 
                padding: 10px; display: flex; justify-content: center;
            }

            .spi-btn-group { display: flex; gap: 4px; }
            .btn-mini { 
                padding: 5px 10px; border-radius: 6px; border: 1px solid #e2e8f0; 
                font-size: 0.65rem; font-weight: 800; cursor: pointer; background: white;
            }
            .btn-mini.active { background: #1e293b; color: white; border-color: #1e293b; }
            .btn-copy { background: #3b82f6; color: white; border: none; }

            .spi-boot-loader { height: 3px; width: 100%; background: #3b82f6; position: absolute; top:0; left:0; animation: load-pulse 1.5s infinite; }
            @keyframes load-pulse { 0% { opacity: 0.2; } 50% { opacity: 1; } 100% { opacity: 0.2; } }
        `;
        document.head.appendChild(style);
    },

    render() {
        const t = this.lang === 'es' ? 
            { title: "MATRIZ SPI-A", copy: "Copiar", reset: "Reset" } : 
            { title: "SPI-A MATRIX", copy: "Copy", reset: "Reset" };

        const grouped = this.data.reduce((acc, s) => {
            const cat = s[this.lang].cat;
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(s);
            return acc;
        }, {});

        this.container.innerHTML = `
            <div class="spi-v4">
                <nav class="spi-nav">
                    <h2>${t.title}</h2>
                    <div class="spi-btn-group">
                        <button onclick="SpiTool.setLang('es')" class="btn-mini ${this.lang==='es'?'active':''}">ES</button>
                        <button onclick="SpiTool.setLang('en')" class="btn-mini ${this.lang==='en'?'active':''}">EN</button>
                        <button onclick="SpiTool.copy()" class="btn-mini btn-copy"><i class="far fa-copy"></i> ${t.copy}</button>
                        <button onclick="SpiTool.reset()" class="btn-mini">${t.reset}</button>
                    </div>
                </nav>
                
                <div class="spi-scroll">
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
                    <canvas id="spiChartV4"></canvas>
                </div>
            </div>
        `;
    },

    initChart() {
        const ctx = document.getElementById('spiChartV4');
        if (!ctx) return;
        const cats = [...new Set(this.data.map(s => s[this.lang].cat))];
        this.chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: cats,
                datasets: [{
                    data: cats.map(() => 0),
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderColor: '#3b82f6',
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
        this.updateChart();
    },

    toggle(id) {
        const tile = document.getElementById(`tile-${id}`);
        if (this.selected.has(id)) {
            this.selected.delete(id);
            tile.classList.remove('active');
        } else {
            this.selected.add(id);
            tile.classList.add('active');
        }
        this.updateChart();
    },

    updateChart() {
        const cats = [...new Set(this.data.map(s => s[this.lang].cat))];
        const values = cats.map(cat => {
            const pool = this.data.filter(s => s[this.lang].cat === cat);
            const sel = pool.filter(s => this.selected.has(s.id)).length;
            return (sel / pool.length) * 100;
        });
        if (this.chart) {
            this.chart.data.labels = cats;
            this.chart.data.datasets[0].data = values;
            this.chart.update();
        }
    },

    setLang(l) { this.lang = l; this.render(); setTimeout(() => this.initChart(), 30); },

    copy() {
        const sel = this.data.filter(s => this.selected.has(s.id));
        if (!sel.length) return;
        const report = "SPI-A EVALUATION:\n" + sel.map(s => `[${s[this.lang].cat}] ${s[this.lang].nombre}`).join('\n');
        navigator.clipboard.writeText(report);
        alert(this.lang === 'es' ? "Perfil copiado" : "Profile copied");
    },

    reset() { this.selected.clear(); this.render(); setTimeout(() => this.initChart(), 30); }
};

// Disparo silencioso
SpiTool.init();
