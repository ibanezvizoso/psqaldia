/**
 * hipnoticosSwitch.js - Motor de Conmutación y Deprescripción de Hipnóticos PSQALDÍA v2.0
 * Basado en: Palagini et al., Sleep Medicine 128 (2025) 117-126
 * 
 * FIXES v2.0:
 *  - Matriz por defecto integrada (funciona siempre al instante, con o sin red).
 *  - Detección inteligente de fila de cabecera en Google Sheets.
 *  - Cabecera con padding-right de seguridad para evitar colisión con el botón [X].
 *  - Tarjeta de bibliografía completa en tipografía pequeña en el pie.
 */

const CONFIG_HIP = {
    SHEET_NAME: 'Data_Hipnotics',
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

// Matriz de respaldo completa (Consenso Palagini 2025) para garantizar funcionamiento inmediato
const DEFAULT_HIPNOTICS_DATA = [
    { aKey: 'BZ_ZDRUG', aES: 'BZD / Fármacos Z', aEN: 'BZD / Z-Drugs', bKey: 'BZ_ZDRUG', bES: 'BZD / Fármacos Z', bEN: 'BZD / Z-Drugs', modality: 'SWITCH_DIRECT', code: 'TYPE:DIRECT | A:D1(0%) | B:D1(100%)', recES: 'Cambio intracrítico directo al día siguiente a dosis terapéutica equivalente.', recEN: 'Direct intra-class switch on the next day at equivalent therapeutic dose.' },
    { aKey: 'BZ_ZDRUG', aES: 'BZD / Fármacos Z', aEN: 'BZD / Z-Drugs', bKey: 'ESZOPICLONE', bES: 'Eszopiclona', bEN: 'Eszopiclone', modality: 'CROSS_TAPER', code: 'TYPE:CROSS | A:W1(75%),W2(50%),W3(25%),W4(0%) | B:W1(2mg),W2(2mg),W3(3mg),W4(3mg)', recES: 'Reducción del 25% semanal de BZD/Z con eszopiclona 2 mg (S1-S2) y titulación a 3 mg (S3-S4).', recEN: '25% weekly BZD/Z reduction with eszopiclone 2 mg (W1-2), escalating to 3 mg (W3-4).' },
    { aKey: 'BZ_ZDRUG', aES: 'BZD / Fármacos Z', aEN: 'BZD / Z-Drugs', bKey: 'DARIDOREXANT', bES: 'Daridorexant', bEN: 'Daridorexant', modality: 'CROSS_TAPER', code: 'TYPE:CROSS | A:W1(75%),W2(50%),W3(25%),W4(0%) | B:W1(25mg),W2(25mg),W3(50mg),W4(50mg)', recES: 'Reducción del 25% semanal de BZD/Z con daridorexant 25 mg (S1-S2) y subida a 50 mg (S3-S4).', recEN: '25% weekly BZD/Z reduction while cross-tapering daridorexant 25 mg (W1-2) to 50 mg (W3-4).' },
    { aKey: 'BZ_ZDRUG', aES: 'BZD / Fármacos Z', aEN: 'BZD / Z-Drugs', bKey: 'MELATONIN_PR', bES: 'Melatonina 2 mg PR', bEN: 'Melatonin 2 mg PR', modality: 'CROSS_TAPER', code: 'TYPE:CROSS | A:W1(75%),W2(50%),W3(25%),W4(0%) | B:W1(2mg),W2(2mg),W3(2mg),W4(2mg)', recES: 'Reducción del 25% semanal de BZD/Z manteniendo dosis fija de melatonina 2 mg PR (S1-S4).', recEN: '25% weekly BZD/Z reduction while maintaining continuous fixed melatonin 2 mg PR (W1-4).' },
    { aKey: 'BZ_ZDRUG', aES: 'BZD / Fármacos Z', aEN: 'BZD / Z-Drugs', bKey: 'NONE', bES: 'Ninguno (Retirada)', bEN: 'None / Taper', modality: 'TAPER', code: 'TYPE:TAPER | A:W1(75%),W2(50%),W3(25%),W4(0%)', recES: 'Retirada gradual lineal con descensos del 25% semanal a lo largo de 4 semanas. Se recomienda asociar TCC-I.', recEN: 'Gradual 25% weekly linear dose reduction across 4 weeks. Multi-component CBT-I is recommended.' },
    { aKey: 'DARIDOREXANT', aES: 'Daridorexant', aEN: 'Daridorexant', bKey: 'BZ_ZDRUG', bES: 'BZD / Fármacos Z', bEN: 'BZD / Z-Drugs', modality: 'SWITCH_DIRECT', code: 'TYPE:DIRECT | A:D1(0mg) | B:D1(100%)', recES: 'No produce efecto rebote ni abstinencia; cambio directo al día siguiente a dosis terapéutica de BZD.', recEN: 'No withdrawal or rebound insomnia; direct next-day switch to therapeutic dose of BZD.' },
    { aKey: 'DARIDOREXANT', aES: 'Daridorexant', aEN: 'Daridorexant', bKey: 'ESZOPICLONE', bES: 'Eszopiclona', bEN: 'Eszopiclone', modality: 'SWITCH_DIRECT', code: 'TYPE:DIRECT | A:D1(0mg) | B:D1(100%)', recES: 'Cese de daridorexant y cambio directo la noche siguiente a eszopiclona.', recEN: 'Direct next-day switch from daridorexant to eszopiclone.' },
    { aKey: 'DARIDOREXANT', aES: 'Daridorexant', aEN: 'Daridorexant', bKey: 'MELATONIN_PR', bES: 'Melatonina 2 mg PR', bEN: 'Melatonin 2 mg PR', modality: 'SWITCH_DIRECT', code: 'TYPE:DIRECT | A:D1(0mg) | B:D1(2mg)', recES: 'Cese de daridorexant e inicio directo de melatonina 2 mg PR la noche siguiente.', recEN: 'Direct switch to melatonin 2 mg PR on the next night without tapering.' },
    { aKey: 'DARIDOREXANT', aES: 'Daridorexant', aEN: 'Daridorexant', bKey: 'NONE', bES: 'Ninguno (Retirada)', bEN: 'None / Taper', modality: 'ABRUPT_STOP', code: 'TYPE:ABRUPT | A:D1(0mg)', recES: 'No requiere pauta descendente; se suspende de forma directa y brusca en día 1 sin riesgo de rebote.', recEN: 'Discontinue abruptly on day 1; no tapering schedule required due to lack of rebound effects.' },
    { aKey: 'MELATONIN_PR', aES: 'Melatonina 2 mg PR', aEN: 'Melatonin 2 mg PR', bKey: 'BZ_ZDRUG', bES: 'BZD / Fármacos Z', bEN: 'BZD / Z-Drugs', modality: 'SWITCH_DIRECT', code: 'TYPE:DIRECT | A:D1(0mg) | B:D1(100%)', recES: 'Carece de síndrome de retirada; switch directo al día siguiente al fármaco pautado.', recEN: 'No withdrawal effects; direct switch to the target hypnotic next day.' },
    { aKey: 'MELATONIN_PR', aES: 'Melatonina 2 mg PR', aEN: 'Melatonin 2 mg PR', bKey: 'ESZOPICLONE', bES: 'Eszopiclona', bEN: 'Eszopiclone', modality: 'SWITCH_DIRECT', code: 'TYPE:DIRECT | A:D1(0mg) | B:D1(100%)', recES: 'Cambio directo al día siguiente a eszopiclona.', recEN: 'Direct next-day switch to eszopiclone.' },
    { aKey: 'MELATONIN_PR', aES: 'Melatonina 2 mg PR', aEN: 'Melatonin 2 mg PR', bKey: 'DARIDOREXANT', bES: 'Daridorexant', bEN: 'Daridorexant', modality: 'SWITCH_DIRECT', code: 'TYPE:DIRECT | A:D1(0mg) | B:D1(50mg)', recES: 'Cambio directo a daridorexant 50 mg la noche siguiente.', recEN: 'Direct switch to daridorexant 50 mg on the next night.' },
    { aKey: 'MELATONIN_PR', aES: 'Melatonina 2 mg PR', aEN: 'Melatonin 2 mg PR', bKey: 'NONE', bES: 'Ninguno (Retirada)', bEN: 'None / Taper', modality: 'ABRUPT_STOP', code: 'TYPE:ABRUPT | A:D1(0mg)', recES: 'Sin dependencia ni insomnio de rebote; suspensión brusca directa en día 1.', recEN: 'No dependence or rebound insomnia; abrupt discontinuation on day 1.' },
    { aKey: 'OFF_LABEL_AD', aES: 'Antidepresivo sedante off-label', aEN: 'Off-label sedating AD', bKey: 'DARIDOREXANT', bES: 'Daridorexant', bEN: 'Daridorexant', modality: 'CROSS_TAPER', code: 'TYPE:CROSS | A:W1(75%),W2(50%),W3(25%),W4(0%) | B:W1(25mg),W2(25mg),W3(50mg),W4(50mg)', recES: 'Reducción del 25% semanal del antidepresivo introduciendo daridorexant 25 mg (S1-S2) y escalando a 50 mg (S3-S4).', recEN: '25% weekly antidepressant taper cross-tapering daridorexant 25 mg (W1-2) to 50 mg (W3-4).' },
    { aKey: 'OFF_LABEL_AD', aES: 'Antidepresivo sedante off-label', aEN: 'Off-label sedating AD', bKey: 'MELATONIN_PR', bES: 'Melatonina 2 mg PR', bEN: 'Melatonin 2 mg PR', modality: 'CROSS_TAPER', code: 'TYPE:CROSS | A:W1(75%),W2(50%),W3(25%),W4(0%) | B:W1(2mg),W2(2mg),W3(2mg),W4(2mg)', recES: 'Reducción del 25% semanal del antidepresivo manteniendo melatonina 2 mg PR continua durante 4 semanas.', recEN: '25% weekly antidepressant taper with continuous melatonin 2 mg PR (W1-4).' },
    { aKey: 'OFF_LABEL_AD', aES: 'Antidepresivo sedante off-label', aEN: 'Off-label sedating AD', bKey: 'NONE', bES: 'Ninguno (Retirada)', bEN: 'None / Taper', modality: 'TAPER', code: 'TYPE:TAPER | A:W1(75%),W2(50%),W3(25%),W4(0%)', recES: 'Desescalada del 25% semanal para prevenir síndrome de discontinuación por antidepresivos.', recEN: '25% weekly gradual taper to avoid antidepressant discontinuation symptoms.' },
    { aKey: 'OFF_LABEL_AP', aES: 'Antipsicótico sedante off-label', aEN: 'Off-label sedating AP', bKey: 'DARIDOREXANT', bES: 'Daridorexant', bEN: 'Daridorexant', modality: 'CROSS_TAPER', code: 'TYPE:CROSS | A:W1(75%),W2(50%),W3(25%),W4(0%) | B:W1(25mg),W2(25mg),W3(50mg),W4(50mg)', recES: 'Reducción del 25% semanal del antipsicótico introduciendo daridorexant 25 mg (S1-S2) y escalando a 50 mg (S3-S4).', recEN: '25% weekly antipsychotic taper cross-tapering daridorexant 25 mg (W1-2) to 50 mg (W3-4).' },
    { aKey: 'OFF_LABEL_AP', aES: 'Antipsicótico sedante off-label', aEN: 'Off-label sedating AP', bKey: 'MELATONIN_PR', bES: 'Melatonina 2 mg PR', bEN: 'Melatonin 2 mg PR', modality: 'CROSS_TAPER', code: 'TYPE:CROSS | A:W1(75%),W2(50%),W3(25%),W4(0%) | B:W1(2mg),W2(2mg),W3(2mg),W4(2mg)', recES: 'Reducción del 25% semanal del antipsicótico manteniendo melatonina 2 mg PR continua durante 4 semanas.', recEN: '25% weekly antipsychotic taper with continuous melatonin 2 mg PR (W1-4).' },
    { aKey: 'OFF_LABEL_AP', aES: 'Antipsicótico sedante off-label', aEN: 'Off-label sedating AP', bKey: 'NONE', bES: 'Ninguno (Retirada)', bEN: 'None / Taper', modality: 'TAPER', code: 'TYPE:TAPER | A:W1(75%),W2(50%),W3(25%),W4(0%)', recES: 'Desescalada del 25% semanal para evitar síntomas de rebote colinérgico o histaminérgico.', recEN: '25% weekly gradual taper to prevent withdrawal/rebound phenomena.' }
];

window.currentLangHip = 'es';
window.hipCurrentMode = 'SWITCH'; // 'SWITCH' o 'TAPER'
window.dbHipnotics = [...DEFAULT_HIPNOTICS_DATA];

const i18nHip = {
    es: {
        title: "Switch & Deprescripción de Hipnóticos",
        subtitle: "Consenso Europeo de Neuropsicofarmacología y Sueño (Palagini et al., 2025)",
        modeSwitch: "Cambio (Switch)",
        modeTaper: "Retirada pura (Taper)",
        fromDrug: "Fármaco Actual (Origen)",
        currentDose: "Dosis Actual (mg)",
        toDrug: "Fármaco Objetivo (Destino)",
        melatoninFixedNote: "Melatonina 2 mg PR tiene dosis fija autorizada de 2 mg.",
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
        directNotice: "Cambio directo: suspender Fármaco A e iniciar Fármaco B al día siguiente a dosis equivalente.",
        abruptNotice: "Suspensión directa: fármaco sin tolerancia ni riesgo demostrado de rebote o abstinencia.",
        recHeader: "Recomendación del consenso:",
        biblioTitle: "Evidencia y bibliografía de referencia:",
        disclaimer: "Propuesta clínica orientativa para profesionales sanitarios basada en el consenso europeo (Sleep Med 2025). Debe individualizarse según el contexto médico del paciente."
    },
    en: {
        title: "Hypnotic Switching & Deprescribing",
        subtitle: "European Expert Consensus on Chronic Insomnia (Palagini et al., 2025)",
        modeSwitch: "Switch Medication",
        modeTaper: "Deprescribe (Taper)",
        fromDrug: "Current Hypnotic (Origin)",
        currentDose: "Current Dose (mg)",
        toDrug: "Target Hypnotic (Destination)",
        melatoninFixedNote: "Melatonin 2 mg PR is fixed per European approved guidelines.",
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
        directNotice: "Direct switch: discontinue Drug A and initiate Drug B next night at equivalent dose.",
        abruptNotice: "Abrupt discontinuation: no documented risk of withdrawal syndrome or rebound insomnia.",
        recHeader: "Consensus recommendation:",
        biblioTitle: "Reference guideline & evidence:",
        disclaimer: "Guidance tool for healthcare professionals based on European consensus (Sleep Med 2025). Must be tailored to the patient's specific clinical context."
    }
};

window.iniciarHipnoticosSwitch = async function() {
    const container = document.getElementById('modalData');
    if (!container) return;

    if (!document.getElementById('hip-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'hip-styles';
        styleTag.innerHTML = `
            .hip-ui { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.6rem; font-family: inherit; }
            
            /* Cabecera con padding-right de seguridad para no quedar bajo el botón [X] */
            .hip-header { 
                display: flex; 
                justify-content: space-between; 
                align-items: flex-start; 
                margin-bottom: 0.5rem; 
                width: 100%; 
                padding-right: 3rem; 
                box-sizing: border-box; 
            }
            .hip-title-block { flex: 1; }
            .hip-title { margin: 0; font-weight: 800; font-size: 1.2rem; color: #1e3a8a; line-height: 1.2; }
            .hip-subtitle { font-size: 0.72rem; color: #64748b; margin-top: 3px; }
            
            .hip-lang-toggle { display: flex; background: #e2e8f0; border-radius: 0.75rem; padding: 2px; flex-shrink: 0; }
            .hip-lang-btn { padding: 4px 10px; border-radius: 0.55rem; border: none; cursor: pointer; font-size: 0.7rem; font-weight: 800; color: #64748b; background: transparent; transition: all 0.2s; }
            .hip-lang-btn.active { background: white; color: #1e3a8a; box-shadow: 0 2px 4px rgba(0,0,0,0.08); }

            .hip-mode-toggle { display: grid; grid-template-columns: 1fr 1fr; background: #f1f5f9; border-radius: 0.9rem; padding: 3px; margin-top: 0.4rem; gap: 4px; }
            .hip-mode-btn { padding: 0.65rem; border: none; border-radius: 0.75rem; cursor: pointer; font-size: 0.82rem; font-weight: 800; color: #64748b; background: transparent; transition: all 0.2s; text-align: center; }
            .hip-mode-btn.active { background: white; color: #2563eb; box-shadow: 0 2px 5px rgba(0,0,0,0.06); }

            .hip-field { display: flex; flex-direction: column; margin-top: 0.4rem; }
            .hip-field label { font-size: 0.68rem; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 0.3rem; letter-spacing: 0.3px; }
            
            /* Forzar fondos y textos legibles en selects e inputs */
            .hip-field select, .hip-field input { 
                width: 100%; 
                padding: 0.8rem; 
                border-radius: 0.85rem; 
                border: 2px solid #e2e8f0; 
                font-size: 0.92rem; 
                outline: none; 
                background-color: #ffffff !important; 
                color: #0f172a !important; 
                box-sizing: border-box; 
            }
            .hip-field select option { background-color: #ffffff !important; color: #0f172a !important; }
            .hip-field select:focus, .hip-field input:focus { border-color: #3b82f6; }
            .hip-field input:disabled { background-color: #f1f5f9 !important; color: #64748b !important; cursor: not-allowed; }
            .hip-help-text { font-size: 0.68rem; color: #0284c7; margin-top: 4px; font-weight: 600; }

            .btn-ejecutar-hip { margin-top: 1rem; padding: 0.95rem; background: #1e3a8a; color: white; border: none; border-radius: 0.9rem; cursor: pointer; font-weight: 900; font-size: 0.95rem; transition: background 0.2s; }
            .btn-ejecutar-hip:hover { background: #172554; }

            .hip-res-container { margin-top: 1.25rem; border-radius: 1.1rem; display: none; border: 1px solid #e2e8f0; background: #fff; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.03); }
            .hip-res-header { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 0.9rem 1.1rem; font-size: 0.78rem; color: #334155; line-height: 1.45; }
            .hip-res-header b { color: #0f172a; }
            .hip-res-body { padding: 1.25rem; }

            .hip-step { display: flex; gap: 0.85rem; margin-bottom: 1.1rem; position: relative; }
            .hip-step:not(:last-child)::after { content: ''; position: absolute; left: 19px; top: 38px; bottom: -12px; width: 2px; background: #f1f5f9; }
            .hip-step-idx { min-width: 38px; height: 38px; background: white; border: 2px solid #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.72rem; color: #1e3a8a; z-index: 1; flex-shrink: 0; }
            .hip-step-content { flex-grow: 1; display: flex; flex-direction: column; gap: 4px; }
            
            .hip-tag { font-weight: 800; font-size: 0.65rem; text-transform: uppercase; padding: 2px 7px; border-radius: 5px; display: inline-block; width: fit-content; }
            .hip-tag-orig { background: #fee2e2; color: #b91c1c; }
            .hip-tag-dest { background: #dcfce7; color: #15803d; }
            .hip-dose-txt { font-size: 0.9rem; color: #1e293b; }

            .btn-copiar-hip { margin-top: 0.75rem; width: 100%; padding: 0.85rem; background: #f1f5f9; border-radius: 0.8rem; border: 1px solid #e2e8f0; cursor: pointer; font-weight: 800; font-size: 0.78rem; color: #475569; transition: all 0.2s; }
            .btn-copiar-hip:hover { background: #e2e8f0; color: #0f172a; }

            /* Bibliografía en formato pequeño al pie */
            .hip-biblio { font-size: 0.67rem; color: #64748b; padding: 0.85rem 1.1rem; border-top: 1px solid #e2e8f0; background: #f8fafc; line-height: 1.45; }
            .hip-biblio-title { font-weight: 800; text-transform: uppercase; font-size: 0.62rem; color: #475569; margin-bottom: 3px; letter-spacing: 0.4px; }
            .hip-biblio a { color: #2563eb; text-decoration: underline; }
            .hip-disclaimer { font-size: 0.65rem; color: #94a3b8; padding: 0.6rem 1.1rem; border-top: 1px solid #f1f5f9; background: #ffffff; font-style: italic; line-height: 1.35; }
        `;
        document.head.appendChild(styleTag);
    }

    // Renderizado inmediato usando datos locales precargados
    renderInterfazHip();

    // Intento de actualización en segundo plano desde Google Sheets
    try {
        const response = await fetch(`/?sheet=${CONFIG_HIP.SHEET_NAME}`);
        if (response.ok) {
            const data = await response.json();
            const rawRows = data.values || [];
            if (rawRows.length > 0) {
                // Comprobar si la fila 0 es cabecera técnica
                const hasHeader = rawRows[0][CONFIG_HIP.COL_A_KEY]?.toLowerCase().includes('key');
                const validRows = hasHeader ? rawRows.slice(1) : rawRows;
                
                const loaded = validRows.map(r => ({
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
                })).filter(i => i.aKey && i.code);

                if (loaded.length > 0) {
                    window.dbHipnotics = loaded;
                    renderInterfazHip();
                }
            }
        }
    } catch (e) {
        console.warn("Utilizando matriz interna por defecto de hipnóticos (Palagini 2025):", e);
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
    if (!container) return;

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
                <div class="hip-title-block">
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
                
                <div class="hip-biblio">
                    <div class="hip-biblio-title">${t.biblioTitle}</div>
                    Palagini L, Brugnoli R, Dell'Osso BM, Di Nicola M, Maina G, Martinotti G, Maruani J, Mauries S, Serafini G, Mencacci C, Liguori C, Ferini-Strambi L, Geoffroy PA, Balestrieri M. 
                    <b>Clinical practice guidelines for switching or deprescribing hypnotic medications for chronic insomnia: Results of European neuropsychopharmacology and sleep expert's consensus group</b>. 
                    <i>Sleep Medicine</i>. 2025;128:117-126. 
                    <a href="https://doi.org/10.1016/j.sleep.2025.01.033" target="_blank" rel="noopener noreferrer">doi:10.1016/j.sleep.2025.01.033</a>
                </div>
                <div class="hip-disclaimer">${t.disclaimer}</div>
            </div>
        </div>
    `;

    onDrugAChanged();
}

window.onDrugAChanged = function() {
    const aSelect = document.getElementById('hip_a_select');
    if (!aSelect) return;
    const aKey = aSelect.value;
    const doseInput = document.getElementById('hip_a_dose');
    const note = document.getElementById('hip_melatonin_note');
    const bSelect = document.getElementById('hip_b_select');
    const isES = window.currentLangHip === 'es';

    // Regla de Melatonina PR: fijar a 2 mg
    if (aKey === 'MELATONIN_PR') {
        doseInput.value = 2;
        doseInput.disabled = true;
        note.style.display = 'block';
    } else {
        doseInput.disabled = false;
        note.style.display = 'none';
        if (doseInput.value === '2') doseInput.value = '10';
    }

    if (window.hipCurrentMode === 'SWITCH' && bSelect) {
        // Filtrar F
