/**
 * hipnoticosSwitch.js - Motor de Conmutación y Deprescripción de Hipnóticos PSQALDÍA v2.3
 * Basado en: Palagini L, Brugnoli R, Dell'Osso BM, Di Nicola M, Maina G, Martinotti G, et al.
 * Clinical practice guidelines for switching or deprescribing hypnotic medications for chronic insomnia:
 * Results of European neuropsychopharmacology and sleep expert's consensus group.
 * Sleep Medicine. 2025;128:117-126. doi:10.1016/j.sleep.2025.01.025
 */

const CONFIG_HIP = {
    SHEET_NAME: 'Data_Hipnotics',
    // Mapeo según la pestaña Data_Hipnotics (Worker solicita A2:Z500)
    COL_A_KEY: 0,      // Drug_A_Key
    COL_A_ES: 1,       // Farmaco_A_ES
    COL_A_EN: 2,       // Farmaco_A_EN
    COL_B_KEY: 3,      // Drug_B_Key
    COL_B_ES: 4,       // Farmaco_B_ES
    COL_B_EN: 5,       // Farmaco_B_EN
    COL_MODALITY: 6,   // Modality
    COL_CODE: 7,       // Codigo_Algoritmico
    COL_REC_ES: 8,     // Recomendacion_Clinica_ES
    COL_REC_EN: 9      // Clinical_Notes_EN
};

window.currentLangHip = window.currentLangHip || 'es';
window.hipCurrentMode = window.hipCurrentMode || 'SWITCH';
window.dbHipnotics = []; // Origen exclusivo: Google Sheets vía Worker

const i18nHip = {
    es: {
        title: "Switch & Deprescripción de Hipnóticos",
        modeSwitch: "Cambio (Switch)",
        modeTaper: "Retirada (Taper)",
        fromDrug: "Fármaco Actual (Origen)",
        currentDose: "Dosis Actual (mg)",
        toDrug: "Fármaco Objetivo (Destino)",
        melatoninFixedNote: "Melatonina 2 mg PR es dosis terapéutica fija según ficha técnica.",
        btnRun: "GENERAR PAUTA",
        btnCopy: "COPIAR PAUTA PARA HISTORIA",
        copied: "¡Pauta copiada al portapapeles!",
        day: "Día",
        week: "Semana",
        stop: "Suspender",
        initiate: "Iniciar",
        reduce: "Reducir a",
        increase: "Subir a",
        maintain: "Mantener",
        recHeader: "Recomendación clínica del consenso:",
        biblioHeader: "Referencia del consenso:",
        biblioCitation: "Palagini L, Brugnoli R, Dell'Osso BM, Di Nicola M, Maina G, Martinotti G, et al. Clinical practice guidelines for switching or deprescribing hypnotic medications for chronic insomnia: Results of European neuropsychopharmacology and sleep expert's consensus group. Sleep Medicine. 2025;128:117-126. doi:10.1016/j.sleep.2025.01.025",
        loading: "Cargando datos del consenso desde Sheets...",
        errorLoad: "No se pudieron obtener los datos de la hoja Data_Hipnotics."
    },
    en: {
        title: "Hypnotic Switching & Deprescribing",
        modeSwitch: "Switch Medication",
        modeTaper: "Deprescribe (Taper)",
        fromDrug: "Current Hypnotic (Origin)",
        currentDose: "Current Dose (mg)",
        toDrug: "Target Hypnotic (Destination)",
        melatoninFixedNote: "Melatonin 2 mg PR is a fixed dose per European guidelines.",
        btnRun: "GENERATE SCHEDULE",
        btnCopy: "COPY STRATEGY TO CLIPBOARD",
        copied: "Schedule copied to clipboard!",
        day: "Day",
        week: "Week",
        stop: "Discontinue",
        initiate: "Initiate",
        reduce: "Reduce to",
        increase: "Increase to",
        maintain: "Maintain",
        recHeader: "Consensus recommendation:",
        biblioHeader: "Consensus reference:",
        biblioCitation: "Palagini L, Brugnoli R, Dell'Osso BM, Di Nicola M, Maina G, Martinotti G, et al. Clinical practice guidelines for switching or deprescribing hypnotic medications for chronic insomnia: Results of European neuropsychopharmacology and sleep expert's consensus group. Sleep Medicine. 2025;128:117-126. doi:10.1016/j.sleep.2025.01.025",
        loading: "Loading consensus data from Sheets...",
        errorLoad: "Unable to retrieve data from Data_Hipnotics sheet."
    }
};

function getHipContainer() {
    return document.getElementById('modalData') || 
           document.getElementById('hipnoticos-app') || 
           document.getElementById('mainContainer');
}

window.iniciarHipnoticosSwitch = async function() {
    const container = getHipContainer();
    if (!container) return;

    if (!document.getElementById('hip-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'hip-styles';
        styleTag.innerHTML = `
            .hip-ui { 
                padding: 1.25rem; 
                display: flex; 
                flex-direction: column; 
                gap: 0.65rem; 
                font-family: inherit; 
                box-sizing: border-box; 
            }
            .hip-header { 
                display: grid; 
                grid-template-columns: 1fr auto; 
                align-items: center; 
                margin-bottom: 0.25rem; 
                width: 100%; 
                box-sizing: border-box; 
                padding-right: 48px; /* Margen para no solapar botón X del modal */
            }
            .hip-title { 
                margin: 0; 
                font-weight: 800; 
                font-size: 1.2rem; 
                color: #1e3a8a; 
                line-height: 1.25; 
            }
            .hip-lang-toggle { 
                display: flex; 
                background: #e2e8f0; 
                border-radius: 0.65rem; 
                padding: 2px; 
                flex-shrink: 0; 
            }
            .hip-lang-btn { 
                padding: 4px 10px; 
                border-radius: 0.5rem; 
                border: none; 
                cursor: pointer; 
                font-size: 0.72rem; 
                font-weight: 800; 
                color: #64748b; 
                background: transparent; 
                transition: all 0.2s; 
            }
            .hip-lang-btn.active { 
                background: #ffffff; 
                color: #1e3a8a; 
                box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
            }
            .hip-mode-toggle { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                background: #f1f5f9; 
                border-radius: 0.85rem; 
                padding: 3px; 
                margin-top: 0.4rem; 
                gap: 4px; 
            }
            .hip-mode-btn { 
                padding: 0.7rem; 
                border: none; 
                border-radius: 0.7rem; 
                cursor: pointer; 
                font-size: 0.82rem; 
                font-weight: 800; 
                color: #64748b; 
                background: transparent; 
                transition: all 0.2s; 
                text-align: center; 
            }
            .hip-mode-btn.active { 
                background: #ffffff; 
                color: #2563eb; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.05); 
            }
            .hip-field { 
                display: flex; 
                flex-direction: column; 
                margin-top: 0.4rem; 
            }
            .hip-field label { 
                font-size: 0.7rem; 
                font-weight: 800; 
                text-transform: uppercase; 
                color: #64748b; 
                margin-bottom: 0.35rem; 
            }
            .hip-field select, .hip-field input { 
                width: 100%; 
                padding: 0.8rem; 
                border-radius: 0.8rem; 
                border: 2px solid #e2e8f0; 
                font-size: 0.95rem; 
                outline: none; 
                background: #fff; 
                box-sizing: border-box; 
            }
            .hip-field select:focus, .hip-field input:focus { 
                border-color: #3b82f6; 
            }
            .hip-field input:disabled { 
                background: #f8fafc; 
                color: #94a3b8; 
                cursor: not-allowed; 
            }
            .hip-help-text { 
                font-size: 0.68rem; 
                color: #0284c7; 
                margin-top: 4px; 
                font-weight: 600; 
            }
            .btn-ejecutar-hip { 
                margin-top: 0.9rem; 
                padding: 0.95rem; 
                background: #1e3a8a; 
                color: white; 
                border: none; 
                border-radius: 0.9rem; 
                cursor: pointer; 
                font-weight: 900; 
                font-size: 0.95rem; 
                transition: background 0.2s; 
            }
            .btn-ejecutar-hip:hover { background: #172554; }
            .hip-res-container { 
                margin-top: 1.25rem; 
                border-radius: 1rem; 
                display: none; 
                border: 1px solid #e2e8f0; 
                background: #fff; 
                overflow: hidden; 
                box-shadow: 0 4px 10px rgba(0,0,0,0.03); 
            }
            .hip-res-header { 
                background: #f8fafc; 
                border-bottom: 1px solid #e2e8f0; 
                padding: 0.9rem 1.15rem; 
                font-size: 0.82rem; 
                color: #334155; 
                line-height: 1.5; 
            }
            .hip-res-header b { color: #0f172a; }
            .hip-res-body { padding: 1.25rem 1.15rem; }
            .hip-step { 
                display: flex; 
                gap: 0.9rem; 
                margin-bottom: 1.1rem; 
                position: relative; 
            }
            .hip-step:not(:last-child)::after { 
                content: ''; 
                position: absolute; 
                left: 17px; 
                top: 36px; 
                bottom: -14px; 
                width: 2px; 
                background: #f1f5f9; 
            }
            .hip-step-idx { 
                min-width: 36px; 
                height: 36px; 
                background: white; 
                border: 2px solid #e2e8f0; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-weight: 900; 
                font-size: 0.72rem; 
                color: #1e3a8a; 
                z-index: 1; 
                flex-shrink: 0; 
            }
            .hip-step-content { 
                flex-grow: 1; 
                display: flex; 
                flex-direction: column; 
                gap: 6px; 
                justify-content: center; 
            }
            .hip-tag { 
                font-weight: 800; 
                font-size: 0.65rem; 
                text-transform: uppercase; 
                padding: 2px 7px; 
                border-radius: 5px; 
                display: inline-block; 
                margin-right: 6px; 
                vertical-align: middle; 
            }
            .hip-tag-orig { background: #fee2e2; color: #b91c1c; }
            .hip-tag-dest { background: #dcfce7; color: #15803d; }
            .hip-dose-txt { font-size: 0.9rem; color: #1e293b; vertical-align: middle; }
            .hip-biblio-box { 
                font-size: 0.72rem; 
                color: #475569; 
                padding: 0.85rem 1.15rem; 
                background: #f8fafc; 
                border-top: 1px solid #e2e8f0; 
                line-height: 1.45; 
            }
            .hip-biblio-box b { color: #0f172a; }
            .btn-copiar-hip { 
                margin-top: 0.6rem; 
                width: 100%; 
                padding: 0.85rem; 
                background: #f1f5f9; 
                border-radius: 0.8rem; 
                border: 1px solid #e2e8f0; 
                cursor: pointer; 
                font-weight: 800; 
                font-size: 0.78rem; 
                color: #475569; 
                transition: all 0.2s; 
            }
            .btn-copiar-hip:hover { background: #e2e8f0; color: #0f172a; }
            .hip-loading-box { 
                text-align: center; 
                padding: 2.5rem 1rem; 
                color: #64748b; 
                font-size: 0.85rem; 
                font-weight: 600; 
            }
        `;
        document.head.appendChild(styleTag);
    }

    const t = i18nHip[window.currentLangHip];
    container.innerHTML = `<div class="hip-loading-box">${t.loading}</div>`;

    try {
        const apiBase = window.location.origin.includes('psqaldia.com') ? '' : 'https://psqaldia.com';
        const response = await fetch(`${apiBase}/?sheet=${CONFIG_HIP.SHEET_NAME}`);
        
        if (!response.ok) throw new Error("Error HTTP " + response.status);
        const data = await response.json();
        const rawRows = (data && data.values) ? data.values : [];

        // Mapeo seguro celda por celda frente a celdas vacías (undefined)
        window.dbHipnotics = rawRows
            .filter(r => r && r[CONFIG_HIP.COL_A_KEY] && r[CONFIG_HIP.COL_A_KEY].toString().trim().toLowerCase() !== 'drug_a_key')
            .map(r => {
                const getCol = idx => (r[idx] !== undefined && r[idx] !== null) ? r[idx].toString().trim() : '';
                return {
                    aKey: getCol(CONFIG_HIP.COL_A_KEY),
                    aES: getCol(CONFIG_HIP.COL_A_ES) || getCol(CONFIG_HIP.COL_A_KEY),
                    aEN: getCol(CONFIG_HIP.COL_A_EN) || getCol(CONFIG_HIP.COL_A_ES) || getCol(CONFIG_HIP.COL_A_KEY),
                    bKey: getCol(CONFIG_HIP.COL_B_KEY),
                    bES: getCol(CONFIG_HIP.COL_B_ES) || getCol(CONFIG_HIP.COL_B_KEY),
                    bEN: getCol(CONFIG_HIP.COL_B_EN) || getCol(CONFIG_HIP.COL_B_ES) || getCol(CONFIG_HIP.COL_B_KEY),
                    modality: getCol(CONFIG_HIP.COL_MODALITY),
                    code: getCol(CONFIG_HIP.COL_CODE),
                    recES: getCol(CONFIG_HIP.COL_REC_ES),
                    recEN: getCol(CONFIG_HIP.COL_REC_EN) || getCol(CONFIG_HIP.COL_REC_ES)
                };
            })
            .filter(item => item.aKey && item.code);

        renderInterfazHip();
    } catch (e) {
        console.error("Error al cargar datos desde Sheets:", e);
        container.innerHTML = `<div class="hip-loading-box" style="color:#b91c1c;">${t.errorLoad}</div>`;
    }
};

window.setLanguageHip = function(lang) {
    window.currentLangHip = lang;
    const curA = document.getElementById('hip_a_select')?.value;
    const curB = document.getElementById('hip_b_select')?.value;
    renderInterfazHip(curA, curB);
    if (document.getElementById('hip-res-box')?.style.display === 'block') {
        ejecutarHipnoticosSwitch();
    }
};

window.setModeHip = function(mode) {
    window.hipCurrentMode = mode;
    const curA = document.getElementById('hip_a_select')?.value;
    renderInterfazHip(curA);
    if (document.getElementById('hip-res-box')?.style.display === 'block') {
        ejecutarHipnoticosSwitch();
    }
};

function renderInterfazHip(prevSelectedA, prevSelectedB) {
    const t = i18nHip[window.currentLangHip];
    const isES = window.currentLangHip === 'es';
    const container = getHipContainer();
    if (!container) return;

    // Extracción de lista única de fármaco origen según la modalidad activa
    const drugAMap = new Map();
    window.dbHipnotics.forEach(row => {
        if (window.hipCurrentMode === 'TAPER') {
            if (row.bKey === 'NONE' && !drugAMap.has(row.aKey)) {
                drugAMap.set(row.aKey, isES ? row.aES : row.aEN);
            }
        } else {
            if (row.bKey !== 'NONE' && !drugAMap.has(row.aKey)) {
                drugAMap.set(row.aKey, isES ? row.aES : row.aEN);
            }
        }
    });

    const optDrugA = Array.from(drugAMap.entries())
        .map(([key, label]) => `<option value="${key}">${label}</option>`)
        .join('');

    container.innerHTML = `
        <div class="hip-ui">
            <div class="hip-header">
                <h2 class="hip-title">${t.title}</h2>
                <div class="hip-lang-toggle">
                    <button type="button" class="hip-lang-btn ${isES ? 'active' : ''}" onclick="setLanguageHip('es')">ES</button>
                    <button type="button" class="hip-lang-btn ${!isES ? 'active' : ''}" onclick="setLanguageHip('en')">EN</button>
                </div>
            </div>

            <div class="hip-mode-toggle">
                <button type="button" class="hip-mode-btn ${window.hipCurrentMode === 'SWITCH' ? 'active' : ''}" onclick="setModeHip('SWITCH')">${t.modeSwitch}</button>
                <button type="button" class="hip-mode-btn ${window.hipCurrentMode === 'TAPER' ? 'active' : ''}" onclick="setModeHip('TAPER')">${t.modeTaper}</button>
            </div>

            <div class="hip-field">
                <label for="hip_a_select">${t.fromDrug}</label>
                <select id="hip_a_select" onchange="onDrugAChanged()">${optDrugA}</select>
            </div>

            <div class="hip-field">
                <label for="hip_a_dose">${t.currentDose}</label>
                <input type="number" id="hip_a_dose" value="10" min="0.1" step="any">
                <div id="hip_melatonin_note" class="hip-help-text" style="display:none;">${t.melatoninFixedNote}</div>
            </div>

            <div class="hip-field" id="hip_dest_container" style="${window.hipCurrentMode === 'TAPER' ? 'display:none;' : ''}">
                <label for="hip_b_select">${t.toDrug}</label>
                <select id="hip_b_select"></select>
            </div>

            <button type="button" class="btn-ejecutar-hip" onclick="ejecutarHipnoticosSwitch()">${t.btnRun}</button>

            <div id="hip-res-box" class="hip-res-container">
                <div id="hip-res-header" class="hip-res-header"></div>
                <div id="hip-res-pauta" class="hip-res-body"></div>
                <div class="hip-biblio-box">
                    <b>${t.biblioHeader}</b><br>
                    ${t.biblioCitation}
                </div>
            </div>
        </div>
    `;

    // Preservar selección previa si existe
    const aSelect = document.getElementById('hip_a_select');
    if (prevSelectedA && Array.from(aSelect.options).some(o => o.value === prevSelectedA)) {
        aSelect.value = prevSelectedA;
    }

    onDrugAChanged(prevSelectedB);
}

window.onDrugAChanged = function(prevSelectedB) {
    const aSelect = document.getElementById('hip_a_select');
    if (!aSelect || !aSelect.value) return;

    const aKey = aSelect.value;
    const doseInput = document.getElementById('hip_a_dose');
    const note = document.getElementById('hip_melatonin_note');
    const bSelect = document.getElementById('hip_b_select');
    const isES = window.currentLangHip === 'es';

    // Regla fija clínica: Melatonina 2 mg PR
    if (aKey === 'MELATONIN_PR') {
        doseInput.value = 2;
        doseInput.disabled = true;
        note.style.display = 'block';
    } else {
        doseInput.disabled = false;
        note.style.display = 'none';
        if (doseInput.value === '2') doseInput.value = '10';
    }

    if (window.hipCurrentMode === 'SWITCH') {
        const validRows = window.dbHipnotics.filter(r => r.aKey === aKey && r.bKey !== 'NONE');
        bSelect.innerHTML = validRows.map(r => `<option value="${r.bKey}">${isES ? r.bES : r.bEN}</option>`).join('');

        if (prevSelectedB && Array.from(bSelect.options).some(o => o.value === prevSelectedB)) {
            bSelect.value = prevSelectedB;
        }
    }
};

window.ejecutarHipnoticosSwitch = function() {
    const aSelect = document.getElementById('hip_a_select');
    if (!aSelect || !aSelect.value) return;

    const aKey = aSelect.value;
    const aDose = parseFloat(document.getElementById('hip_a_dose').value) || 0;
    const isTaper = window.hipCurrentMode === 'TAPER';
    const bKey = isTaper ? 'NONE' : document.getElementById('hip_b_select').value;
    const isES = window.currentLangHip === 'es';
    const t = i18nHip[window.currentLangHip];

    const matchRow = window.dbHipnotics.find(r => r.aKey === aKey && r.bKey === bKey);
    if (!matchRow) return;

    const recText = (isES ? matchRow.recES : matchRow.recEN) || matchRow.recES;
    const drugAName = (isES ? matchRow.aES : matchRow.aEN) || matchRow.aKey;
    const drugBName = (isES ? matchRow.bES : matchRow.bEN) || matchRow.bKey;

    document.getElementById('hip-res-header').innerHTML = `<b>${t.recHeader}</b> ${recText}`;

    const schedule = parseHipDSL(matchRow.code, aDose, drugAName, drugBName);
    renderPautaHip(schedule);
};

function parseHipDSL(code, aDose, nameA, nameB) {
    const t = i18nHip[window.currentLangHip];
    const steps = [];

    const parts = (code || '').split('|').map(s => s.trim());
    const typePart = parts[0]?.replace('TYPE:', '').trim();

    // Suspensión directa limpia (sin mensajes redundantes)
    if (typePart === 'ABRUPT') {
        steps.push({
            label: `${t.day} 1`,
            items: [{ name: nameA, tag: 'hip-tag-orig', text: `<b>${t.stop}</b>` }]
        });
        return steps;
    }

    // Switch directo limpio (sin mensajes de "al día siguiente...")
    if (typePart === 'DIRECT') {
        steps.push({
            label: `${t.day} 1`,
            items: [
                { name: nameA, tag: 'hip-tag-orig', text: `<b>${t.stop}</b>` },
                { name: nameB, tag: 'hip-tag-dest', text: `<b>${t.initiate}</b>` }
            ]
        });
        return steps;
    }

    // Modalidades escalonadas semanales: CROSS o TAPER
    const aMap = parseTokensToMap(parts.find(p => p.startsWith('A:'))?.replace('A:', ''));
    const bMap = parseTokensToMap(parts.find(p => p.startsWith('B:'))?.replace('B:', ''));

    const allWeeks = ['W1', 'W2', 'W3', 'W4'];
    allWeeks.forEach((wk, idx) => {
        const weekNum = idx + 1;
        const weekLabel = `${t.week} ${weekNum}`;
        const items = [];

        // Fármaco A (Origen)
        if (aMap[wk] !== undefined) {
            const tokenA = aMap[wk];
            if (tokenA.endsWith('%')) {
                const pct = parseFloat(tokenA) / 100;
                const calcDose = +(aDose * pct).toFixed(2);
                if (calcDose === 0) {
                    items.push({ name: nameA, tag: 'hip-tag-orig', text: `<b>${t.stop}</b> (0 mg)` });
                } else {
                    items.push({ name: nameA, tag: 'hip-tag-orig', text: `${t.reduce} <b>${calcDose} mg</b> (${tokenA})` });
                }
            } else if (tokenA.endsWith('mg')) {
                const mg = parseFloat(tokenA);
                if (mg === 0) {
                    items.push({ name: nameA, tag: 'hip-tag-orig', text: `<b>${t.stop}</b>` });
                } else {
                    items.push({ name: nameA, tag: 'hip-tag-orig', text: `${t.initiate} <b>${mg} mg</b>` });
                }
            }
        }

        // Fármaco B (Destino en Cross-Taper)
        if (bMap && bMap[wk] !== undefined) {
            const tokenB = bMap[wk];
            const mgB = parseFloat(tokenB);
            let action = t.initiate;
            if (idx === 0) action = t.initiate;
            else if (mgB > parseFloat(bMap[`W${idx}`] || 0)) action = t.increase;
            else action = t.maintain;

            items.push({ name: nameB, tag: 'hip-tag-dest', text: `${action} <b>${tokenB}</b>` });
        }

        if (items.length > 0) {
            steps.push({ label: weekLabel, items });
        }
    });

    return steps;
}

function parseTokensToMap(tokenStr) {
    if (!tokenStr) return {};
    const map = {};
    const matches = [...tokenStr.matchAll(/(W\d+|D\d+)\(([^)]+)\)/g)];
    matches.forEach(m => { map[m[1]] = m[2]; });
    return map;
}

function renderPautaHip(steps) {
    const t = i18nHip[window.currentLangHip];
    let html = '';

    steps.forEach(step => {
        let itemsHtml = step.items.map(it => `
            <div>
                <span class="hip-tag ${it.tag}">${it.name}</span>
                <span class="hip-dose-txt">${it.text}</span>
            </div>
        `).join('');

        html += `
            <div class="hip-step">
                <div class="hip-step-idx">${step.label}</div>
                <div class="hip-step-content">${itemsHtml}</div>
            </div>
        `;
    });

    html += `<button type="button" class="btn-copiar-hip" onclick="copiarEstrategiaHip()">${t.btnCopy}</button>`;

    const box = document.getElementById('hip-res-box');
    box.style.display = 'block';
    document.getElementById('hip-res-pauta').innerHTML = html;
}

window.copiarEstrategiaHip = function() {
    const t = i18nHip[window.currentLangHip];
    let txt = `PSQALDÍA - SWITCH & DEPRESCIPCIÓN DE HIPNÓTICOS\n`;
    txt += `${t.biblioCitation}\n`;
    txt += `--------------------------------------------------\n`;
    txt += `${document.getElementById('hip-res-header').innerText}\n\n`;

    document.querySelectorAll('.hip-step').forEach(step => {
        const timeLabel = step.querySelector('.hip-step-idx').innerText;
        txt += `[${timeLabel}]\n`;
        step.querySelectorAll('.hip-step-content > div').forEach(line => {
            const tag = line.querySelector('.hip-tag').innerText;
            const text = line.querySelector('.hip-dose-txt').innerText;
            txt += `  • ${tag}: ${text}\n`;
        });
    });

    navigator.clipboard.writeText(txt).then(() => {
        alert(t.copied);
    }).catch(() => {
        const temp = document.createElement("textarea");
        temp.value = txt;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
        alert(t.copied);
    });
};

// Carga directa si se abre como archivo .html independiente en ordenador
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!document.getElementById('modalData')) window.iniciarHipnoticosSwitch();
    });
} else {
    if (!document.getElementById('modalData')) window.iniciarHipnoticosSwitch();
}
