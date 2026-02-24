// --- INTERFAZ CATATONIA (VERSIÓN CLINICAL GRID) ---
window.iniciarInterfazCatatonia = async function() {
    const container = document.getElementById('modalData');

    // 1. ESTILOS (Maquetación exacta a la imagen y protección de UI)
    if (!document.getElementById('cat-styles')) {
        const style = document.createElement('style');
        style.id = 'cat-styles';
        style.innerHTML = `
            .cat-container { padding: 1rem; font-family: 'Segoe UI', system-ui, sans-serif; position: relative; }
            .cat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-right: 50px; }
            .cat-header h2 { margin: 0; font-size: 1.3rem; color: #1e293b; font-weight: 800; }
            
            /* Botón Checklist */
            .btn-chk-mode { 
                background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 6px 12px; 
                border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: 0.2s;
            }
            .btn-chk-mode:hover { background: var(--primary); color: white; border-color: var(--primary); }

            /* LA TABLA (Basada en imagen) */
            .cat-table { 
                display: grid; grid-template-columns: 90px repeat(3, 1fr); 
                border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: white;
            }
            .cell { padding: 8px; border: 0.5px solid #f1f5f9; min-height: 90px; }
            .h-cell { background: #f8fafc; text-align: center; font-weight: 700; font-size: 0.75rem; color: #64748b; padding: 12px 4px; border-bottom: 2px solid #e2e8f0; }
            .s-cell { background: #f8fafc; font-weight: 800; font-size: 0.7rem; color: #94a3b8; display: flex; align-items: center; justify-content: center; writing-mode: vertical-lr; transform: rotate(180deg); }

            /* Síntomas (Badges verdes como en la imagen) */
            .sym-list { display: flex; flex-direction: column; gap: 4px; }
            .sym-badge { 
                background: #f0fdf4; color: #166534; border: 1px solid #dcfce7; padding: 5px 8px; 
                border-radius: 4px; font-size: 0.78rem; cursor: pointer; text-align: center; transition: 0.2s;
            }
            .sym-badge:hover { border-color: #22c55e; transform: translateY(-1px); }
            .sym-badge.active { background: #22c55e !important; color: white !important; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }

            /* Detalles */
            .info-box { 
                margin-top: 1rem; padding: 1rem; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; display: none;
                animation: slideIn 0.3s ease;
            }
            @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

            /* Checklist */
            .checklist-view { display: none; padding-right: 50px; }
            .chk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-top: 1rem; }
            .chk-card { display: flex; align-items: center; gap: 10px; padding: 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.85rem; }
            .chk-card input { width: 18px; height: 18px; accent-color: #22c55e; }
        `;
        document.head.appendChild(style);
    }

    // 2. MAPEO DE SÍNTOMAS (Siguiendo la imagen exactamente)
    const mapaClinico = {
        "Observation": {
            "Increased": ["Agitación / Excitación", "Impulsividad", "Combatividad"],
            "Abnormal": ["Muecas (Grimacing)", "Estereotipias", "Manierismos", "Posturismo", "Perseveración"],
            "Decreased": ["Estupor", "Ambitendencia", "Mirada fija (Staring)"]
        },
        "Interview": {
            "Increased": [],
            "Abnormal": ["Ecolalia", "Ecopraxia", "Verbigeración", "Obediencia automática"],
            "Decreased": ["Negativismo", "Mutismo", "Retraimiento (Withdrawal)"]
        },
        "Physical examination": {
            "Increased": [],
            "Abnormal": ["Flexibilidad cérea", "Catalepsia", "Rigidez", "Gegenhalten", "Mitgehen", "Reflejo de prensión (Grasp)"],
            "Decreased": []
        }
    };

    // 3. CARGA DE DATOS DEL EXCEL
    if (!window.dbCatatonia) {
        try {
            const response = await fetch(`${window.WORKER_URL}?sheet=catatonia`);
            const data = await response.json();
            // Creamos un diccionario rápido para buscar definiciones por nombre
            window.dbCatatonia = {};
            data.values.forEach(row => {
                window.dbCatatonia[row[0].trim()] = {
                    def: row[4] || "Sin definición.",
                    expl: row[3] || "Observación clínica estándar."
                };
            });
        } catch (e) {
            console.error("Error cargando DB:", e);
        }
    }

    // 4. RENDERIZADO
    const renderCell = (metodo, actividad) => {
        const sintomas = mapaClinico[metodo][actividad];
        return `
            <div class="cell">
                <div class="sym-list">
                    ${sintomas.map(s => `<div class="sym-badge" onclick="window.verSintoma('${s}', this)">${s}</div>`).join('')}
                </div>
            </div>
        `;
    };

    container.innerHTML = `
        <div id="cat-explorer" class="cat-container">
            <div class="cat-header">
                <h2>Catatonía</h2>
                <button class="btn-chk-mode" onclick="window.viewCat('chk')">CREAR CHECKLIST</button>
            </div>

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

            <div id="cat-info" class="info-box">
                <h4 id="info-name" style="margin:0 0 8px 0; color:#166534;"></h4>
                <p id="info-def" style="margin:0 0 10px 0; font-size:0.9rem; line-height:1.4; color:#334155;"></p>
                <div style="font-size:0.7rem; font-weight:800; color:#94a3b8; text-transform:uppercase;">Exploración:</div>
                <div id="info-expl" style="font-size:0.85rem; font-style:italic; color:#475569;"></div>
            </div>
        </div>

        <div id="cat-checklist" class="cat-container checklist-view">
            <div class="cat-header">
                <div style="display:flex; align-items:center; gap:12px;">
                    <button class="btn-chk-mode" onclick="window.viewCat('exp')"><i class="fas fa-arrow-left"></i></button>
                    <h2 style="margin:0;">Checklist de Evaluación</h2>
                </div>
                <div id="cat-count" style="background:#22c55e; color:white; padding:4px 12px; border-radius:20px; font-weight:800; font-size:0.8rem;">0 Seleccionados</div>
            </div>
            <div class="chk-grid" id="chk-items"></div>
        </div>
    `;

    // Preparar checklist
    const allSymptoms = Object.values(mapaClinico).flatMap(m => Object.values(m).flat());
    document.getElementById('chk-items').innerHTML = allSymptoms.map(s => `
        <label class="chk-card">
            <input type="checkbox" onchange="window.updateCatCount()">
            <span>${s}</span>
        </label>
    `).join('');
};

// --- LOGICA DE INTERACCIÓN ---

window.verSintoma = function(name, el) {
    document.querySelectorAll('.sym-badge').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    
    const info = window.dbCatatonia[name] || { def: "Definición no encontrada en el Excel.", expl: "Consulte manual clínico." };
    const box = document.getElementById('cat-info');
    box.style.display = 'block';
    document.getElementById('info-name').innerText = name;
    document.getElementById('info-def').innerText = info.def;
    document.getElementById('info-expl').innerText = info.expl;
};

window.viewCat = function(mode) {
    document.getElementById('cat-explorer').style.display = mode === 'exp' ? 'block' : 'none';
    document.getElementById('cat-checklist').style.display = mode === 'chk' ? 'block' : 'none';
};

window.updateCatCount = function() {
    const count = document.querySelectorAll('#cat-checklist input:checked').length;
    document.getElementById('cat-count').innerText = `${count} Seleccionados`;
};
