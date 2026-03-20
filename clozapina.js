/**
 * clozapina.js - Motor de Titulación Pro PSQALDÍA v2.0
 * Estética pulida + Timeline Dinámico + Maudsley 15
 */

window.clozLang = 'es';
window.dbCloz = [];

const i18nCloz = {
    es: {
        title: "Titulación de Clozapina",
        startDate: "Fecha de inicio del tratamiento",
        profile: "Perfil metabólico / hábito",
        generate: "GENERAR PLAN DE TITULACIÓN",
        copy: "COPIAR PAUTA",
        pdf: "DESCARGAR PDF",
        profiles: {
            "mujer-f": "Mujer • Fumadora",
            "mujer-nf": "Mujer • No Fumadora",
            "hombre-f": "Hombre • Fumador",
            "hombre-nf": "Hombre • No Fumador"
        },
        labels: { morning: "Mañana", night: "Noche", total: "Dosis Total" },
        day: "DÍA",
        copied: "¡Pauta copiada!",
        disclaimer: "Plan basado en Maudsley Prescribing Guidelines 15th Ed. La dosificación debe supervisarse según tolerancia clínica y controles hematológicos obligatorios."
    },
    en: {
        title: "Clozapine Titration Guide",
        startDate: "Treatment start date",
        profile: "Metabolic profile / Habit",
        generate: "GENERATE TITRATION PLAN",
        copy: "COPY SCHEDULE",
        pdf: "DOWNLOAD PDF",
        profiles: {
            "mujer-f": "Woman • Smoker",
            "mujer-nf": "Woman • Non-Smoker",
            "hombre-f": "Man • Smoker",
            "hombre-nf": "Man • Non-Smoker"
        },
        labels: { morning: "Morning", night: "Night", total: "Total Dose" },
        day: "DAY",
        copied: "Schedule copied!",
        disclaimer: "Plan based on Maudsley Prescribing Guidelines 15th Ed. Dosing should be monitored according to clinical tolerance and mandatory blood tests."
    }
};

window.iniciarClozapina = async function() {
    const container = document.getElementById('modalData');
    if (!container) return;

    // Inyectar Estilos específicos para esta herramienta
    if (!document.getElementById('cloz-styles')) {
        const style = document.createElement('style');
        style.id = 'cloz-styles';
        style.innerHTML = `
            .cloz-container { padding: 1.5rem; font-family: 'Inter', sans-serif; }
            .cloz-header-ui { background: #f8fafc; padding: 1.5rem; border-radius: 1.5rem; border: 1px solid #e2e8f0; margin-bottom: 2rem; }
            .cloz-grid-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
            
            .cloz-timeline { position: relative; margin-top: 2rem; padding-left: 20px; }
            .cloz-timeline::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: #e2e8f0; border-radius: 3px; }
            
            .cloz-card { 
                background: white; border: 1px solid #e2e8f0; border-radius: 1.2rem; 
                padding: 1.2rem; margin-bottom: 1rem; position: relative;
                transition: transform 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
            }
            .cloz-card::before { 
                content: ''; position: absolute; left: -26px; top: 22px; 
                width: 14px; height: 14px; background: #4338ca; 
                border: 3px solid white; border-radius: 50%; box-shadow: 0 0 0 3px #e2e8f0;
            }
            
            .cloz-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px dashed #f1f5f9; padding-bottom: 0.5rem; }
            .cloz-day-badge { font-weight: 900; font-size: 0.7rem; color: #4338ca; text-transform: uppercase; background: #eef2ff; padding: 4px 10px; border-radius: 8px; }
            .cloz-date-label { font-size: 0.85rem; font-weight: 700; color: #64748b; }
            
            .cloz-dose-grid { display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 10px; }
            .dose-item { text-align: center; padding: 8px; border-radius: 12px; background: #f8fafc; }
            .dose-item.highlight { background: #4338ca; color: white; }
            .dose-val { display: block; font-weight: 900; font-size: 1.1rem; }
            .dose-lab { display: block; font-size: 0.6rem; text-transform: uppercase; font-weight: 700; opacity: 0.8; }
            
            .cloz-disclaimer { font-size: 0.75rem; color: #64748b; font-style: italic; margin-top: 2rem; padding: 1rem; border-top: 1px solid #f1f5f9; text-align: center; line-height: 1.4; }
        `;
        document.head.appendChild(style);
    }

    try {
        const response = await fetch(`${window.WORKER_URL}?sheet=clozapina`);
        const data = await response.json();
        window.dbCloz = data.values;
        renderInterfazCloz();
    } catch (e) {
        container.innerHTML = "Error al conectar con la base de datos.";
    }
};

window.setLanguageCloz = function(lang) {
    window.clozLang = lang;
    renderInterfazCloz();
};

function renderInterfazCloz() {
    const t = i18nCloz[window.clozLang];
    const container = document.getElementById('modalData');
    
    container.innerHTML = `
        <div class="cloz-container">
            <div class="calc-header">
                <h2 style="font-weight:900; color:#1e293b;">${t.title}</h2>
                <div class="lang-toggle">
                    <button class="lang-btn ${window.clozLang === 'es' ? 'active' : ''}" onclick="setLanguageCloz('es')">ES</button>
                    <button class="lang-btn ${window.clozLang === 'en' ? 'active' : ''}" onclick="setLanguageCloz('en')">EN</button>
                </div>
            </div>

            <div class="cloz-header-ui">
                <div class="cloz-grid-inputs">
                    <div>
                        <label class="depre-label">${t.startDate}</label>
                        <input type="date" id="cloz_start" class="depre-input" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div>
                        <label class="depre-label">${t.profile}</label>
                        <select id="cloz_profile" class="depre-input">
                            <option value="1">${t.profiles["mujer-f"]}</option>
                            <option value="4">${t.profiles["mujer-nf"]}</option>
                            <option value="7">${t.profiles["hombre-f"]}</option>
                            <option value="10">${t.profiles["hombre-nf"]}</option>
                        </select>
                    </div>
                </div>
                <button class="btn-ejecutar" style="width:100%; margin-top:1rem;" onclick="generarCalendarioCloz()">${t.generate}</button>
            </div>

            <div id="cloz-res-box" style="display:none;">
                <div id="cloz-res-pauta" class="cloz-timeline"></div>
                
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:20px;">
                    <button class="btn-copiar" onclick="copiarCalendarioCloz()"><i class="far fa-copy"></i> ${t.copy}</button>
                    <button class="btn-copiar" style="background:#4338ca; color:white; border-color:#4338ca;" onclick="window.exportarPDF('Pauta_Clozapina')"><i class="fas fa-file-pdf"></i> PDF</button>
                </div>

                <div class="cloz-disclaimer">
                    <i class="fas fa-info-circle"></i> ${t.disclaimer}
                </div>
            </div>
        </div>
    `;
}

window.generarCalendarioCloz = function() {
    const t = i18nCloz[window.clozLang];
    const startInput = document.getElementById('cloz_start').value;
    const colBase = parseInt(document.getElementById('cloz_profile').value);
    
    if (!startInput || !window.dbCloz) return;

    const startDate = new Date(startInput);
    let html = '';
    
    window.dbCloz.forEach((row) => {
        const numDia = parseInt(row[0]);
        if (isNaN(numDia)) return;

        const currentFecha = new Date(startDate);
        currentFecha.setDate(startDate.getDate() + (numDia - 1));
        
        const fechaFormat = currentFecha.toLocaleDateString(window.clozLang === 'es' ? 'es-ES' : 'en-US', {
            weekday: 'long', day: 'numeric', month: 'short'
        });

        const m = row[colBase] || '0';
        const n = row[colBase + 1] || '0';
        const tot = row[colBase + 2] || '0';

        html += `
            <div class="cloz-card">
                <div class="cloz-card-header">
                    <span class="cloz-day-badge">${t.day} ${numDia}</span>
                    <span class="cloz-date-label">${fechaFormat}</span>
                </div>
                <div class="cloz-dose-grid">
                    <div class="dose-item">
                        <span class="dose-lab">☀️ ${t.labels.morning}</span>
                        <span class="dose-val">${m} <small>mg</small></span>
                    </div>
                    <div class="dose-item">
                        <span class="dose-lab">🌙 ${t.labels.night}</span>
                        <span class="dose-val">${n} <small>mg</small></span>
                    </div>
                    <div class="dose-item highlight">
                        <span class="dose-lab">Σ ${t.labels.total}</span>
                        <span class="dose-val">${tot} <small>mg</small></span>
                    </div>
                </div>
            </div>
        `;
    });

    document.getElementById('cloz-res-pauta').innerHTML = html;
    document.getElementById('cloz-res-box').style.display = 'block';
};

window.copiarCalendarioCloz = function() {
    const t = i18nCloz[window.clozLang];
    let txt = `📋 ${t.title.toUpperCase()}\n--------------------------\n`;
    
    document.querySelectorAll('.cloz-card').forEach(c => {
        const dia = c.querySelector('.cloz-day-badge').innerText;
        const fecha = c.querySelector('.cloz-date-label').innerText;
        const d = c.querySelectorAll('.dose-val');
        txt += `${dia} (${fecha}): ☀️${d[0].innerText} | 🌙${d[1].innerText} | TOTAL: ${d[2].innerText}\n`;
    });

    navigator.clipboard.writeText(txt);
    alert(t.copied);
};
