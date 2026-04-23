/**
 * clozapina.js - Motor de Titulación PSQALDÍA v2.2
 * UI Corregida (Espaciado para cierre) + Funciones Originales Preservadas
 */

window.clozLang = 'es';
window.dbCloz = [];

const i18nCloz = {
    es: {
        title: "Titulación de Clozapina",
        startDate: "Fecha de Inicio",
        profile: "Perfil / Hábito",
        generate: "GENERAR PLAN",
        copy: "COPIAR PAUTA",
        profiles: {
            "mujer-f": "Mujer • Fumadora",
            "mujer-nf": "Mujer • No Fumadora",
            "hombre-f": "Hombre • Fumador",
            "hombre-nf": "Hombre • No Fumador"
        },
        labels: { morning: "Mañana", night: "Noche", total: "Total" },
        day: "DÍA",
        copied: "¡Copiado!",
        disclaimer: "Basado en Maudsley Prescribing Guidelines 15th Ed. La dosificación debe supervisarse según tolerancia clínica y controles hematológicos."
    },
    en: {
        title: "Clozapine Titration",
        startDate: "Start Date",
        profile: "Profile / Habit",
        generate: "GENERATE PLAN",
        copy: "COPY SCHEDULE",
        profiles: {
            "mujer-f": "Woman • Smoker",
            "mujer-nf": "Woman • Non-Smoker",
            "hombre-f": "Man • Smoker",
            "hombre-nf": "Man • Non-Smoker"
        },
        labels: { morning: "Morning", night: "Night", total: "Total" },
        day: "DAY",
        copied: "Copied!",
        disclaimer: "Based on Maudsley Prescribing Guidelines 15th Ed. Monitor dosage according to clinical tolerance and mandatory blood tests."
    }
};

window.iniciarClozapina = async function() {
    const container = document.getElementById('modalData');
    if (!container) return;

    if (!document.getElementById('cloz-styles')) {
        const style = document.createElement('style');
        style.id = 'cloz-styles';
        style.innerHTML = `
            .cloz-container { padding: 1.5rem; font-family: inherit; }
            
            .cloz-header-ui { 
                background: var(--card); 
                padding: 1.5rem; 
                border-radius: 1.5rem; 
                border: 1px solid var(--border); 
                box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
                margin-bottom: 2rem;
            }
            .cloz-input-group { margin-bottom: 1.2rem; }
            .cloz-label { 
                display: block; 
                font-size: 0.7rem; 
                font-weight: 800; 
                color: var(--text-muted); 
                text-transform: uppercase; 
                letter-spacing: 0.05em; 
                margin-bottom: 0.5rem;
            }
            .cloz-input { 
                width: 100%; 
                padding: 0.8rem 1rem; 
                border-radius: 0.8rem; 
                border: 2px solid var(--border); 
                background: var(--bg); 
                color: var(--text-main); 
                font-size: 1rem; 
                font-weight: 600;
                outline: none;
                transition: all 0.2s;
                appearance: none;
            }
            .cloz-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(67, 56, 202, 0.1); }
            
            .btn-cloz-gen { 
                width: 100%; 
                padding: 1rem; 
                background: var(--primary); 
                color: white; 
                border: none; 
                border-radius: 1rem; 
                font-weight: 800; 
                font-size: 0.9rem; 
                cursor: pointer;
                transition: transform 0.2s;
            }
            .btn-cloz-gen:active { transform: scale(0.98); }

            .cloz-timeline { position: relative; padding-left: 20px; border-left: 3px solid var(--border); margin-left: 10px; }
            .cloz-card { 
                background: var(--card); border: 1px solid var(--border); border-radius: 1.2rem; 
                padding: 1.2rem; margin-bottom: 1rem; position: relative;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
            }
            .cloz-card::before { 
                content: ''; position: absolute; left: -31px; top: 22px; 
                width: 14px; height: 14px; background: var(--primary); 
                border: 3px solid var(--card); border-radius: 50%;
            }
            .cloz-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; }
            .cloz-day-badge { font-weight: 900; font-size: 0.65rem; color: var(--primary); background: rgba(67, 56, 202, 0.1); padding: 4px 8px; border-radius: 6px; }
            .cloz-date-label { font-size: 0.85rem; font-weight: 700; color: var(--text-main); }
            
            .cloz-dose-grid { display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 8px; }
            .dose-item { text-align: center; padding: 6px; border-radius: 10px; background: var(--bg); border: 1px solid var(--border); }
            .dose-item.highlight { background: var(--primary); color: white; border-color: var(--primary); }
            .dose-val { display: block; font-weight: 900; font-size: 1rem; }
            .dose-lab { display: block; font-size: 0.55rem; text-transform: uppercase; font-weight: 700; opacity: 0.8; }
            
            .cloz-disclaimer { font-size: 0.7rem; color: var(--text-muted); text-align: center; margin-top: 2rem; line-height: 1.4; border-top: 1px dashed var(--border); padding-top: 1rem; }
        `;
        document.head.appendChild(style);
    }

    try {
        const response = await fetch(`/?sheet=clozapina`);
        const data = await response.json();
        window.dbCloz = data.values;
        renderInterfazCloz();
    } catch (e) { container.innerHTML = "Error de conexión."; }
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
            <div class="calc-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; padding-right: 45px;">
                <h2 style="font-weight:900; margin:0; font-size:1.3rem;">${t.title}</h2>
                <div class="lang-toggle">
                    <button class="lang-btn ${window.clozLang === 'es' ? 'active' : ''}" onclick="setLanguageCloz('es')">ES</button>
                    <button class="lang-btn ${window.clozLang === 'en' ? 'active' : ''}" onclick="setLanguageCloz('en')">EN</button>
                </div>
            </div>

            <div class="cloz-header-ui">
                <div class="cloz-input-group">
                    <label class="cloz-label">${t.startDate}</label>
                    <input type="date" id="cloz_start" class="cloz-input" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="cloz-input-group">
                    <label class="cloz-label">${t.profile}</label>
                    <select id="cloz_profile" class="cloz-input">
                        <option value="1">${t.profiles["mujer-f"]}</option>
                        <option value="4">${t.profiles["mujer-nf"]}</option>
                        <option value="7">${t.profiles["hombre-f"]}</option>
                        <option value="10">${t.profiles["hombre-nf"]}</option>
                    </select>
                </div>
                <button class="btn-cloz-gen" onclick="generarCalendarioCloz()">${t.generate}</button>
            </div>

            <div id="cloz-res-box" style="display:none;">
                <div id="cloz-res-pauta" class="cloz-timeline"></div>
                <button class="btn-copiar" style="width:100%; margin-top:1rem;" onclick="copiarCalendarioCloz()">
                    <i class="far fa-copy"></i> ${t.copy}
                </button>
                <div class="cloz-disclaimer">${t.disclaimer}</div>
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
            weekday: 'short', day: 'numeric', month: 'short'
        });

        const m = row[colBase] || '0';
        const n = row[colBase + 1] || '0';
        const tot = row[colBase + 2] || '0';

        html += `
            <div class="cloz-card">
                <div class="cloz-card-header">
                    <span class="cloz-day-badge">${t.day} ${numDia}</span>
                    <span class="cloz-date-label">${fechaFormat.toUpperCase()}</span>
                </div>
                <div class="cloz-dose-grid">
                    <div class="dose-item">
                        <span class="dose-lab">${t.labels.morning}</span>
                        <span class="dose-val">${m} <small>mg</small></span>
                    </div>
                    <div class="dose-item">
                        <span class="dose-lab">${t.labels.night}</span>
                        <span class="dose-val">${n} <small>mg</small></span>
                    </div>
                    <div class="dose-item highlight">
                        <span class="dose-lab">Σ ${t.labels.total}</span>
                        <span class="dose-val">${tot} <small>mg</small></span>
                    </div>
                </div>
            </div>`;
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
        txt += `${dia} (${fecha}): ${d[0].innerText} | ${d[1].innerText} | TOTAL: ${d[2].innerText}\n`;
    });
    navigator.clipboard.writeText(txt);
    alert(t.copied);
};
