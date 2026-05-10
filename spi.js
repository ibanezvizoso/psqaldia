/**
 * SPI-A: Herramienta de Síntomas Básicos - PSQ al día
 * Versión Pro Arquitectura Modal (Corregida)
 */

window.SpiTool = {
    data: [],
    selected: new Set(),
    chart: null,
    lang: 'es',

    // PUNTO DE ENTRADA ÚNICO
    async init() {
        // 1. Detección del contenedor con reintento (Clave para modales)
        this.container = document.getElementById('tool-container');
        
        if (!this.container) {
            // Si el modal está abriéndose, esperamos 50ms y reintentamos
            setTimeout(() => this.init(), 50);
            return;
        }

        this.injectStyles();
        this.container.innerHTML = '<div class="psq-loading">Iniciando dominios clínicos...</div>';

        try {
            // 2. Carga de Chart.js (Solo si no existe)
            await this.loadChartLib();

            // 3. Obtención de datos del Worker (Fila A2 en adelante)
            const response = await fetch('/?sheet=SPI_A');
            const json = await response.json();
            
            if (!json.values || json.values.length === 0) throw new Error("Datos no encontrados");

            // Mapeo: 0:Cat, 1:ES_Nom, 2:ES_Desc, 3:EN_Nom, 4:EN_Desc, 6:Color
            this.data = json.values.map((row, index) => ({
                id: index,
                cat: row[0] || 'Misc',
                es: { nombre: row[1] || '', desc: row[2] || '' },
                en: { nombre: row[3] || '', desc: row[4] || '' },
                color: row[6] || '#3498db'
            }));

            this.render();
            // Retraso técnico para asegurar que el Canvas existe en el modal
            setTimeout(() => this.initChart(), 100);

        } catch (err) {
            this.container.innerHTML = `<div class="psq-error">Error al cargar SPI-A. Reintenta.</div>`;
        }
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
                border-left: 6px solid var(--accent); transition: all 0.2s; position: relative;
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            }
            .symptom-card:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
            .symptom-card.is-selected { background: #f0f7ff; outline: 2px solid #3498db; }
            .cat-tag { font-size: 10px; font-weight: bold; text-transform: uppercase; opacity: 0.6; }
            .psq-loading { text-align: center; padding: 40px; color: #666; }
            .spi-btn { width: 100%; padding: 12px; border-radius: 8px; border: none; font-weight: bold; cursor: pointer; margin-top: 10px; }
            .btn-blue { background: #3498db; color: white; }
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
                    <h3 style="margin:0 0 15px 0">${t.title}</h3>
                    <div style="max-width: 280px; margin: auto;">
                        <canvas id="spiRadar"></canvas>
                    </div>
                    <button onclick="SpiTool.copy()" class="spi-btn btn-blue">${t.copy}</button>
                    <button onclick="SpiTool.reset()" class="spi-btn" style="background:#eee">${t.reset}</button>
                    <div style="margin-top:15px; display:flex; gap:10px; justify-content:center">
                        <span style="cursor:pointer; font-size:12px" onclick="SpiTool.setLang('es')">🇪🇸 ES</span>
                        <span style="cursor:pointer; font-size:12px" onclick="SpiTool.setLang('en')">🇺🇸 EN</span>
                    </div>
                </aside>
                <main class="spi-main">
                    <div class="spi-grid">
                        ${this.data.map(s => `
                            <div id="card-${s.id}" class="symptom-card ${this.selected.has(s.id)?'is-selected':''}" 
                                 onclick="SpiTool.toggle(${s.id})" style="--accent: ${s.color}">
                                <div class="cat-tag">${s.cat}</div>
                                <h4 style="margin:8px 0 5px 0">${s[this.lang].nombre}</h4>
                                <p style="font-size:12px; color:#666; line-height:1.4">${s[this.lang].desc}</p>
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

        const cats = [...new Set(this.data.map(s => s.cat))];
        this.chart = new Chart(canvas, {
            type: 'radar',
            data: {
                labels: cats,
                datasets: [{
                    data: cats.map(() => 0),
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: '#3498db',
                    borderWidth: 2,
                    pointRadius: 3
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

    setLang(l) { this.lang = l; this.render(); setTimeout(() => this.initChart(), 50); },
    
    copy() {
        const sel = this.data.filter(s => this.selected.has(s.id));
        if (sel.length === 0) return;
        const text = sel.map(s => `[${s.cat}] ${s[this.lang].nombre}`).join('\n');
        navigator.clipboard.writeText("SPI-A EVALUATION:\n" + text);
        alert(this.lang === 'es' ? "Copiado" : "Copied");
    },

    reset() { this.selected.clear(); this.render(); setTimeout(() => this.initChart(), 50); }
};

// Auto-inicio inteligente para sistemas de modales
if (document.readyState === 'complete') {
    SpiTool.init();
} else {
    window.addEventListener('load', () => SpiTool.init());
}
