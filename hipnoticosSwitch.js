/**
 * hipnoticosSwitch.js - Motor de Conmutación y Deprescripción de Hipnóticos PSQALDÍA v1.0
 * Basado en el Consenso Europeo: Palagini et al., Sleep Medicine 128 (2025) 117-126
 * Características:
 *  - Soporte bilingüe dinámico (ES / EN)
 *  - Modalidades: Cross-Taper, Switch Directo y Deprescripción Pura (Taper)
 *  - Restricción de Melatonina a 2 mg PR fija
 *  - Generador de calendario semanal/diario con timeline
 *  - Botón de copiado estructurado para historia clínica
 */

const CONFIG_HIP = {
    SHEET_NAME: 'Data_Hipnotics',
    // Mapeo de columnas del Sheet Data_Hipnotics
    COL_A_KEY: 0,
    COL_A_ES: 1,
    COL_A_EN: 2,
    COL_B_KEY: 3,
    COL_B_ES: 4,
    COL_B_EN: 5,
    COL_MODALITY: 6,
    COL_CODE: 7,
    COL_REC_ES: 8,
    COL_REC_EN: 9
};

window.currentLangHip = 'es';

const i18nHip = {
    es: {
        title: "Switch & Deprescripción de Hipnóticos",
        subtitle: "Basado en el consenso europeo de hipnóticos (Palagini et al., 2025)",
        modeSwitch: "Cambio (Switch)",
        modeTaper: "Retirada pura (Taper)",
        fromDrug: "Fármaco Actual (Origen)",
        currentDose: "Dosis Actual (mg)",
        toDrug: "Fármaco Objetivo (Destino)",
        melatoninFixedNote: "Melatonina 2 mg PR es dosis fija de ficha técnica.",
        btnRun: "GENERAR CALENDARIO",
        btnCopy: "COPIAR PAUTA PARA HISTORIA",
        copied: "¡Pauta copiada al portapapeles!",
        day: "Día",
        week: "Semana",
        stop: "Suspender",
        take: "Tomar",
        reduce: "Reducir a",
        increase: "Subir a",
        maintain: "Mantener",
        directSwitchNotice: "Cambio directo: suspender Fármaco A e iniciar Fármaco B al día siguiente a dosis terapéutica.",
        abruptStopNotice: "Suspensión directa: fármaco sin riesgo demostrado de abstinencia ni insomnio de rebote.",
        recHeader: "Recomendación clínica:",
        disclaimer: "Basado en Palagini et al. Sleep Medicine (2025). Esta propuesta clínica algorítmica debe adaptarse y supervisarse según el criterio médico y la respuesta individual del paciente."
    },
    en: {
        title: "Hypnotic Switching & Deprescribing",
        subtitle: "Based on European Expert Consensus (Palagini et al., 2025)",
        modeSwitch: "Switch Medication",
        modeTaper: "Deprescribe (Taper only)",
        fromDrug: "Current Hypnotic (Origin)",
        currentDose: "Current Dose (mg)",
        toDrug: "Target Hypnotic (Destination)",
        melatoninFixedNote: "Melatonin 2 mg PR is fixed per European guidelines.",
        btnRun: "GENERATE SCHEDULE",
        btnCopy: "COPY STRATEGY TO CLIPBOARD",
        copied: "Schedule copied to clipboard!",
        day: "Day",
        week: "Week",
        stop: "Discontinue",
        take: "Take",
        reduce: "Reduce to",
        increase: "Increase to",
        maintain: "Maintain",
        directSwitchNotice: "Direct switch: discontinue Drug A and initiate Drug B the following night at therapeutic dose.",
        abruptStopNotice: "Abrupt discontinuation: no documented risk of withdrawal syndrome or rebound insomnia.",
        recHeader: "Clinical recommendation:",
        disclaimer: "Based on Palagini et al. Sleep Medicine (2025). This algorithm proposal must be adapted and supervised according to clinical judgment and individual patient response."
    }
};

window.iniciarHipnoticosSwitch = async function() {
    const container = document.getElementById('modalData');
    if (!container) return;

    if (!document.getElementById('hip-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'hip-styles';
        styleTag.innerHTML = `
            .hip-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.6rem; font-family: inherit; }
            .hip-header { display: grid; grid-template-columns: 1fr auto; align-items: center; margin-bottom: 0.5rem; width: 100%; }
            .hip-title { margin: 0; font-weight: 800; font-size: 1.25rem; color: #1e3a8a; }
            .hip-subtitle { font-size: 0.75rem; color: #64748b; margin-top: 2px; }
            
            .hip-lang-toggle { display: flex; background: #e2e8f0; border-radius: 0.8rem; padding: 2px; }
            .hip-lang-btn { padding: 4px 12px; border-radius: 0.6rem; border: none; cursor: pointer; font-size: 0.7rem; font-weight: 800; color: #64748b; background: transparent; transition: all 0.2s; }
            .hip-lang-btn.active { background: white; color: #1e3a8a; box-shadow: 0 2px 4px rgba(0,0,0,0.08); }

            .hip-mode-toggle { display: grid; grid-template-columns: 1fr 1fr; background: #f1f5f9; border-radius: 1rem; padding: 4px; margin-top: 0.8rem; gap: 4px; }
            .hip-mode-btn { padding: 0.75rem; border: none; border-radius: 0.8rem; cursor: pointer; font-size: 0.85rem; font-weight: 800; color: #64748b; background: transparent; transition: all 0.2s; text-align: center; }
            .hip-mode-btn.active { background: white; color: #2563eb; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }

            .hip-field { display: flex; flex-direction: column; margin-top: 0.5rem; }
            .hip-field label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 0.35rem; }
            .hip-field select, .hip-field input { width: 100%; padding: 0.85rem; border-radius: 0.9rem; border: 2px solid #e2e8f0; font-size: 0.95rem; outline: none; background: #fff; box-sizing: border-box; }
            .hip-field select:focus, .hip-field input:focus { border-color: #3b82f6; }
            .hip-field input:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
            .hip-help-text { font-size: 0.68rem; color: #0284c7; margin-top: 4px; font-weight: 600; }

            .btn-ejecutar-hip { margin-top: 1.2rem; padding: 1rem; background: #1e3a8a; color: white; border: none; border-radius: 1rem; cursor: pointer; font-weight: 900; font-size: 1rem; transition: background 0.2s; }
            .btn-ejecutar-hip:hover { background: #172554; }

            .hip-res-container { margin-top: 1.5rem; border-radius: 1.25rem; display: none; border: 1px solid #e2e8f0; background: #fff; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.03); }
            .hip-res-header { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 1rem 1.25rem; font-size: 0.8rem; color: #334155; line-height: 1.5; }
            .hip-res-header b { color: #0f172a; }
            .hip-res-body { padding: 1.5rem; }

            .hip-step { display: flex; gap: 1rem; margin-bottom: 1.2rem; position: relative; }
            .hip-step:not(:last-child)::after { content: ''; position: absolute; left: 19px; top: 38px; bottom: -15px; width: 2px; background: #f1f5f9; }
            .hip-step-idx { min-width: 40px; height: 40px; background: white; border: 2px solid #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.75rem; color: #1e3a8a; z-index: 1; flex-shrink: 0; }
            .hip-step-content { flex-grow: 1; display: flex; flex-direction: column; gap: 4px; }
            
            .hip-tag { font-weight: 800; font-size: 0.65rem; text-transform: uppercase; padding: 2px 8px; border-radius: 6px; display: inline-block; width: fit-content; }
            .hip-tag-orig { background: #fee2e2; color: #b91c1c; }
            .hip-tag-dest { background: #dcfce7; color: #15803d; }
            .hip-dose-txt { font-size: 0.95rem; color: #1e293b; }

            .hip-disclaimer { font-size: 0.7rem; color: #64748b; padding: 1rem 1.25rem; border-top: 1px solid #f1f5f9; background: #fafafa; font-style: italic; line-height: 1.45; text-align: justify; }
            .btn-copiar-hip { margin-top: 1rem; width: 100%; padding: 0.9rem; background: #f1f5f9; border-radius: 0.85rem; border: 1px solid #e2e8f0; cursor: pointer; font-weight: 800; font-size: 0.8rem; color: #475569; transition: all 0.2s; }
            .btn-copiar-hip:hover { background: #e2e8f0; color: #0f172a; }
        `;
        document.head.appendChild(styleTag);
    }

    try {
        const response = await fetch(`/?sheet=${CONFIG_HIP.SHEET_NAME}`);
        const data = await response.json();
        
        // Saltamos la fila 0 (encabezados) para evitar leer cabeceras como datos
        const rawRows = (data.values || []).slice(1);

        window.dbHipnotics = rawRows.map(r => ({
            aKey: r[CONFIG_HIP.COL_A_KEY]?.toString().trim(),
            aES: r[CONFIG_HIP.COL_A_ES]?.toString().trim(),
            aEN: r[CONFIG_HIP.COL_A_EN]?.toString().trim(),
            bKey: r[CONFIG_HIP.COL_B_KEY]?.toString().trim(),
            bES: r[CONFIG_HIP.COL_B_ES]?.toString().trim(),
            bEN: r[CONFIG_HIP.COL_B_EN]?.toString().trim(),
            modality: r[CONFIG_HIP.COL_MODALITY]?.toString().trim(),
            code: r[CONFIG_HIP.COL_CODE]?.toString().trim(),
            recES: r[CONFIG_HIP.COL_REC_ES]?.toString().trim(),
            recEN: r[CONFIG_HIP.COL_REC_EN]?.toString().trim()
        })).filter(item => item.aKey && item.code);

        window.hipCurrentMode = 'SWITCH'; // 'SWITCH' o 'TAPER'
        renderInterfazHip();
    } catch (e) {
        console.error("Error al cargar datos de Data_Hipnotics:", e);
    }
};

window.setLanguageHip = function(lang) {
    window.currentLangHip = lang;
    renderInterfazHip();
    if (document.getElementById('hip-res-box') && document.getElementById('hip-res-box').style.display === 'block') {
        ejecutarHipnoticosSwitch();
    }
};

window.setModeHip = function(mode) {
    window.hipCurrentMode = mode;
    renderInterfazHip();
};

function renderInterfazHip() {
    const t = i18nHip[window.currentLangHip];
    const isES = window.currentLangHip === 'es';
    const container = document.getElementById('modalData');

    // Extraer lista única de Fármaco A
    const drugAMap = new Map();
    window.dbHipnotics.forEach(row => {
        if (!drugAMap.has(row.aKey)) {
            drugAMap.set(row.aKey, isES ? row.aES : row.aEN);
        }
    });

    const optDrugA = Array.from(drugAMap.entries())
        .map(([key, label]) => `<option value="${key}">${label}</option>`)
        .join('');

    container.innerHTML = `
        <div class="hip-ui">
            <div class="hip-header">
                <div>
                    <h2 class="hip-title">${t.title}</h2>
                    <div class="hip-subtitle">${t.subtitle}</div>
                </div>
                <div class="hip-lang-toggle">
                    <button class="hip-lang-btn ${isES ? 'active' : ''}" onclick="setLanguageHip('es')">ES</button>
                    <button class="hip-lang-btn ${!isES ? 'active' : ''}" onclick="setLanguageHip('en')">EN</button>
                </div>
            </div>

            <div class="hip-mode-toggle">
                <button class="hip-mode-btn ${window.hipCurrentMode === 'SWITCH' ? 'active' : ''}" onclick="setModeHip('SWITCH')">${t.modeSwitch}</button>
                <button class="hip-mode-btn ${window.hipCurrentMode === 'TAPER' ? 'active' : ''}" onclick="setModeHip('TAPER')">${t.modeTaper}</button>
            </div>

            <div class="hip-field">
                <label>${t.fromDrug}</label>
                <select id="hip_a_select" onchange="onDrugAChanged()">${optDrugA}</select>
            </div>

            <div class="hip-field">
                <label>${t.currentDose}</label>
                <input type="number" id="hip_a_dose" value="10" min="0.1" step="any">
                <div id="hip_melatonin_note" class="hip-help-text" style="display:none;">${t.melatoninFixedNote}</div>
            </div>

            <div class="hip-field" id="hip_dest_container" style="${window.hipCurrentMode === 'TAPER' ? 'display:none;' : ''}">
                <label>${t.toDrug}</label>
                <select id="hip_b_select"></select>
            </div>

            <button class="btn-ejecutar-hip" onclick="ejecutarHipnoticosSwitch()">${t.btnRun}</button>

            <div id="hip-res-box" class="hip-res-container">
                <div id="hip-res-header" class="hip-res-header"></div>
                <div id="hip-res-pauta" class="hip-res-body"></div>
                <div class="hip-disclaimer">${t.disclaimer}</div>
            </div>
        </div>
    `;

    onDrugAChanged();
}

window.onDrugAChanged = function() {
    const aKey = document.getElementById('hip_a_select').value;
    const doseInput = document.getElementById('hip_a_dose');
    const note = document.getElementById('hip_melatonin_note');
    const bSelect = document.getElementById('hip_b_select');
    const isES = window.currentLangHip === 'es';

    // Regla de Melatonina: dosis fija en 2 mg
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
        // Filtrar Fármaco B permitidos en el consenso según Fármaco A
        const validRows = window.dbHipnotics.filter(r => r.aKey === aKey && r.bKey !== 'NONE');
        bSelect.innerHTML = validRows.map(r => `<option value="${r.bKey}">${isES ? r.bES : r.bEN}</option>`).join('');
    }
};

window.ejecutarHipnoticosSwitch = function() {
    const aKey = document.getElementById('hip_a_select').value;
    const aDose = parseFloat(document.getElementById('hip_a_dose').value) || 0;
    const isTaper = window.hipCurrentMode === 'TAPER';
    const bKey = isTaper ? 'NONE' : document.getElementById('hip_b_select').value;
    const isES = window.currentLangHip === 'es';
    const t = i18nHip[window.currentLangHip];

    const matchRow = window.dbHipnotics.find(r => r.aKey === aKey && r.bKey === bKey);
    if (!matchRow) return;

    // Mostrar cabecera con recomendación de la guía
    const recText = isES ? matchRow.recES : matchRow.recEN;
    const drugAName = isES ? matchRow.aES : matchRow.aEN;
    const drugBName = isES ? matchRow.bES : matchRow.bEN;

    document.getElementById('hip-res-header').innerHTML = `<b>${t.recHeader}</b> ${recText}`;

    // Parsear el DSL
    const schedule = parseHipDSL(matchRow.code, aDose, drugAName, drugBName);
    renderPautaHip(schedule);
};

function parseHipDSL(code, aDose, nameA, nameB) {
    const isES = window.currentLangHip === 'es';
    const t = i18nHip[window.currentLangHip];
    const steps = [];

    // Sintaxis: TYPE:CROSS | A:W1(75%),W2(50%),W3(25%),W4(0%) | B:W1(25mg),W2(25mg),W3(50mg),W4(50mg)
    const parts = code.split('|').map(s => s.trim());
    const typePart = parts[0]?.replace('TYPE:', '').trim();

    if (typePart === 'ABRUPT') {
        steps.push({
            label: `${t.day} 1`,
            items: [{ name: nameA, tag: 'hip-tag-orig', text: `${t.stop} (${t.abruptStopNotice})` }]
        });
        return steps;
    }

    if (typePart === 'DIRECT') {
        steps.push({
            label: `${t.day} 1`,
            items: [
                { name: nameA, tag: 'hip-tag-orig', text: `${t.stop}` },
                { name: nameB, tag: 'hip-tag-dest', text: `${t.take} (${t.directSwitchNotice})` }
            ]
        });
        return steps;
    }

    // TYPE: CROSS o TAPER por semanas
    const aMap = parseTokensToMap(parts.find(p => p.startsWith('A:'))?.replace('A:', ''));
    const bMap = parseTokensToMap(parts.find(p => p.startsWith('B:'))?.replace('B:', ''));

    const allWeeks = ['W1', 'W2', 'W3', 'W4'];
    allWeeks.forEach((wk, idx) => {
        const weekNum = idx + 1;
        const weekLabel = `${t.week} ${weekNum}`;
        const items = [];

        // Fármaco A
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
                    items.push({ name: nameA, tag: 'hip-tag-orig', text: `${t.take} <b>${mg} mg</b>` });
                }
            }
        }

        // Fármaco B (si existe en Cross-taper)
        if (bMap && bMap[wk] !== undefined) {
            const tokenB = bMap[wk];
            const mgB = parseFloat(tokenB);
            let action = t.take;
            if (idx === 0) action = t.take;
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
    // Regex para capturar W1(75%) o D1(0%)
    const matches = [...tokenStr.matchAll(/(W\d+|D\d+)\(([^)]+)\)/g)];
    matches.forEach(m => {
        map[m[1]] = m[2];
    });
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

    html += `<button class="btn-copiar-hip" onclick="copiarEstrategiaHip()">${t.btnCopy}</button>`;

    const box = document.getElementById('hip-res-box');
    box.style.display = 'block';
    document.getElementById('hip-res-pauta').innerHTML = html;
}

window.copiarEstrategiaHip = function() {
    const t = i18nHip[window.currentLangHip];
    let txt = `PSQALDÍA - SWITCH & DEPRESCIPCIÓN DE HIPNÓTICOS (Palagini 2025)\n`;
    txt += `${document.getElementById('hip-res-header').innerText}\n\n`;

    document.querySelectorAll('.hip-step').forEach(step => {
        const timeLabel = step.querySelector('.hip-step-idx').innerText;
        txt += `[${timeLabel}]\n`;
        step.querySelectorAll('.hip-step-content > div').forEach(line => {
            const tag = line.querySelector('.hip-tag').innerText;
            const text = line.querySelector('.hip-dose-txt').innerText;
            txt += `  - ${tag}: ${text}\n`;
        });
    });

    navigator.clipboard.writeText(txt);
    alert(t.copied);
};
