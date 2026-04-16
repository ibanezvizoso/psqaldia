/**
 * aes.js - Motor PSQALDÍA v4.0
 * Corregido para uso con columna Acción: iniciarAES()
 */
window.dbAES = [];
window.langAES = 'es';

// Función principal que llamarás desde la columna "Acción" de tu Sheets
window.iniciarAES = async function() {
    // 1. Seteamos fecha por defecto
    const dateEl = document.getElementById('startDate');
    if (dateEl) dateEl.valueAsDate = new Date();
    
    // 2. Renderizamos interfaz inicial
    updateUIAES();
    
    // 3. Carga de datos
    try {
        const r = await fetch('https://psqaldia.com/?sheet=AES');
        const j = await r.json();
        window.dbAES = j.values;
        initSelectsAES();
    } catch (e) { 
        console.error("Error cargando AES:", e); 
    }
};

const i18nAES = {
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

window.setLangAES = function(l) {
    window.langAES = l;
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.innerText.toLowerCase() === l));
    updateUIAES();
    if(document.getElementById('res-box').style.display === 'block') renderPlanAES();
};

function updateUIAES() {
    const t = i18nAES[window.langAES];
    const map = {
        'ui-title':'title', 'ui-subtitle':'subtitle', 'ui-i1-t':'i1t', 'ui-i1-p':'i1p',
        'ui-i2-t':'i2t', 'ui-i2-p':'i2p', 'ui-i3-t':'i3t', 'ui-i3-p':'i3p',
        'ui-setup-h':'setup', 'ui-l-drug':'lDrug', 'ui-l-target':'lTarget', 'ui-l-date':'lDate',
        'btnGen':'btnGen', 'ui-b-copy':'btnCopy', 'ui-b-title':'bTitle',
        'ui-b-stahl':'bStahl', 'ui-b-fichas':'bFichas', 'ui-b-exp':'bExp'
    };
    for(let id in map) { if(document.getElementById(id)) document.getElementById(id).innerText = t[map[id]]; }
}

function initSelectsAES() {
    const s = document.getElementById('drugSelect');
    if (!s) return;
    s.innerHTML = `<option value="">-- ${i18nAES[window.langAES].lDrug} --</option>`;
    window.dbAES.forEach((row, i) => { if(row[0]) { const o = document.createElement('option'); o.value = i; o.textContent = row[0]; s.appendChild(o); } });
}

// Escuchador de eventos delegado para el cambio de fármaco
document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'drugSelect') {
        const row = window.dbAES[e.target.value];
        const ts = document.getElementById('targetDose');
        if (!ts) return;
        ts.innerHTML = '';
        if(!row) return;
        // Cadencia de 3: Pauta(i), Target(i+1), Intervalo(i+2) desde columna B (index 1)
        for (let i = 1; i < row.length; i += 3) {
            if (row[i+1]) { 
                const o = document.createElement('option'); 
                o.value = i; 
                o.textContent = `${row[i+1]} mg/${window.langAES==='es'?'día':'day'}`; 
                ts.appendChild(o); 
            }
        }
        ts.disabled = false;
        document.getElementById('btnGen').disabled = false;
    }
});

function formatDoseAES(p) {
    const d = p.split('-').map(v => v.trim());
    const t = i18nAES[window.langAES];
    let res = [];
    if(d[0] && d[0] !== '0') res.push(`${t.morn}: ${d[0]} mg`);
    if(d[1] && d[1] !== '0') res.push(`${t.mid}: ${d[1]} mg`);
    if(d[2] && d[2] !== '0') res.push(`${t.night}: ${d[2]} mg`);
    return res.length > 0 ? res.join(', ') : "0 mg";
}

window.renderPlanAES = function() {
    const drugSelect = document.getElementById('drugSelect');
    if (!drugSelect.value) return;

    const row = window.dbAES[drugSelect.value];
    const targetIdx = parseInt(document.getElementById('targetDose').value);
    const start = new Date(document.getElementById('startDate').value);
    const list = document.getElementById('plan-list');
    const t = i18nAES[window.langAES];
    
    list.innerHTML = `<h3 style="font-weight:800; color:var(--primary); margin-bottom:1.5rem;">${row[0]}</h3>`;
    let offset = 0;
    
    for (let i = 1; i <= targetIdx; i += 3) {
        const d = new Date(start); d.setDate(start.getDate() + offset);
        const ds = d.toLocaleDateString(window.langAES==='es'?'es-ES':'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
        list.innerHTML += `
            <div class="step-card">
                <div class="step-date">${t.from} ${ds}</div>
                <div class="step-doses">${formatDoseAES(row[i])}</div>
            </div>`;
        offset += (parseInt(row[i+2]) || 0);
    }
    document.getElementById('res-box').style.display = 'block';
};

window.copyPlanAES = function() {
    const drug = window.dbAES[document.getElementById('drugSelect').value][0];
    let txt = `${drug.toUpperCase()}\n`;
    document.querySelectorAll('.step-card').forEach(c => {
        txt += `• ${c.querySelector('.step-date').innerText}: ${c.querySelector('.step-doses').innerText}\n`;
    });
    navigator.clipboard.writeText(txt).then(() => alert(i18nAES[window.langAES].copied));
};
