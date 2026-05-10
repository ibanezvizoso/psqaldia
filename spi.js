/**
 * SPI-A: Herramienta de Síntomas Básicos - PSQ al día
 * Versión Pro Arquitectura Modal (Mapeo Final según Sheet)
 */

window.SpiTool = {
    data: [],
    selected: new Set(),
    chart: null,
    lang: 'es',
    categoryColors: {},

    async init() {
        this.container = document.getElementById('tool-container');
        
        if (!this.container) {
            setTimeout(() => this.init(), 50);
            return;
        }

        this.injectStyles();
        this.container.innerHTML = '<div class="psq-loading">Cargando matriz de síntomas...</div>';

        try {
            await this.loadChartLib();

            const response = await fetch('/?sheet=SPI_A');
            const json = await response.json();
            
            if (!json.values || json.values.length === 0) throw new Error("Datos no encontrados");

            let rows = json.values;

            // 1. Detección y limpieza de cabecera (Fila 1)
            if (rows[0] && rows[0][0] && rows[0][0].toString().toLowerCase().includes('categor')) {
                rows.shift(); 
            }

            // 2. Mapeo exacto según tu imagen:
            // 0:Cat_ES, 1:Symp_ES, 2:Desc_ES, 3:Cat_EN, 4:Symp_EN, 5:Desc_EN, 6:Color
            this.data = rows.map((row, index) => {
                const colorFromSheet = row[6] ? row[6].trim() : null;
                const catES = row[0] || 'Misc';
                
                return {
                    id: index,
                    es: { cat: catES, nombre: row[1] || '', desc: row[2] || '' },
                    en: { cat: row[3] || 'Misc', nombre: row[4] || '', desc: row[5] || '' },
                    color: colorFromSheet || this.getPastelColor(catES)
                };
            });

            this.render();
            setTimeout(() => this.initChart(), 100);

        } catch (err) {
            console.error(err);
            this.container.innerHTML = `<div class="psq-error">Error de conexión con SPI-A.</div>`;
        }
    },

    getPastelColor(catName) {
        if (!this.categoryColors[catName]) {
            const hue = Math.floor(Math.random() * 360);
            this.categoryColors[catName] = `hsl(${hue}, 70%, 90%)`;
        }
        return this.categoryColors[catName];
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
            .spi-layout { display: flex; gap: 20px; flex-direction: row-reverse; }
            .spi-sidebar { width: 320px; position: sticky; top: 0; background: #fff; padding: 15px; border-radius: 12px; height: fit-content; border: 1px solid #eee; }
            .spi-main { flex: 1; }
            .spi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
            .symptom-card { 
                background: white; border-radius: 10px; padding: 15px; cursor: pointer;
                border-left: 8px solid var(--accent); transition: all 0.2s; position: relative;
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            }
            .symptom-card:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
            .symptom-card.is-selected { background: #f0faff; outline: 2px solid #3498db; }
            .cat-tag { font-size: 10px; font-weight: 900; text-transform: uppercase; opacity: 0.7; color: #444; }
            .psq-loading { text-align: center; padding: 40px; font-weight: bold; color: #3498db; }
            .spi-btn { width: 100%; padding: 12px; border-radius: 8px; border: none; font-weight: 800; cursor: pointer; margin-top: 10px; transition: 0.2s; }
            .btn-blue { background: #3498db; color: white; }
            .btn-blue:hover { background: #2980b9; }
            @media (max-width: 900px) { .spi-layout { flex-direction: column; } .spi-sidebar { width: 100%; position: relative; } }
        `;
        document.head.appendChild(style);
    },

    render() {
        const t = this.lang === 'es' ? 
            { title: "Perfil SPI-A", copy: "Copiar Informe", reset: "Reiniciar" } : 
            { title: "SPI-A Profile", copy: "Copy Report", reset: "Reset" };

        this.container.innerHTML = `
            <div class="spi-layout">
                <aside class="spi-sidebar">
                    <h3 style="margin:0 0 15px 0; font-weight:900; color:#2c3e50;">${t.title}</h3>
                    <div style="max-width: 280px; margin: auto;">
                        <canvas id="spiRadar"></canvas>
                    </div>
                    <button onclick="SpiTool.copy()" class="spi-btn btn-blue"><i class="far fa-copy"></i> ${t.copy}</button>
                    <button onclick="SpiTool.reset()" class="spi-btn" style="background:#f8f9fa; color:#666;">${t.reset}</button>
                    <div style="margin-top:20px; display:flex; gap:15px; justify-content:center; border-top:1px solid #eee; padding-top:15px;">
                        <span style="cursor:pointer; font-weight:${this.lang==='es'?'900':'normal'}" onclick="SpiTool.setLang('es')">🇪🇸 ESP</span>
                        <span style="cursor:pointer; font-weight:${this.lang==='en'?'900':'normal'}" onclick="SpiTool.setLang('en')">🇺🇸 ENG</span>
                    </div>
                </aside>
                <main class="spi-main">
                    <div class="spi-grid">
                        ${this.data.map(s => `
                            <div id="card-${s.id}" class="symptom-card ${this.selected.has(s.id)?'is-selected':''}" 
                                 onclick="SpiTool.toggle(${s.id})" style="--accent: ${s.color}">
                                <div class="cat-tag">${s[this.lang].cat}</div>
                                <h4 style="margin:8px 0 5px 0; font-size:15px; color:#2c3e50;">${s[this.lang].nombre}</h4>
                                <p style="font-size:12px; color:#7f8c8d; line-height:1.4; margin:0;">${s[this.lang].desc}</p>
                            </div>
                        `).join('')}
                    </div>
                </main>
            </div>
        `;
    },

    initChart() {
        const canvas = document.getElementById('spiRadar');
        if (!canvas) return;

        // Categorías únicas según el idioma actual
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
                    pointBackgroundColor: '#3498db'
                }]
            },
            options: {
                scales: { 
                    r: { 
                        min: 0, max: 100, 
                        ticks: { display: false, stepSize: 25 },
                        pointLabels: { font: { size: 10, weight: 'bold' } }
                    } 
                },
                plugins: { legend: { display: false } }
            }
        });
    },

    toggle(id) {
        if (this.selected.has(id)) this.selected.delete(id);
        else this.selected.add(id);
        
        this.render(); // Re-render para actualizar clases visuales
        this.updateChart();
    },

    updateChart() {
        const cats = [...new Set(this.data.map(s => s[this.lang].cat))];
        const values = cats.map(catName => {
            const symptomsInCat = this.data.filter(s => s[this.lang].cat === catName);
            const selectedInCat = symptomsInCat.filter(s => this.selected.has(s.id));
            return (selectedInCat.length / symptomsInCat.length) * 100;
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
        setTimeout(() => {
            this.initChart();
            this.updateChart();
        }, 50); 
    },
    
    copy() {
        const sel = this.data.filter(s => this.selected.has(s.id));
        if (sel.length === 0) return;
        
        const header = this.lang === 'es' ? "EVALUACIÓN SPI-A:\n" : "SPI-A EVALUATION:\n";
        const text = sel.map(s => `• [${s[this.lang].cat}] ${s[this.lang].nombre}`).join('\n');
        
        navigator.clipboard.writeText(header + text);
        alert(this.lang === 'es' ? "Informe copiado" : "Report copied");
    },

    reset() { 
        this.selected.clear(); 
        this.render(); 
        setTimeout(() => this.initChart(), 50); 
    }
};

// Auto-inicio
if (document.readyState === 'complete') SpiTool.init();
else window.addEventListener('load', () => SpiTool.init());
