/**
 * SPI-A: Herramienta de Síntomas Básicos - PSQ al día
 * Versión 2.0: Agrupación por Dominios y UI Compacta
 */

window.SpiTool = {
    data: [],
    selected: new Set(),
    chart: null,
    lang: 'es',
    categoryColors: {},
    isInitializing: false,

    async init() {
        if (this.isInitializing) return;
        this.container = document.getElementById('modalData');
        
        if (!this.container) {
            setTimeout(() => this.init(), 100);
            return;
        }

        this.isInitializing = true;
        this.injectStyles();
        this.container.innerHTML = '<div class="psq-loading">Organizando dominios clínicos...</div>';

        try {
            await this.loadChartLib();

            const response = await fetch('/?sheet=SPI_A');
            if (!response.ok) throw new Error("Network error");
            const json = await response.json();
            
            if (!json.values || json.values.length === 0) throw new Error("Sin datos");

            // Mapeo y limpieza
            this.data = json.values.map((row, index) => {
                const catES = row[0] || 'Varios';
                return {
                    id: index,
                    es: { cat: catES, nombre: row[1] || '', desc: row[2] || '' },
                    en: { cat: row[3] || 'Misc', nombre: row[4] || '', desc: row[5] || '' },
                    color: row[6] ? row[6].trim() : this.getPastelColor(catES)
                };
            });

            this.render();
            setTimeout(() => this.initChart(), 50);

        } catch (err) {
            console.error(err);
            // Solo mostramos error si realmente falla tras varios segundos
            this.container.innerHTML = `<div class="psq-error">Error de carga. Verifica la conexión.</div>`;
        } finally {
            this.isInitializing = false;
        }
    },

    getPastelColor(cat) {
        if (!this.categoryColors[cat]) {
            const hue = Math.floor(Math.random() * 360);
            this.categoryColors[cat] = `hsl(${hue}, 60%, 94%)`;
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
            .spi-wrapper { padding: 0.8rem; display: flex; gap: 15px; flex-direction: row-reverse; max-height: 85vh; }
            .spi-sidebar { width: 260px; background: var(--card); padding: 12px; border-radius: 12px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 10px; }
            .spi-main { flex: 1; overflow-y: auto; padding-right: 5px; }
            
            /* Agrupación por categorías */
            .spi-category-section { margin-bottom: 15px; }
            .spi-category-title { 
                font-size: 0.65rem; font-weight: 900; text-transform: uppercase; 
                color: var(--primary); margin-bottom: 8px; border-bottom: 1px solid var(--border);
                padding-bottom: 3px; letter-spacing: 0.5px;
            }
            
            .spi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 6px; }
            
            /* Tarjetas más pequeñas y compactas */
            .spi-card { 
                background: var(--bg); border-radius: 6px; padding: 6px 10px; cursor: pointer;
                border: 1px solid var(--border); border-left: 4px solid var(--accent);
                transition: 0.1s; display: flex; flex-direction: column; justify-content: center;
            }
            .spi-card:hover { background: var(--bg-alt); }
            .spi-card.active { background: var(--primary-light); border-color: var(--primary); }
            
            .spi-card h4 { margin: 0; font-size: 0.75rem; color: var(--text-main); font-weight: 700; line-height: 1.2; }
            .spi-card p { margin: 2px 0 0 0; font-size: 0.65rem; color: var(--text-muted); line-height: 1.1; display: none; }
            .spi-card.active p { display: block; color: var(--primary); font-weight: 500; }

            .spi-btn-main { width: 100%; padding: 8px; border-radius: 6px; border: none; font-weight: 800; cursor: pointer; background: var(--primary); color: white; font-size: 0.7rem; }
            .spi-lang-btn { cursor: pointer; font-size: 0.6rem; font-weight: 800; color: var(--text-muted); padding: 3px 6px; }
            .spi-lang-btn.active { color: var(--primary); text-decoration: underline; }
            
            @media (max-width: 900px) { .spi-wrapper { flex-direction: column; max-height: none; } .spi-sidebar { width: 100%; position: relative; } }
        `;
        document.head.appendChild(style);
    },

    render() {
        const t = this.lang === 'es' ? 
            { title: "Perfil SPI-A", copy: "Copiar Informe", reset: "Limpiar" } : 
            { title: "SPI-A Profile", copy: "Copy Report", reset: "Clear" };

        // Agrupar datos por categoría
        const grouped = this.data.reduce((acc, s) => {
            const cat = s[this.lang].cat;
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(s);
            return acc;
        }, {});

        this.container.innerHTML = `
            <div class="spi-wrapper">
                <aside class="spi-sidebar">
                    <h3 style="margin:0; font-size: 0.9rem; font-weight: 900; text-align:center;">${t.title}</h3>
                    <canvas id="spiRadarCanvas" style="max-height: 200px;"></canvas>
                    <button onclick="SpiTool.copyReport()" class="spi-btn-main">${t.copy}</button>
                    <button onclick="SpiTool.reset()" class="spi-btn-main" style="background:var(--bg-alt); color:var(--text-main); border: 1px solid var(--border)">${t.reset}</button>
                    <div style="display:flex; justify-content:center; gap:10px; margin-top:5px;">
                        <span class="spi-lang-btn ${this.lang === 'es'?'active':''}" onclick="SpiTool.setLang('es')">ES</span>
                        <span class="spi-lang-btn ${this.lang === 'en'?'active':''}" onclick="SpiTool.setLang('en')">EN</span>
                    </div>
                </aside>
                <main class="spi-main">
                    ${Object.keys(grouped).map(cat => `
                        <div class="spi-category-section">
                            <div class="spi-category-title">${cat}</div>
                            <div class="spi-grid">
                                ${grouped[cat].map(s => `
                                    <div id="spi-card-${s.id}" class="spi-card ${this.selected.has(s.id)?'active':''}" 
                                         onclick="SpiTool.toggleSymptom(${s.id})" style="--accent: ${s.color}">
                                        <h4>${s[this.lang].nombre}</h4>
                                        <p>${s[this.lang].desc}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </main>
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
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    borderColor: '#7c3aed',
                    borderWidth: 1.5,
                    pointRadius: 1
                }]
            },
            options: {
                scales: { 
                    r: { 
                        min: 0, max: 100, ticks: { display: false },
                        pointLabels: { font: { size: 8, weight: 'bold' }, color: '#666' } 
                    } 
                },
                plugins: { legend: { display: false } },
                maintainAspectRatio: false
            }
        });
        this.updateChart();
    },

    toggleSymptom(id) {
        if (this.selected.has(id)) this.selected.delete(id);
        else this.selected.add(id);
        
        document.getElementById(`spi-card-${id}`).classList.toggle('active');
        this.updateChart();
    },

    updateChart() {
        const cats = [...new Set(this.data.map(s => s[this.lang].cat))];
        const values = cats.map(catName => {
            const symptomsInCat = this.data.filter(s => s[this.lang].cat === catName);
            const selectedInCat = symptomsInCat.filter(s => this.selected.has(s.id)).length;
            return (selectedInCat / symptomsInCat.length) * 100;
        });
        
        if (this.chart) {
            this.chart.data.labels = cats;
            this.chart.data.datasets[0].data = values;
            this.chart.update();
        }
    },

    setLang(l) { 
        this.lang = l; 
        this.render(); 
        setTimeout(() => this.initChart(), 50); 
    },

    copyReport() {
        const sel = this.data.filter(s => this.selected.has(s.id));
        if (sel.length === 0) return;
        const text = sel.map(s => `• [${s[this.lang].cat}] ${s[this.lang].nombre}`).join('\n');
        navigator.clipboard.writeText("SPI-A EVALUATION:\n" + text);
        alert(this.lang === 'es' ? "Informe copiado" : "Report copied");
    },

    reset() {
        this.selected.clear();
        this.render();
        setTimeout(() => this.initChart(), 50);
    }
};

SpiTool.init();
