// --- CARGA DE DATOS Y FUNCIÓN PRINCIPAL ---
window.iniciarInterfazCatatonia = async function() {
    const container = document.getElementById('modalData');

    // A. ESTILOS REVISADOS (Sin solapamientos y con rejilla real)
    if (!document.getElementById('cat-internal-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'cat-internal-styles';
        styleTag.innerHTML = `
            .cat-ui { padding: 1rem; font-family: inherit; position: relative; color: var(--text-main); }
            
            /* Cabecera con espacio para la X del modal */
            .cat-header { 
                display: flex; align-items: center; justify-content: space-between; 
                margin-bottom: 1.5rem; padding-right: 40px; 
            }
            .cat-header h2 { margin: 0; font-size: 1.2rem; font-weight: 800; color: var(--primary); }

            /* Botón Checklist más estilizado */
            .btn-toggle-view {
                background: var(--primary); color: white; border: none;
                padding: 8px 14px; border-radius: 8px; font-size: 0.7rem;
                font-weight: 700; cursor: pointer; text-transform: uppercase;
            }

            /* LA CUADRÍCULA (Estilo Imagen) */
            .cat-grid {
                display: grid;
                grid-template-columns: 80px repeat(3, 1fr);
                border: 1.5px solid var(--border);
                border-radius: 12px; overflow: hidden;
                background: var(--bg);
            }
            .cat-cell { 
                padding: 12px 8px; border: 0.5px solid var(--border); 
                min-height: 100px; display: flex; flex-direction: column; gap: 6px;
            }
            .cat-header-cell {
                background: #f8fafc; text-align: center; font-weight: 800;
                font-size: 0.7rem; text-transform: uppercase; color: #64748b;
                padding: 12px 5px; border-bottom: 2px solid var(--border);
            }
            .cat-side-cell {
                background: #f8fafc; font-weight: 800; font-size: 0.75rem;
                color: #dc2626; display: flex; align-items: center; justify-content: center;
                writing-mode: vertical-lr; transform: rotate(180deg); border-right: 2px solid var(--border);
            }

            /* Los Síntomas (Badges) */
            .sym-badge {
                padding: 6px 8px; border-radius: 6px; background: #f0fdf4; 
                border: 1px solid #dcfce7; font-size: 0.75rem; cursor: pointer;
                transition: all 0.2s; color: #166534; text-align: center; line-height: 1.2;
            }
            .sym-badge:hover { border-color: var(--primary); background: #f0fdf4; transform: scale(1.02); }
            .sym-badge.active { background: var(--primary) !important; color: white !important; border-color: var(--primary); box-shadow: 0 4px 10px var(--primary-alpha); }

            /* Info Card */
            .info-card { 
                padding: 1rem; border-radius: 12px; margin-top: 1rem; 
                display: none; background: var(--bg-alt); border: 1px solid var(--border);
                animation: fadeIn 0.3s ease;
            }

            /* Checklist (Grid de 2 columnas para que no sea un pegote) */
            .checklist-ui { display: none; padding-right: 40px; }
            .chk-container { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-top: 1rem; }
            .chk-item {
                display: flex; align-items: center; gap: 10px; padding: 10px;
                background: var(--bg-alt); border-radius: 8px; border: 1px solid var(--border);
                font-size: 0.8rem; cursor: pointer;
            }
            .chk-item input { width: 18px; height: 18px; accent-color: var(--primary); }
            .counter-pill { background: var(--primary); color: white; padding: 2px 8px; border-radius: 20px; font-size: 0.75rem; }

            @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
            @media (max-width: 600px) { .chk-container { grid-template-columns: 1fr; } .cat-grid { grid-template-columns: 50px 1fr 1fr 1fr; } }
        `;
        document.head.appendChild(styleTag);
    }

    // 1. CARGA Y NORMALIZACIÓN DE DATOS
    if (!window.dbCatatonia) {
        try {
            const pestaña = "catatonia"; 
            const response = await fetch(`${window.WORKER_URL}?sheet=${pestaña}`);
            const data = await response.json();
            
            window.dbCatatonia = data.values.map(row => ({
                sintoma: row[0],
                // Normalizamos para evitar fallos de matching
                actividad: String(row[1]).trim().toLowerCase(), 
                metodo: String(row[2]).trim().toLowerCase(),
                exploracion: row[3] || "Sin datos de exploración.",
                definicion: row[4] || "Sin definición."
            }));
        } catch (e) {
            container.innerHTML = `<div style="padding:2rem;">Error cargando datos: ${e.message}</div>`;
            return;
        }
    }

    // 2. RENDERIZADO
    container.innerHTML = `
        <div class="cat-ui" id="cat-explorer">
            <div class="cat-header">
                <h2>Catatonía (DSM-5 / Bush-Francis)</h2>
                <button class="btn-toggle-view" onclick="window.switchCatView('checklist')">Crear Checklist</button>
            </div>
            
            <div class="cat-grid">
                <div class="cat-header-cell" style="background:transparent; border:none;"></div>
                <div class="cat-header-cell">Observation</div>
                <div class="cat-header-cell">Interview</div>
                <div class="cat-header-cell">Physical Exam</div>

                <div class="cat-side-cell" style="color:#ef4444;">Increased</div>
                ${renderGridCell('aumentada', 'observation')}
                ${renderGridCell('aumentada', 'interview')}
                ${renderGridCell('aumentada', 'physical examination')}

                <div class="cat-side-cell" style="color:#f59e0b;">Abnormal</div>
                ${renderGridCell('anormal', 'observation')}
                ${renderGridCell('anormal', 'interview')}
                ${renderGridCell('anormal', 'physical examination')}

                <div class="cat-side-cell" style="color:#3b82f6;">Decreased</div>
                ${renderGridCell('disminuida', 'observation')}
                ${renderGridCell('disminuida', 'interview')}
                ${renderGridCell('disminuida', 'physical examination')}
            </div>

            <div class="info-card" id="cat-info-box">
                <div id="info-title" style="font-weight:800; color:var(--primary); margin-bottom:5px; font-size:1rem;"></div>
                <div id="info-def" style="font-size:0.9rem; line-height:1.4; margin-bottom:10px;"></div>
                <div style="font-size:0.7rem; text-transform:uppercase; font-weight:800; color:var(--text-muted);">Exploración:</div>
                <div id="info-expl" style="font-size:0.85rem; font-style:italic;"></div>
            </div>
        </div>

        <div class="cat-ui checklist-ui" id="cat-checklist-view">
            <div class="cat-header">
                <div style="display:flex; align-items:center; gap:10px;">
                    <button class="btn" onclick="window.switchCatView('explorer')" style="padding:5px 10px;"><i class="fas fa-arrow-left"></i></button>
                    <h3 style="margin:0;">Checklist</h3>
                    <div class="counter-pill"><span id="chk-count">0</span> seleccionados</div>
                </div>
            </div>
            <div id="chk-list-content"></div>
        </div>
    `;

    renderChecklist();
};

// --- FUNCIONES DE APOYO ---

function renderGridCell(actividad, metodo) {
    // Buscamos síntomas que coincidan con la fila y la columna
    const sintomas = window.dbCatatonia.filter(s => s.actividad === actividad && s.metodo.includes(metodo));
    
    return `
        <div class="cat-cell">
            ${sintomas.map(s => `
                <div class="sym-badge" onclick="window.showCatSymptom('${s.sintoma.replace(/'/g, "\\'")}', this)">
                    ${s.sintoma}
                </div>
            `).join('')}
        </div>
    `;
}

function renderChecklist() {
    const listContainer = document.getElementById('chk-list-content');
    const categorias = [
        { id: 'aumentada', label: 'Actividad Aumentada' },
        { id: 'anormal', label: 'Actividad Anormal' },
        { id: 'disminuida', label: 'Actividad Disminuida' }
    ];

    listContainer.innerHTML = categorias.map(cat => `
        <div style="margin-top:1rem;">
            <div style="font-size:0.65rem; font-weight:900; color:var(--primary); text-transform:uppercase; border-bottom:1px solid var(--border); padding-bottom:3px; margin-bottom:8px;">${cat.label}</div>
            <div class="chk-container">
                ${window.dbCatatonia.filter(s => s.actividad === cat.id).map(s => `
                    <label class="chk-item">
                        <input type="checkbox" onchange="window.updateCatCount()">
                        <span>${s.sintoma}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `).join('');
}

window.showCatSymptom = function(name, el) {
    const data = window.dbCatatonia.find(s => s.sintoma === name);
    if (!data) return;

    document.querySelectorAll('.sym-badge').forEach(b => b.classList.remove('active'));
    el.classList.add('active');

    const box = document.getElementById('cat-info-box');
    box.style.display = 'block';
    document.getElementById('info-title').innerText = name;
    document.getElementById('info-def').innerText = data.definicion;
    document.getElementById('info-expl').innerText = data.exploracion;
    
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

window.switchCatView = function(view) {
    const isCheck = view === 'checklist';
    document.getElementById('cat-explorer').style.display = isCheck ? 'none' : 'block';
    document.getElementById('cat-checklist-view').style.display = isCheck ? 'block' : 'none';
};

window.updateCatCount = function() {
    const n = document.querySelectorAll('#cat-checklist-view input:checked').length;
    document.getElementById('chk-count').innerText = n;
};
