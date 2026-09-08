/**
 * cfi.js - Entrevista de Formulación Cultural (CFI - DSM-5-TR)
 * PSQALDÍA v1.0
 * Estructura simétrica a aes.js / clozapina.js - Sin emojis, texto profesional.
 */

window.cfiLang = 'es';

const i18nCFI = {
    es: {
        title: "Formulación Cultural (CFI)",
        subtitle: "Guía de entrevista clínica estructurada DSM-5-TR",
        patientTermLabel: "Término o descripción del problema según el paciente",
        patientTermPh: "Ej. Nervios, decaimiento, ataque, presión en la cabeza...",
        toggleGuide: "Ver preguntas guía",
        d1Title: "Dominio 1: Definición cultural del problema",
        d1Subtitle: "Significado personal y social del motivo de consulta",
        d1NotesPh: "Anotar cómo define el paciente su malestar, términos propios y aspectos más preocupantes...",
        d2Title: "Dominio 2: Causas, contexto y apoyos",
        d2Subtitle: "Modelos explicativos, estresores, redes y rol de la identidad",
        d2NotesPh: "Anotar causas atribuidas por el paciente/familia, apoyos, estresores psicosociales e identidad...",
        d3Title: "Dominio 3: Afrontamiento y ayuda previa",
        d3Subtitle: "Recursos propios, itinerario asistencial y barreras",
        d3NotesPh: "Anotar qué ha hecho por su cuenta, tratamientos o curadores previos, utilidad y barreras...",
        d4Title: "Dominio 4: Ayuda actual y relación médico-paciente",
        d4Subtitle: "Expectativas asistenciales y prevención de malentendidos",
        d4NotesPh: "Anotar qué tipo de ayuda espera, opiniones de allegados y posibles dudas o recelos terapéuticos...",
        btnCopy: "COPIAR INFORME CLÍNICO",
        btnAI: "SINTETIZAR CON IA",
        btnReset: "REINICIAR",
        copied: "Informe copiado al portapapeles",
        aiLoading: "Sintetizando formulación cultural...",
        aiError: "No se pudo conectar con el servicio de IA.",
        aiTitle: "Síntesis Narrativa (DSM-5-TR):",
        disclaimer: "Basado en la Entrevista de Formulación Cultural (CFI) del DSM-5-TR (American Psychiatric Association). Instrumento de apoyo clínico."
    },
    en: {
        title: "Cultural Formulation Interview (CFI)",
        subtitle: "DSM-5-TR Structured Clinical Interview Guide",
        patientTermLabel: "Patient's term or description for the problem",
        patientTermPh: "E.g., Nerves, low spirits, distress, pressure in head...",
        toggleGuide: "Show guiding questions",
        d1Title: "Domain 1: Cultural Definition of the Problem",
        d1Subtitle: "Personal and social meaning of the clinical issue",
        d1NotesPh: "Record patient's phrasing, personal explanatory terms, and main concerns...",
        d2Title: "Domain 2: Causes, Context, and Support",
        d2Subtitle: "Explanatory models, stressors, support network, and identity",
        d2NotesPh: "Record attributed causes, family views, psychosocial stressors, and cultural identity...",
        d3Title: "Domain 3: Coping and Past Help Seeking",
        d3Subtitle: "Self-coping resources, treatment history, and barriers",
        d3NotesPh: "Record autonomous coping, previous treatments or healers, usefulness, and barriers...",
        d4Title: "Domain 4: Current Help Seeking & Therapeutic Relationship",
        d4Subtitle: "Care expectations and preventing misunderstanding",
        d4NotesPh: "Record perceived needs, network advice, and concerns regarding the clinician-patient bond...",
        btnCopy: "COPY CLINICAL REPORT",
        btnAI: "SYNTHESIZE WITH AI",
        btnReset: "RESET",
        copied: "Report copied to clipboard",
        aiLoading: "Synthesizing cultural formulation...",
        aiError: "Could not connect to AI service.",
        aiTitle: "Narrative Synthesis (DSM-5-TR):",
        disclaimer: "Based on the Cultural Formulation Interview (CFI), DSM-5-TR (American Psychiatric Association). Clinical support tool."
    }
};

const cfiQuestions = {
    es: {
        d1: [
            "1. ¿Qué le trae hoy aquí? (Si solo cita un diagnóstico médico: La gente suele entender sus problemas a su propia manera. ¿Cómo describiría usted su problema?)",
            "2. A veces la gente describe su problema de forma distinta a su familia, amigos o comunidad. ¿Cómo se lo describiría a ellos?",
            "3. ¿Qué es lo que más le preocupa o le inquieta de su problema?"
        ],
        d2: [
            "4. ¿Por qué cree que le ocurre esto? ¿Cuáles cree que son las causas? (Sondear: sucesos vitales, conflictos, causa física, espiritual...)",
            "5. ¿Qué piensan sus familiares, amigos o allegados sobre la causa de su problema?",
            "6. ¿Hay apoyos que mejoren su situación? (Familia, amigos, comunidad, religión/espiritualidad).",
            "7. ¿Hay factores de estrés que la empeoren? (Económicos, laborales, familiares, discriminación).",
            "8. Para usted, ¿cuáles son los aspectos más importantes de su origen o identidad (comunidad, idioma, procedencia, género, orientación, fe)?",
            "9. ¿Hay aspectos de su origen o identidad que marquen una diferencia en su problema?",
            "10. ¿Hay aspectos de su identidad que le causen otras dificultades (migración, choque generacional, roles de género)?"
        ],
        d3: [
            "11. ¿Qué ha hecho usted por su cuenta para sobrellevar o manejar este problema?",
            "12. En el pasado, ¿qué tipo de ayuda, tratamiento, consejo o curación ha buscado (médicos, salud mental, medicina tradicional, guías espirituales)? ¿Qué le fue útil y qué no?",
            "13. ¿Ha habido algo que le haya impedido recibir la ayuda necesaria (dinero, trabajo, estigma, barrera idiomática o cultural)?"
        ],
        d4: [
            "14. ¿Qué tipo de ayuda cree que le resultaría más útil en este momento?",
            "15. ¿Hay otros tipos de ayuda que sus familiares, amigos u otras personas le hayan sugerido?",
            "16. A veces médicos y pacientes no se entienden por tener orígenes o expectativas distintas. ¿Le ha preocupado esto? ¿Hay algo que podamos hacer para brindarle la atención que necesita?"
        ]
    },
    en: {
        d1: [
            "1. What brings you here today? (If medical diagnosis given: People often understand problems in their own way. How would you describe your problem?)",
            "2. How would you describe your problem to family, friends, or your community?",
            "3. What troubles you most about your problem?"
        ],
        d2: [
            "4. Why do you think this is happening to you? What do you think are the causes?",
            "5. What do others in your family, friends, or community think is causing it?",
            "6. Are there supports that make it better (family, friends, spirituality)?",
            "7. Are there stresses that make it worse (money, work, family, discrimination)?",
            "8. What are the most important aspects of your background or identity?",
            "9. Do any aspects of your background or identity make a difference to your problem?",
            "10. Do any aspects of your identity cause other concerns or difficulties?"
        ],
        d3: [
            "11. What have you done on your own to cope with your problem?",
            "12. What kinds of treatment, advice, or healing have you sought in the past? What was most and least useful?",
            "13. Has anything prevented you from getting the help you need (financial, stigma, language, culture)?"
        ],
        d4: [
            "14. What kinds of help do you think would be most useful to you at this time?",
            "15. Are there other kinds of help suggested by family, friends, or others?",
            "16. Doctors and patients sometimes misunderstand each other due to background or expectations. Have you been concerned about this? What can we do to provide the care you need?"
        ]
    }
};

window.iniciarCFI = async function() {
    const container = document.getElementById('modalData');
    if (!container) return;

    if (!document.getElementById('cfi-styles')) {
        const style = document.createElement('style');
        style.id = 'cfi-styles';
        style.innerHTML = `
            .cfi-container { padding: 1.2rem; font-family: inherit; color: var(--text-main); }
            .cfi-header-ui {
                background: var(--card);
                padding: 1.2rem;
                border-radius: 1.2rem;
                border: 1px solid var(--border);
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04);
                margin-bottom: 1.2rem;
            }
            .cfi-label {
                display: block; font-size: 0.7rem; font-weight: 800;
                color: var(--text-muted); text-transform: uppercase;
                letter-spacing: 0.05em; margin-bottom: 0.4rem;
            }
            .cfi-input {
                width: 100%; padding: 0.75rem 0.9rem; border-radius: 0.8rem;
                border: 2px solid var(--border); background: var(--bg);
                color: var(--text-main); font-size: 0.95rem; font-weight: 600;
                outline: none; transition: all 0.2s; box-sizing: border-box;
            }
            .cfi-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(67, 56, 202, 0.1); }
            .cfi-card {
                background: var(--card); border: 1px solid var(--border); border-radius: 1rem;
                padding: 1rem; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            }
            .cfi-card-header { margin-bottom: 0.6rem; }
            .cfi-badge {
                font-weight: 800; font-size: 0.65rem; color: var(--primary);
                background: rgba(67, 56, 202, 0.08); padding: 3px 8px; border-radius: 6px;
                display: inline-block; margin-bottom: 0.3rem; text-transform: uppercase;
            }
            .cfi-domain-title { font-size: 0.95rem; font-weight: 800; margin: 0; color: var(--text-main); }
            .cfi-domain-sub { font-size: 0.75rem; color: var(--text-muted); margin: 0.2rem 0 0.5rem 0; }
            
            .cfi-guide-toggle {
                font-size: 0.72rem; font-weight: 700; color: var(--primary);
                background: none; border: none; padding: 0; cursor: pointer;
                display: inline-flex; align-items: center; gap: 4px; margin-bottom: 0.6rem;
            }
            .cfi-guide-box {
                background: var(--bg); border-left: 3px solid var(--primary);
                padding: 0.6rem 0.8rem; border-radius: 0 0.5rem 0.5rem 0; margin-bottom: 0.7rem;
                font-size: 0.78rem; line-height: 1.45; color: var(--text-main); display: none;
            }
            .cfi-guide-box ul { margin: 0; padding-left: 1.1rem; }
            .cfi-guide-box li { margin-bottom: 0.35rem; }
            
            .cfi-textarea {
                width: 100%; min-height: 75px; padding: 0.7rem; border-radius: 0.7rem;
                border: 1px solid var(--border); background: var(--bg);
                color: var(--text-main); font-size: 0.85rem; font-family: inherit;
                resize: vertical; outline: none; box-sizing: border-box;
            }
            .cfi-textarea:focus { border-color: var(--primary); }
            
            .cfi-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 1.2rem; }
            .btn-cfi-primary {
                background: var(--primary); color: white; border: none; padding: 0.85rem;
                border-radius: 0.8rem; font-weight: 800; font-size: 0.82rem; cursor: pointer;
                transition: transform 0.15s, opacity 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px;
            }
            .btn-cfi-secondary {
                background: var(--card); color: var(--text-main); border: 2px solid var(--border);
                padding: 0.85rem; border-radius: 0.8rem; font-weight: 800; font-size: 0.82rem; cursor: pointer;
                transition: background 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px;
            }
            .btn-cfi-primary:active, .btn-cfi-secondary:active { transform: scale(0.98); }
            .btn-cfi-reset {
                width: 100%; background: none; border: none; color: var(--text-muted);
                font-size: 0.72rem; font-weight: 700; padding: 0.8rem; cursor: pointer; text-align: center;
                margin-top: 0.4rem; text-decoration: underline;
            }
            
            .cfi-ai-box {
                margin-top: 1.2rem; background: var(--card); border: 1px solid var(--primary);
                border-radius: 1rem; padding: 1.1rem; display: none;
            }
            .cfi-ai-box-title { font-size: 0.82rem; font-weight: 800; color: var(--primary); margin-bottom: 0.5rem; }
            .cfi-ai-content { font-size: 0.85rem; line-height: 1.5; color: var(--text-main); white-space: pre-wrap; margin-bottom: 0.8rem; }
            .cfi-disclaimer {
                font-size: 0.68rem; color: var(--text-muted); text-align: center;
                margin-top: 1.5rem; line-height: 1.4; border-top: 1px dashed var(--border); padding-top: 0.8rem;
            }
        `;
        document.head.appendChild(style);
    }

    renderInterfazCFI();
};

window.setLanguageCFI = function(lang) {
    window.cfiLang = lang;
    renderInterfazCFI();
};

window.toggleCFIEstadoGuia = function(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
};

function renderInterfazCFI() {
    const t = i18nCFI[window.cfiLang];
    const q = cfiQuestions[window.cfiLang];
    const container = document.getElementById('modalData');
    if (!container) return;

    container.innerHTML = `
        <div class="cfi-container">
            <div class="calc-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem; padding-right: 45px;">
                <div>
                    <h2 style="font-weight:900; margin:0; font-size:1.25rem;">${t.title}</h2>
                    <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">${t.subtitle}</span>
                </div>
                <div class="lang-toggle">
                    <button class="lang-btn ${window.cfiLang === 'es' ? 'active' : ''}" onclick="setLanguageCFI('es')">ES</button>
                    <button class="lang-btn ${window.cfiLang === 'en' ? 'active' : ''}" onclick="setLanguageCFI('en')">EN</button>
                </div>
            </div>

            <div class="cfi-header-ui">
                <label class="cfi-label">${t.patientTermLabel}</label>
                <input type="text" id="cfi_term" class="cfi-input" placeholder="${t.patientTermPh}">
            </div>

            <!-- DOMINIO 1 -->
            <div class="cfi-card">
                <div class="cfi-card-header">
                    <span class="cfi-badge">CFI 01 - 03</span>
                    <h3 class="cfi-domain-title">${t.d1Title}</h3>
                    <p class="cfi-domain-sub">${t.d1Subtitle}</p>
                </div>
                <button class="cfi-guide-toggle" onclick="toggleCFIEstadoGuia('cfi_guide_d1')">
                    <i class="fas fa-chevron-down"></i> ${t.toggleGuide}
                </button>
                <div id="cfi_guide_d1" class="cfi-guide-box">
                    <ul>
                        ${q.d1.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                <textarea id="cfi_d1" class="cfi-textarea" placeholder="${t.d1NotesPh}"></textarea>
            </div>

            <!-- DOMINIO 2 -->
            <div class="cfi-card">
                <div class="cfi-card-header">
                    <span class="cfi-badge">CFI 04 - 10</span>
                    <h3 class="cfi-domain-title">${t.d2Title}</h3>
                    <p class="cfi-domain-sub">${t.d2Subtitle}</p>
                </div>
                <button class="cfi-guide-toggle" onclick="toggleCFIEstadoGuia('cfi_guide_d2')">
                    <i class="fas fa-chevron-down"></i> ${t.toggleGuide}
                </button>
                <div id="cfi_guide_d2" class="cfi-guide-box">
                    <ul>
                        ${q.d2.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                <textarea id="cfi_d2" class="cfi-textarea" placeholder="${t.d2NotesPh}"></textarea>
            </div>

            <!-- DOMINIO 3 -->
            <div class="cfi-card">
                <div class="cfi-card-header">
                    <span class="cfi-badge">CFI 11 - 13</span>
                    <h3 class="cfi-domain-title">${t.d3Title}</h3>
                    <p class="cfi-domain-sub">${t.d3Subtitle}</p>
                </div>
                <button class="cfi-guide-toggle" onclick="toggleCFIEstadoGuia('cfi_guide_d3')">
                    <i class="fas fa-chevron-down"></i> ${t.toggleGuide}
                </button>
                <div id="cfi_guide_d3" class="cfi-guide-box">
                    <ul>
                        ${q.d3.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                <textarea id="cfi_d3" class="cfi-textarea" placeholder="${t.d3NotesPh}"></textarea>
            </div>

            <!-- DOMINIO 4 -->
            <div class="cfi-card">
                <div class="cfi-card-header">
                    <span class="cfi-badge">CFI 14 - 16</span>
                    <h3 class="cfi-domain-title">${t.d4Title}</h3>
                    <p class="cfi-domain-sub">${t.d4Subtitle}</p>
                </div>
                <button class="cfi-guide-toggle" onclick="toggleCFIEstadoGuia('cfi_guide_d4')">
                    <i class="fas fa-chevron-down"></i> ${t.toggleGuide}
                </button>
                <div id="cfi_guide_d4" class="cfi-guide-box">
                    <ul>
                        ${q.d4.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                <textarea id="cfi_d4" class="cfi-textarea" placeholder="${t.d4NotesPh}"></textarea>
            </div>

            <div class="cfi-actions">
                <button class="btn-cfi-secondary" onclick="copiarInformeCFI()">
                    <i class="far fa-copy"></i> ${t.btnCopy}
                </button>
                <button id="btn-cfi-ai" class="btn-cfi-primary" onclick="sintetizarIACFI()">
                    <i class="fas fa-robot"></i> ${t.btnAI}
                </button>
            </div>

            <button class="btn-cfi-reset" onclick="reiniciarCFI()">${t.btnReset}</button>

            <!-- CAJA DE RESULTADO IA -->
            <div id="cfi-ai-box" class="cfi-ai-box">
                <div class="cfi-ai-box-title">
                    <i class="fas fa-brain"></i> ${t.aiTitle}
                </div>
                <div id="cfi-ai-content" class="cfi-ai-content"></div>
                <button class="btn-cfi-primary" style="width:100%;" onclick="copiarSintesisIACFI()">
                    <i class="far fa-copy"></i> ${t.btnCopy}
                </button>
            </div>

            <div class="cfi-disclaimer">${t.disclaimer}</div>
        </div>
    `;
}

window.copiarInformeCFI = function() {
    const t = i18nCFI[window.cfiLang];
    const term = (document.getElementById('cfi_term')?.value || '').trim();
    const d1 = (document.getElementById('cfi_d1')?.value || '').trim();
    const d2 = (document.getElementById('cfi_d2')?.value || '').trim();
    const d3 = (document.getElementById('cfi_d3')?.value || '').trim();
    const d4 = (document.getElementById('cfi_d4')?.value || '').trim();

    let txt = `FORMULACIÓN CULTURAL (DSM-5-TR / CFI)\n`;
    txt += `--------------------------------------------------\n`;
    if (term) txt += `Descripción del paciente: ${term}\n\n`;
    txt += `1. DEFINICIÓN CULTURAL DEL PROBLEMA:\n${d1 || 'Sin hallazgos consignados.'}\n\n`;
    txt += `2. CAUSAS, CONTEXTO PSICOSOCIAL Y APOYOS:\n${d2 || 'Sin hallazgos consignados.'}\n\n`;
    txt += `3. AFRONTAMIENTO Y BÚSQUEDA PREVIA DE AYUDA:\n${d3 || 'Sin hallazgos consignados.'}\n\n`;
    txt += `4. AYUDA ACTUAL Y RELACIÓN MÉDICO-PACIENTE:\n${d4 || 'Sin hallazgos consignados.'}\n`;

    navigator.clipboard.writeText(txt);
    alert(t.copied);
};

window.sintetizarIACFI = async function() {
    const t = i18nCFI[window.cfiLang];
    const btn = document.getElementById('btn-cfi-ai');
    const aiBox = document.getElementById('cfi-ai-box');
    const aiContent = document.getElementById('cfi-ai-content');

    const term = (document.getElementById('cfi_term')?.value || '').trim();
    const d1 = (document.getElementById('cfi_d1')?.value || '').trim();
    const d2 = (document.getElementById('cfi_d2')?.value || '').trim();
    const d3 = (document.getElementById('cfi_d3')?.value || '').trim();
    const d4 = (document.getElementById('cfi_d4')?.value || '').trim();

    if (!term && !d1 && !d2 && !d3 && !d4) {
        alert(window.cfiLang === 'es' ? 'Introduce notas en al menos un dominio.' : 'Please enter notes in at least one domain.');
        return;
    }

    const payloadContext = {
        idioma: window.cfiLang,
        termino_paciente: term || "No especificado",
        dominio_1_definicion: d1 || "Sin notas",
        dominio_2_causas_contexto: d2 || "Sin notas",
        dominio_3_afrontamiento_previo: d3 || "Sin notas",
        dominio_4_ayuda_actual_relacion: d4 || "Sin notas"
    };

    const originalBtnHTML = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t.aiLoading}`;
    btn.disabled = true;

    try {
        const response = await fetch('/api/ia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                toolId: 'cfi_summary',
                context: JSON.stringify(payloadContext)
            })
        });

        if (!response.ok) throw new Error("Error en respuesta del Worker");

        const resData = await response.json();
        const textoSintesis = resData.response || resData.content || (typeof resData === 'string' ? resData : JSON.stringify(resData));

        aiContent.innerText = textoSintesis;
        aiBox.style.display = 'block';
        aiBox.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        console.error("CFI IA Error:", err);
        alert(t.aiError);
    } finally {
        btn.innerHTML = originalBtnHTML;
        btn.disabled = false;
    }
};

window.copiarSintesisIACFI = function() {
    const t = i18nCFI[window.cfiLang];
    const aiContent = document.getElementById('cfi-ai-content');
    if (!aiContent || !aiContent.innerText) return;
    navigator.clipboard.writeText(aiContent.innerText);
    alert(t.copied);
};

window.reiniciarCFI = function() {
    const confirmMsg = window.cfiLang === 'es' ? '¿Deseas reiniciar los campos?' : 'Do you want to reset all fields?';
    if (confirm(confirmMsg)) {
        ['cfi_term', 'cfi_d1', 'cfi_d2', 'cfi_d3', 'cfi_d4'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        const aiBox = document.getElementById('cfi-ai-box');
        if (aiBox) aiBox.style.display = 'none';
    }
};
