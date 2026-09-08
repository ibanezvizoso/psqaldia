/**
 * cfi.js - Entrevista de Formulación Cultural (CFI - DSM-5-TR)
 * PSQALDÍA v2.0 - Arquitectura pro con layout simétrico a spi.js
 * DSM-5-TR American Psychiatric Association
 */

window.ToolCFI = {
    lang: 'es',
    activeDomain: 1,
    term: '',
    notes: { 1: '', 2: '', 3: '', 4: '' },
    i18n: {
        es: {
            title: "FORMULACIÓN CULTURAL (CFI)",
            termLabel: "Término / metáfora del paciente",
            termPh: "Ej. «nervios», «ataque», «presión en el pecho»...",
            termDefault: "este problema",
            reset: "Reiniciar",
            copyFull: "COPIAR INFORME",
            copyAi: "COPIAR SÍNTESIS",
            copied: "✓ COPIADO",
            ia: "✦ IA SÍNTESIS",
            iaGenerando: "Sintetizando formulación clínica con IA...",
            iaVacio: "Introduce notas en al menos un dominio para sintetizar.",
            iaError: "Error al conectar con el servicio de IA.",
            btnInsert: "Insertar guía",
            dNames: [
                "1. Definición cultural",
                "2. Causas y contexto",
                "3. Afrontamiento",
                "4. Alianza asistencial"
            ],
            dSubtitles: [
                "Significado personal y contextualización social del motivo de consulta",
                "Modelos explicativos, estresores psicosociales, red de apoyo e identidad",
                "Mecanismos propios de resolución, tratamientos previos y barreras de acceso",
                "Expectativas terapéuticas y prevención de malentendidos médico-paciente"
            ],
            placeholders: [
                "Consigne el motivo expresado, términos coloquiales y aspectos que más angustian al paciente...",
                "Anote causas según paciente/familia, recursos de apoyo, factores de estrés e impacto identitario...",
                "Registre qué ha hecho por su cuenta, recursos tradicionales o médicos previos y barreras encontradas...",
                "Describa qué tipo de intervención espera recibir y posibles discrepancias o desconfianza con el equipo asistencial..."
            ],
            guideTitle: "Preguntas clínicas DSM-5-TR",
            guideTip: "Haga clic en una pregunta para pegarla en el bloc de notas."
        },
        en: {
            title: "CULTURAL FORMULATION (CFI)",
            termLabel: "Patient's term / description",
            termPh: "E.g., «nerves», «distress», «chest tightness»...",
            termDefault: "this problem",
            reset: "Reset",
            copyFull: "COPY REPORT",
            copyAi: "COPY SYNTHESIS",
            copied: "✓ COPIED",
            ia: "✦ AI SYNTHESIS",
            iaGenerando: "Synthesizing cultural formulation with AI...",
            iaVacio: "Please enter notes in at least one domain to synthesize.",
            iaError: "Error connecting to AI service.",
            btnInsert: "Insert prompt",
            dNames: [
                "1. Cultural Definition",
                "2. Causes & Context",
                "3. Coping & Past Help",
                "4. Current Care & Alliance"
            ],
            dSubtitles: [
                "Personal meaning and social framing of the presenting concern",
                "Explanatory models, psychosocial stressors, support networks, and identity",
                "Self-coping mechanisms, previous treatment history, and access barriers",
                "Care expectations and preventing clinician-patient misunderstandings"
            ],
            placeholders: [
                "Record patient phrasing, personal idioms of distress, and primary worries...",
                "Record attributed causes, community views, social stressors, and role of cultural identity...",
                "Record autonomous coping, previous healing sought, usefulness, and structural barriers...",
                "Record perceived needs, family recommendations, and potential clinician-patient misalignment..."
            ],
            guideTitle: "DSM-5-TR Clinical Questions",
            guideTip: "Click any question to paste it into the domain notebook."
        }
    },
    questions: {
        es: {
            1: [
                { num: "01", q: "¿Qué le trae hoy aquí?", probe: "Si solo cita un diagnóstico médico: La gente suele entender sus problemas a su manera. ¿Cómo describiría usted su problema?" },
                { num: "02", q: "¿Cómo le describiría [problema] a su familia, amigos o personas de su comunidad?", probe: "Explora la formulación frente a la red social y el lenguaje cotidiano." },
                { num: "03", q: "¿Qué es lo que más le preocupa o le inquieta de [problema]?", probe: "Indaga el aspecto de mayor impacto personal o funcional." }
            ],
            2: [
                { num: "04", q: "¿Por qué cree que le ocurre esto? ¿Cuáles cree que son las causas de [problema]?", probe: "Sondear: sucesos vitales, conflictos personales, factores físicos, emocionales o espirituales." },
                { num: "05", q: "¿Qué piensan sus familiares o allegados sobre la causa de [problema]?", probe: "Identifica discrepancias entre el paciente y su entorno directo." },
                { num: "06", q: "¿Hay apoyos que mejoren [problema] (familia, amigos, comunidad, espiritualidad)?", probe: "Identifica recursos de resiliencia y factores protectores." },
                { num: "07", q: "¿Hay factores de estrés que empeoren [problema] (dinero, empleo, discriminación)?", probe: "Contextualiza los determinantes socioambientales adversos." },
                { num: "08", q: "¿Cuáles son los aspectos más importantes de su origen o identidad (cultura, lengua, procedencia, género, fe)?", probe: "Autodefinición cultural relevante para el caso." },
                { num: "09", q: "¿Hay aspectos de su origen o identidad que marquen una diferencia en [problema]?", probe: "Impacto específico de la identidad en la vivencia del cuadro." },
                { num: "10", q: "¿Hay aspectos de su identidad que le causen otras dificultades (migración, roles, choque generacional)?", probe: "Vulnerabilidades estructurales ligadas al estatus sociocultural." }
            ],
            3: [
                { num: "11", q: "¿Qué ha hecho usted por su cuenta para sobrellevar o manejar [problema]?", probe: "Estrategias autónomas de afrontamiento adaptativas o desadaptativas." },
                { num: "12", q: "¿Qué tipo de ayuda, tratamiento o curación ha buscado en el pasado? ¿Qué le resultó útil y qué no?", probe: "Incluye médicos, salud mental, guías espirituales o medicina tradicional." },
                { num: "13", q: "¿Ha habido algo que le haya impedido recibir la ayuda necesaria?", probe: "Sondear: recursos económicos, trabajo, estigma social, barreras de idioma o culturales." }
            ],
            4: [
                { num: "14", q: "¿Qué tipo de ayuda cree que le resultaría más útil en este momento para [problema]?", probe: "Expectativas asistenciales directas del paciente." },
                { num: "15", q: "¿Hay otros tipos de ayuda que sus familiares o allegados le hayan sugerido?", probe: "Presiones o expectativas divergentes de la red de apoyo." },
                { num: "16", q: "A veces médicos y pacientes no se entienden por tener orígenes o expectativas distintas. ¿Le ha preocupado esto? ¿Qué podemos hacer para darle la atención que necesita?", probe: "Prevención de desavenencias y refuerzo de la alianza terapéutica." }
            ]
        },
        en: {
            1: [
                { num: "01", q: "What brings you here today?", probe: "If medical diagnosis given: People often understand problems in their own way. How would you describe your problem?" },
                { num: "02", q: "How would you describe [problema] to your family, friends, or community?", probe: "Explores communication within the social network." },
                { num: "03", q: "What troubles you most about [problema]?", probe: "Focuses on the most distressing or disabling facets." }
            ],
            2: [
                { num: "04", q: "Why do you think this is happening? What do you think are the causes of [problema]?", probe: "Probe: life events, conflicts, somatic, psychological, or spiritual causes." },
                { num: "05", q: "What do others in your family or community think is causing [problema]?", probe: "Identifies divergence between individual and network models." },
                { num: "06", q: "Are there supports that make [problema] better (family, friends, spirituality)?", probe: "Assesses resilience, protective factors, and coping capital." },
                { num: "07", q: "Are there stresses that make [problema] worse (finances, work, discrimination)?", probe: "Evaluates environmental and systemic psychosocial stressors." },
                { num: "08", q: "What are the most important aspects of your background or identity?", probe: "Self-defined cultural, ethnic, linguistic, gender, or religious elements." },
                { num: "09", q: "Do any aspects of your background or identity make a difference to [problema]?", probe: "Salience of cultural identity in illness expression." },
                { num: "10", q: "Do any aspects of your identity cause difficulties (migration, gender roles, generational gap)?", probe: "Structural difficulties or discrimination related to identity." }
            ],
            3: [
                { num: "11", q: "What have you done on your own to cope with [problema]?", probe: "Evaluates autonomous coping and self-management strategies." },
                { num: "12", q: "In the past, what kinds of care, advice, or healing have you sought? What was helpful and what wasn't?", probe: "Includes medical, psychological, folk healers, and spiritual counselors." },
                { num: "13", q: "Has anything prevented you from getting the help you need?", probe: "Probes financial, systemic, stigma, linguistic, or cultural barriers." }
            ],
            4: [
                { num: "14", q: "What kinds of help do you think would be most useful to you at this time for [problema]?", probe: "Clarifies direct patient preferences and treatment goals." },
                { num: "15", q: "Are there other kinds of help suggested by family, friends, or others?", probe: "Uncovers network suggestions and potential conflicting loyalties." },
                { num: "16", q: "Clinicians and patients sometimes misunderstand each other due to differing backgrounds. Have you been concerned about this? What can we do to provide the care you need?", probe: "Elicits concerns regarding therapeutic rapport and cultural distance." }
            ]
        }
    }
};

window.iniciarCFI = function() {
    const container = document.getElementById('modalData');
    if (!container) return;

    if (!document.getElementById('cfi-pro-styles')) {
        const style = document.createElement('style');
        style.id = 'cfi-pro-styles';
        style.innerHTML = `
            .cfi-container {
                display: flex;
                flex-direction: column;
                height: 85vh;
                min-height: 600px;
                max-height: 920px;
                background: var(--bg, #f8fafc);
                color: var(--text-main, #0f172a);
                font-family: inherit;
                overflow: hidden;
            }

            /* NAV SUPERIOR ESTILO SPI */
            .cfi-nav-ui {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 16px;
                background: var(--card, #ffffff);
                border-bottom: 1px solid var(--border, #e2e8f0);
                flex-shrink: 0;
            }
            .cfi-nav-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.88rem;
                font-weight: 900;
                letter-spacing: 0.02em;
                margin: 0;
            }
            .cfi-nav-title span {
                font-size: 0.65rem;
                background: rgba(37, 99, 235, 0.1);
                color: var(--primary, #2563eb);
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 800;
            }
            .cfi-nav-right {
                display: flex;
                gap: 6px;
                align-items: center;
                margin-right: 35px; /* Margen para botón de cierre del modal */
            }

            /* BARRA DEL TÉRMINO DEL PACIENTE */
            .cfi-term-bar {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 16px;
                background: var(--card, #ffffff);
                border-bottom: 1px solid var(--border, #e2e8f0);
                flex-shrink: 0;
            }
            .cfi-term-label {
                font-size: 0.7rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.04em;
                color: var(--text-muted, #64748b);
                white-space: nowrap;
            }
            .cfi-term-input {
                flex: 1;
                border: 1px solid var(--border, #cbd5e1);
                background: var(--bg, #f8fafc);
                color: var(--text-main, #0f172a);
                font-size: 0.82rem;
                font-weight: 600;
                padding: 5px 10px;
                border-radius: 6px;
                outline: none;
                transition: border-color 0.15s;
            }
            .cfi-term-input:focus {
                border-color: var(--primary, #2563eb);
                background: #fff;
            }

            /* SELECTOR DE PESTAÑAS / DOMINIOS */
            .cfi-tabs {
                display: flex;
                background: var(--card, #ffffff);
                border-bottom: 1px solid var(--border, #e2e8f0);
                padding: 0 16px;
                overflow-x: auto;
                gap: 4px;
                flex-shrink: 0;
            }
            .cfi-tab-btn {
                position: relative;
                background: none;
                border: none;
                padding: 10px 14px;
                font-size: 0.75rem;
                font-weight: 700;
                color: var(--text-muted, #64748b);
                cursor: pointer;
                border-bottom: 2px solid transparent;
                transition: all 0.15s;
                white-space: nowrap;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .cfi-tab-btn:hover { color: var(--primary, #2563eb); }
            .cfi-tab-btn.active {
                color: var(--primary, #2563eb);
                border-bottom-color: var(--primary, #2563eb);
                font-weight: 800;
            }
            .cfi-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: var(--primary, #2563eb);
                display: none;
            }
            .cfi-dot.has-content { display: inline-block; }

            /* ÁREA DE TRABAJO EN 2 PANELES */
            .cfi-workspace {
                flex: 1;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                padding: 12px 16px;
                overflow: hidden;
            }
            @media (max-width: 768px) {
                .cfi-workspace {
                    grid-template-columns: 1fr;
                    grid-template-rows: auto 1fr;
                    overflow-y: auto;
                }
            }

            /* COLUMNA GUÍA DE PREGUNTAS */
            .cfi-guide-col {
                display: flex;
                flex-direction: column;
                background: var(--card, #ffffff);
                border: 1px solid var(--border, #e2e8f0);
                border-radius: 10px;
                overflow: hidden;
            }
            .cfi-guide-header {
                padding: 8px 12px;
                background: rgba(0,0,0,0.02);
                border-bottom: 1px solid var(--border, #e2e8f0);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .cfi-guide-title {
                font-size: 0.72rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.04em;
                color: var(--text-muted, #64748b);
                margin: 0;
            }
            .cfi-guide-scroll {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .cfi-q-card {
                background: var(--bg, #f8fafc);
                border: 1px solid var(--border, #e2e8f0);
                border-left: 3px solid var(--primary, #2563eb);
                border-radius: 6px;
                padding: 8px 10px;
                cursor: pointer;
                transition: transform 0.1s, background 0.15s;
            }
            .cfi-q-card:hover {
                transform: translateX(2px);
                background: #fff;
                box-shadow: 0 2px 6px rgba(0,0,0,0.04);
            }
            .cfi-q-meta {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 4px;
            }
            .cfi-q-badge {
                font-size: 0.6rem;
                font-weight: 900;
                background: rgba(37, 99, 235, 0.12);
                color: var(--primary, #2563eb);
                padding: 1px 5px;
                border-radius: 4px;
            }
            .cfi-q-text {
                font-size: 0.78rem;
                font-weight: 700;
                color: var(--text-main, #0f172a);
                line-height: 1.35;
                margin: 0 0 3px 0;
            }
            .cfi-q-text .term-hl {
                color: var(--primary, #2563eb);
                text-decoration: underline dotted;
            }
            .cfi-q-probe {
                font-size: 0.7rem;
                color: var(--text-muted, #64748b);
                line-height: 1.3;
                margin: 0;
                font-style: italic;
            }

            /* COLUMNA BLOC DE NOTAS */
            .cfi-editor-col {
                display: flex;
                flex-direction: column;
                background: var(--card, #ffffff);
                border: 1px solid var(--border, #e2e8f0);
                border-radius: 10px;
                overflow: hidden;
            }
            .cfi-editor-header {
                padding: 8px 12px;
                border-bottom: 1px solid var(--border, #e2e8f0);
                background: rgba(0,0,0,0.02);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .cfi-editor-title {
                font-size: 0.74rem;
                font-weight: 800;
                color: var(--text-main, #0f172a);
                margin: 0;
            }
            .cfi-editor-sub {
                font-size: 0.68rem;
                color: var(--text-muted, #64748b);
                padding: 6px 12px;
                background: #fff;
                border-bottom: 1px dashed var(--border, #e2e8f0);
                line-height: 1.3;
            }
            .cfi-textarea {
                flex: 1;
                width: 100%;
                box-sizing: border-box;
                border: none;
                padding: 12px;
                font-family: inherit;
                font-size: 0.84rem;
                line-height: 1.5;
                color: var(--text-main, #0f172a);
                background: #fff;
                resize: none;
                outline: none;
            }

            /* PANEL INFERIOR RETRÁCTIL (ESTILO SPI) */
            .cfi-bottom {
                flex-shrink: 0;
                border-top: 1px solid var(--border, #e2e8f0);
                background: var(--card, #ffffff);
            }
            .cfi-info-bar {
                padding: 8px 16px;
                font-size: 0.72rem;
                color: var(--text-muted, #64748b);
                border-left: 4px solid var(--primary, #2563eb);
                background: #fff;
                line-height: 1.3;
            }
            .cfi-ia-output {
                display: none;
                background: var(--bg, #f8fafc);
                border-top: 1px solid var(--border, #e2e8f0);
                padding: 12px 16px;
                font-size: 0.8rem;
                line-height: 1.55;
                color: var(--text-main, #0f172a);
                max-height: 150px;
                overflow-y: auto;
                border-left: 4px solid var(--primary, #2563eb);
                white-space: pre-wrap;
            }
            .cfi-ia-output.visible { display: block; }
            .cfi-ia-output.loading { color: var(--text-muted, #64748b); font-style: italic; }
            .cfi-ia-footer {
                display: none;
                padding: 6px 16px;
                background: var(--card, #ffffff);
                border-top: 1px solid var(--border, #e2e8f0);
                justify-content: flex-end;
                gap: 8px;
            }
            .cfi-ia-footer.visible { display: flex; }

            /* BOTONES MINI IDÉNTICOS A SPI */
            .btn-mini {
                padding: 4px 10px;
                border-radius: 6px;
                border: 1px solid var(--border, #cbd5e1);
                background: var(--card, #ffffff);
                cursor: pointer;
                font-size: 0.7rem;
                font-weight: 700;
                transition: all 0.15s;
                color: var(--text-main, #0f172a);
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
            }
            .btn-mini:hover { background: var(--border, #e2e8f0); }
            .btn-mini.active {
                background: var(--primary, #2563eb);
                color: #ffffff;
                border-color: var(--primary, #2563eb);
            }
            .btn-mini.ia {
                border-color: var(--primary, #2563eb);
                color: var(--primary, #2563eb);
                font-weight: 800;
            }
            .btn-mini.ia:hover {
                background: var(--primary, #2563eb);
                color: #ffffff;
            }
        `;
        document.head.appendChild(style);
    }

    renderInterfazCFI();
};

function renderInterfazCFI() {
    const t = window.ToolCFI.i18n[window.ToolCFI.lang];
    const dIdx = window.ToolCFI.activeDomain;
    const container = document.getElementById('modalData');
    if (!container) return;

    const termUser = window.ToolCFI.term.trim();
    const termDisplay = termUser || t.termDefault;
    const questionsList = window.ToolCFI.questions[window.ToolCFI.lang][dIdx] || [];

    container.innerHTML = `
        <div class="cfi-container">

            <!-- CABECERA DE CONTROL (ESTILO SPI) -->
            <div class="cfi-nav-ui">
                <h2 class="cfi-nav-title">
                    ${t.title} <span>DSM-5-TR</span>
                </h2>
                <div class="cfi-nav-right">
                    <button class="btn-mini ${window.ToolCFI.lang === 'es' ? 'active' : ''}" onclick="setLangCFI('es')">ES</button>
                    <button class="btn-mini ${window.ToolCFI.lang === 'en' ? 'active' : ''}" onclick="setLangCFI('en')">EN</button>
                    <button class="btn-mini ia" onclick="sintetizarIACFI()">${t.ia}</button>
                    <button class="btn-mini" onclick="copiarInformeCFI()" title="${t.copyFull}">
                        <i class="far fa-copy"></i> ${t.copyFull}
                    </button>
                    <button class="btn-mini" onclick="resetCFI()" title="${t.reset}">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>

            <!-- ENCABEZADO: TÉRMINO DEL PACIENTE (DINÁMICO EN PREGUNTAS) -->
            <div class="cfi-term-bar">
                <span class="cfi-term-label">${t.termLabel}:</span>
                <input type="text" id="cfiTermInput" class="cfi-term-input" 
                       placeholder="${t.termPh}" 
                       value="${escapeHTML(window.ToolCFI.term)}" 
                       oninput="onTermChangeCFI(this.value)">
            </div>

            <!-- TABS POR DOMINIO -->
            <div class="cfi-tabs">
                ${[1, 2, 3, 4].map(num => `
                    <button class="cfi-tab-btn ${window.ToolCFI.activeDomain === num ? 'active' : ''}" 
                            onclick="selectDomainCFI(${num})">
                        <span>${t.dNames[num - 1]}</span>
                        <span class="cfi-dot ${window.ToolCFI.notes[num]?.trim() ? 'has-content' : ''}"></span>
                    </button>
                `).join('')}
            </div>

            <!-- ÁREA DE TRABAJO (GUÍA CLÍNICA + EDITOR) -->
            <div class="cfi-workspace">
                
                <!-- COLUMNA IZQUIERDA: PREGUNTAS GUÍA DSM-5-TR -->
                <div class="cfi-guide-col">
                    <div class="cfi-guide-header">
                        <span class="cfi-guide-title">${t.guideTitle}</span>
                        <span style="font-size:0.65rem; color:var(--text-muted);">${t.guideTip}</span>
                    </div>
                    <div class="cfi-guide-scroll">
                        ${questionsList.map(item => {
                            const parsedQ = item.q.replace(/\[problema\]/gi, `<span class="term-hl">${escapeHTML(termDisplay)}</span>`);
                            return `
                                <div class="cfi-q-card" onclick="insertQuestionToNotesCFI('${item.num}')">
                                    <div class="cfi-q-meta">
                                        <span class="cfi-q-badge">CFI ${item.num}</span>
                                    </div>
                                    <p class="cfi-q-text">${parsedQ}</p>
                                    <p class="cfi-q-probe">${item.probe}</p>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- COLUMNA DERECHA: APUNTES CLÍNICOS DEL DOMINIO -->
                <div class="cfi-editor-col">
                    <div class="cfi-editor-header">
                        <span class="cfi-editor-title">${t.dNames[dIdx - 1]}</span>
                        <span id="cfiCharCount" style="font-size:0.65rem; color:var(--text-muted);">
                            ${(window.ToolCFI.notes[dIdx] || '').length} caracteres
                        </span>
                    </div>
                    <div class="cfi-editor-sub">
                        ${t.dSubtitles[dIdx - 1]}
                    </div>
                    <textarea id="cfiDomainNotes" class="cfi-textarea" 
                              placeholder="${t.placeholders[dIdx - 1]}" 
                              oninput="onNotesChangeCFI(${dIdx}, this.value)">${escapeHTML(window.ToolCFI.notes[dIdx] || '')}</textarea>
                </div>

            </div>

            <!-- PANEL INFERIOR RETRÁCTIL: CONSEJO E INTELIGENCIA ARTIFICIAL -->
            <div class="cfi-bottom">
                <div class="cfi-info-bar" id="cfiInfoBar">
                    <strong>DSM-5-TR:</strong> Registre términos literales del paciente y evite interpretar prematureces diagnósticas en la formulación cultural.
                </div>
                <div class="cfi-ia-output" id="cfiIaOutput"></div>
                <div class="cfi-ia-footer" id="cfiIaFooter">
                    <button class="btn-mini" onclick="copiarNarrativaCFI()">
                        <i class="far fa-copy"></i> <span id="cfiBtnCopyText">${t.copyAi}</span>
                    </button>
                </div>
            </div>

        </div>
    `;
}

window.onTermChangeCFI = function(val) {
    window.ToolCFI.term = val;
    // Actualización reactiva de los resaltados en las preguntas sin perder foco
    const t = window.ToolCFI.i18n[window.ToolCFI.lang];
    const display = val.trim() || t.termDefault;
    const cards = document.querySelectorAll('.cfi-q-card');
    const questionsList = window.ToolCFI.questions[window.ToolCFI.lang][window.ToolCFI.activeDomain] || [];

    cards.forEach((card, idx) => {
        if (questionsList[idx]) {
            const parsed = questionsList[idx].q.replace(/\[problema\]/gi, `<span class="term-hl">${escapeHTML(display)}</span>`);
            const p = card.querySelector('.cfi-q-text');
            if (p) p.innerHTML = parsed;
        }
    });
};

window.onNotesChangeCFI = function(domain, val) {
    window.ToolCFI.notes[domain] = val;
    const countEl = document.getElementById('cfiCharCount');
    if (countEl) countEl.innerText = `${val.length} caracteres`;

    // Actualizar indicador de punto en pestaña activa
    const tabs = document.querySelectorAll('.cfi-tab-btn');
    if (tabs[domain - 1]) {
        const dot = tabs[domain - 1].querySelector('.cfi-dot');
        if (dot) {
            if (val.trim()) dot.classList.add('has-content');
            else dot.classList.remove('has-content');
        }
    }
};

window.selectDomainCFI = function(num) {
    window.ToolCFI.activeDomain = num;
    renderInterfazCFI();
    const textarea = document.getElementById('cfiDomainNotes');
    if (textarea) textarea.focus();
};

window.insertQuestionToNotesCFI = function(num) {
    const dIdx = window.ToolCFI.activeDomain;
    const qItem = (window.ToolCFI.questions[window.ToolCFI.lang][dIdx] || []).find(x => x.num === num);
    if (!qItem) return;

    const textarea = document.getElementById('cfiDomainNotes');
    if (!textarea) return;

    const t = window.ToolCFI.i18n[window.ToolCFI.lang];
    const term = window.ToolCFI.term.trim() || t.termDefault;
    const cleanQ = qItem.q.replace(/\[problema\]/gi, `"${term}"`);
    const insertion = `[CFI ${num}: ${cleanQ}]\n- `;

    const currentVal = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newVal = currentVal.substring(0, start) + (start > 0 && !currentVal.endsWith('\n') ? '\n' : '') + insertion + currentVal.substring(end);
    textarea.value = newVal;
    window.onNotesChangeCFI(dIdx, newVal);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
};

window.sintetizarIACFI = async function() {
    const t = window.ToolCFI.i18n[window.ToolCFI.lang];
    const iaOutput = document.getElementById('cfiIaOutput');
    const iaFooter = document.getElementById('cfiIaFooter');
    if (!iaOutput || !iaFooter) return;

    const hasContent = Object.values(window.ToolCFI.notes).some(txt => txt.trim().length > 0) || window.ToolCFI.term.trim().length > 0;
    if (!hasContent) {
        iaOutput.textContent = t.iaVacio;
        iaOutput.className = 'cfi-ia-output visible loading';
        iaFooter.className = 'cfi-ia-footer';
        return;
    }

    // Contexto en string limpio, simétrico a spi.js (evita el bug de doble serialización)
    const contextLines = [
        `ENTREVISTA DE FORMULACIÓN CULTURAL (DSM-5-TR)`,
        `IDIOMA: ${window.ToolCFI.lang.toUpperCase()}`,
        `TÉRMINO O METÁFORA DEL PACIENTE: ${window.ToolCFI.term.trim() || 'No especificado'}`,
        ``,
        `[DOMINIO 1: DEFINICIÓN CULTURAL DEL PROBLEMA]`,
        window.ToolCFI.notes[1]?.trim() || 'Sin notas registradas.',
        ``,
        `[DOMINIO 2: CAUSAS, CONTEXTO PSICOSOCIAL Y APOYOS]`,
        window.ToolCFI.notes[2]?.trim() || 'Sin notas registradas.',
        ``,
        `[DOMINIO 3: AFRONTAMIENTO Y BÚSQUEDA PREVIA DE AYUDA]`,
        window.ToolCFI.notes[3]?.trim() || 'Sin notas registradas.',
        ``,
        `[DOMINIO 4: AYUDA ACTUAL Y ALIANZA ASISTENCIAL]`,
        window.ToolCFI.notes[4]?.trim() || 'Sin notas registradas.'
    ];
    const contextString = contextLines.join('\n');

    iaOutput.textContent = t.iaGenerando;
    iaOutput.className = 'cfi-ia-output visible loading';
    iaFooter.className = 'cfi-ia-footer';

    try {
        const res = await fetch('/api/ia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                toolId: 'cfi', // Conexión estándar idéntica a 'spi'
                context: contextString 
            })
        });

        if (!res.ok) throw new Error("Status " + res.status);
        const data = await res.json();
        
        const texto = (data.response || data.content || (typeof data === 'string' ? data : '')).replace(/\*\*|###|##|\*/g, '').trim();

        if (!texto) throw new Error("Respuesta vacía");

        iaOutput.textContent = texto;
        iaOutput.className = 'cfi-ia-output visible';
        iaFooter.className = 'cfi-ia-footer visible';
    } catch (e) {
        console.error("CFI IA Connection Error:", e);
        iaOutput.textContent = t.iaError;
        iaOutput.className = 'cfi-ia-output visible loading';
        iaFooter.className = 'cfi-ia-footer';
    }
};

window.copiarNarrativaCFI = function() {
    const t = window.ToolCFI.i18n[window.ToolCFI.lang];
    const texto = document.getElementById('cfiIaOutput')?.textContent;
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    const btnSpan = document.getElementById('cfiBtnCopyText');
    if (!btnSpan) return;
    const orig = btnSpan.textContent;
    btnSpan.textContent = t.copied;
    setTimeout(() => { btnSpan.textContent = orig; }, 2000);
};

window.copiarInformeCFI = function() {
    const t = window.ToolCFI.i18n[window.ToolCFI.lang];
    const term = window.ToolCFI.term.trim();
    
    let txt = `FORMULACIÓN CULTURAL (DSM-5-TR / CFI)\n`;
    txt += `==================================================\n`;
    if (term) txt += `TÉRMINO O DESCRIPCIÓN DEL PACIENTE: ${term}\n\n`;
    txt += `1. DEFINICIÓN CULTURAL DEL PROBLEMA:\n${window.ToolCFI.notes[1]?.trim() || 'Sin hallazgos consignados.'}\n\n`;
    txt += `2. CAUSAS, CONTEXTO PSICOSOCIAL Y APOYOS:\n${window.ToolCFI.notes[2]?.trim() || 'Sin hallazgos consignados.'}\n\n`;
    txt += `3. AFRONTAMIENTO Y BÚSQUEDA PREVIA DE AYUDA:\n${window.ToolCFI.notes[3]?.trim() || 'Sin hallazgos consignados.'}\n\n`;
    txt += `4. AYUDA ACTUAL Y RELACIÓN ASISTENCIAL:\n${window.ToolCFI.notes[4]?.trim() || 'Sin hallazgos consignados.'}\n`;
    txt += `==================================================\n`;

    navigator.clipboard.writeText(txt);
    alert(t.copied);
};

window.setLangCFI = function(l) {
    window.ToolCFI.lang = l;
    renderInterfazCFI();
};

window.resetCFI = function() {
    const confirmMsg = window.ToolCFI.lang === 'es' ? '¿Desea reiniciar todos los campos de la entrevista?' : 'Reset all interview fields?';
    if (confirm(confirmMsg)) {
        window.ToolCFI.term = '';
        window.ToolCFI.notes = { 1: '', 2: '', 3: '', 4: '' };
        window.ToolCFI.activeDomain = 1;
        renderInterfazCFI();
    }
};

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}
