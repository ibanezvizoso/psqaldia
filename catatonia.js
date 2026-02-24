// --- CARGA DE DATOS, ESTILOS Y FUNCIÓN PRINCIPAL CATATONIA ---
window.iniciarInterfazCatatonia = async function() {
    const container = document.getElementById('modalData');

    // A. INYECCIÓN DE ESTILOS (Siguiendo tu patrón de diseño)
    if (!document.getElementById('cat-internal-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'cat-internal-styles';
        styleTag.innerHTML = `
            .cat-ui { padding: 1.2rem; display: flex; flex-direction: column; gap: 1rem; font-family: inherit; }
            .cat-ui h2 { margin: 0; font-weight: 800; font-size: 1.4rem; }
            
            /* Contenedores de grupos */
            .cat-group { background: var(--bg-alt); border-radius: 1rem; padding: 1rem; border: 1px solid var(--border); }
            .cat-group-title { font-size: 0.7rem; font-weight: 900; text-transform: uppercase; color: var(--primary); margin-bottom: 0.8rem; letter-spacing: 0.5px; }
            
            .obs-subgroup { margin-bottom: 1rem; }
            .obs-subgroup-title { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.4rem; border-bottom: 1px solid var(--border); padding-bottom: 2px; }

            /* Grid de síntomas */
            .symptoms-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
            .sym-badge { 
                padding: 0.5rem 0.8rem; border-radius: 0.8rem; background: var(--bg); border: 1.5px solid var(--border);
                font-size: 0.85rem; cursor: pointer; transition: all 0.2s; font-weight: 500;
            }
            .sym-badge:hover { border-color: var(--primary); color: var(--primary); }
            .sym-badge.active { background: var(--primary); color: white; border-color: var(--primary); box-shadow: 0 4px 12px var(--primary-alpha); }

            /* Cajas de Información */
            .info-card { padding: 1rem; border-radius: 1rem; margin-top: 0.5rem; display: none; animation: fadeIn 0.3s ease; }
            .info-card.def { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); }
            .info-card.expl { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); }
            .info-label { font-size: 0.65rem; font-weight: 900; text-transform: uppercase; display: block; margin-bottom: 4px; }
            
            /* Checklist View */
            .checklist-ui { display: none; }
            .chk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-top: 1rem; }
            .chk-item { 
                display: flex; align-items: center; gap: 8px; font-size: 0.85rem; 
                padding: 0.6rem; background: var(--bg); border-radius: 0.8rem; border: 1px solid var(--border);
            }
            .chk-item input { width: 18px; height: 18px; accent-color: var(--primary); }
            .counter-pill { 
                background: var(--primary); color: white; padding: 4px 12px; border-radius: 50px; 
                font-size: 0.8rem; font-weight: 800; margin-left: auto;
            }

            @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
            @media (max-width: 600px) { .chk-grid { grid-template-columns: 1fr; } }
        `;
        document.head.appendChild(styleTag);
    }

    // 1. CARGA DE DATOS (Vía Worker)
    if (!window.dbCatatonia) {
        try {
            const pestaña = "catatonia"; 
            const response = await fetch(`${window.WORKER_URL}?sheet=${pestaña}`);
            const data = await response.json();

            if (data.error) throw new Error(data.details || data.error);

            window.dbCatatonia = data.values.map(row => ({
                sintoma: row[0],
                actividad: row[1],
                observacion: row[2],
                exploracion: row[3] || "Observación clínica general.",
                definicion: row[4]
            }));
        } catch (e) {
            container.innerHTML = `<div style="padding:2.5rem;">Error: ${e.message}</div>`;
            return;
        }
    }

    // 2. RENDERIZADO ESTRUCTURA BASE
    container.innerHTML = `
        <div class="cat-ui" id="cat-explorer">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem;">
                <h2><i class="fas fa-brain"></i> Catatonía</h2>
                <button class="btn btn-primary" onclick="window.switchCatView('checklist')" style="padding: 0.5rem 1rem; font-size:0.75rem;">CHECKLIST</button>
            </div>
            
            <div id="cat-main-content"></div>

            <div id="cat-details" style="margin-top:1rem;">
                <div class="info-card def" id="card-def">
                    <span class="info-label" style="color:#059669;">Definición</span>
                    <div id="txt-def" style="font-size:0.95rem; line-height:1.4;"></div>
                </div>
                <div class="info-card expl" id="card-expl">
                    <span class="info-label" style="color:#2563eb;">Exploración / Maniobra</span>
                    <div id="txt-expl" style="font-size:0.95rem; line-height:1.4;"></div>
                </div>
            </div>
        </div>

        <div class="cat-ui checklist-ui" id="cat-checklist-view">
            <div style="display:flex; align-items:center; gap:10px;">
                <button class="btn" onclick="window.switchCatView('explorer')" style="background:var(--border); color:var(--text-main);"><i class="fas fa-arrow-left"></i></button>
                <h3>Checklist</h3>
                <div class="counter-pill"><span id="chk-count">0</span> / ${window.dbCatatonia.length}</div>
            </div>
            <div id="chk-list-container"></div>
        </div>
    `;

    renderExplorer();
    renderChecklist();
};

// --- FUNCIONES DE SOPORTE ---

function renderExplorer() {
    const main = document.getElementById('cat-main-content');
    const grupos = ["Aumentada", "Anormal", "Disminuida"];
    
    grupos.forEach(grupo => {
        const sintomasGrupo = window.dbCatatonia.filter(d => d.actividad === grupo);
        if (sintomasGrupo.length === 0) return;

        let html = `<div class="cat-group" style="margin-bottom:1rem;">
            <div class="cat-group-title">${grupo}</div>`;
        
        // Subgrupar por tipo de observación
        const obsTipos = [...new Set(sintomasGrupo.map(s => s.observacion))];
        obsTipos.forEach(tipo => {
            const finalSintomas = sintomasGrupo.filter(s => s.observacion === tipo);
            html += `<div class="obs-subgroup">
                <div class="obs-subgroup-title">${tipo}</div>
                <div class="symptoms-grid">
                    ${finalSintomas.map(s => `<div class="sym-badge" onclick="window.showCatSymptom('${s.sintoma}', this)">${s.sintoma}</div>`).join('')}
                </div>
            </div>`;
        });
        
        html += `</div>`;
        main.innerHTML += html;
    });
}

function renderChecklist() {
    const container = document.getElementById('chk-list-container');
    const grupos = ["Aumentada", "Anormal", "Disminuida"];
    
    grupos.forEach(grupo => {
        const sintomas = window.dbCatatonia.filter(d => d.actividad === grupo);
        container.innerHTML += `
            <div style="margin-top:1.5rem;">
                <div class="obs-subgroup-title" style="color:var(--primary)">Actividad ${grupo}</div>
                <div class="chk-grid">
                    ${sintomas.map(s => `
                        <div class="chk-item">
                            <input type="checkbox" onchange="window.updateCatCount()">
                            <span>${s.sintoma}</span>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    });
}

// Globales para interactividad
window.showCatSymptom = function(name, el) {
    const data = window.dbCatatonia.find(s => s.sintoma === name);
    document.querySelectorAll('.sym-badge').forEach(b => b.classList.remove('active'));
    el.classList.add('active');

    document.getElementById('card-def').style.display = 'block';
    document.getElementById('card-expl').style.display = 'block';
    document.getElementById('txt-def').innerText = data.definicion;
    document.getElementById('txt-expl').innerText = data.exploracion;
};

window.switchCatView = function(view) {
    if (view === 'checklist') {
        document.getElementById('cat-explorer').style.display = 'none';
        document.getElementById('cat-checklist-view').style.display = 'block';
    } else {
        document.getElementById('cat-explorer').style.display = 'block';
        document.getElementById('cat-checklist-view').style.display = 'none';
    }
};

window.updateCatCount = function() {
    const checked = document.querySelectorAll('#cat-checklist-view input:checked').length;
    document.getElementById('chk-count').innerText = checked;
};
