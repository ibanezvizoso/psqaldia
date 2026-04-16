/**
 * aes.js - Motor de Titulación de Antiepilépticos PSQALDÍA v1.0
 * Estructura de inyección dinámica compatible con columna Acción: iniciarAES()
 */

window.aesLang = 'es';
window.dbAES = [];

const i18nAES = {
    es: {
        title: "Titulación de Antiepilépticos",
        startDate: "Fecha de Inicio",
        drug: "Fármaco",
        target: "Dosis Objetivo",
        generate: "GENERAR PLAN",
        copy: "COPIAR PAUTA",
        labels: { morning: "Mañana", midday: "Mediodía", night: "Noche" },
        day: "PASO",
        copied: "¡Copiado!",
        disclaimer: "Bibliografía: Stahl Guía del prescriptor, fichas técnicas y experiencia clínica. La dosificación debe supervisarse según tolerancia clínica."
    },
    en: {
        title: "AED Titration",
        startDate: "Start Date",
        drug: "Medication",
        target: "Target Dose",
        generate: "GENERATE PLAN",
        copy: "COPY SCHEDULE",
        labels: { morning: "Morning", midday: "Midday", night: "Night" },
        day: "STEP",
        copied: "Copied!",
        disclaimer: "References: Stahl's Prescriber's Guide, product labels, and clinical experience. Dosage should be monitored according to clinical tolerance."
    }
};

window.iniciarAES = async function() {
    const container = document.getElementById('modalData');
    if (!container) return;

    // Inyectar Estilos (Clonando la estética de Clozapina)
    if (!document.getElementById('aes-styles')) {
        const style = document.createElement('style');
        style.id = 'aes-styles';
        style.innerHTML = `
            .aes-container { padding: 1.5rem; font-family: inherit; }
            .aes-header-ui { 
                background: var(--card-bg); 
                padding: 1.5rem; 
                border-radius: 1.5rem; 
                border: 1px solid var(--border); 
                box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
                margin-bottom: 2rem;
            }
            .aes-input-group { margin-bottom: 1.2rem; }
            .aes-label { 
                display: block; font-size: 0.7rem; font-weight: 800; 
                color: var(--text-muted); text-transform: uppercase; 
                letter-spacing: 0.05em; margin-bottom: 0.5rem;
            }
            .aes-input { 
                width: 100%; padding: 0.8rem 1rem; border-radius: 0.8rem; 
                border: 2px solid var(--border); background: var(--bg); 
                color: var(--text-main); font-size: 1rem; font-weight: 600;
                outline: none; transition: all 0.2s; appearance: none;
            }
            .aes-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(67, 56, 202, 0.1); }
            
            .btn-aes-gen { 
                width: 100%; padding: 1rem; background: var(--primary); 
                color: white; border: none; border-radius: 1rem; 
                font-weight: 800; font-size: 0.9rem; cursor: pointer;
                transition: transform 0.2s;
            }
            .btn-aes-gen:active { transform: scale(0.98); }

            .aes-timeline { position: relative; padding-left: 20px; border-left: 3px solid var(--border); margin-left: 10px; }
            .aes-card { 
                background: var(--card-bg); border: 1px solid var(--border); border-radius: 1.2rem; 
                padding: 1.2rem; margin-bottom: 1rem; position: relative;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
            }
            .aes-card::before { 
                content: ''; position: absolute; left: -31px; top: 22px; 
                width: 14px; height: 14px; background: var(--primary); 
                border: 3px solid var(--card-bg); border-radius: 50%;
            }
            .aes-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; }
            .aes-step-badge { font-weight: 900; font-size: 0.65rem; color: var(--primary); background: rgba(67, 56, 202, 0.1); padding: 4px 8px; border-radius: 6px; }
            .aes-date-label { font-size: 0.85rem; font-weight: 700; color: var(--text-main); }
            
            .aes-dose-list { display: flex; flex-direction: column; gap: 4px; }
            .aes-dose-row { font-size: 1rem; font-weight: 600; color: var(--text-main); }
            .aes-dose-row span { color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 800; margin-right: 8px; }
            
            .aes-disclaimer { font-size: 0.7rem; color: var(--text-muted); text-align: center; margin-top: 2rem; line-height: 1.4; border-top: 1px dashed var(--border); padding-top: 1rem; }
        `;
        document.head.appendChild(style);
    }

    try {
        const response = await fetch(`/?sheet=AES`);
        const data = await response.json();
        window.dbAES = data.values;
        renderInterfazAES();
    } catch (e) { container.innerHTML = "Error de conexión."; }
};

window.setLanguageAES = function(lang) {
    window.aesLang = lang;
    renderInterfazAES();
};

function renderInterfazAES() {
    const t = i18nAES[window.aesLang];
    const container = document.getElementById('modalData');
    
    container.innerHTML = `
        <div class="aes-container">
            <div class="calc-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; padding-right: 45px;">
                <h2 style="font-weight:900; margin:0; font-size:1.3rem;">${t.title}</h2>
                <div class="lang-toggle">
                    <button class="lang-btn ${window.aesLang === 'es' ? 'active' : ''}" onclick="setLanguageAES('es')">ES</button>
                    <button class="lang-btn ${window.aesLang === 'en' ? 'active' : ''}" onclick="setLanguageAES('en')">EN</button>
                </div>
            </div>

            <div class="aes-header-ui">
                <div class="aes-input-group">
                    <label class="aes-label">${t.drug}</label>
                    <select id="aes_drug" class="aes-input" onchange="actualizarDosisObjetivo()">
                        <option value="">-- Seleccionar --</option>
                        ${window.dbAES.map((row, index) => `<option value="${index}">${row[0]}</option>`).join('')}
                    </select>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                    <div class="aes-input-group">
                        <label class="aes-label">${t.target}</label>
                        <select id="aes_target" class="aes-input" disabled>
                            <option value="">--</option>
                        </select>
                    </div>
                    <div class="aes-input-group">
                        <label class="aes-label">${t.startDate}</label>
                        <input type="date" id="aes_start" class="aes-input" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
                <button class="btn-aes-gen" onclick="generarCalendarioAES()">${t.generate}</button>
            </div>

            <div id="aes-res-box" style="display:none;">
                <div id="aes-res-pauta" class="aes-timeline"></div>
                <button class="btn-copiar" style="width:100%; margin-top:1rem;" onclick="copiarCalendarioAES()">
                    <i class="far fa-copy"></i> ${t.copy}
                </button>
                <div class="aes-disclaimer">${t.disclaimer}</div>
            </div>
        </div>
    `;
}

window.actualizarDosisObjetivo = function() {
    const drugIdx = document.getElementById('aes_drug').value;
    const targetSelect = document.getElementById('aes_target');
    targetSelect.innerHTML = '';
    
    if (!drugIdx) { targetSelect.disabled = true; return; }

    const row = window.dbAES[drugIdx];
    // Cadencia 3: Pauta (i), Target (i+1), Intervalo (i+2) empezando en Col B (index 1)
    for (let i = 1; i < row.length; i += 3) {
        const targetVal = row[i+1];
        if (targetVal) {
            let opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `${targetVal} mg/día`;
            targetSelect.appendChild(opt);
        }
    }
    targetSelect.disabled = false;
}

window.generarCalendarioAES = function() {
    const t = i18nAES[window.aesLang];
    const drugIdx = document.getElementById('aes_drug').value;
    const targetIdx = parseInt(document.getElementById('aes_target').value);
    const startInput = document.getElementById('aes_start').value;
    
    if (!drugIdx || isNaN(targetIdx) || !startInput) return;

    const row = window.dbAES[drugIdx];
    const startDate = new Date(startInput);
    let html = '';
    let diasAcumulados = 0;
    let stepCount = 1;

    for (let i = 1; i <= targetIdx; i += 3) {
        const currentFecha = new Date(startDate);
        currentFecha.setDate(startDate.getDate() + diasAcumulados);
        
        const fechaFormat = currentFecha.toLocaleDateString(window.aesLang === 'es' ? 'es-ES' : 'en-US', {
            weekday: 'long', day: 'numeric', month: 'long'
        });

        // Formatear dosis Mañana-Mediodía-Noche
        const pautaRaw = row[i] || "0-0-0";
        const doses = pautaRaw.split('-').map(d => d.trim());
        let doseHtml = '';
        if (doses[0] && doses[0] !== '0') doseHtml += `<div class="aes-dose-row"><span>${t.labels.morning}</span>${doses[0]} mg</div>`;
        if (doses[1] && doses[1] !== '0') doseHtml += `<div class="aes-dose-row"><span>${t.labels.midday}</span>${doses[1]} mg</div>`;
        if (doses[2] && doses[2] !== '0') doseHtml += `<div class="aes-dose-row"><span>${t.labels.night}</span>${doses[2]} mg</div>`;

        html += `
            <div class="aes-card">
                <div class="aes-card-header">
                    <span class="aes-step-badge">${t.day} ${stepCount}</span>
                    <span class="aes-date-label">${fechaFormat.toUpperCase()}</span>
                </div>
                <div class="aes-dose-list">
                    ${doseHtml || '0 mg'}
                </div>
            </div>`;
        
        diasAcumulados += (parseInt(row[i+2]) || 0);
        stepCount++;
    }

    document.getElementById('aes-res-pauta').innerHTML = html;
    document.getElementById('aes-res-box').style.display = 'block';
};

window.copiarCalendarioAES = function() {
    const t = i18nAES[window.aesLang];
    const drugName = window.dbAES[document.getElementById('aes_drug').value][0];
    let txt = `📋 TITULACIÓN: ${drugName.toUpperCase()}\n--------------------------\n`;
    document.querySelectorAll('.aes-card').forEach(c => {
        const step = c.querySelector('.aes-step-badge').innerText;
        const fecha = c.querySelector('.aes-date-label').innerText;
        const doses = Array.from(c.querySelectorAll('.aes-dose-row')).map(div => div.innerText).join(' | ');
        txt += `${step} (${fecha}): ${doses}\n`;
    });
    navigator.clipboard.writeText(txt);
    alert(t.copied);
};
