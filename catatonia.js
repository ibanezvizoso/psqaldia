// --- INTERFAZ CATATONIA (VERSIÓN CLINICAL GRID PRO - CON COLORES E IDs) ---
window.iniciarInterfazCatatonia = async function() {
    const container = document.getElementById('modalData');

    /* =========================
       1. ESTILOS (Colores y UX)
    ========================== */
    if (!document.getElementById('cat-styles')) {
        const style = document.createElement('style');
        style.id = 'cat-styles';
        style.innerHTML = `
            .cat-container { padding: 1rem; font-family: 'Segoe UI', system-ui, sans-serif; position: relative; }
            .cat-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; padding-right: 45px; }
            .cat-header h2 { margin:0; font-size:1.3rem; font-weight:800; color:#1e293b; }

            .btn-view-toggle {
                background:#f1f5f9; border:1px solid #cbd5e1; padding:6px 12px; border-radius:6px;
                font-size:0.75rem; font-weight:700; cursor:pointer; transition:0.2s; text-transform: uppercase;
            }
            .btn-view-toggle:hover { background:var(--primary); color:white; }

            /* LA TABLA */
            .cat-table {
                display:grid; grid-template-columns:90px repeat(3,1fr);
                border:1.px solid #e2e8f0; border-radius:8px; overflow:hidden; background:white;
            }
            .cell { padding:8px; border:0.5px solid #f1f5f9; min-height:95px; }
            .h-cell {
                background:#f8fafc; text-align:center; font-weight:700; font-size:0.75rem;
                color:#64748b; padding:12px 4px; border-bottom:2px solid #e2e8f0;
            }
            .s-cell {
                font-weight:800; font-size:0.7rem; text-transform:uppercase;
                display:flex; align-items:center; justify-content:center;
                writing-mode:vertical-lr; transform:rotate(180deg);
            }

            /* COLORES POR CATEGORÍA (Suaves) */
            .row-inc { background-color: #f0fdf4; border-left: 4px solid #22c55e; } /* Verde - Aumentado */
            .row-abn { background-color: #fffbeb; border-left: 4px solid #f59e0b; } /* Amarillo - Anormal */
            .row-dec { background-color: #fef2f2; border-left: 4px solid #ef4444; } /* Rojo - Disminuido */
            
            .cell-inc { background-color: rgba(34, 197, 94, 0.02); }
            .cell-abn { background-color: rgba(245, 158, 11, 0.02); }
            .cell-dec { background-color: rgba(239, 68, 68, 0.02); }

            /* SÍNTOMAS */
            .sym-list { display:flex; flex-direction:column; gap:4px; }
            .sym-badge {
                background:white; color:#334155; border:1px solid #e2e8f0;
                padding:5px 8px; border-radius:4px; font-size:0.78rem;
                cursor:pointer; text-align:center; transition:0.2s;
            }
            .sym-badge:hover { border-color:var(--primary); transform:translateY(-1px); background:#f8fafc; }
            .sym-badge.active { background:var(--primary) !important; color:white !important; border-color:var(--primary); }

            .info-box {
                margin-top:1rem; padding:1rem; border-radius:8px;
                background:#f8fafc; border:1px solid #e2e8f0; display:none; animation: fadeIn 0.3s;
            }

            /* CHECKLIST */
            .checklist-view { display: none; padding-right: 45px; }
            .chk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; margin-top: 10px; }
            .chk-card { display: flex; align-items: center; gap: 10px; padding: 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.8rem; cursor: pointer; }
            .chk-card input { width: 16px; height: 16px; accent-color: var(--primary); }
            .counter-pill { background: #1e293b; color: white; padding: 4px 12px; border-radius: 20px; font-weight: 800; font-size: 0.8rem; }

            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `;
        document.head.appendChild(style);
    }

    /* =========================
       2. MAPA CLÍNICO
    ========================== */
    const mapaClinico = {
        "Observation": {
            "Increased": [
                { id:"agitacion", label:"Agitación / Excitación" },
                { id:"impulsividad", label:"Impulsividad" },
                { id:"combatividad", label:"Combatividad" }
            ],
            "Abnormal": [
                { id:"muecas", label:"Muecas (Grimacing)" },
                { id:"estereotipias", label:"Estereotipias" },
                { id:"manierismos", label:"Manierismos" },
                { id:"posturismo", label:"Posturismo" },
                { id:"perseveracion", label:"Perseveración" }
            ],
            "Decreased": [
                { id:"estupor", label:"Estupor" },
                { id:"ambitendencia", label:"Ambitendencia" },
                { id:"staring", label:"Mirada fija (Staring)" }
            ]
        },
        "Interview": {
            "Increased": [],
            "Abnormal": [
                { id:"ecolalia", label:"Ecolalia" },
                { id:"ecopraxia", label:"Ecopraxia" },
                { id:"verbigeracion", label:"Verbigeración" },
                { id:"obediencia", label:"Obediencia automática" }
            ],
            "Decreased": [
                { id:"negativismo", label:"Negativismo" },
                { id:"mutismo", label:"Mutismo" },
                { id:"retraimiento", label:"Retraimiento (Withdrawal)" }
            ]
        },
        "Physical examination": {
            "Increased": [],
            "Abnormal": [
                { id:"flexibilidad", label:"Flexibilidad cérea" },
                { id:"catalepsia", label:"Catalepsia" },
                { id:"rigidez", label:"Rigidez" },
                { id:"gegenhalten", label:"Gegenhalten" },
                { id:"mitgehen", label:"Mitgehen" },
                { id:"grasp", label:"Reflejo de prensión (Grasp)" }
            ],
            "Decreased": []
        }
    };

    /* =========================
       3. CARGA EXCEL
    ========================== */
    if (!window.dbCatatonia) {
        try {
            const response = await fetch(`${window.WORKER_URL}?sheet=catatonia`);
            const data = await response.json();
            window.dbCatatonia = {};
            data.values.forEach(row => {
                const id = row[5]?.trim();
                if (id) window.dbCatatonia[id] = { def: row[4], expl: row[3] };
            });
        } catch (e) { console.error("Error DB:", e); }
    }

    /* =========================
       4. RENDERIZADO
    ========================== */
    const totalSintomas = 24; // Como pediste: X/24

    const renderCell = (metodo, actividad, bgClass) => {
        const sintomas = mapaClinico[metodo][actividad];
        return `
            <div class="cell ${bgClass}">
                <div class="sym-list">
                    ${sintomas.map(s => `
                        <div class="sym-badge" onclick="window.verSintoma('${s.id}', this)">
                            ${s.label}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };

    container.innerHTML = `
        <div id="cat-explorer" class="cat-container">
            <div class="cat-header">
                <h2>Catatonía</h2>
                <button class="btn-view-toggle" onclick="window.switchCat('chk')">Checklist</button>
            </div>

            <div class="cat-table">
                <div class="h-cell" style="border:none;background:transparent;"></div>
                <div class="h-cell">Observation</div>
                <div class="h-cell">Interview</div>
                <div class="h-cell">Physical exam</div>

                <div class="s-cell row-inc">Increased</div>
                ${renderCell("Observation","Increased", "cell-inc")}
                ${renderCell("Interview","Increased", "cell-inc")}
                ${renderCell("Physical examination","Increased", "cell-inc")}

                <div class="s-cell row-abn">Abnormal</div>
                ${renderCell("Observation","Abnormal", "cell-abn")}
                ${renderCell("Interview","Abnormal", "cell-abn")}
                ${renderCell("Physical examination","Abnormal", "cell-abn")}

                <div class="s-cell row-dec">Decreased</div>
                ${renderCell("Observation","Decreased", "cell-dec")}
                ${renderCell("Interview","Decreased", "cell-dec")}
                ${renderCell("Physical examination","Decreased", "cell-dec")}
            </div>

            <div id="cat-info" class="info-box">
                <h4 id="info-name" style="margin:0 0 5px 0; color:var(--primary);"></h4>
                <p id="info-def" style="margin:0 0 10px 0; font-size:0.9rem; line-height:1.4;"></p>
                <div style="font-size:0.65rem; font-weight:800; color:#94a3b8; text-transform:uppercase;">Maniobra Exploratoria:</div>
                <div id="info-expl" style="font-size:0.85rem; font-style:italic; color:#64748b;"></div>
            </div>
        </div>

        <div id="cat-checklist" class="cat-container checklist-view">
            <div class="cat-header">
                <div style="display:flex; align-items:center; gap:12px;">
                    <button class="btn-view-toggle" onclick="window.switchCat('exp')">← Volver</button>
                    <h2 style="margin:0;">Evaluación</h2>
                </div>
                <div class="counter-pill" id="cat-counter">0 / ${totalSintomas}</div>
            </div>
            <div class="chk-grid" id="chk-content"></div>
        </div>
    `;

    // Generar checklist
    const allSyms = Object.values(mapaClinico).flatMap(m => Object.values(m).flat());
    document.getElementById('chk-content').innerHTML = allSyms.map(s => `
        <label class="chk-card">
            <input type="checkbox" onchange="window.updateCatCounter()">
            <span>${s.label}</span>
        </label>
    `).join('');
};

/* =========================
   INTERACCIÓN GLOBAL
========================== */
window.verSintoma = function(id, el) {
    document.querySelectorAll('.sym-badge').forEach(b => b.classList.remove('active'));
    el.classList.add('active');

    const info = window.dbCatatonia[id] || { def: "No definida.", expl: "N/A" };
    document.getElementById('cat-info').style.display = "block";
    document.getElementById('info-name').innerText = el.innerText;
    document.getElementById('info-def').innerText = info.def;
    document.getElementById('info-expl').innerText = info.expl;
};

window.switchCat = function(mode) {
    document.getElementById('cat-explorer').style.display = mode === 'exp' ? 'block' : 'none';
    document.getElementById('cat-checklist').style.display = mode === 'chk' ? 'block' : 'none';
};

window.updateCatCounter = function() {
    const checked = document.querySelectorAll('#cat-checklist input:checked').length;
    document.getElementById('cat-counter').innerText = `${checked} / 24`;
};
