/**
 * SPI-A: Herramienta de Síntomas Básicos - PSQ al día
 * Versión Pro Autónoma (Optimizada para Worker v6.1)
 */

window.SpiTool = {
    data: [],
    selected: new Set(),
    chart: null,
    lang: navigator.language.startsWith('es') ? 'es' : 'en', // Detección automática

    async init() {
        this.container = document.getElementById('tool-container');
        
        // Si no hay contenedor (como en Catatonia), lo creamos
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'tool-container';
            document.body.prepend(this.container);
        }

        this.injectStyles();
        this.container.innerHTML = '<div class="psq-loading">Cargando base de datos SPI-A...</div>';

        try {
            // 1. Cargar Chart.js de forma asíncrona pero segura
            await this.loadChartLib();

            // 2. Fetch de datos (Worker v6.1 ya devuelve desde A2)
            const response = await fetch('/?sheet=SPI_A');
            const json = await response.json();
            
            if (!json.values || json.values.length === 0) throw new Error("Hoja SPI_A vacía");

            // 3. Mapeo de columnas (A:Cat, B:NomES, C:DescES, D:NomEN, E:DescEN, G:Color)
            this.data = json.values.map((row, index) => ({
                id: index,
                cat: row[0] || 'General',
                es: { nombre: row[1] || '', desc: row[2] || '' },
                en: { nombre: row[3] || '', desc: row[4] || '' },
                color: row[6] || '#3498db'
            }));

            this.render();
            this.initChart();

        } catch (err) {
            console.error("SPI-A Error:", err);
            this.container.innerHTML = `
                <div class="psq-error">
                    <h3>⚠️ Error de carga</h3>
                    <p>No se pudo iniciar la herramienta SPI-A.</p>
                    <small>${err.message}</small>
                    <br><button onclick="location.reload()" style="margin-top:10px">Reintentar</button>
                </div>`;
        }
    },

    loadChartLib: function() {
        return new Promise((resolve, reject) => {
            if (window.Chart) return resolve();
            const s = document.createElement('script');
            s.src = "https://cdn.jsdelivr.net/npm/chart.js";
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    },

    injectStyles: function() {
        if (document.getElementById('spi-css')) return;
        const style = document.createElement('style');
        style.id = 'spi-css';
        style.innerHTML = `
            #tool-container { font-family: system-ui, -apple-system, sans-serif; max-width: 1200px; margin: auto; padding: 10px; }
            .spi-layout { display: grid; grid-template-columns: 320px 1fr; gap: 20px; }
            .spi-sidebar { position: sticky; top: 10px; height: fit-content; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .spi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
            .symptom-card { 
                background: white; border-radius: 10px; padding: 15px; cursor: pointer;
                border-left: 6px solid var(--accent); transition: 0.2s; position: relative;
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            }
            .symptom-card:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
            .symptom-card.is-selected { background: #f0f7ff; outline: 2px solid #3498db; }
            .cat-tag { font-size: 10px; font-weight: bold; text-transform: uppercase; opacity: 0.6; }
            .psq-loading { text-align: center; padding: 40px; color: #666; font-style: italic; }
            .lang-switch { display: flex; gap: 5px; margin-bottom: 15px; }
            .lang-switch span { font-size: 11px; padding: 3px 6px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; }
            .lang-switch span.active { background: #3498db; color: white; border-color: #3498db; }
            @media (max-width: 800px) { .spi-layout { grid-template-columns: 1fr; } .spi-sidebar { position: relative; top: 0; } }
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
                    <div class="lang-switch">
                        <span class="${this.lang==='es'?'active':''}" onclick="SpiTool.setLang('es')">ES</span>
                        <span class="${this.lang==='en'?'active':''}" onclick="SpiTool.setLang('en')">EN</span>
                    </div>
                    <h3 style="margin:0 0 15px 0">${t.title}</h3>
                    <canvas id="spiRadar"></canvas>
                    <button onclick="SpiTool.copy()" style="width:100%; padding:12px; background:#3498db; color:white; border:none; border-radius:6px; margin-top:20px; font-weight:bold; cursor:pointer">${t.copy}</button>
                    <button onclick="SpiTool.reset()" style="width:100%; padding:8px; background:none; border:1px solid #ddd; border-radius:6px; margin-top:8px; cursor:pointer">${t.reset}</button>
                </aside>
                <main class="spi-grid">
                    ${this.data.map(s => `
                        <div id="card-${s.id}" class="symptom-card ${this.selected.has(s.id)?'is-selected':''}" 
                             onclick="SpiTool.toggle(${s.id})" style="--accent: ${s.color}">
                            <div class="cat-tag">${s.cat}</div>
                            <h4 style="margin:8px 0 5px 0">${s[this.lang].nombre}</h4>
                            <p style="font-size:12px; color:#666; line-height:1.4">${s[this.lang].desc}</p>
                        </div>
                    `).join('')}
                </main>
            </div>
        `;
    },

    initChart() {
        const ctx = document.getElementById('spiRadar');
        const cats = [...new Set(this.data.map(s => s.cat))];
        this.chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: cats,
                datasets: [{
                    data: cats.map(() => 0),
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: '#3498db',
                    borderWidth: 2
                }]
            },
            options: {
                scales: { r: { min: 0, max: 100, ticks: { display: false } } },
                plugins: { legend: { display: false } }
            }
        });
    },

    toggle(id) {
        const card = document.getElementById(`card-${id}`);
        if (this.selected.has(id)) {
            this.selected.delete(id);
            card.classList.remove('is-selected');
        } else {
            this.selected.add(id);
            card.classList.add('is-selected');
        }
        this.updateChart();
    },

    updateChart() {
        const cats = [...new Set(this.data.map(s => s.cat))];
        const values = cats.map(cat => {
            const total = this.data.filter(s => s.cat === cat).length;
            const sel = this.data.filter(s => s.cat === cat && this.selected.has(s.id)).length;
            return (sel / total) * 100;
        });
        this.chart.data.datasets[0].data = values;
        this.chart.update();
    },

    setLang(l) { this.lang = l; this.render(); this.initChart(); this.updateChart(); },
    
    copy() {
        const sel = this.data.filter(s => this.selected.has(s.id));
        if (sel.length === 0) return;
        const text = sel.map(s => `[${s.cat}] ${s[this.lang].nombre}`).join('\n');
        navigator.clipboard.writeText("SPI-A EVALUATION:\n" + text);
        alert(this.lang === 'es' ? "Copiado" : "Copied");
    },

    reset() { this.selected.clear(); this.render(); this.initChart(); }
};

// Auto-ejecución al cargar el script
if (document.readyState === 'complete') SpiTool.init();
else window.addEventListener('load', () => SpiTool.init());
