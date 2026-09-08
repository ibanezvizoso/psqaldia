/**
 * cfi.js - Guía Clínica de Formulación Cultural (CFI - DSM-5-TR)
 * PSQALDÍA v4.5 - Minimalist Hub Edition
 */

window.ToolCFI = {
    lang: 'es',
    activeDomain: null, // null: Vista Hub de 4 tarjetas; 1-4: Vista de dominio específico
    expandedItems: {}, // Guarda los acordeones abiertos { '01-target': true, '01-probe': false }

    colors: {
        1: { name: 'rose', bg: '#fff1f2', border: '#fecdd3', accent: '#e11d48', badge: '#ffe4e6', text: '#9f1239' },
        2: { name: 'amber', bg: '#fffbeb', border: '#fde68a', accent: '#d97706', badge: '#fef3c7', text: '#92400e' },
        3: { name: 'emerald', bg: '#f0fdf4', border: '#bbf7d0', accent: '#059669', badge: '#dcfce7', text: '#065f46' },
        4: { name: 'indigo', bg: '#eef2ff', border: '#c7d2fe', accent: '#4f46e5', badge: '#e0e7ff', text: '#3730a3' }
    },

    icons: {
        1: 'fa-comment-dots',
        2: 'fa-project-diagram',
        3: 'fa-compass',
        4: 'fa-handshake'
    },

    i18n: {
        es: {
            title: "FORMULACIÓN CULTURAL (CFI)",
            badge: "DSM-5-TR",
            introTitle: "Encuadre sugerido",
            introText: "«Me gustaría entender el problema que le trae hoy aquí para poder ayudarle mejor. Quiero conocer su propia experiencia y sus ideas sobre lo que le sucede. Le haré unas preguntas sobre su situación y cómo la está afrontando. Recuerde que no hay respuestas correctas ni incorrectas».",
            keyLabel: "Objetivo",
            probeLabel: "Sonda de rescate",
            backHub: "Todos los dominios",
            itemsCount: "preguntas",
            copySuccess: "¡Copiado!",
            dNames: [
                "Definición cultural",
                "Causas y contexto",
                "Afrontamiento previo",
                "Relación asistencial"
            ],
            dSubtitles: [
                "Vivencia subjetiva, significado personal e impacto social.",
                "Modelos explicativos, estresores, identidad y red de apoyo.",
                "Recursos autónomos, itinerario previo y barreras asistenciales.",
                "Expectativas del paciente y prevención de distancias con el profesional."
            ]
        },
        en: {
            title: "CULTURAL FORMULATION (CFI)",
            badge: "DSM-5-TR",
            introTitle: "Opening script",
            introText: "“I would like to understand the problems that bring you here today so that I can help you more effectively. I want to know about your own experience and ideas. I will ask some questions about what is going on and how you deal with it. Please remember there are no right or wrong answers.”",
            keyLabel: "Clinical Target",
            probeLabel: "Clinical Probe",
            backHub: "All domains",
            itemsCount: "questions",
            copySuccess: "Copied!",
            dNames: [
                "Cultural Definition",
                "Causes & Context",
                "Past Coping & Care",
                "Care & Alliance"
            ],
            dSubtitles: [
                "Subjective experience, personal meaning, and social impact.",
                "Explanatory models, stressors, identity, and social networks.",
                "Self-management, prior care pathway, and systemic barriers.",
                "Patient expectations and therapeutic alliance barriers."
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
                title: "4. Ayuda actual y relación asistencial",
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
                        probe: "Include physicians, psychotherapy, traditional healers, and spiritual counselors."
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

    if (!document.getElementById('cfi-styles-v45')) {
        const style = document.createElement('style');
        style.id = 'cfi-styles-v45';
        style.innerHTML = `
            .cfi-app {
                display: flex; flex-direction: column; height: 86vh; max-height: 880px;
                background: #f8fafc; color: #0f172a; font-family: inherit;
                border-radius: 16px; overflow: hidden;
            }
            .cfi-header {
                display: flex; justify-content: space-between; align-items: center;
                padding: 12px 20px; background: #ffffff; border-bottom: 1px solid #f1f5f9;
                flex-shrink: 0;
            }
            .cfi-brand {
                display: flex; align-items: center; gap: 8px; font-weight: 800;
                font-size: 0.85rem; letter-spacing: -0.01em; color: #1e293b;
            }
            .cfi-badge {
                font-size: 0.65rem; background: #f1f5f9; color: #475569;
                padding: 2px 7px; border-radius: 6px; font-weight: 700;
            }
            .cfi-lang-btn {
                background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
                padding: 3px 8px; font-size: 0.72rem; font-weight: 700; cursor: pointer;
                color: #64748b; transition: all 0.15s ease;
            }
            .cfi-lang-btn.active {
                background: #0f172a; color: #ffffff; border-color: #0f172a;
            }

            /* Encuadre sugerido colapsable/minimal */
            .cfi-quote-bar {
                background: #ffffff; border-bottom: 1px solid #f1f5f9;
                padding: 10px 20px; font-size: 0.78rem; line-height: 1.45;
                color: #475569; display: flex; gap: 10px; align-items: flex-start;
                flex-shrink: 0;
            }
            .cfi-quote-tag {
                background: #eff6ff; color: #2563eb; font-size: 0.65rem;
                font-weight: 800; text-transform: uppercase; padding: 2px 6px;
                border-radius: 4px; white-space: nowrap; margin-top: 1px;
            }
            .cfi-quote-text {
                margin: 0; font-style: italic; color: #334155;
            }

            /* Contenedor principal */
            .cfi-body {
                flex: 1; overflow-y: auto; padding: 20px;
            }

            /* HUB DE 4 ETIQUETAS/TARJETAS */
            .cfi-hub-grid {
                display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 16px; align-items: stretch;
            }
            .cfi-hub-card {
                background: #ffffff; border-radius: 14px; padding: 20px;
                border: 1px solid #f1f5f9; cursor: pointer;
                display: flex; flex-direction: column; justify-content: space-between;
                gap: 16px; transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
                position: relative; overflow: hidden;
            }
            .cfi-hub-card::before {
                content: ''; position: absolute; left: 0; top: 0; bottom: 0;
                width: 5px; background: var(--card-accent);
            }
            .cfi-hub-card:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.02);
                border-color: var(--card-border);
            }
            .cfi-hub-top {
                display: flex; justify-content: space-between; align-items: flex-start;
            }
            .cfi-hub-icon-pill {
                width: 40px; height: 40px; border-radius: 10px;
                display: flex; align-items: center; justify-content: center;
                background: var(--card-bg); color: var(--card-accent);
                font-size: 1.1rem;
            }
            .cfi-hub-count {
                font-size: 0.68rem; font-weight: 700; color: #64748b;
                background: #f8fafc; padding: 4px 8px; border-radius: 20px;
            }
            .cfi-hub-title {
                font-size: 0.95rem; font-weight: 800; color: #0f172a; margin: 0 0 6px 0;
            }
            .cfi-hub-desc {
                font-size: 0.77rem; color: #64748b; line-height: 1.4; margin: 0;
            }
            .cfi-hub-cta {
                font-size: 0.72rem; font-weight: 700; color: var(--card-accent);
                display: flex; align-items: center; gap: 5px;
            }

            /* VISTA DETALLE DOMINIO */
            .cfi-nav-strip {
                display: flex; justify-content: space-between; align-items: center;
                margin-bottom: 16px; flex-wrap: wrap; gap: 10px;
            }
            .cfi-btn-back {
                background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px;
                padding: 6px 12px; font-size: 0.75rem; font-weight: 700; color: #334155;
                cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
                transition: background 0.15s ease;
            }
            .cfi-btn-back:hover { background: #f1f5f9; }
            .cfi-domain-pills {
                display: flex; gap: 6px;
            }
            .cfi-domain-pill {
                border: none; border-radius: 8px; padding: 6px 12px; font-size: 0.72rem;
                font-weight: 700; cursor: pointer; transition: all 0.15s ease;
                background: #ffffff; color: #64748b; border: 1px solid #e2e8f0;
            }
            .cfi-domain-pill.active {
                background: var(--active-accent); color: #ffffff; border-color: var(--active-accent);
            }

            /* LISTA DE PREGUNTAS */
            .cfi-item-card {
                background: #ffffff; border-radius: 12px; padding: 16px;
                border: 1px solid #f1f5f9; margin-bottom: 12px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.02);
            }
            .cfi-item-header {
                display: flex; justify-content: space-between; align-items: flex-start;
                gap: 12px; margin-bottom: 12px;
            }
            .cfi-item-id {
                font-size: 0.65rem; font-weight: 900; background: #f8fafc;
                color: #64748b; border: 1px solid #e2e8f0; padding: 2px 6px;
                border-radius: 6px; flex-shrink: 0;
            }
            .cfi-item-q {
                font-size: 0.95rem; font-weight: 800; color: #0f172a;
                line-height: 1.45; margin: 0; flex: 1;
            }
            .cfi-copy-btn {
                background: none; border: none; color: #94a3b8; cursor: pointer;
                font-size: 0.85rem; padding: 4px; transition: color 0.15s ease;
            }
            .cfi-copy-btn:hover { color: #0f172a; }

            /* MICRO-BOTONES COLAPSABLES */
            .cfi-chip-row {
                display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;
            }
            .cfi-chip {
                background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;
                padding: 4px 9px; font-size: 0.68rem; font-weight: 700; color: #475569;
                cursor: pointer; display: inline-flex; align-items: center; gap: 5px;
                transition: all 0.15s ease;
            }
            .cfi-chip:hover { background: #f1f5f9; }
            .cfi-chip.active {
                background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8;
            }

            .cfi-drawer {
                margin-top: 10px; padding: 10px 12px; border-radius: 8px;
                font-size: 0.75rem; line-height: 1.4; animation: fadeIn 0.15s ease;
            }
            .cfi-drawer-target {
                background: #f8fafc; border-left: 3px solid #94a3b8; color: #334155;
            }
            .cfi-drawer-probe {
                background: #f0fdf4; border-left: 3px solid #10b981; color: #065f46;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-3px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }

    renderCFI();
};

function renderCFI() {
    const t = window.ToolCFI.i18n[window.ToolCFI.lang];
    const domains = window.ToolCFI.data[window.ToolCFI.lang];
    const container = document.getElementById('modalData');
    if (!container) return;

    // Header y Encuadre se mantienen siempre limpios
    let html = `
        <div class="cfi-app">
            <div class="cfi-header">
                <div class="cfi-brand">
                    <i class="fas fa-comments text-slate-400"></i>
                    <span>${t.title}</span>
                    <span class="cfi-badge">${t.badge}</span>
                </div>
                <div style="display:flex; gap:5px; margin-right:35px;">
                    <button class="cfi-lang-btn ${window.ToolCFI.lang === 'es' ? 'active' : ''}" onclick="setLangCFI('es')">ES</button>
                    <button class="cfi-lang-btn ${window.ToolCFI.lang === 'en' ? 'active' : ''}" onclick="setLangCFI('en')">EN</button>
                </div>
            </div>

            <div class="cfi-quote-bar">
                <span class="cfi-quote-tag">${t.introTitle}</span>
                <p class="cfi-quote-text">${t.introText}</p>
            </div>

            <div class="cfi-body">
    `;

    // VISTA 1: EL HUB DE 4 ETIQUETAS PASTEL (PANTALLA DE INICIO)
    if (window.ToolCFI.activeDomain === null) {
        html += `<div class="cfi-hub-grid">`;
        domains.forEach((d, i) => {
            const color = window.ToolCFI.colors[d.id];
            const icon = window.ToolCFI.icons[d.id];
            const subtitle = t.dSubtitles[i];

            html += `
                <div class="cfi-hub-card" 
                     style="--card-bg:${color.bg}; --card-border:${color.border}; --card-accent:${color.accent};"
                     onclick="openDomainCFI(${d.id})">
                    <div class="cfi-hub-top">
                        <div class="cfi-hub-icon-pill">
                            <i class="fas ${icon}"></i>
                        </div>
                        <span class="cfi-hub-count">${d.items.length} ${t.itemsCount}</span>
                    </div>
                    <div>
                        <h4 class="cfi-hub-title">${d.title}</h4>
                        <p class="cfi-hub-desc">${subtitle}</p>
                    </div>
                    <div class="cfi-hub-cta">
                        <span>Explorar preguntas</span>
                        <i class="fas fa-arrow-right"></i>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    } 
    // VISTA 2: NAVEGACIÓN Y PREGUNTAS DEL DOMINIO SELECCIONADO
    else {
        const activeDom = domains.find(d => d.id === window.ToolCFI.activeDomain);
        const activeColor = window.ToolCFI.colors[activeDom.id];

        html += `
            <div class="cfi-nav-strip">
                <button class="cfi-btn-back" onclick="openDomainCFI(null)">
                    <i class="fas fa-th-large"></i> ${t.backHub}
                </button>
                <div class="cfi-domain-pills" style="--active-accent:${activeColor.accent};">
                    ${domains.map(d => `
                        <button class="cfi-domain-pill ${d.id === activeDom.id ? 'active' : ''}" 
                                onclick="openDomainCFI(${d.id})">
                            ${d.id}. ${t.dNames[d.id - 1]}
                        </button>
                    `).join('')}
                </div>
            </div>

            <div>
                ${activeDom.items.map(item => {
                    const targetOpen = !!window.ToolCFI.expandedItems[`${item.num}-target`];
                    const probeOpen = !!window.ToolCFI.expandedItems[`${item.num}-probe`];

                    return `
                        <div class="cfi-item-card">
                            <div class="cfi-item-header">
                                <span class="cfi-item-id">CFI ${item.num}</span>
                                <p class="cfi-item-q">${item.question}</p>
                                <button class="cfi-copy-btn" title="Copiar pregunta" onclick="copyPromptCFI('${item.num}', this)">
                                    <i class="far fa-copy"></i>
                                </button>
                            </div>

                            <div class="cfi-chip-row">
                                <button class="cfi-chip ${targetOpen ? 'active' : ''}" onclick="toggleDrawerCFI('${item.num}-target')">
                                    <i class="fas fa-bullseye"></i> ${t.keyLabel}
                                    <i class="fas ${targetOpen ? 'fa-chevron-up' : 'fa-chevron-down'}" style="font-size:0.6rem;"></i>
                                </button>
                                <button class="cfi-chip ${probeOpen ? 'active' : ''}" onclick="toggleDrawerCFI('${item.num}-probe')">
                                    <i class="fas fa-life-ring"></i> ${t.probeLabel}
                                    <i class="fas ${probeOpen ? 'fa-chevron-up' : 'fa-chevron-down'}" style="font-size:0.6rem;"></i>
                                </button>
                            </div>

                            ${targetOpen ? `
                                <div class="cfi-drawer cfi-drawer-target">
                                    <strong>${t.keyLabel}:</strong> ${item.target}
                                </div>
                            ` : ''}

                            ${probeOpen ? `
                                <div class="cfi-drawer cfi-drawer-probe">
                                    <strong>${t.probeLabel}:</strong> ${item.probe}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;
}

window.openDomainCFI = function(id) {
    window.ToolCFI.activeDomain = id;
    renderCFI();
};

window.toggleDrawerCFI = function(key) {
    window.ToolCFI.expandedItems[key] = !window.ToolCFI.expandedItems[key];
    renderCFI();
};

window.setLangCFI = function(l) {
    window.ToolCFI.lang = l;
    renderCFI();
};

window.copyPromptCFI = function(num, btn) {
    const d = window.ToolCFI.data[window.ToolCFI.lang];
    let foundText = "";
    d.forEach(dom => {
        const item = dom.items.find(i => i.num === num);
        if (item) foundText = item.question;
    });

    if (foundText && navigator.clipboard) {
        navigator.clipboard.writeText(foundText).then(() => {
            const original = btn.innerHTML;
            btn.innerHTML = `<i class="fas fa-check" style="color:#10b981;"></i>`;
            setTimeout(() => { btn.innerHTML = original; }, 1200);
        });
    }
};
