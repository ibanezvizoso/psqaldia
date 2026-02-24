// --- CARGA DE DATOS, ESTILOS Y FUNCIÓN PRINCIPAL CATATONIA ---
window.iniciarInterfazCatatonia = async function() {
    const container = document.getElementById('modalData');

    // A. INYECCIÓN DE ESTILOS OPTIMIZADOS
    if (!document.getElementById('cat-internal-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'cat-internal-styles';
        styleTag.innerHTML = `
            .cat-ui { padding: 1rem; font-family: inherit; position: relative; }
            .cat-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; padding-right: 45px; } /* Espacio para la X del modal */
            .cat-header h2 { margin: 0; font-size: 1.3rem; font-weight: 800; display: flex; align-items: center; gap: 8px; }
            
            /* Botón Checklist Estilizado */
            .btn-checklist-toggle { 
                background: var(--primary-alpha); color: var(--primary); border: 1.2px solid var(--primary);
                padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; cursor: pointer;
                transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.5px;
            }
            .btn-checklist-toggle:hover { background: var(--primary); color: white; }

            /* ESTRUCTURA DE TABLA (Como la imagen) */
            .cat-grid { 
                display: grid; 
                grid-template-columns: 100px repeat(3, 1fr); 
                border: 1px solid var(--border);
                border-radius: 8px; overflow: hidden; background: var(--bg);
            }
            .cat-cell { padding: 10px; border: 0.5px solid var(--border); min-height: 80px; }
            .cat-header-cell { 
                background: var(--bg-alt); text-align: center; font-weight: 800; 
                font-size: 0.75rem; text-transform: uppercase; color: var(--primary);
                display: flex; align-items: center; justify-content: center; border-bottom: 2px solid var(--border);
            }
            .cat-side-cell { 
                background: var(--bg-alt); font-weight: 800; font-size: 0.7rem; 
                text-transform: uppercase; color: var(--text-muted);
                display: flex; align-items: center; justify-content: center; writing-mode: vertical-lr; transform: rotate(180deg);
            }

            /* Síntomas */
            .symptoms-container { display: flex; flex-direction: column; gap: 4px; }
            .sym-badge { 
                padding: 5px 8px; border-radius: 6px; background: #f0fdf4; border: 1px solid #dcfce7;
                font-size: 0.8rem; cursor: pointer; transition: all 0.2s; color: #166534; text-align: center;
            }
            .sym-badge:hover { border-color: var(--primary); transform: translateY(-1px); }
            .sym-badge.active { background: var(--primary); color: white; border-color: var(--primary); box-shadow: 0 4px 10px var(--primary-alpha); }

            /* Info Cards */
            .info-card { padding: 1rem; border-radius: 12px; margin-top: 1rem; display: none; border: 1px solid var(--border); animation: fadeIn 0.3s; }
            .info-card.def { background: var(--bg-alt); border-left: 4px solid var(--primary); }
            
            /* Checklist View */
            .checklist-ui { display: none; padding-right: 40px; }
            .chk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.8rem; margin-top: 1rem; }
            .chk-item { 
                display: flex; align-items: center; gap: 10px; padding: 10px; 
                background: var(--bg-alt); border-radius: 10px; border: 1px solid var(--border); font-size: 0.85rem;
            }
            .counter-pill { background: var(--primary); color: white; padding: 3px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 800; }

            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @media (max-width: 700px) { .cat-grid { grid-template-columns: 60px 1fr 1fr 1fr; } .cat-header-cell { font-size: 0.6rem; } }
        `;
        document.head.appendChild(styleTag);
    }

    // 1. CARGA DE DATOS
    if (!window.dbCatatonia) {
        try {
            const pestaña = "catatonia"; 
            const response = await fetch(`${window.WORKER_URL}?sheet=${pestaña}`);
            const data = await response.json();
            window.dbCatatonia = data.values.map(row => ({
                sintoma: row[0],
                actividad: row[1], // Aumentada, Anormal, Disminuida
                metodo: row[2],    // Observation, Interview, Physical examination
                exploracion: row[3] || "Observación clínica.",
                definicion: row[4]
            }));
        } catch (e) {
            container.innerHTML = `<div style="padding:2rem;">Error de conexión.</div>`;
            return;
        }
    }

    // 2. RENDERIZADO ESTRUCTURA
    container.innerHTML = `
        <div class="cat-ui" id="cat-explorer">
            <div class="cat-header">
                <h2><i class="fas fa-brain"></i> Catatonía</h2>
                <button class="btn-checklist-toggle" onclick="window.switchCatView('checklist')">Crear Checklist</button>
            </div>
            
            <div class="cat-grid">
                <div class="cat-header-cell" style="border:none; background:transparent;"></div>
                <div class="cat-header-cell">Observation</div>
                <div class="cat-header-cell">Interview</div>
                <div class="cat-header-cell">Physical exam</div>

                <div class="cat-side-cell">Increased</div>
                ${renderGridCell('Aumentada', 'Observation')}
                ${renderGridCell('Aumentada', 'Interview')}
                ${renderGridCell('Aumentada', 'Physical examination')}

                <div class="cat-side-cell">Abnormal</div>
                ${renderGridCell('Anormal', 'Observation')}
                ${renderGridCell('Anormal', 'Interview')}
                ${renderGridCell('Anormal', 'Physical examination')}

                <div class="cat-side-cell">Decreased</div>
                ${renderGridCell('Disminuida', 'Observation')}
                ${renderGridCell('Disminuida', 'Interview')}
                ${renderGridCell('Disminuida', 'Physical examination')}
            </div>

            <div id="cat-details">
                <div class="info-card def" id="card-def">
                    <strong id="txt-title" style="display:block; color:var(--primary); margin-bottom:5px;"></strong>
                    <div id="txt-def" style="font-size:0.9rem; margin-bottom:8px;"></div>
                    <small id="txt-expl" style="color:var(--text-muted); font-style:italic;"></small>
                </div>
            </div>
        </div>

        <div class="cat-ui checklist-ui" id="cat-checklist-view">
            <div class="cat-header">
                <div style="display:flex; align-items:center; gap:12px;">
                    <button class="btn" onclick="window.switchCatView('explorer')" style="padding:4px 8px;"><i class="fas fa-arrow-left"></i></button>
                    <h3 style="margin:0;">Evaluación</h3>
                    <div class="counter-pill"><span id="chk-count">0</span> seleccionados</div>
                </div>
            </div>
            <div id="chk-list-container"></div>
        </div>
    `;

    renderChecklist();
};

function renderGridCell(actividad, metodo) {
    const sintomas = window.dbCatatonia.filter(s => s.actividad === actividad && s.metodo === metodo);
    return `
        <div class="cat-cell">
            <div class="symptoms-container">
                ${sintomas.map(s => `<div class="sym-badge" onclick="window.showCatSymptom('${s.sintoma}', this)">${s.sintoma}</div>`).join('')}
            </div>
        </div>
    `;
}

function renderChecklist() {
    const container = document.getElementById('chk-list-container');
    const grupos = ["Aumentada", "Anormal", "Disminuida"];
    
    container.innerHTML = grupos.map(g => `
        <div style="margin-bottom:1.5rem;">
            <div style="font-size:0.7rem; font-weight:900; text-transform:uppercase; color:var(--primary); margin-bottom:8px; border-bottom:1px solid var(--border);">${g}</div>
            <div class="chk-grid">
                ${window.dbCatatonia.filter(d => d.actividad === g).map(s => `
                    <div class="chk-item">
                        <input type="checkbox" style="width:18px; height:18px;" onchange="window.updateCatCount()">
                        <span>${s.sintoma}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

window.showCatSymptom = function(name, el) {
    const data = window.dbCatatonia.find(s => s.sintoma === name);
    document.querySelectorAll('.sym-badge').forEach(b => b.classList.remove('active'));
    el.classList.add('active');

    const card = document.getElementById('card-def');
    card.style.display = 'block';
    document.getElementById('txt-title').innerText = name;
    document.getElementById('txt-def').innerText = data.definicion;
    document.getElementById('txt-expl').innerText = "Maniobra: " + data.exploracion;
};

window.switchCatView = function(view) {
    const isCheck = view === 'checklist';
    document.getElementById('cat-explorer').style.display = isCheck ? 'none' : 'block';
    document.getElementById('cat-checklist-view').style.display = isCheck ? 'block' : 'none';
};

window.updateCatCount = function() {
    const checked = document.querySelectorAll('#cat-checklist-view input:checked').length;
    document.getElementById('chk-count').innerText = checked;
};
