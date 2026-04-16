/**
 * aes.js - Motor de Antiepilépticos PSQALDÍA con soporte multiidioma
 */
let aesData = [];
let currentLang = 'es';

const i18n = {
    es: {
        title: "Titulación de FAE",
        subtitle: "Planificador dinámico de inicio de fármacos antiepilépticos.",
        setup: "Configuración",
        drug: "Fármaco",
        target: "Dosis Objetivo",
        date: "Fecha de Inicio",
        generate: "GENERAR PLAN",
        copy: "COPIAR PAUTA",
        copied: "¡Copiado!",
        morning: "Mañana",
        midday: "Mediodía",
        night: "Noche",
        disclaimer: "Consulte siempre la ficha técnica. La titulación debe ajustarse según tolerancia clínica.",
        from: "Desde el"
    },
    en: {
        title: "AED Titration",
        subtitle: "Dynamic starter planner for anti-epileptic drugs.",
        setup: "Setup",
        drug: "Medication",
        target: "Target Dose",
        date: "Start Date",
        generate: "GENERATE PLAN",
        copy: "COPY SCHEDULE",
        copied: "Copied!",
        morning: "Morning",
        midday: "Midday",
        night: "Night",
        disclaimer: "Always consult the prescribing information. Titration should be adjusted based on clinical tolerance.",
        from: "Starting"
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('startDate').valueAsDate = new Date();
    updateUI();
    
    try {
        const res = await fetch('https://psqaldia.com/?sheet=AES');
        const json = await res.json();
        aesData = json.values;
        populateDrugs();
    } catch (e) { console.error("Error cargando AES", e); }
});

function setLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('.lang-btn').forEach(b => {
        b.classList.toggle('active', b.innerText.toLowerCase() === lang);
    });
    updateUI();
    if(document.getElementById('results-box').style.display === 'block') generarPauta();
}

function updateUI() {
    const t = i18n[currentLang];
    document.getElementById('ui-title').innerText = t.title;
    document.getElementById('ui-subtitle').innerText = t.subtitle;
    document.getElementById('ui-setup-title').innerText = t.setup;
    document.getElementById('ui-label-drug').innerText = t.drug;
    document.getElementById('ui-label-target').innerText = t.target;
    document.getElementById('ui-label-date').innerText = t.date;
    document.getElementById('btnGenerate').innerText = t.generate;
    document.getElementById('ui-btn-copy').innerText = t.copy;
    document.getElementById('ui-disclaimer').innerText = t.disclaimer;
}

function populateDrugs() {
    const select = document.getElementById('drugSelect');
    select.innerHTML = `<option value="">-- ${i18n[currentLang].drug} --</option>`;
    aesData.forEach((row, i) => {
        if(row[0]) {
            let opt = document.createElement('option');
            opt.value = i;
            opt.textContent = row[0];
            select.appendChild(opt);
        }
    });
}

document.getElementById('drugSelect').addEventListener('change', (e) => {
    const row = aesData[e.target.value];
    const targetSelect = document.getElementById('targetDose');
    targetSelect.innerHTML = '';
    if(!row) return;

    for (let i = 1; i < row.length; i += 3) {
        if (row[i+1]) {
            let opt = document.createElement('option');
            opt.value = i; 
            opt.textContent = `${row[i+1]} mg/${currentLang === 'es' ? 'día' : 'day'}`;
            targetSelect.appendChild(opt);
        }
    }
    targetSelect.disabled = false;
    document.getElementById('btnGenerate').disabled = false;
});

function formatDoseText(pauta) {
    const doses = pauta.split('-').map(d => d.trim());
    const t = i18n[currentLang];
    let parts = [];
    if(doses[0] && doses[0] !== '0') parts.push(`${t.morning}: ${doses[0]} mg`);
    if(doses[1] && doses[1] !== '0') parts.push(`${t.midday}: ${doses[1]} mg`);
    if(doses[2] && doses[2] !== '0') parts.push(`${t.night}: ${doses[2]} mg`);
    return parts.join(', ');
}

window.generarPauta = function() {
    const drugRow = aesData[document.getElementById('drugSelect').value];
    const targetIdx = parseInt(document.getElementById('targetDose').value);
    const startDate = new Date(document.getElementById('startDate').value);
    const list = document.getElementById('results-list');
    const t = i18n[currentLang];
    
    list.innerHTML = `<h3 style="font-size: 1.1rem; margin-bottom: 1.5rem;">${drugRow[0]}</h3>`;
    let daysDiff = 0;
    
    for (let i = 1; i <= targetIdx; i += 3) {
        const currentLineDate = new Date(startDate);
        currentLineDate.setDate(startDate.getDate() + daysDiff);
        const dateStr = currentLineDate.toLocaleDateString(currentLang === 'es' ? 'es-ES' : 'en-US', {
            weekday: 'long', day: 'numeric', month: 'long'
        });

        list.innerHTML += `
            <div class="step-card">
                <div class="step-header"><span class="step-date">${t.from} ${dateStr}</span></div>
                <div class="step-doses">${formatDoseText(drugRow[i])}</div>
            </div>`;
        daysDiff += (parseInt(drugRow[i+2]) || 0);
    }
    document.getElementById('results-box').style.display = 'block';
};

window.copiarPauta = function() {
    const t = i18n[currentLang];
    const drugName = aesData[document.getElementById('drugSelect').value][0];
    let txt = `📋 ${drugName.toUpperCase()} (${t.title})\n`;
    
    document.querySelectorAll('.step-card').forEach(card => {
        const date = card.querySelector('.step-date').innerText;
        const doses = card.querySelector('.step-doses').innerText;
        txt += `• ${date}: ${doses}\n`;
    });
    
    navigator.clipboard.writeText(txt).then(() => alert(t.copied));
};
