/**
 * aes.js - Motor de Titulación AES v4.2
 * Estructura idéntica a clozapina.js para integración total en PSQALDÍA
 */

window.aesLang = 'es';
window.dbAES = [];

const i18nAES = {
    es: {
        title: "Configuración del Tratamiento",
        startDate: "Fecha de Inicio",
        drug: "Fármaco",
        target: "Dosis Objetivo",
        generate: "GENERAR PLAN",
        copy: "COPIAR PLAN LIMPIO",
        copied: "¡Copiado!",
        labels: { morning: "Mañana", midday: "Mediodía", night: "Noche" },
        from: "Desde el",
        disclaimer: "Basado en Stahl's Prescriber's Guide y Fichas Técnicas. La titulación debe ajustarse según tolerancia clínica."
    },
    en: {
        title: "Treatment Setup",
        startDate: "Start Date",
        drug: "Medication",
        target: "Target Dose",
        generate: "GENERATE PLAN",
        copy: "COPY CLEAN PLAN",
        copied: "Copied!",
        labels: { morning: "Morning", midday: "Midday", night: "Night" },
        from: "Starting on",
        disclaimer: "Based on Stahl's Prescriber's Guide and FDA/EMA labels. Titration should be adjusted according to clinical tolerance."
    }
};

window.iniciarAES = async function() {
    const container = document.getElementById('modalData');
    if (!container) return;

    // Inyectar Estilos específicos (estilo Clozapina)
    if (!document.getElementById('aes-styles')) {
        const style = document.createElement('style');
        style.id = 'aes-styles';
        style.innerHTML = `
            .aes-ui { padding: 2rem; }
            .aes-header-ui { background: var(--bg); padding: 1.5rem; border-radius: 1.2rem; border: 1px solid var(--border); margin-bottom: 2rem; }
            .aes-input-group { margin-bottom: 1.2rem; }
            .aes-label { display: block; font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem; }
            .aes-input { width: 100%; padding: 0.8rem; border-radius: 0.8rem; border: 2px solid var(--border); font-size: 1rem; font-weight: 600; outline: none; box-sizing: border-box; }
            .btn-aes { width: 100%; padding: 1rem; background: var(--primary); color: white; border: none; border-radius: 1rem; font-weight: 800; cursor: pointer; }
            .aes-timeline { border-left: 3px solid var(--border); padding-left: 20px; margin-left: 10px; margin-top: 2rem; }
            .aes-card { background: white; border: 1px solid var(--border); border-radius: 1.2rem; padding: 1.2rem; margin-bottom: 1rem; position: relative; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            .aes-card::before { content: ''; position: absolute; left: -31px; top: 22px; width: 14px; height: 14px; background: var(--primary); border: 3px solid white; border-radius: 50%; }
            .aes-date { color: var(--primary); font-weight: 800; font-size: 0.85rem; text-transform: uppercase; }
            .aes-doses { font-size: 1.1rem; font-weight: 700; margin-top: 0.3rem; }
            .lang-btn { background: #eee; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.7rem; font-weight:800; }
            .lang-btn.active { background: var(--primary); color:white; }
        `;
        document.head.appendChild(style);
    }

    try {
        const response = await fetch('/?sheet=AES');
        const data = await response.json();
        window.dbAES = data.values;
        renderInterfazAES();
    } catch (e) { container.innerHTML = "<p style='padding:2rem;'>Error conectando con el servidor.</p>"; }
};

window.setLangAES = function(l) { window.aesLang = l; renderInterfazAES(); };

function renderInterfazAES() {
    const t = i18nAES[window.aesLang];
    const container = document.getElementById('modalData');
    
    container.innerHTML = `
        <div class="aes-ui">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                <h2 style="font-weight:900; margin:0; font-size:1.3rem;">${t.title}</h2>
                <div>
                    <button class="lang-btn ${window.aesLang==='es'?'active':''}" onclick="setLangAES('es')">ES</button>
                    <button class="lang-btn ${window.aesLang==='en'?'active':''}" onclick="setLangAES('en')">EN</button>
                </div>
            </div>

            <div class="aes-header-ui">
                <div class="aes-input-group">
                    <label class="aes-label">${t.drug}</label>
                    <select id="drugSelect" class="aes-input" onchange="updateTargetsAES()">
                        <option value="">-- Seleccionar --</option>
                        ${window.dbAES.map((row, i) => row[0] ? `<option value="${i}">${row[0]}</option>` : '').join('')}
                    </select>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                    <div class="aes-input-group">
                        <label class="aes-label">${t.target}</label>
                        <select id="targetDose" class="aes-input" disabled><option>--</option></select>
                    </div>
                    <div class="aes-input-group">
                        <label class="aes-label">${t.startDate}</label>
                        <input type="date" id="startDate" class="aes-input" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
                <button class="btn-aes" onclick="generarCalendarioAES()">${t.generate}</button>
            </div>
            <div id="aes-res-box" style="display:none;">
                <div id="aes-timeline" class="aes-timeline"></div>
                <button class="btn-aes" style="background:#f1f5f9; color:var(--text-main); border:1px solid var(--border); margin-top:1.5rem;" onclick="copiarAES()">
                    <i class="far fa-copy"></i> ${t.copy}
                </button>
                <p style="font-size:0.7rem; color:var(--text-muted); margin-top:1.5rem; text-align:center;">${t.disclaimer}</p>
            </div>
        </div>
    `;
}

window.updateTargetsAES = function() {
    const drugIdx = document.getElementById('drugSelect').value;
    const ts = document.getElementById('targetDose');
    ts.innerHTML = '';
    if(!drugIdx) { ts.disabled = true; return; }
    
    const row = window.dbAES[drugIdx];
    for (let i = 1; i < row.length; i += 3) {
        if (row[i+1]) {
            let o = document.createElement('option');
            o.value = i;
            o.textContent = `${row[i+1]} mg/${window.aesLang==='es'?'día':'day'}`;
            ts.appendChild(o);
        }
    }
    ts.disabled = false;
};

window.generarCalendarioAES = function() {
    const drugRow = window.dbAES[document.getElementById('drugSelect').value];
    const targetIdx = parseInt(document.getElementById('targetDose').value);
    const start = new Date(document.getElementById('startDate').value);
    const t = i18nAES[window.aesLang];
    
    let html = '';
    let offset = 0;
    
    for (let i = 1; i <= targetIdx; i += 3) {
        const d = new Date(start); d.setDate(start.getDate() + offset);
        const ds = d.toLocaleDateString(window.aesLang==='es'?'es-ES':'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
        
        const doses = drugRow[i].split('-').map(v => v.trim());
        let dText = [];
        if(doses[0] && doses[0] !== '0') dText.push(`${t.labels.morning}: ${doses[0]} mg`);
        if(doses[1] && doses[1] !== '0') dText.push(`${t.labels.midday}: ${doses[1]} mg`);
        if(doses[2] && doses[2] !== '0') dText.push(`${t.labels.night}: ${doses[2]} mg`);

        html += `
            <div class="aes-card">
                <div class="aes-date">${t.from} ${ds}</div>
                <div class="aes-doses">${dText.join(', ')}</div>
            </div>`;
        offset += (parseInt(drugRow[i+2]) || 0);
    }
    document.getElementById('aes-timeline').innerHTML = html;
    document.getElementById('aes-res-box').style.display = 'block';
};

window.copiarAES = function() {
    const drug = window.dbAES[document.getElementById('drugSelect').value][0];
    let txt = `${drug.toUpperCase()}\n`;
    document.querySelectorAll('.aes-card').forEach(c => {
        txt += `• ${c.querySelector('.aes-date').innerText}: ${c.querySelector('.aes-doses').innerText}\n`;
    });
    navigator.clipboard.writeText(txt).then(() => alert(i18nAES[window.aesLang].copied));
};
