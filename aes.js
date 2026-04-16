/**
 * aes.js - Versión Final PSQALDÍA
 */
let db = [];
let lang = 'es';

const i18n = {
    es: {
        title: "Titulación de FAE",
        subtitle: "Planificador dinámico para el inicio de fármacos antiepilépticos.",
        i1t: "Seguridad", i1p: "Titulación progresiva para reducir el riesgo de efectos adversos cutáneos o sistémicos.",
        i2t: "Precisión", i2p: "Cronograma automático basado en los intervalos de seguridad de cada fármaco.",
        i3t: "Individualizado", i3p: "Selección de dosis objetivo según la indicación y respuesta del paciente.",
        setup: "Configuración",
        lDrug: "Fármaco", lTarget: "Dosis Objetivo", lDate: "Fecha de Inicio",
        btnGen: "GENERAR PLAN", btnCopy: "COPIAR PLAN",
        copied: "Plan copiado con éxito",
        bTitle: "Referencias Clínicas",
        bStahl: "Stahl's Essential Psychopharmacology: Guía del prescriptor.",
        bFichas: "Fichas técnicas oficiales (AEMPS / EMA).",
        bExp: "Experiencia clínica.",
        morn: "Mañana", mid: "Mediodía", night: "Noche", from: "Desde el"
    },
    en: {
        title: "AED Titration",
        subtitle: "Dynamic planner for initiating anti-epileptic drugs.",
        i1t: "Safety", i1p: "Progressive titration to reduce the risk of serious skin or systemic reactions.",
        i2t: "Precision", i2p: "Automatic timeline based on specific drug safety intervals.",
        i3t: "Tailored", i3p: "Target dose selection based on indication and patient response.",
        setup: "Setup",
        lDrug: "Medication", lTarget: "Target Dose", lDate: "Start Date",
        btnGen: "GENERATE PLAN", btnCopy: "COPY PLAN",
        copied: "Plan copied to clipboard",
        bTitle: "Clinical References",
        bStahl: "Stahl's Essential Psychopharmacology: Prescriber's Guide.",
        bFichas: "Official prescribing information (EMA / FDA).",
        bExp: "Protocols based on clinical experience and expert consensus.",
        morn: "Morning", mid: "Midday", night: "Night", from: "Starting"
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('startDate').valueAsDate = new Date();
    updateUI();
    try {
        const r = await fetch('https://psqaldia.com/?sheet=AES');
        const j = await r.json();
        db = j.values;
        initSelects();
    } catch (e) { console.error(e); }
});

function setLang(l) {
    lang = l;
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.innerText.toLowerCase() === l));
    updateUI();
    if(document.getElementById('res-box').style.display === 'block') renderPlan();
}

function updateUI() {
    const t = i18n[lang];
    const map = {
        'ui-title':'title', 'ui-subtitle':'subtitle', 'ui-i1-t':'i1t', 'ui-i1-p':'i1p',
        'ui-i2-t':'i2t', 'ui-i2-p':'i2p', 'ui-i3-t':'i3t', 'ui-i3-p':'i3p',
        'ui-setup-h':'setup', 'ui-l-drug':'lDrug', 'ui-l-target':'lTarget', 'ui-l-date':'lDate',
        'btnGen':'btnGen', 'ui-b-copy':'btnCopy', 'ui-b-title':'bTitle',
        'ui-b-stahl':'bStahl', 'ui-b-fichas':'bFichas', 'ui-b-exp':'bExp'
    };
    for(let id in map) { if(document.getElementById(id)) document.getElementById(id).innerText = t[map[id]]; }
}

function initSelects() {
    const s = document.getElementById('drugSelect');
    s.innerHTML = `<option value="">-- ${i18n[lang].lDrug} --</option>`;
    db.forEach((row, i) => { if(row[0]) { const o = document.createElement('option'); o.value = i; o.textContent = row[0]; s.appendChild(o); } });
}

document.getElementById('drugSelect').addEventListener('change', (e) => {
    const row = db[e.target.value];
    const ts = document.getElementById('targetDose');
    ts.innerHTML = '';
    if(!row) return;
    for (let i = 1; i < row.length; i += 3) {
        if (row[i+1]) { const o = document.createElement('option'); o.value = i; o.textContent = `${row[i+1]} mg/${lang==='es'?'día':'day'}`; ts.appendChild(o); }
    }
    ts.disabled = false;
    document.getElementById('btnGen').disabled = false;
});

function formatDose(p) {
    const d = p.split('-').map(v => v.trim());
    const t = i18n[lang];
    let res = [];
    if(d[0] && d[0] !== '0') res.push(`${t.morn}: ${d[0]} mg`);
    if(d[1] && d[1] !== '0') res.push(`${t.mid}: ${d[1]} mg`);
    if(d[2] && d[2] !== '0') res.push(`${t.night}: ${d[2]} mg`);
    return res.join(', ');
}

window.renderPlan = function() {
    const row = db[document.getElementById('drugSelect').value];
    const targetIdx = parseInt(document.getElementById('targetDose').value);
    const start = new Date(document.getElementById('startDate').value);
    const list = document.getElementById('plan-list');
    const t = i18n[lang];
    
    list.innerHTML = `<h3 style="font-weight:800; color:var(--primary); margin-bottom:1.5rem;">${row[0]}</h3>`;
    let offset = 0;
    
    for (let i = 1; i <= targetIdx; i += 3) {
        const d = new Date(start); d.setDate(start.getDate() + offset);
        const ds = d.toLocaleDateString(lang==='es'?'es-ES':'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
        list.innerHTML += `
            <div class="step-card">
                <div class="step-date">${t.from} ${ds}</div>
                <div class="step-doses">${formatDose(row[i])}</div>
            </div>`;
        offset += (parseInt(row[i+2]) || 0);
    }
    document.getElementById('res-box').style.display = 'block';
};

window.copyPlan = function() {
    const drug = db[document.getElementById('drugSelect').value][0];
    let txt = `${drug.toUpperCase()}\n`;
    document.querySelectorAll('.step-card').forEach(c => {
        txt += `• ${c.querySelector('.step-date').innerText}: ${c.querySelector('.step-doses').innerText}\n`;
    });
    navigator.clipboard.writeText(txt).then(() => alert(i18n[lang].copied));
};
