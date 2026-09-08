/**
 * cfi.js - Guía Clínica de Formulación Cultural (CFI - DSM-5-TR)
 * PSQALDÍA v4.0 - Herramienta de Consulta Rápida en Consulta
 * Sin formularios de entrada. Enfoque: navegación rápida, scripting verbal y sondas clínicas.
 */

window.ToolCFI = {
    lang: 'es',
    activeDomain: 0, // 0: Vista general de los 4 dominios; 1-4: Dominio individual ampliado
    i18n: {
        es: {
            title: "FORMULACIÓN CULTURAL (CFI)",
            badge: "DSM-5-TR",
            viewAll: "TODOS LOS DOMINIOS",
            introTitle: "ENCUADRE INICIAL SUGERIDO (LITERAL)",
            introText: "«Me gustaría entender el problema que le trae hoy aquí para poder ayudarle mejor. Quiero conocer su propia experiencia y sus ideas sobre lo que le sucede. Le haré unas preguntas sobre su situación y cómo la está afrontando. Recuerde que no hay respuestas correctas ni incorrectas».",
            keyLabel: "OBJETIVO CLÍNICO",
            probeLabel: "REPREGUNTA / SONDA DE RESCATE",
            dNames: [
                "1. Definición cultural",
                "2. Causas y contexto",
                "3. Afrontamiento previo",
                "4. Relación asistencial"
            ],
            dSubtitles: [
                "Vivencia subjetiva, significado personal e impacto social (CFI 01-03)",
                "Modelos explicativos, estresores, apoyos e identidad (CFI 04-10)",
                "Recursos propios, itinerario asistencial y barreras (CFI 11-13)",
                "Expectativas terapéuticas y prevención de distancias (CFI 14-16)"
            ]
        },
        en: {
            title: "CULTURAL FORMULATION (CFI)",
            badge: "DSM-5-TR",
            viewAll: "ALL DOMAINS",
            introTitle: "SUGGESTED OPENING SCRIPT",
            introText: "“I would like to understand the problems that bring you here today so that I can help you more effectively. I want to know about your own experience and ideas. I will ask some questions about what is going on and how you deal with it. Please remember there are no right or wrong answers.”",
            keyLabel: "CLINICAL TARGET",
            probeLabel: "PROBE / CLINICAL FOLLOW-UP",
            dNames: [
                "1. Cultural Definition",
                "2. Causes & Context",
                "3. Past Coping & Help",
                "4. Care & Alliance"
            ],
            dSubtitles: [
                "Subjective experience, personal meaning & social impact (CFI 01-03)",
                "Explanatory models, stressors, support & identity (CFI 04-10)",
                "Self-management, treatment pathway & barriers (CFI 11-13)",
                "Care expectations & alliance barriers (CFI 14-16)"
            ]
        }
    },
    data: {
        es: [
            {
                id: 1,
                title: "1. Definición cultural del problema",
                items: [
                    {
                        num: "01",
                        question: "¿Qué le trae hoy aquí?",
                        target: "Explorar la perspectiva propia del paciente sobre su motivo de consulta.",
                        probe: "Si solo cita un diagnóstico médico o etiqueta psiquiátrica: «La gente suele entender sus problemas a su propia manera, que puede ser parecida o diferente a la de los médicos. ¿Cómo describiría usted su problema?»"
                    },
                    {
                        num: "02",
                        question: "¿Cómo le describiría su problema a su familia, amigos o personas de su comunidad?",
                        target: "Identificar modismos compartidos del malestar y cómo se comunica en su entorno natural.",
                        probe: "Indagar si utiliza metáforas culturales, somáticas o emocionales propias de su grupo de origen."
                    },
                    {
                        num: "03",
                        question: "¿Qué es lo que más le preocupa o le inquieta de su problema?",
                        target: "Detectar la faceta más invalidante, dolorosa o temida desde el punto de vista del paciente.",
                        probe: "¿Le preocupa perder su autonomía, el juicio de los demás, el dolor físico o las repercusiones laborales?"
                    }
                ]
            },
            {
                id: 2,
                title: "2. Causas, contexto psicosocial y apoyos",
                items: [
                    {
                        num: "04",
                        question: "¿Por qué cree que le ocurre esto? ¿Cuáles cree que son las causas?",
                        target: "Modelo explicativo propio (biológico, biográfico, moral o espiritual).",
                        probe: "Sondear: «Algunas personas lo explican por cosas malas que pasaron, problemas con otros, enfermedad física, causas espirituales u otros motivos. ¿Qué piensa usted?»"
                    },
                    {
                        num: "05",
                        question: "¿Qué piensan sus familiares o allegados sobre la causa de lo que le pasa?",
                        target: "Contrastar el modelo del paciente con el de su red social directa.",
                        probe: "Permite detectar discrepancias intrafamiliares o presiones para adoptar interpretaciones ajenas."
                    },
                    {
                        num: "06",
                        question: "¿Hay personas o apoyos que alivien su situación o le hagan sentir mejor?",
                        target: "Identificar redes de resiliencia, factores protectores y capital social.",
                        probe: "Sondear apoyos concretos: familia, amigos, compañeros, comunidad religiosa o prácticas espirituales."
                    },
                    {
                        num: "07",
                        question: "¿Hay factores de estrés en su entorno que empeoren su malestar?",
                        target: "Vulnerabilidad socioeconómica y determinantes contextuales.",
                        probe: "Sondear: dificultades económicas, precariedad laboral, conflictos de pareja/familia o discriminación."
                    },
                    {
                        num: "08",
                        question: "¿Cuáles son los aspectos más importantes de su origen o identidad para usted?",
                        target: "Autodefinición del marco identitario relevante para el caso.",
                        probe: "Explorar: cultura de procedencia, lengua materna, grupo étnico, religión, identidad de género u orientación."
                    },
                    {
                        num: "09",
                        question: "¿Hay aspectos de su origen o identidad que marquen una diferencia en su problema?",
                        target: "Impacto directo del marco cultural en la vivencia de la clínica.",
                        probe: "¿Sentiría o viviría esto de manera distinta de haber nacido o vivido en otro entorno?"
                    },
                    {
                        num: "10",
                        question: "¿Hay aspectos de su identidad que le supongan dificultades añadidas?",
                        target: "Estrés de aculturación, choque generacional o discriminación estructural.",
                        probe: "Sondear: proceso migratorio, barreras de idioma, choque de roles familiares o marginación social."
                    }
                ]
            },
            {
                id: 3,
                title: "3. Afrontamiento y búsqueda previa de ayuda",
                items: [
                    {
                        num: "11",
                        question: "¿Qué ha hecho usted por su cuenta para sobrellevar o manejar este problema?",
                        target: "Evaluar mecanismos autónomos de afrontamiento (adaptativos o perjudiciales).",
                        probe: "Sondear auto-aislamiento, rutinas, ejercicio, consumo de sustancias, oración o automedicación."
                    },
                    {
                        num: "12",
                        question: "¿Qué tipo de ayuda, tratamiento o consejo ha buscado en el pasado? ¿Qué fue útil y qué no?",
                        target: "Itinerario asistencial previo y grado de satisfacción con diversas fuentes de ayuda.",
                        probe: "Incluir médicos, psicología, terapias complementarias, medicina tradicional o líderes comunitarios/espirituales."
                    },
                    {
                        num: "13",
                        question: "¿Ha habido algo que le haya impedido recibir la ayuda necesaria?",
                        target: "Identificar barreras de acceso y motivos de abandono terapéutico.",
                        probe: "Sondear: coste económico, horarios, miedo al estigma social, desconfianza médica o falta de traductores."
                    }
                ]
            },
            {
                id: 4,
                title: "4. Ayuda actual y relación médico-paciente",
                items: [
                    {
                        num: "14",
                        question: "¿Qué tipo de ayuda cree que le resultaría más útil en este momento?",
                        target: "Alinear los objetivos terapéuticos con las demandas explícitas del paciente.",
                        probe: "Sondear si prioriza psicofármacos, psicoterapia de apoyo, mediación social, bajas laborales o escucha."
                    },
                    {
                        num: "15",
                        question: "¿Hay otros tipos de ayuda que sus allegados le hayan recomendado?",
                        target: "Detectar presiones o expectativas contrapuestas en su red relacional.",
                        probe: "¿Su familia espera una solución diferente a la que usted busca hoy aquí?"
                    },
                    {
                        num: "16",
                        question: "A veces médicos y pacientes no se entienden por tener orígenes o expectativas distintas. ¿Le ha preocupado esto? ¿Qué podemos hacer para coordinarnos bien?",
                        target: "Prevención activa de desavenencias asistenciales y refuerzo de la alianza.",
                        probe: "Permite ventilar recelos sobre juicios morales, incomprensión de su cultura o barreras de comunicación."
                    }
                ]
            }
        ],
        en: [
            {
                id: 1,
                title: "1. Cultural Definition of the Problem",
                items: [
                    {
                        num: "01",
                        question: "What brings you here today?",
                        target: "Elicit personal framing of the presenting issue.",
                        probe: "If medical diagnosis given: “People often understand their problems in their own way. How would you describe your problem in your own words?”"
                    },
                    {
                        num: "02",
                        question: "How would you describe your problem to your family, friends, or community?",
                        target: "Capture idioms of distress shared within their social sphere.",
                        probe: "Identify whether emotional, somatic, or cultural idioms are preferred."
                    },
                    {
                        num: "03",
                        question: "What troubles you most about your problem?",
                        target: "Identify the most disabling or feared aspect of the condition.",
                        probe: "Is the main concern loss of function, social judgment, physical pain, or role failure?"
                    }
                ]
            },
            {
                id: 2,
                title: "2. Causes, Context, and Support",
                items: [
                    {
                        num: "04",
                        question: "Why do you think this is happening to you? What do you think are the causes?",
                        target: "Personal explanatory models (biomedical, life event, moral, or spiritual).",
                        probe: "Prompt: “Some people explain it through adverse events, interpersonal conflict, bodily illness, or spiritual reasons. What do you think?”"
                    },
                    {
                        num: "05",
                        question: "What do others in your family or circle think is causing your problem?",
                        target: "Contrast personal models against family and network beliefs.",
                        probe: "Uncover family disagreements or external explanatory pressures."
                    },
                    {
                        num: "06",
                        question: "Are there any kinds of support that make your situation better?",
                        target: "Identify resilience factors, community assets, and protective networks.",
                        probe: "Probe support from relatives, community groups, spiritual practices, or peers."
                    },
                    {
                        num: "07",
                        question: "Are there any kinds of stresses that make your situation worse?",
                        target: "Socioeconomic and environmental vulnerabilities.",
                        probe: "Probe financial strain, workplace conditions, family disputes, or discrimination."
                    },
                    {
                        num: "08",
                        question: "What are the most important aspects of your background or identity?",
                        target: "Patient's primary self-identified cultural dimensions.",
                        probe: "Explore country of origin, native language, ethnicity, faith, sexual orientation, or gender identity."
                    },
                    {
                        num: "09",
                        question: "Do any aspects of your background or identity make a difference to your problem?",
                        target: "Direct influence of cultural identity on symptom experience.",
                        probe: "Would this issue be felt differently if you lived within another cultural setting?"
                    },
                    {
                        num: "10",
                        question: "Do any aspects of your identity cause other concerns or difficulties for you?",
                        target: "Acculturative stress, discrimination, or generational friction.",
                        probe: "Probe migration hardships, language barriers, or conflicting role expectations."
                    }
                ]
            },
            {
                id: 3,
                title: "3. Past Coping and Help Seeking",
                items: [
                    {
                        num: "11",
                        question: "What have you done on your own to cope with your problem?",
                        target: "Assess autonomous coping methods (adaptive vs maladaptive).",
                        probe: "Explore withdrawal, daily routines, substance use, prayer, or OTC remedies."
                    },
                    {
                        num: "12",
                        question: "What kinds of care, advice, or healing have you sought in the past? What was useful?",
                        target: "Prior care pathways and perceived utility across health models.",
                        probe: "Include physicians, psychotherapy, traditional/indigenous healers, and spiritual counselors."
                    },
                    {
                        num: "13",
                        question: "Has anything prevented you from getting the help you need?",
                        target: "Systemic and social barriers to mental healthcare engagement.",
                        probe: "Probe financial constraints, schedules, fear of stigma, medical mistrust, or lack of interpreters."
                    }
                ]
            },
            {
                id: 4,
                title: "4. Current Help Seeking & Alliance",
                items: [
                    {
                        num: "14",
                        question: "What kinds of help do you think would be most useful to you right now?",
                        target: "Align clinical goals with the patient's explicit priorities.",
                        probe: "Identify whether they prioritize medications, counseling, social assistance, or medical leave."
                    },
                    {
                        num: "15",
                        question: "Are there other kinds of help that family or friends have suggested?",
                        target: "Detect conflicting external pressures regarding treatment expectations.",
                        probe: "Is their network advising options that conflict with what they seek today?"
                    },
                    {
                        num: "16",
                        question: "Doctors and patients sometimes misunderstand each other due to differing backgrounds. Have you had concerns about this? What can we do to ensure good care?",
                        target: "Proactively reduce cultural distance and strengthen therapeutic rapport.",
                        probe: "Address worries regarding bias, moral judgment, cultural dismissal, or miscommunication."
                    }
                ]
            }
        ]
    }
};

window.iniciarCFI = function() {
    const container = document.getElementById('modalData');
    if (!container) return;

    if (!document.getElementById('cfi-guide-styles')) {
        const style = document.createElement('style');
        style.id = 'cfi-guide-styles';
        style.innerHTML = `
            .cfi-desk {
                display: flex; flex-direction: column; height: 86vh; max-height: 940px;
                background: var(--bg, #f8fafc); color: var(--text-main, #0f172a);
                font-family: inherit; overflow: hidden; border-radius: 1rem;
            }

            /* NAV SUPERIOR ESTILO SPI */
            .cfi-bar {
                display: flex; justify-content: space-between; align-items: center;
                padding: 10px 16px; background: var(--card, #ffffff);
                border-bottom: 1px solid var(--border, #e2e8f0); flex-shrink: 0;
            }
            .cfi-title {
                display: flex; align-items: center; gap: 8px; font-size: 0.88rem;
                font-weight: 900; letter-spacing: 0.02em; margin: 0;
            }
            .cfi-badge {
                font-size: 0.65rem; background: rgba(37, 99, 235, 0.1);
                color: var(--primary, #2563eb); padding: 2px 7px; border-radius: 5px; font-weight: 800;
            }
            .cfi-actions {
                display: flex; gap: 6px; align-items: center; margin-right: 35px;
            }

            /* SCRIPTING VERBAL DE ENCUADRE */
            .cfi-intro-strip {
                background: #eff6ff; border-left: 4px solid var(--primary, #2563eb);
                padding: 10px 16px; flex-shrink: 0; border-bottom: 1px solid var(--border, #e2e8f0);
            }
            .cfi-intro-label {
                font-size: 0.65rem; font-weight: 900; text-transform: uppercase;
                letter-spacing: 0.05em; color: var(--primary, #2563eb); margin-bottom: 3px;
                display: flex; align-items: center; gap: 5px;
            }
            .cfi-intro-quote {
                font-size: 0.8rem; line-height: 1.45; color: #1e3a8a; font-style: italic; margin: 0;
            }

            /* BARRA DE NAVEGACIÓN POR DOMINIOS */
            .cfi-tabs {
                display: flex; background: var(--card, #ffffff); border-bottom: 1px solid var(--border, #e2e8f0);
                padding: 0 16px; overflow-x: auto; gap: 6px; flex-shrink: 0;
            }
            .cfi-tab-btn {
                background: none; border: none; padding: 10px 14px; font-size: 0.74rem;
                font-weight: 700; color: var(--text-muted, #64748b); cursor: pointer;
                border-bottom: 2px solid transparent; transition: all 0.15s; white-space: nowrap;
                display: flex; align-items: center; gap: 6px;
            }
            .cfi-tab-btn:hover { color: var(--primary, #2563eb); }
            .cfi-tab-btn.active {
                color: var(--primary, #2563eb); border-bottom-color: var(--primary, #2563eb); font-weight: 800;
            }

            /* CONTENEDOR CON SCROLL DE LECTURA */
            .cfi-scroll-area {
                flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 16px;
            }

            /* SECCIONES Y TARJETAS DE PREGUNTAS */
            .cfi-domain-header {
                font-size: 0.8rem; font-weight: 900; text-transform: uppercase;
                letter-spacing: 0.04em; color: var(--text-muted, #64748b);
                display: flex; align-items: center; gap: 10px; margin-bottom: 4px;
            }
            .cfi-domain-header::after { content: ''; flex: 1; height: 1px; background: var(--border, #e2e8f0); }

            .cfi-grid {
                display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                gap: 12px;
            }

            .cfi-card {
                background: var(--card, #ffffff); border: 1px solid var(--border, #e2e8f0);
                border-radius: 10px; padding: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                border-left: 4px solid var(--primary, #2563eb);
                display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
            }

            .cfi-q-top {
                display: flex; gap: 10px; align-items: flex-start;
            }
            .cfi-num-pill {
                font-size: 0.65rem; font-weight: 900; background: rgba(37, 99, 235, 0.1);
                color: var(--primary, #2563eb); padding: 3px 6px; border-radius: 6px; flex-shrink: 0;
            }
            .cfi-q-text {
                font-size: 0.9rem; font-weight: 800; line-height: 1.4; color: var(--text-main, #0f172a);
                margin: 0;
            }

            /* META-INFORMACIÓN CLÍNICA Y REPREGUNTAS */
            .cfi-box-target {
                font-size: 0.73rem; color: var(--text-muted, #475569); line-height: 1.35;
                background: var(--bg, #f8fafc); padding: 6px 10px; border-radius: 6px;
                border: 1px solid var(--border, #e2e8f0);
            }
            .cfi-box-probe {
                font-size: 0.74rem; color: #0369a1; line-height: 1.4;
                background: #f0f9ff; padding: 8px 10px; border-radius: 6px;
                border-left: 3px solid #0284c7;
            }
            .cfi-label-micro {
                font-size: 0.6rem; font-weight: 900; text-transform: uppercase;
                letter-spacing: 0.04em; display: block; margin-bottom: 2px;
            }

            /* FOOTER DE APOYO AL EXPLORADOR */
            .cfi-footer-hint {
                background: var(--card, #ffffff); border-top: 1px solid var(--border, #e2e8f0);
                padding: 10px 16px; font-size: 0.72rem; color: var(--text-muted, #64748b);
                flex-shrink: 0; display: flex; justify-content: space-between; align-items: center;
            }

            .btn-mini {
                padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border, #cbd5e1);
                background: var(--card, #ffffff); cursor: pointer; font-size: 0.7rem; font-weight: 700;
                transition: all 0.15s; color: var(--text-main, #0f172a); display: inline-flex;
                align-items: center; justify-content: center; gap: 4px;
            }
            .btn-mini:hover { background: var(--border, #e2e8f0); }
            .btn-mini.active { background: var(--primary, #2563eb); color: #ffffff; border-color: var(--primary, #2563eb); }
        `;
        document.head.appendChild(style);
    }

    renderGuiaCFI();
};

function renderGuiaCFI() {
    const t = window.ToolCFI.i18n[window.ToolCFI.lang];
    const domains = window.ToolCFI.data[window.ToolCFI.lang];
    const container = document.getElementById('modalData');
    if (!container) return;

    // Filtrar dominios según pestaña activa (0 = todos)
    const displayedDomains = window.ToolCFI.activeDomain === 0 
        ? domains 
        : domains.filter(d => d.id === window.ToolCFI.activeDomain);

    container.innerHTML = `
        <div class="cfi-desk">

            <!-- NAV SUPERIOR -->
            <div class="cfi-bar">
                <div class="cfi-title">
                    <span>${t.title}</span>
                    <span class="cfi-badge">${t.badge}</span>
                </div>
                <div class="cfi-actions">
                    <button class="btn-mini ${window.ToolCFI.lang === 'es' ? 'active' : ''}" onclick="setLangCFI('es')">ES</button>
                    <button class="btn-mini ${window.ToolCFI.lang === 'en' ? 'active' : ''}" onclick="setLangCFI('en')">EN</button>
                </div>
            </div>

            <!-- ENCUADRE VERBAL INICIAL -->
            <div class="cfi-intro-strip">
                <div class="cfi-intro-label">
                    <i class="fas fa-comment-medical"></i> ${t.introTitle}
                </div>
                <p class="cfi-intro-quote">${t.introText}</p>
            </div>

            <!-- NAVEGADOR DE PESTAÑAS -->
            <div class="cfi-tabs">
                <button class="cfi-tab-btn ${window.ToolCFI.activeDomain === 0 ? 'active' : ''}" onclick="setDomainCFI(0)">
                    <i class="fas fa-th-large"></i> ${t.viewAll}
                </button>
                ${domains.map(d => `
                    <button class="cfi-tab-btn ${window.ToolCFI.activeDomain === d.id ? 'active' : ''}" onclick="setDomainCFI(${d.id})">
                        ${d.title}
                    </button>
                `).join('')}
            </div>

            <!-- ÁREA SCROLL CON LAS PREGUNTAS Y SONDAS -->
            <div class="cfi-scroll-area">
                ${displayedDomains.map(d => `
                    <div>
                        <div class="cfi-domain-header">${d.title}</div>
                        <div class="cfi-grid">
                            ${d.items.map(item => `
                                <div class="cfi-card">
                                    <div class="cfi-q-top">
                                        <span class="cfi-num-pill">CFI ${item.num}</span>
                                        <p class="cfi-q-text">${item.question}</p>
                                    </div>
                                    
                                    <div class="cfi-box-target">
                                        <span class="cfi-label-micro" style="color:var(--text-muted);">${t.keyLabel}</span>
                                        ${item.target}
                                    </div>

                                    <div class="cfi-box-probe">
                                        <span class="cfi-label-micro" style="color:#0284c7;">${t.probeLabel}</span>
                                        ${item.probe}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- FOOTER INFORMATIVO -->
            <div class="cfi-footer-hint">
                <span><i class="fas fa-info-circle"></i> Las instrucciones del DSM-5-TR recomiendan adaptar el lenguaje y explorar metáforas propias sin imponer el modelo biomédico.</span>
                <span>16 ítems diagnósticos</span>
            </div>

        </div>
    `;
}

window.setDomainCFI = function(id) {
    window.ToolCFI.activeDomain = id;
    renderGuiaCFI();
};

window.setLangCFI = function(l) {
    window.ToolCFI.lang = l;
    renderGuiaCFI();
};
