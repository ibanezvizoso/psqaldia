/**
 * SPI-A: Herramienta de Síntomas Básicos - PSQ al día
 * Versión Definitiva con Arquitectura Clase 'Catatonia'
 */

window.SpiTool = {
    data: [],
    selected: new Set(),
    chart: null,
    lang: 'es',
    categoryColors: {},

    async init() {
        // 1. Localizar contenedor (modalData es el estándar de tus herramientas)
        this.container = document.getElementById('modalData');
        
        if (!this.container) {
            setTimeout(() => this.init(), 50);
            return;
        }

        this.injectStyles();
        this.container.innerHTML = '<div class="psq-loading">Mapeando dominios SPI-A...</div>';

        try {
            // 2. Carga de Chart.js
            await this.loadChartLib();

            // 3. Obtención de datos (El worker ya salta la Fila 1)
            const response = await fetch('/?sheet=SPI_A');
            const json = await response.json();
            
            if (!json.values || json.values.length === 0) throw new Error("Sin datos");

            // 4. Construcción de la DB siguiendo tu modelo de Catatonia
            // Col 0: Cat(ES), 1: Nom(ES), 2: Desc(ES), 3: Cat(EN), 4: Nom(EN), 5: Desc(EN), 6: Color
            this.data = json.values.map((row, index) => {
                const catES = row[0] || 'Varios';
                const colorSheet = row[6] ? row[6].trim() : this.getPastelColor(catES);

                return {
                    id: index,
                    es: { cat: catES, nombre: row[1] || '', desc: row[2] || '' },
                    en: { cat: row[3] || 'Misc', nombre: row[4] || '', desc: row[5] || '' },
                    color: colorSheet
                };
            });

            this.render();
            setTimeout(() => this.initChart(), 100);

        } catch (err) {
            this.container.innerHTML = `<div class="psq-error">Error al conectar con la base de datos SPI-A.</div>`;
        }
    },

    // Generador de respaldo para categorías nuevas sin color en el Excel
    getPastelColor(cat) {
        if (!this.categoryColors[cat]) {
            const hue = Math.floor(Math.random() * 360);
            this.categoryColors[cat] = `hsl(${hue}, 70%, 92%)`;
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
            .spi-wrapper { padding: 1rem; display: flex; gap: 20px; flex-direction: row-reverse; }
            .spi-sidebar { width: 300px; position: sticky; top: 0; background: var(--card); padding: 15px; border-radius: 12px; border: 1px solid var(--border); height: fit-content; }
            .spi-main { flex: 1; }
            .spi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
            .spi-card { 
                background: var(--bg); border-radius: 10px; padding: 12px; cursor: pointer;
                border-left: 6px solid var(--accent); transition: 0.2s; border-top: 1px solid var(--border); border-right: 1px solid var(--border); border-bottom: 1px solid var(--border);
            }
            .spi-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .spi-card.active { background: var(--bg-alt); outline: 2px solid var(--primary); }
            .spi-cat-label { font-size: 0.6rem; font-weight: 900; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px; }
            .spi-card h4 { margin: 0 0 5px 0; font-size: 0.85rem; color: var(--text-main); font-weight: 800; }
            .spi-card p { margin: 0; font-size: 0.75rem; color: var(--text-muted); line-height: 1.3; }
            .spi-btn-main { width: 100%; padding: 10px; border-radius: 8px; border: none; font-weight: 800; cursor: pointer; margin-top: 10px; background: var(--primary); color: white; font-size: 0.8rem; }
            .spi-lang-box { display: flex; gap: 10px; justify-content: center; margin-top: 15px; border-top: 1px solid var(--border); padding-top: 10px; }
            .spi-lang-btn { cursor: pointer; font-size: 0.7rem; font-weight: 800; color: var(--text-muted); padding: 4px 8px; border-radius: 5px; }
            .spi-lang-btn.active { color: var(--primary); background: var(--bg-alt); }
            .psq-loading { padding: 40px; text-align: center; font-weight: 800; color: var(--primary); }
            @media (max-width: 900px) { .spi-wrapper { flex-direction: column; } .spi-sidebar { width: 100%; } }
        `;
        document.head.appendChild(style);
    },

    render() {
        const t = this.lang === 'es' ? 
            { title: "Perfil SPI-A", copy: "Copiar Perfil", reset: "Reiniciar" } : 
            { title: "SPI-A Profile", copy: "Copy Profile", reset: "Reset" };

        this.container.innerHTML = `
            <div class="spi-wrapper">
                <aside class="spi-sidebar">
                    <h3 style="margin:0 0 10px 0; font-size: 1rem; font-weight: 900;">${t.title}</h3>
                    <canvas id="spiRadarCanvas" style="max-width: 100%;"></canvas>
                    <button onclick="SpiTool.copyReport()" class="spi-btn-main">${t.copy}</button>
                    <button onclick="SpiTool.reset()" class="spi-btn-main" style="background:var(--bg-alt); color:var(--text-main); border: 1px solid var(--border)">${t.reset}</button>
                    <div class="spi-lang-box">
                        <span class="spi-lang-btn ${this.lang === 'es'?'active':''}" onclick="SpiTool.setLang('es')">ESPAÑOL</span>
                        <span class="spi-lang-btn ${this.lang === 'en'?'active':''}" onclick="SpiTool.setLang('en')">ENGLISH</span>
                    </div>
                </aside>
                <main class="spi-main">
                    <div class="spi-grid">
                        ${this.data.map(s => `
                            <div id="spi-card-${s.id}" class="spi-card ${this.selected.has(s.id)?'active':''}" 
                                 onclick="SpiTool.toggleSymptom(${s.id})" style="--accent: ${s.color}">
                                <div class="spi-cat-label">${s[this.lang].cat}</div>
                                <h4>${s[this.lang].nombre}</h4>
                                <p>${s[this.lang].desc}</p>
                            </div>
                        `).join('')}
                    </div>
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
                    backgroundColor: 'rgba(124, 58, 237, 0.15)',
                    borderColor: '#7c3aed',
                    borderWidth: 2,
                    pointRadius: 2
                }]
            },
            options: {
                scales: { r: { min: 0, max: 100, ticks: { display: false }, pointLabels: { font: { size: 9, weight: 'bold' } } } },
                plugins: { legend: { display: false } }
            }
        });
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
            const totalInCat = this.data.filter(s => s[this.lang].cat === catName).length;
            const selectedInCat = this.data.filter(s => s[this.lang].cat === catName && this.selected.has(s.id)).length;
            return (selectedInCat / totalInCat) * 100;
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

    copyReport() {
        const sel = this.data.filter(s => this.selected.has(s.id));
        if (sel.length === 0) return;
        const text = sel.map(s => `• [${s[this.lang].cat}] ${s[this.lang].nombre}`).join('\n');
        navigator.clipboard.writeText("SPI-A EVALUATION:\n" + text);
        alert(this.lang === 'es' ? "Perfil copiado" : "Profile copied");
    },

    reset() {
        this.selected.clear();
        this.render();
        setTimeout(() => this.initChart(), 50);
    }
};

// Disparo inicial
SpiTool.init();
