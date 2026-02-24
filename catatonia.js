// --- INTERFAZ CATATONIA (VERSIÓN CLINICAL GRID PRO - CON IDs) --- 
window.iniciarInterfazCatatonia = async function() {
    const container = document.getElementById('modalData');

    /* =========================
       1. ESTILOS
    ========================== */
    if (!document.getElementById('cat-styles')) {
        const style = document.createElement('style');
        style.id = 'cat-styles';
        style.innerHTML = `
            .cat-container { padding: 1rem; font-family: 'Segoe UI', system-ui, sans-serif; }
            .cat-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
            .cat-header h2 { margin:0; font-size:1.3rem; font-weight:800; color:#1e293b; }

            .btn-chk-mode {
                background:#f1f5f9; border:1px solid #cbd5e1;
                padding:6px 12px; border-radius:6px;
                font-size:0.75rem; font-weight:700;
                cursor:pointer; transition:0.2s;
            }
            .btn-chk-mode:hover { background:#22c55e; color:white; }

            .cat-table {
                display:grid;
                grid-template-columns:90px repeat(3,1fr);
                border:1px solid #e2e8f0;
                border-radius:8px;
                overflow:hidden;
                background:white;
            }

            .cell { padding:8px; border:0.5px solid #f1f5f9; min-height:90px; }
            .h-cell {
                background:#f8fafc;
                text-align:center;
                font-weight:700;
                font-size:0.75rem;
                color:#64748b;
                padding:12px 4px;
                border-bottom:2px solid #e2e8f0;
            }
            .s-cell {
                background:#f8fafc;
                font-weight:800;
                font-size:0.7rem;
                color:#94a3b8;
                display:flex;
                align-items:center;
                justify-content:center;
                writing-mode:vertical-lr;
                transform:rotate(180deg);
            }

            .sym-list { display:flex; flex-direction:column; gap:4px; }

            .sym-badge {
                background:#f0fdf4;
                color:#166534;
                border:1px solid #dcfce7;
                padding:5px 8px;
                border-radius:4px;
                font-size:0.78rem;
                cursor:pointer;
                text-align:center;
                transition:0.2s;
            }
            .sym-badge:hover { border-color:#22c55e; transform:translateY(-1px); }
            .sym-badge.active {
                background:#22c55e !important;
                color:white !important;
            }

            .info-box {
                margin-top:1rem;
                padding:1rem;
                border-radius:8px;
                background:#f8fafc;
                border:1px solid #e2e8f0;
                display:none;
            }
        `;
        document.head.appendChild(style);
    }

    /* =========================
       2. MAPA CLÍNICO CON IDs
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
       3. CARGA EXCEL (ID en F = row[5])
    ========================== */
    if (!window.dbCatatonia) {
        try {
            const response = await fetch(`${window.WORKER_URL}?sheet=catatonia`);
            const data = await response.json();

            window.dbCatatonia = {};

            data.values.forEach(row => {
                const id = row[5]?.trim();  // Columna F
                if (!id) return;

                window.dbCatatonia[id] = {
                    def: row[4] || "Sin definición.",
                    expl: row[3] || "Exploración clínica estándar."
                };
            });

        } catch (e) {
            console.error("Error cargando DB catatonía:", e);
        }
    }

    /* =========================
       4. RENDER
    ========================== */
    const renderCell = (metodo, actividad) => {
        const sintomas = mapaClinico[metodo][actividad];

        return `
            <div class="cell">
                <div class="sym-list">
                    ${sintomas.map(s => `
                        <div class="sym-badge"
                             onclick="window.verSintoma('${s.id}', this)">
                             ${s.label}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };

    container.innerHTML = `
        <div class="cat-container">
            <div class="cat-header">
                <h2>Catatonía</h2>
            </div>

            <div class="cat-table">
                <div class="h-cell" style="border:none;background:transparent;"></div>
                <div class="h-cell">Observation</div>
                <div class="h-cell">Interview</div>
                <div class="h-cell">Physical exam</div>

                <div class="s-cell">Increased</div>
                ${renderCell("Observation","Increased")}
                ${renderCell("Interview","Increased")}
                ${renderCell("Physical examination","Increased")}

                <div class="s-cell">Abnormal</div>
                ${renderCell("Observation","Abnormal")}
                ${renderCell("Interview","Abnormal")}
                ${renderCell("Physical examination","Abnormal")}

                <div class="s-cell">Decreased</div>
                ${renderCell("Observation","Decreased")}
                ${renderCell("Interview","Decreased")}
                ${renderCell("Physical examination","Decreased")}
            </div>

            <div id="cat-info" class="info-box">
                <h4 id="info-name" style="margin:0 0 8px 0;"></h4>
                <p id="info-def" style="margin:0 0 10px 0;"></p>
                <div style="font-size:0.7rem;font-weight:800;color:#94a3b8;">
                    Exploración:
                </div>
                <div id="info-expl" style="font-style:italic;"></div>
            </div>
        </div>
    `;
};


/* =========================
   INTERACCIÓN
========================== */

window.verSintoma = function(id, el) {

    document.querySelectorAll('.sym-badge')
        .forEach(b => b.classList.remove('active'));

    el.classList.add('active');

    const info = window.dbCatatonia[id] || {
        def: "Definición no encontrada en el Excel.",
        expl: "Revise el ID en la hoja."
    };

    document.getElementById('cat-info').style.display = "block";
    document.getElementById('info-name').innerText = el.innerText;
    document.getElementById('info-def').innerText = info.def;
    document.getElementById('info-expl').innerText = info.expl;
};
