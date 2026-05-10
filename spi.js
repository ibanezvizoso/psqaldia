/**
 * SPI-A: Schizophrenia Proneness Instrument (Adult)
 * PSQ al día - Versión 5.0 (Estética SaaS Clínica)
 */

window.SpiTool = {
    data: [],
    selected: new Set(),
    chart: null,
    lang: 'es',

    async init() {
        const target = document.getElementById('modalData');
        if (!target) {
            // Reintento silencioso sin contaminar consola
            requestAnimationFrame(() => this.init());
            return;
        }

        this.container = target;
        this.injectStyles();
        this.container.innerHTML = '<div class="spi-loader"></div>';

        try {
            await this.loadChartLib();
            const response = await fetch('/?sheet=SPI_A');
            const json = await response.json();
            
            if (!json.values || json.values.length <= 1) throw new Error("No data");

            // Mapeo preciso según la tabla bilingüe:
            // 0:Ítem | 1:Cat ES | 2:Sym ES | 3:Desc ES | 4:Cat EN | 5:Sym EN | 6:Desc EN | 7:Color
            this.data = json.values.slice(1).map((row, index) => ({
                id: index,
                code: row[0] || '?',
                es: { cat: row[1], nombre: row[2], desc: row[3] },
                en: { cat: row[4], nombre: row[5], desc: row[6] },
                color: row[7] || '#cbd5e1'
            }));

            this.render();
            // Aseguramos que el canvas exista antes de iniciar el chart
            requestAnimationFrame(() => this.initChart());

        } catch (err) {
            console.error("SPI-A Boot Error:", err);
            this.container.innerHTML = `<div style="padding:20px; text-align:center; color:#64748b; font-size:0.8rem;">
                Error de conexión con SPI_A. Reintenta en unos segundos.</div>`;
        }
    },

    loadChartLib() {
        return new Promise(res => {
            if (window.Chart) return res();
            const s = document.createElement('script');
            s.src = "https://cdn.jsdelivr.net/npm/chart.js";
            s.onload = () => {
                // Pequeño delay para asegurar registro en window
                setTimeout(res, 50);
            };
            document.head.appendChild(s);
        });
    },

    injectStyles() {
        if (document.getElementById('spi-css-v5')) return;
        const style = document.createElement('style');
        style.id = 'spi-css-v5';
        style.innerHTML = `
            :root { --spi-bg: #f8fafc; --spi-card: #ffffff; --spi-accent: #3b82f6; }
            .spi-v5 { display: grid; grid-template-rows: auto 1fr auto; height: 85vh; background: var(--spi-bg); font-family: 'Inter', system-ui, sans-serif; color: #1e293b; overflow: hidden; }
            
            /* Header Estilo Moderno */
            .spi-header { padding: 16px 24px; background: white; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
            .spi-header h2 { margin:0; font-size: 1rem; font-weight: 800; letter-spacing: -0.025em; color: #0f172a; }
            
            .spi-main { display: grid; grid-template-columns: 1fr 280px; overflow: hidden; }
            .spi-scroll { overflow-y: auto; padding: 24px; scroll-behavior: smooth; }
            
            /* Radar Sidebar */
            .spi-sidebar { background: white; border-left: 1px solid #e2e8f0; padding: 20px; display: flex; flex-direction: column; gap: 20px; }
            .spi-radar-cont { flex: 1; min-height: 200px; position: relative; }

            /* Grid y Secciones */
            .spi-section { margin-bottom: 32px; }
            .spi-section-title { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 12px; display: flex; align-items: center; gap: 10px; }
            .spi-section-title::after { content:''; flex:1; height:1px; background:#f1f5f9; }

            .spi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
            
            /* Tarjeta de Síntoma Mejorada */
            .spi-card { 
                background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; cursor: pointer;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden;
                display: flex; flex-direction: column; gap: 4px;
            }
            .spi-card::before { content:''; position:absolute; top:0; left:0; width:100%; height:4px; background: var(--item-color); opacity: 0.6; }
            .spi-card:hover { border-color: var(--item-color); transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
            
            .spi-card.active { border-color: var(--spi-accent); background: #eff6ff; box-shadow: 0 0 0 2px var(--spi-accent); }
            .spi-card .code { font-size: 0.6rem; font-weight: 700; color: #64748b; margin-bottom: 2px; }
            .spi-card h4 { margin: 0; font-size: 0.85rem; font-weight: 700; line-height: 1.3; }
            .spi-card p { margin: 4px 0 0 0; font-size: 0.75rem; color: #64748b; line-height: 1.4; display: none; }
            .spi-card.active p { display: block; animation: slideIn 0.2s ease-out; }

            /* Botonera */
            .spi-actions { display: flex; gap: 8px; }
            .btn-spi { padding: 8px 14px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.75rem; font-weight: 600; cursor: pointer; background: white; transition: 0.2s; }
            .btn-spi:hover { background: #f8fafc; border-color: #cbd5e1; }
            .btn-spi.primary { background: var(--spi-accent); color: white; border: none; }
            .btn-spi.active { background: #0f172a; color: white; }

            @keyframes slideIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
            .spi-loader { height: 4px; width: 100%; background: #3b82f6; position: absolute; top:0; animation: spi-p 1.5s infinite; }
            @keyframes spi-p { 0% { left:-100%; width:30%; } 100% { left:100%; width:30%; } }

            @media (max-width: 768px) {
                .spi-main { grid-template-columns: 1fr; }
                .spi-sidebar { display: none; }
            }
        `;
        document.head.appendChild(style);
    },

    render() {
        const lang = this.lang;
        const t = lang === 'es' ? 
            { title: "Exploración SPI-A", copy: "Copiar Perfil", reset: "Reiniciar", resume: "RESUMEN" } : 
            { title: "SPI-A Assessment", copy: "Copy Profile", reset: "Reset", resume: "SUMMARY" };

        const grouped = this.data.reduce((acc, s) => {
            const cat = s[lang].cat;
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(s);
            return acc;
        }, {});

        this.container.innerHTML = `
            <div class="spi-v5">
                <header class="spi-header">
                    <h2>${t.title}</h2>
                    <div class="spi-actions">
                        <button onclick="SpiTool.toggleLang()" class="btn-spi">${lang === 'es' ? 'EN' : 'ES'}</button>
                        <button onclick="SpiTool.reset()" class="btn-spi">${t.reset}</button>
                        <button onclick="SpiTool.copy()" class="btn-spi primary">${t.copy}</button>
                    </div>
                </header>
                
                <main class="spi-main">
                    <div class="spi-scroll">
                        ${Object.keys(grouped).map(cat => `
                            <div class="spi-section">
                                <div class="spi-section-title">${cat}</div>
                                <div class="spi-grid">
                                    ${grouped[cat].map(s => `
                                        <div id="tile-${s.id}" class="spi-card ${this.selected.has(s.id)?'active':''}" 
                                             onclick="SpiTool.toggle(${s.id})" style="--item-color: ${s.color}">
                                            <span class="code">${s.code}</span>
                                            <h4>${s[lang].nombre}</h4>
                                            <p>${s[lang].desc}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <aside class="spi-sidebar">
                        <div style="font-size: 0.65rem; font-weight: 800; color: #94a3b8;">${t.resume}</div>
                        <div class="spi-radar-cont">
                            <canvas id="spiRadarCanvas"></canvas>
                        </div>
                        <div id="spi-counter" style="font-size: 0.75rem; color: #64748b; text-align: center;">
                            0 síntomas seleccionados
                        </div>
                    </aside>
                </main>
            </div>
        `;
    },

    initChart() {
        const canvas = document.getElementById('spiRadarCanvas');
        if (!canvas || !window.Chart) return;

        const cats = [...new Set(this.data.map(s => s[this.lang].cat))];
        
        this.chart = new Chart(canvas, {
            type: 'radar',
            data: {
                labels: cats.map(c => c.length > 12 ? c.substring(0, 10)+'..' : c),
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
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { display: false, stepSize: 25 },
                        grid: { color: '#e2e8f0' },
                        pointLabels: { font: { size: 9, weight: '600' }, color: '#64748b' }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
        this.updateUI();
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
        this.updateUI();
    },

    updateUI() {
        const cats = [...new Set(this.data.map(s => s[this.lang].cat))];
        const values = cats.map(cat => {
            const pool = this.data.filter(s => s[this.lang].cat === cat);
            const sel = pool.filter(s => this.selected.has(s.id)).length;
            return (sel / pool.length) * 100;
        });

        if (this.chart) {
            this.chart.data.datasets[0].data = values;
            this.chart.update();
        }

        const counter = document.getElementById('spi-counter');
        if (counter) {
            counter.innerText = `${this.selected.size} ${this.lang === 'es' ? 'síntomas detectados' : 'symptoms detected'}`;
        }
    },

    toggleLang() {
        this.lang = this.lang === 'es' ? 'en' : 'es';
        this.render();
        requestAnimationFrame(() => this.initChart());
    },

    copy() {
        if (!this.selected.size) return;
        const sel = this.data.filter(s => this.selected.has(s.id));
        const date = new Date().toLocaleDateString();
        let report = `SPI-A EVALUATION (${date})\n----------------------\n`;
        report += sel.map(s => `• [${s[this.lang].cat}] ${s.code}: ${s[this.lang].nombre}`).join('\n');
        
        navigator.clipboard.writeText(report);
        const btn = document.querySelector('.btn-spi.primary');
        const originalText = btn.innerText;
        btn.innerText = "¡Copiado!";
        setTimeout(() => btn.innerText = originalText, 2000);
    },

    reset() {
        this.selected.clear();
        this.render();
        requestAnimationFrame(() => this.initChart());
    }
};

// Disparo seguro
SpiTool.init();
