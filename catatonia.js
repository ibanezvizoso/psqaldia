// --- INTERFAZ CATATONIA (VERSIÓN COLOR Y RESPONSIVA) ---
window.iniciarInterfazCatatonia = async function() {
    const container = document.getElementById('modalData');

    // Función para generar colores pastel aleatorios pero consistentes
    const getPastelColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash % 360);
        return `hsla(${h}, 70%, 90%, 1)`; // Tono variable, saturación media, mucha luminosidad
    };

    if (!document.getElementById('cat-styles')) {
        const style = document.createElement('style');
        style.id = 'cat-styles';
        style.innerHTML = `
            .cat-ui-wrapper { 
                padding: 1rem; 
                font-family: inherit; 
                max-width: 100%; 
                box-sizing: border-box;
            }
            .cat-header { 
                display: flex; justify-content: space-between; align-items: center; 
                margin-bottom: 1rem; padding-right: 45px; 
            }
            
            /* Contenedor con scroll para que no se corte a la derecha */
            .cat-scroll-container { 
                width: 100%; 
                overflow-x: auto; 
                border-radius: 12px;
                border: 1px solid var(--border);
                background: var(--bg);
            }

            .cat-table { 
                display: grid; 
                grid-template-columns: 80px repeat(3, minmax(150px, 1fr)); 
                min-width: 600px; /* Asegura que la tabla no se colapse */
            }

            .cell { padding: 10px; border: 0.5px solid var(--border); min-height: 100px; }
            .h-cell { 
                background: var(--bg-alt); text-align: center; font-weight: 800; 
                font-size: 0.7rem; text-transform: uppercase; color: var(--primary); 
                padding: 12px; border-bottom: 2px solid var(--border);
            }
            .s-cell { 
                background: var(--bg-alt); font-weight: 900; font-size: 0.65rem; 
                color: var(--text-muted); display: flex; align-items: center; 
                justify-content: center; writing-mode: vertical-lr; transform: rotate(180deg);
            }

            .sym-list { display: flex; flex-direction: column; gap: 6px; }
            .sym-badge { 
                padding: 6px 10px; border-radius: 8px; font-size: 0.8rem; 
                cursor: pointer; text-align: center; transition: 0.2s; 
                border: 1px solid rgba(0,0,0,0.05); font-weight: 500;
                color: #1e293b;
            }
            .sym-badge:hover { filter: brightness(0.9); transform: scale(1.02); }
            .sym-badge.active { outline: 2px solid var(--primary); outline-offset: 2px; font-weight: 800; }

            /* Checklist */
            .checklist-view { display: none; padding-right: 45px; }
            .chk-grid { 
                display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); 
                gap: 10px; margin-top: 1rem; 
            }
            .chk-card { 
                display: flex; align-items: center; gap: 10px; padding: 10px; 
                border-radius: 10px; border: 1px solid var(--border); font-size: 0.85rem; 
            }

            .info-box { 
                margin-top: 1.5rem; padding: 1.2rem; border-radius: 12px; 
                background: var(--bg-alt); border: 1px solid var(--border); display: none;
            }
        `;
        document.head.appendChild(style);
    }

    // 1. CARGA DE DATOS
    if (!window.dbCatatonia) {
        try {
            const response = await fetch(`${window.WORKER_URL}?sheet=catatonia`);
            const data = await response.json();
            window.rawCatData = data.values; // Guardamos para el checklist
            window.dbCatatonia = {};
            data.values.forEach(row => {
                window.dbCatatonia[row[0].trim()] = {
                    metodo: row[2],
                    actividad: row[1],
                    def: row[4] || "Sin definición.",
                    expl: row[3] || "Observación estándar.",
                    color: getPastelColor(row[1] || "General") // Color basado en la actividad/categoría
                };
            });
        } catch (e) { console.error(e); }
    }

    const mapaClinico = {
        "Observation": { "Increased": ["Agitación / Excitación", "Impulsividad", "Combatividad"], "Abnormal": ["Muecas (Grimacing)", "Estereotipias", "Manierismos", "Posturismo", "Perseveración"], "Decreased": ["Estupor", "Ambitendencia", "Mirada fija (Staring)"] },
        "Interview": { "Increased": [], "Abnormal": ["Ecolalia", "Ecopraxia", "Verbigeración", "Obediencia automática"], "Decreased": ["Negativismo", "Mutismo", "Retraimiento (Withdrawal)"] },
        "Physical examination": { "Increased": [], "Abnormal": ["Flexibilidad cérea", "Catalepsia", "Rigidez", "Gegenhalten", "Mitgehen", "Reflejo de prensión (Grasp)"], "Decreased": [] }
    };

    const renderCell = (metodo, actividad) => {
        const sintomas = mapaClinico[metodo][actividad];
        return `
            <div class="cell">
                <div class="sym-list">
                    ${sintomas.map(s => {
                        const color = window.dbCatatonia[s]?.color || '#f1f5f9';
                        return `<div class="sym-badge" style="background:${color}" onclick="window.verSintoma('${s}', this)">${s}</div>`;
                    }).join('')}
                </div>
            </div>
        `;
    };

    container.innerHTML = `
        <div id="cat-explorer" class="cat-ui-wrapper">
            <div class="cat-header">
                <h2>Catatonía</h2>
                <button class="btn btn-primary" onclick="window.viewCat('chk')" style="font-size:0.7rem;">CREAR CHECKLIST</button>
            </div>

            <div class="cat-scroll-container">
                <div class="cat-table">
                    <div class="h-cell" style="border:none; background:transparent;"></div>
                    <div class="h-cell">Observation</div>
                    <div class="h-cell">Interview</div>
                    <div class="h-cell">Physical exam</div>

                    <div class="s-cell">Increased</div>
                    ${renderCell('Observation', 'Increased')}
                    ${renderCell('Interview', 'Increased')}
                    ${renderCell('Physical examination', 'Increased')}

                    <div class="s-cell">Abnormal</div>
                    ${renderCell('Observation', 'Abnormal')}
                    ${renderCell('Interview', 'Abnormal')}
                    ${renderCell('Physical examination', 'Abnormal')}

                    <div class="s-cell">Decreased</div>
                    ${renderCell('Observation', 'Decreased')}
                    ${renderCell('Interview', 'Decreased')}
                    ${renderCell('Physical examination', 'Decreased')}
                </div>
            </div>

            <div id="cat-info" class="info-box">
                <h4 id="info-name" style="margin:0 0 5px 0;"></h4>
                <p id="info-def" style="font-size:0.9rem; margin-bottom:10px;"></p>
                <small id="info-expl" style="color:var(--text-muted); display:block; border-top:1px solid var(--border); padding-top:8px;"></small>
            </div>
        </div>

        <div id="cat-checklist" class="cat-ui-wrapper checklist-view">
            <div class="cat-header">
                <div style="display:flex; align-items:center; gap:10px;">
                    <button class="btn" onclick="window.viewCat('exp')">←</button>
                    <h3>Evaluación</h3>
                </div>
                <div id="cat-count" class="badge">0 Seleccionados</div>
            </div>
            <div class="chk-grid">
                ${Object.keys(window.dbCatatonia).map(s => `
                    <label class="chk-card" style="background:${window.dbCatatonia[s].color}">
                        <input type="checkbox" onchange="window.updateCatCount()">
                        <span>${s}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `;
};

window.verSintoma = function(name, el) {
    document.querySelectorAll('.sym-badge').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    const info = window.dbCatatonia[name];
    document.getElementById('cat-info').style.display = 'block';
    document.getElementById('info-name').innerText = name;
    document.getElementById('info-def').innerText = info?.def || "";
    document.getElementById('info-expl').innerText = "Maniobra: " + (info?.expl || "");
};

window.viewCat = function(mode) {
    document.getElementById('cat-explorer').style.display = mode === 'exp' ? 'block' : 'none';
    document.getElementById('cat-checklist').style.display = mode === 'chk' ? 'block' : 'none';
};

window.updateCatCount = function() {
    const n = document.querySelectorAll('#cat-checklist input:checked').length;
    document.getElementById('cat-count').innerText = `${n} Seleccionados`;
};
