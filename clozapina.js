/**
 * clozapina.js - Motor de Titulación de Clozapina PSQALDÍA v1.0
 * Basado en Maudsley Prescribing Guidelines 15th Edition.
 */

window.clozLang = 'es';
window.dbCloz = [];

const i18nCloz = {
    es: {
        title: "Titulación de Clozapina",
        startDate: "Fecha de Inicio",
        profile: "Perfil del Paciente",
        generate: "GENERAR CALENDARIO",
        copy: "COPIAR CALENDARIO",
        profiles: {
            "mujer-f": "Mujer Fumadora",
            "mujer-nf": "Mujer No Fumadora",
            "hombre-f": "Hombre Fumador",
            "hombre-nf": "Hombre No Fumador"
        },
        table: {
            day: "Día / Fecha",
            morning: "Mañana",
            night: "Noche",
            total: "Total"
        },
        copied: "¡Copiado!",
        disclaimer: "Basado en Maudsley Prescribing Guidelines 15th Ed. Esta pauta es orientativa y debe ajustarse según la tolerancia clínica y niveles plasmáticos."
    },
    en: {
        title: "Clozapine Titration",
        startDate: "Start Date",
        profile: "Patient Profile",
        generate: "GENERATE SCHEDULE",
        copy: "COPY SCHEDULE",
        profiles: {
            "mujer-f": "Woman Smoker",
            "mujer-nf": "Woman Non-Smoker",
            "hombre-f": "Man Smoker",
            "hombre-nf": "Man Non-Smoker"
        },
        table: {
            day: "Day / Date",
            morning: "Morning",
            night: "Night",
            total: "Total"
        },
        copied: "Copied!",
        disclaimer: "Based on Maudsley Prescribing Guidelines 15th Ed. This schedule is for guidance and must be adjusted according to clinical tolerance and plasma levels."
    }
};

window.iniciarClozapina = async function() {
    const container = document.getElementById('modalData');
    if (!container) return;

    // Cargar datos de la pestaña "clozapina"
    try {
        const response = await fetch(`${window.WORKER_URL}?sheet=clozapina`);
        const data = await response.json();
        window.dbCloz = data.values; // Guardamos las filas (A2:M...)
        renderInterfazCloz();
    } catch (e) {
        console.error("Error cargando clozapina:", e);
        container.innerHTML = "Error al cargar los datos de Clozapina.";
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
        <div class="calc-ui">
            <div class="calc-header">
                <h2>${t.title}</h2>
                <div class="lang-toggle">
                    <button class="lang-btn ${window.clozLang === 'es' ? 'active' : ''}" onclick="setLanguageCloz('es')">ES</button>
                    <button class="lang-btn ${window.clozLang === 'en' ? 'active' : ''}" onclick="setLanguageCloz('en')">EN</button>
                </div>
                <div></div>
            </div>

            <label>${t.startDate}</label>
            <input type="date" id="cloz_start" class="depre-input" value="${new Date().toISOString().split('T')[0]}" style="width:100%; box-sizing:border-box;">

            <label>${t.profile}</label>
            <select id="cloz_profile" class="depre-input" style="width:100%;">
                <option value="1">${t.profiles["mujer-f"]}</option>
                <option value="4">${t.profiles["mujer-nf"]}</option>
                <option value="7">${t.profiles["hombre-f"]}</option>
                <option value="10">${t.profiles["hombre-nf"]}</option>
            </select>

            <button class="btn-ejecutar" onclick="generarCalendarioCloz()">${t.generate}</button>

            <div id="cloz-res-box" class="res-container">
                <div id="cloz-res-pauta" class="res-pauta"></div>
                <div class="disclaimer">${t.disclaimer}</div>
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
    
    // Iteramos sobre los datos (empezando en el primer paso real)
    window.dbCloz.forEach((row) => {
        const numDia = parseInt(row[0]);
        if (isNaN(numDia)) return;

        // Calcular fecha real
        const currentFecha = new Date(startDate);
        currentFecha.setDate(startDate.getDate() + (numDia - 1));
        
        const fechaFormat = currentFecha.toLocaleDateString(window.clozLang === 'es' ? 'es-ES' : 'en-US', {
            weekday: 'short', day: 'numeric', month: 'short'
        });

        // Extraer dosis (mañana, noche, total)
        const m = row[colBase] || '0';
        const n = row[colBase + 1] || '0';
        const tot = row[colBase + 2] || '0';

        html += `
            <div class="pauta-step">
                <div class="step-idx" style="font-size:0.65rem; line-height:1.2; text-align:center;">
                    ${fechaFormat.toUpperCase()}<br><small>DÍA ${numDia}</small>
                </div>
                <div class="step-body">
                    <span class="tag-farm tag-dest">CLOZAPINA</span>
                    <div class="step-txt">
                        ☀️ ${m} mg | 🌙 ${n} mg | <b>Σ ${tot} mg</b>
                    </div>
                </div>
            </div>
        `;
    });

    const resBox = document.getElementById('cloz-res-box');
    const resContent = document.getElementById('cloz-res-pauta');
    
    resContent.innerHTML = html + `
        <button class="btn-copiar" onclick="copiarCalendarioCloz()">
            <i class="far fa-copy"></i> ${t.copy}
        </button>
    `;
    resBox.style.display = 'block';
};

window.copiarCalendarioCloz = function() {
    const t = i18nCloz[window.clozLang];
    let txt = `${t.title.toUpperCase()}\n--------------------------\n`;
    
    document.querySelectorAll('#cloz-res-pauta .pauta-step').forEach(s => {
        const dia = s.querySelector('.step-idx').innerText.replace('\n', ' ');
        const dosis = s.querySelector('.step-txt').innerText;
        txt += `${dia}: ${dosis}\n`;
    });

    navigator.clipboard.writeText(txt);
    alert(t.copied);
};
