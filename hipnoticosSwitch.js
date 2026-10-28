/**
 * hipnoticosSwitch.js - Motor de Conmutación y Deprescripción de Hipnóticos PSQALDÍA v2.0
 * Basado en: Palagini L, Brugnoli R, Dell'Osso BM, Di Nicola M, Maina G, Martinotti G, et al.
 * Clinical practice guidelines for switching or deprescribing hypnotic medications for chronic insomnia:
 * Results of European neuropsychopharmacology and sleep expert's consensus group.
 * Sleep Medicine. 2025;128:117-126. doi:10.1016/j.sleep.2025.01.025
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

// Base de datos de reserva (Fallback local inmediato para que nunca quede vacío)
const FALLBACK_HIPNOTICS = [
    { aKey: "BZ_ZDRUG", aES: "BZD / Fármacos Z", aEN: "BZD / Z-Drugs", bKey: "BZ_ZDRUG", bES: "BZD / Fármacos Z", bEN: "BZD / Z-Drugs", modality: "SWITCH_DIRECT", code: "TYPE:DIRECT | A:D1(0%) | B:D1(100%)", recES: "Cambio intracrítico directo al día siguiente a dosis terapéutica equivalente.", recEN: "Direct intra-class switch on the next day at equivalent therapeutic dose." },
    { aKey: "BZ_ZDRUG", aES: "BZD / Fármacos Z", aEN: "BZD / Z-Drugs", bKey: "ESZOPICLONE", bES: "Eszopiclona", bEN: "Eszopiclone", modality: "CROSS_TAPER", code: "TYPE:CROSS | A:W1(75%),W2(50%),W3(25%),W4(0%) | B:W1(2mg),W2(2mg),W3(3mg),W4(3mg)", recES: "Reducción del 25% semanal de BZD/Z con eszopiclona 2 mg (S1-S2) y titulación a 3 mg (S3-S4).", recEN: "25% weekly BZD/Z reduction with eszopiclone 2 mg (W1-2), escalating to 3 mg (W3-4)." },
    { aKey: "BZ_ZDRUG", aES: "BZD / Fármacos Z", aEN: "BZD / Z-Drugs", bKey: "DARIDOREXANT", bES: "Daridorexant", bEN: "Daridorexant", modality: "CROSS_TAPER", code: "TYPE:CROSS | A:W1(75%),W2(50%),W3(25%),W4(0%) | B:W1(25mg),W2(25mg),W3(50mg),W4(50mg)", recES: "Reducción del 25% semanal de BZD/Z con daridorexant 25 mg (S1-S2) y subida a 50 mg (S3-S4).", recEN: "25% weekly BZD/Z reduction while cross-tapering daridorexant 25 mg (W1-2) to 50 mg (W3-4)." },
    { aKey: "BZ_ZDRUG", aES: "BZD / Fármacos Z", aEN: "BZD / Z-Drugs", bKey: "MELATONIN_PR", bES: "Melatonina 2 mg PR", bEN: "Melatonin 2 mg PR", modality: "CROSS_TAPER", code: "TYPE:CROSS | A:W1(75%),W2(50%),W3(25%),W4(0%) | B:W1(2mg),W2(2mg),W3(2mg),W4(2mg)", recES: "Reducción del 25% semanal de BZD/Z manteniendo dosis fija de melatonina 2 mg PR (S1-S4).", recEN: "25% weekly BZD/Z reduction while maintaining continuous fixed melatonin 2 mg PR (W1-4)." },
    { aKey: "BZ_ZDRUG", aES: "BZD / Fármacos Z", aEN: "BZD / Z-Drugs", bKey: "NONE", bES: "Ninguno (Retirada)", bEN: "None / Taper", modality: "TAPER", code: "TYPE:TAPER | A:W1(75%),W2(50%),W3(25%),W4(0%)", recES: "Retirada gradual lineal con descensos del 25% semanal a lo largo de 4 semanas. Se recomienda asociar TCC-I.", recEN: "Gradual 25% weekly linear dose reduction across 4 weeks. Multi-component CBT-I is recommended." },
    { aKey: "DARIDOREXANT", aES: "Daridorexant", aEN: "Daridorexant", bKey: "BZ_ZDRUG", bES: "BZD / Fármacos Z", bEN: "BZD / Z-Drugs", modality: "SWITCH_DIRECT", code: "TYPE:DIRECT | A:D1(0mg) | B:D1(100%)", recES: "No produce efecto rebote ni abstinencia; cambio directo al día siguiente a dosis terapéutica de BZD.", recEN: "No withdrawal or rebound insomnia; direct next-day switch to therapeutic dose of BZD." },
    { aKey: "DARIDOREXANT", aES: "Daridorexant", aEN: "Daridorexant", bKey: "ESZOPICLONE", bES: "Eszopiclona", bEN: "Eszopiclone", modality: "SWITCH_DIRECT", code: "TYPE:DIRECT | A:D1(0mg) | B:D1(100%)", recES: "Cese de daridorexant y cambio directo la noche siguiente a eszopiclona.", recEN: "Direct next-day switch from daridorexant to eszopiclone." },
    { aKey: "DARIDOREXANT", aES: "Daridorexant", aEN: "Daridorexant", bKey: "MELATONIN_PR", bES: "Melatonina 2 mg PR", bEN: "Melatonin 2 mg PR", modality: "SWITCH_DIRECT", code: "TYPE:DIRECT | A:D1(0mg) | B:D1(2mg)", recES: "Cese de daridorexant e inicio directo de melatonina 2 mg PR la noche siguiente.", recEN: "Direct switch to melatonin 2 mg PR on the next night without tapering." },
    { aKey: "DARIDOREXANT", aES: "Daridorexant", aEN: "Daridorexant", bKey: "NONE", bES: "Ninguno (Retirada)", bEN: "None / Taper", modality: "ABRUPT_STOP", code: "TYPE:ABRUPT | A:D1(0mg)", recES: "No requiere pauta descendente; se suspende de forma directa y brusca en día 1 sin riesgo de rebote.", recEN: "Discontinue abruptly on day 1; no tapering schedule required due to lack of rebound effects." },
    { aKey: "MELATONIN_PR", aES: "Melatonina 2 mg PR", aEN: "Melatonin 2 mg PR", bKey: "BZ_ZDRUG", bES: "BZD / Fármacos Z", bEN: "BZD / Z-Drugs", modality: "SWITCH_DIRECT", code: "TYPE:DIRECT | A:D1(0mg) | B:D1(100%)", recES: "Carece de síndrome de retirada; switch directo al día siguiente al fármaco pautado.", recEN: "No withdrawal effects; direct switch to the target hypnotic next day." },
    { aKey: "MELATONIN_PR", aES: "Melatonina 2 mg PR", aEN: "Melatonin 2 mg PR", bKey: "ESZOPICLONE", bES: "Eszopiclona", bEN: "Eszopiclone", modality: "SWITCH_DIRECT", code: "TYPE:DIRECT | A:D1(0mg) | B:D1(100%)", recES: "Cambio directo al día siguiente a eszopiclona.", recEN: "Direct next-day switch to eszopiclone." },
    { aKey: "MELATONIN_PR", aES: "Melatonina 2 mg PR", aEN: "Melatonin 2 mg PR", bKey: "DARIDOREXANT", bES: "Daridorexant", bEN: "Daridorexant", modality: "SWITCH_DIRECT", code: "TYPE:DIRECT | A:D1(0mg) | B:D1(50mg)", recES: "Cambio directo a daridorexant 50 mg la noche siguiente.", recEN: "Direct switch to daridorexant 50 mg on the next night." },
    { aKey: "MELATONIN_PR", aES: "Melatonina 2 mg PR", aEN: "Melatonin 2 mg PR", bKey: "NONE", bES: "Ninguno (Retirada)", bEN: "None / Taper", modality: "ABRUPT_STOP", code: "TYPE:ABRUPT | A:D1(0mg)", recES: "Sin dependencia ni insomnio de rebote; suspensión brusca directa en día 1.", recEN: "No dependence or rebound insomnia; abrupt discontinuation on day 1." },
    { aKey: "OFF_LABEL_AD", aES: "Antidepresivo sedante off-label", aEN: "Off-label sedating AD", bKey: "DARIDOREXANT", bES: "Daridorexant", bEN: "Daridorexant", modality: "CROSS_TAPER", code: "TYPE:CROSS | A:W1(75%),W2(50%),W3(25%),W4(0%) | B:W1(25mg),W2(25mg),W3(50mg),W4(50mg)", recES: "Reducción del 25% semanal del antidepresivo introduciendo daridorexant 25 mg (S1-S2) y escalando a 50 mg (S3-S4).", recEN: "25% weekly antidepressant taper cross-tapering daridorexant 25 mg (W1-2) to 50 mg (W3-4)." },
    { aKey: "OFF_LABEL_AD", aES: "Antidepresivo sedante off-label", aEN: "Off-label sedating AD", bKey: "MELATONIN_PR", bES: "Melatonina 2 mg PR", bEN: "Melatonin 2 mg PR", modality: "CROSS_TAPER", code: "TYPE:CROSS | A:W1(75%),W2(50%),W3(25%),W4(0%) | B:W1(2mg),W2(2mg),W3(2mg),W4(2mg)", recES: "Reducción del 25% semanal del antidepresivo manteniendo melatonina 2 mg PR continua durante 4 semanas.", recEN: "25% weekly antidepressant taper with continuous melatonin 2 mg PR (W1-4)." },
    { aKey: "OFF_LABEL_AD", aES: "Antidepresivo sedante off-label", aEN: "Off-label sedating AD", bKey: "NONE", bES: "Ninguno (Retirada)", bEN: "None / Taper", modality: "TAPER", code: "TYPE:TAPER | A:W1(75%),W2(50%),W3(25%),W4(0%)", recES: "Desescalada del 25% semanal para prevenir síndrome de discontinuación por antidepresivos.", recEN: "25% weekly gradual taper to avoid antidepressant discontinuation symptoms." },
    { aKey: "OFF_LABEL_AP", aES: "Antipsicótico sedante off-label", aEN: "Off-label sedating AP", bKey: "DARIDOREXANT", bES: "Daridorexant", bEN: "Daridorexant", modality: "CROSS_TAPER", code: "TYPE:CROSS | A:W1(75%),W2(50%),W3(25%),W4(0%) | B:W1(25mg),W2(25mg),W3(50mg),W4(50mg)", recES: "Reducción del 25% semanal del antipsicótico introduciendo daridorexant 25 mg (S1-S2) y escalando a 50 mg (S3-S4).", recEN: "25% weekly antipsychotic taper cross-tapering daridorexant 25 mg (W1-2) to 50 mg (W3-4)." },
    { aKey: "OFF_LABEL_AP", aES: "Antipsicótico sedante off-label", aEN: "Off-label sedating AP", bKey: "MELATONIN_PR", bES: "Melatonina 2 mg PR", bEN: "Melatonin 2 mg PR", modality: "CROSS_TAPER", code: "TYPE:CROSS | A:W1(75%),W2(50%),W3(25%),W4(0%) | B:W1(2mg),W2(2mg),W3(2mg),W4(2mg)", recES: "Reducción del 25% semanal del antipsicótico manteniendo melatonina 2 mg PR continua durante 4 semanas.", recEN: "25% weekly antipsychotic taper with continuous melatonin 2 mg PR (W1-4)." },
    { aKey: "OFF_LABEL_AP", aES: "Antipsicótico sedante off-label", aEN: "Off-label sedating AP", bKey: "NONE", bES: "Ninguno (Retirada)", bEN: "None / Taper", modality: "TAPER", code: "TYPE:TAPER | A:W1(75%),W2(50%),W3(25%),W4(0%)", recES: "Desescalada del 25% semanal para evitar síntomas de rebote colinérgico o histaminérgico.", recEN: "25% weekly gradual taper to prevent withdrawal/rebound phenomena." }
];

window.currentLangHip = window.currentLangHip || 'es';
window.hipCurrentMode = window.hipCurrentMode || 'SWITCH';
window.dbHipnotics = window.dbHipnotics || FALLBACK_HIPNOTICS;

const i18nHip = {
    es: {
        title: "Switch & Deprescripción de Hipnóticos",
        modeSwitch: "Cambio (Switch)",
        modeTaper: "Retirada (Taper)",
        fromDrug: "Fármaco Actual (Origen)",
        currentDose: "Dosis Actual (mg)",
        toDrug: "Fármaco Objetivo (Destino)",
        melatoninFixedNote: "Melatonina 2 mg PR es dosis terapéutica fija según ficha técnica.",
        btnRun: "GENERAR CALENDARIO DE PAUTA",
        btnCopy: "COPIAR PAUTA PARA HISTORIA CLÍNICA",
        copied: "¡Pauta copiada al portapapeles!",
        day: "Día",
        week: "Semana",
        stop: "Suspender",
        take: "Tomar",
        reduce: "Reducir a",
        increase: "Aumentar a",
        maintain: "Mantener",
        directSwitchNotice: "Cambio directo: suspender Fármaco A e iniciar Fármaco B al día siguiente a dosis terapéutica.",
        abruptStopNotice: "Suspensión directa: fármaco sin riesgo demostrado de abstinencia ni insomnio de rebote.",
        recHeader: "Recomendación clínica del consenso:",
        biblioHeader: "Referencia bibliográfica:",
        biblioCitation: "Palagini L, Brugnoli R, Dell'Osso BM, Di Nicola M, Maina G, Martinotti G, et al. Clinical practice guidelines for switching or deprescribing hypnotic medications for chronic insomnia: Results of European neuropsychopharmacology and sleep expert's consensus group. Sleep Medicine. 2025;128:117-126. doi:10.1016/j.sleep.2025.01.025",
    },
    en: {
        title: "Hypnotic Switching & Deprescribing",
        modeSwitch: "Switch Medication",
        modeTaper: "Deprescribe (Taper)",
        fromDrug: "Current Hypnotic (Origin)",
        currentDose: "Current Dose (mg)",
        toDrug: "Target Hypnotic (Destination)",
        melatoninFixedNote: "Melatonin 2 mg PR is a fixed dose per European guidelines.",
        btnRun: "GENERATE TAPERING SCHEDULE",
        btnCopy: "COPY SCHEDULE TO CLIPBOARD",
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
        recHeader: "Consensus recommendation:",
        biblioHeader: "Bibliographic citation:",
        biblioCitation: "Palagini L, Brugnoli R, Dell'Osso BM, Di Nicola M, Maina G, Martinotti G, et al. Clinical practice guidelines for switching or deprescribing hypnotic medications for chronic insomnia: Results of European neuropsychopharmacology and sleep expert's consensus group. Sleep Medicine. 2025;128:117-126. doi:10.1016/j.sleep.2025.01.025",
    }
};

// Función auxiliar para obtener el contenedor correcto (soporta modal de móvil y HTML independiente)
function getHipContainer() {
    return document.getElementById('modalData') || 
           document.getElementById('hipnoticos-app') || 
           document.getElementById('app') || 
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
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                color: #0f172a;
                box-sizing: border-box;
            }
            /* Header con margen derecho para no solapar la X de cerrar modal */
            .hip-header { 
                display: grid; 
                grid-template-columns: 1fr auto; 
                align-items: center; 
                gap: 0.75rem;
                padding-right: 44px; /* Margen de seguridad para botón X del modal */
                margin-bottom: 0.25rem; 
                width: 100%; 
                box-sizing: border-box;
            }
            .hip-title { 
                margin: 0; 
                font-weight: 800; 
                font-size: 1.15rem; 
                color: #1e3a8a; 
                line-height: 1.25;
            }
            .hip-subtitle { 
                font-size: 0.75rem; 
                color: #64748b; 
                margin-top: 3px; 
                line-height: 1.35;
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
                padding: 0.65rem; 
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
                box-shadow: 0 1px 4px rgba(0,0,0,0.06); 
            }
            .hip-field { 
                display: flex; 
                flex-direction: column; 
                margin-top: 0.4rem; 
            }
            .hip-field label { 
                font-size: 0.72rem; 
                font-weight: 800; 
                text-transform: uppercase; 
                letter-spacing: 0.03em;
                color: #475569; 
                margin-bottom: 0.35rem; 
            }
            .hip-select-custom, .hip-input-custom { 
                width: 100%; 
                padding: 0.75rem 0.9rem; 
                border-radius: 0.75rem; 
                border: 2px solid #cbd5e1; 
                font-size: 0.92rem; 
                outline: none; 
                background: #ffffff; 
                box-sizing: border-box; 
                color: #0f172a;
                font-weight: 500;
                transition: border-color 0.2s;
            }
            .hip-select-custom:focus, .hip-input-custom:focus { 
                border-color: #2563eb; 
            }
            .hip-input-custom:disabled { 
                background: #f8fafc; 
                color: #64748b; 
                border-color: #e2e8f0;
                cursor: not-allowed; 
            }
            .hip-help-text { 
                font-size: 0.72rem; 
                color: #0284c7; 
                margin-top: 4px; 
                font-weight: 600; 
            }
            .btn-ejecutar-hip { 
                margin-top: 0.9rem; 
                padding: 0.9rem; 
                background: #1e3a8a; 
                color: #ffffff; 
                border: none; 
                border-radius: 0.85rem; 
                cursor: pointer; 
                font-weight: 800; 
                font-size: 0.92rem; 
                letter-spacing: 0.02em;
                transition: background 0.2s, transform 0.05s; 
            }
            .btn-ejecutar-hip:hover { background: #172554; }
            .btn-ejecutar-hip:active { transform: scale(0.99); }

            .hip-res-container { 
                margin-top: 1.25rem; 
                border-radius: 1rem; 
                display: none; 
                border: 1px solid #cbd5e1; 
                background: #ffffff; 
                overflow: hidden; 
                box-shadow: 0 4px 12px rgba(0,0,0,0.04); 
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
                margin-bottom: 1.15rem; 
                position: relative; 
            }
            .hip-step:not(:last-child)::after { 
                content: ''; 
                position: absolute; 
                left: 17px; 
                top: 36px; 
                bottom: -15px; 
                width: 2px; 
                background: #e2e8f0; 
            }
            .hip-step-idx { 
                min-width: 36px; 
                height: 36px; 
                background: #ffffff; 
                border: 2px solid #cbd5e1; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-weight: 800; 
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
            .hip-dose-txt { font-size: 0.88rem; color: #1e293b; vertical-align: middle; }

            .hip-biblio-box {
                font-size: 0.72rem;
                color: #475569;
                padding: 0.85rem 1.15rem;
                background: #f1f5f9;
                border-top: 1px solid #e2e8f0;
                line-height: 1.45;
            }
            .hip-biblio-box b { color: #1e293b; }
            .hip-disclaimer { 
                font-size: 0.68rem; 
                color: #64748b; 
                padding: 0.75rem 1.15rem; 
                border-top: 1px solid #f1f5f9; 
                background: #fafafa; 
                font-style: italic; 
                line-height: 1.45; 
                text-align: justify; 
            }
            .btn-copiar-hip { 
                margin-top: 0.5rem; 
                width: 100%; 
                padding: 0.85rem; 
                background: #f8fafc; 
                border-radius: 0.75rem; 
                border: 1px solid #cbd5e1; 
                cursor: pointer; 
                font-weight: 800; 
                font-size: 0.78rem; 
                color: #334155; 
                transition: all 0.2s; 
            }
            .btn-copiar-hip:hover { background: #e2e8f0; color: #0f172a; }
        `;
        document.head.appendChild(styleTag);
    }

    // Renderizado inmediato con base de datos disponible
    renderInterfazHip();

    // Intentar actualización asíncrona desde Google Sheets sin bloquear la UI
    try {
        const response = await fetch(`/?sheet=${CONFIG_HIP.SHEET_NAME}`);
        if (response.ok) {
            const data = await response.json();
            const rawRows = (data && data.values) ? data.values : [];
            
            // Filtro robusto: descarta cabecera si viniera y filas vacías
            const parsed = rawRows
                .filter(r => r && r[CONFIG_HIP.COL_A_KEY] && r[CONFIG_HIP.COL_A_KEY].toString().trim().toLowerCase() !== 'drug_a_key')
                .map(r => ({
                    aKey: (r[CONFIG_HIP.COL_A_KEY] || '').toString().trim(),
                    aES: (r[CONFIG_HIP.COL_A_ES] || r[CONFIG_HIP.COL_A_KEY] || '').toString().trim(),
                    aEN: (r[CONFIG_HIP.COL_A_EN] || r[CONFIG_HIP.COL_A_ES] || r[CONFIG_HIP.COL_A_KEY] || '').toString().trim(),
                    bKey: (r[CONFIG_HIP.COL_B_KEY] || '').toString().trim(),
                    bES: (r[CONFIG_HIP.COL_B_ES] || r[CONFIG_HIP.COL_B_KEY] || '').toString().trim(),
                    bEN: (r[CONFIG_HIP.COL_B_EN] || r[CONFIG_HIP.COL_B_ES] || r[CONFIG_HIP.COL_B_KEY] || '').toString().trim(),
                    modality: (r[CONFIG_HIP.COL_MODALITY] || '').toString().trim(),
                    code: (r[CONFIG_HIP.COL_CODE] || '').toString().trim(),
                    recES: (r[CONFIG_HIP.COL_REC_ES] || '').toString().trim(),
                    recEN: (r[CONFIG_HIP.COL_REC_EN] || r[CONFIG_HIP.COL_REC_ES] || '').toString().trim()
                }))
                .filter(item => item.aKey && item.code);

            if (parsed.length > 0) {
                window.dbHipnotics = parsed;
                // Guardar selecciones actuales y refrescar
                const curA = document.getElementById('hip_a_select')?.value;
                const curB = document.getElementById('hip_b_select')?.value;
                renderInterfazHip(curA, curB);
            }
        }
    } catch (e) {
        console.warn("Utilizando catálogo clínico local para Hipnóticos:", e);
    }
};

window.setLanguageHip = function(lang) {
    window.currentLangHip = lang;
    const curA = document.getElementById('hip_a_select')?.value;
    const curB = document.getElementById('hip_b_select')?.value;
    renderInterfazHip(curA, curB);
    if (document.getElementById('hip-res-box') && document.getElementById('hip-res-box').style.display === 'block') {
        ejecutarHipnoticosSwitch();
    }
};

window.setModeHip = function(mode) {
    window.hipCurrentMode = mode;
    const curA = document.getElementById('hip_a_select')?.value;
    renderInterfazHip(curA);
    if (document.getElementById('hip-res-box') && document.getElementById('hip-res-box').style.display === 'block') {
        ejecutarHipnoticosSwitch();
    }
};

function renderInterfazHip(prevSelectedA, prevSelectedB) {
    const t = i18nHip[window.currentLangHip];
    const isES = window.currentLangHip === 'es';
    const container = getHipContainer();
    if (!container) return;

    // Obtener lista única de Fármacos A según el modo actual
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
                <div>
                    <h2 class="hip-title">${t.title}</h2>
                    <div class="hip-subtitle">${t.subtitle}</div>
                </div>
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
                <select id="hip_a_select" class="hip-select-custom" onchange="onDrugAChanged()">${optDrugA}</select>
            </div>

            <div class="hip-field">
                <label for="hip_a_dose">${t.currentDose}</label>
                <input type="number" id="hip_a_dose" class="hip-input-custom" value="10" min="0.1" step="any">
                <div id="hip_melatonin_note" class="hip-help-text" style="display:none;">${t.melatoninFixedNote}</div>
            </div>

            <div class="hip-field" id="hip_dest_container" style="${window.hipCurrentMode === 'TAPER' ? 'display:none;' : ''}">
                <label for="hip_b_select">${t.toDrug}</label>
                <select id="hip_b_select" class="hip-select-custom"></select>
            </div>

            <button type="button" class="btn-ejecutar-hip" onclick="ejecutarHipnoticosSwitch()">${t.btnRun}</button>

            <div id="hip-res-box" class="hip-res-container">
                <div id="hip-res-header" class="hip-res-header"></div>
                <div id="hip-res-pauta" class="hip-res-body"></div>
                <div class="hip-biblio-box">
                    <b>${t.biblioHeader}</b><br>
                    ${t.biblioCitation}
                </div>
                <div class="hip-disclaimer">${t.disclaimer}</div>
            </div>
        </div>
    `;

    // Restaurar valor previo de Fármaco A si aún existe
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

    // Regla clínica de Melatonina PR: dosis fija en 2 mg
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

    if (typePart === 'ABRUPT') {
        steps.push({
            label: `${t.day} 1`,
            items: [{ name: nameA, tag: 'hip-tag-orig', text: `<b>${t.stop}</b> (${t.abruptStopNotice})` }]
        });
        return steps;
    }

    if (typePart === 'DIRECT') {
        steps.push({
            label: `${t.day} 1`,
            items: [
                { name: nameA, tag: 'hip-tag-orig', text: `<b>${t.stop}</b>` },
                { name: nameB, tag: 'hip-tag-dest', text: `<b>${t.take}</b> (${t.directSwitchNotice})` }
            ]
        });
        return steps;
    }

    // Modalidades CROSS o TAPER por semanas (W1..W4)
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
                    items.push({ name: nameA, tag: 'hip-tag-orig', text: `${t.take} <b>${mg} mg</b>` });
                }
            }
        }

        // Fármaco B (Destino, en Cross-Taper)
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

// Autoarranque si se carga directamente en un archivo .html independiente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!document.getElementById('modalData')) {
            window.iniciarHipnoticosSwitch();
        }
    });
} else {
    if (!document.getElementById('modalData')) {
        window.iniciarHipnoticosSwitch();
    }
}
