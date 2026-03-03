// --- INTERFAZ CATATONIA (BOTÓN NARROW + COLORES SEMÁFORO) ---
window.iniciarInterfazCatatonia = async function() {
    const container = document.getElementById('modalData');

    const getColorByActividad = (act) => {
        const normalized = String(act).toLowerCase().trim();
        if (normalized.includes('aumentada') || normalized.includes('aumento')) return 'hsla(140, 70%, 92%, 1)'; // Verde
        if (normalized.includes('anormal')) return 'hsla(50, 85%, 90%, 1)'; // Amarillo
        if (normalized.includes('disminuida') || normalized.includes('disminuido')) return 'hsla(0, 80%, 92%, 1)'; // Rojo
        return 'hsla(210, 20%, 95%, 1)'; 
    };

    if (!document.getElementById('cat-styles')) {
        const style = document.createElement('style');
        style.id = 'cat-styles';
        style.innerHTML = `
            .cat-ui-wrapper { padding: 1rem; font-family: inherit; max-width: 100%; box-sizing: border-box; }
            .cat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-right: 45px; }
            .cat-header h2 { font-size: 1.1rem; font-weight: 800; margin: 0; }
            
            /* Botón CREAR CHECKLIST extremadamente estrecho horizontalmente */
            .btn-narrow-hor { 
                padding: 4px 10px; 
                font-size: 0.8rem; 
                font-weight: 800; 
                text-transform: uppercase; 
                border-radius: 5px; 
                width: fit-content; /* Se ajusta solo al texto */
                line-height: 1;
                border: 1.3px solid var(--primary);
                background: transparent;
                color: var(--primary);
            }

            .cat-scroll-container { width: 100%; overflow-x: auto; border-radius: 12px; border: 1px solid var(--border); background: var(--bg); }
            .cat-table { display: grid; grid-template-columns: 80px repeat(3, minmax(140px, 1fr)); min-width: 580px; }
            .cell { padding: 8px; border: 0.5px solid var(--border); min-height: 90px; }
            .h-cell { background: var(--bg-alt); text-align: center; font-weight: 800; font-size: 0.65rem; text-transform: uppercase; color: var(--primary); padding: 10px; border-bottom: 2px solid var(--border); }
            .s-cell { background: var(--bg-alt); font-weight: 900; font-size: 0.6rem; color: var(--text-muted); display: flex; align-items: center; justify-content: center; writing-mode: vertical-lr; transform: rotate(180deg); }

            .sym-list { display: flex; flex-direction: column; gap: 4px; }
            .sym-badge { padding: 5px 8px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; text-align: center; transition: 0.2s; border: 1px solid rgba(0,0,0,0.04); color: #1e293b; line-height: 1.1; }
            .sym-badge:hover { filter: brightness(0.95); transform: scale(1.02); }
            .sym-badge.active { outline: 2px solid var(--primary); font-weight: 800; }

            /* Checklist en 2 columnas */
            .checklist-view { display: none; padding-right: 45px; }
            .chk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 1rem; }
            .chk-card { display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 8px; border: 1px solid var(--border); font-size: 0.8rem; cursor: pointer; }
            .chk-card input { width: 16px; height: 16px; accent-color: var(--primary); margin: 0; }

            /* Info Box y Maniobra con tono Azul/Púrpura */
            .info-box { margin-top: 1rem; padding: 1rem; border-radius: 12px; background: var(--bg-alt); border: 1px solid var(--border); display: none; }
            .maneuver-box { 
                margin-top: 10px; padding: 10px; border-radius: 8px; 
                background: #f0f4ff; border: 1px solid #dbeafe; 
                border-left: 4px solid #7c3aed; /* Púrpura para destacar */
            }
            .maneuver-header { font-size: 0.65rem; font-weight: 900; text-transform: uppercase; color: #6d28d9; display: block; margin-bottom: 4px; }
            
            .counter-pill { background: var(--primary); color: white; padding: 2px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; }
            .criteria-container { 
    display: flex; 
    flex-direction: column; 
    gap: 8px; 
    margin-bottom: 15px; 
    background: var(--bg-alt); 
    padding: 10px; 
    border-radius: 10px; 
    border: 1px solid var(--border);
}
.crit-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.crit-label { font-size: 0.7rem; font-weight: 800; width: 90px; color: var(--text-muted); }
.progress-bg { flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; position: relative; }
.progress-bar { height: 100%; width: 0%; background: var(--primary); transition: 0.3s; }
.crit-status { font-size: 0.65rem; font-weight: 900; min-width: 100px; text-align: right; }
.met { color: #10b981; } /* Verde para cuando cumple */
        `;
        document.head.appendChild(style);
    }

    // 1. CARGA DE DATOS
    if (!window.dbCatatonia) {
        try {
            const response = await fetch(`${window.WORKER_URL}?sheet=catatonia`);
            const data = await response.json();
            window.totalSintomas = data.values.length;
            window.dbCatatonia = {};
            data.values.forEach(row => {
                const nombre = row[0].trim();
                window.dbCatatonia[nombre] = {
                    actividad: row[1],
                    def: row[4] || "Sin definición.",
                    expl: row[3] || "Sin datos de maniobra.",
                    color: getColorByActividad(row[1]),
                    dsm: String(row[6]).toUpperCase() === 'TRUE',
        fink: String(row[7]).trim().toUpperCase(), // Guardará 'PRIM', 'PRIMPLUS' o 'SEC'
        lohr: String(row[8]).trim().toUpperCase()  // Guardará 'PRIM' o 'SEC'
                };
            });
        } catch (e) { console.error("Error DB:", e); }
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
                        const sData = window.dbCatatonia[s];
                        return `<div class="sym-badge" style="background:${sData?.color || '#eee'}" onclick="window.verSintoma('${s}', this)">${s}</div>`;
                    }).join('')}
                </div>
            </div>
        `;
    };

    container.innerHTML = `
        <div id="cat-explorer" class="cat-ui-wrapper">
            <div class="cat-header">
                <h2>Catatonía</h2>
                <button class="btn-narrow-hor" onclick="window.viewCat('chk')">Crear checklist</button>
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
                <h4 id="info-name" style="margin:0 0 5px 0; font-size:0.95rem; color:var(--primary);"></h4>
                <p id="info-def" style="font-size:0.85rem; margin-bottom:5px; line-height:1.4;"></p>
                <div class="maneuver-box">
                    <span class="maneuver-header">Maniobra de exploración</span>
                    <div id="info-expl" style="font-size:0.82rem; font-style:italic; color:#1e293b;"></div>
                </div>
            </div>
        </div>

     
<div id="cat-checklist" class="cat-ui-wrapper checklist-view">
    <div class="cat-header">
        <div style="display:flex; align-items:center; gap:10px;">
            <button class="btn-narrow-hor" style="min-width:30px;" onclick="window.viewCat('exp')">←</button>
            <h3 style="margin:0; font-size:1rem;">Checklist</h3>
        </div>
        <div id="cat-count" class="counter-pill">0 / ${window.totalSintomas || 0}</div>
    </div>

    <div class="criteria-container">
        <div class="crit-row">
            <span class="crit-label">DSM-V</span>
            <div class="progress-bg"><div class="progress-bar" id="bar-dsm"></div></div>
            <span class="crit-status" id="status-dsm">0 / 3</span>
        </div>
        <div class="crit-row">
            <span class="crit-label">TAYLOR & FINK</span>
            <div class="progress-bg"><div class="progress-bar" id="bar-fink"></div></div>
            <span class="crit-status" id="status-fink">Incompleto</span>
        </div>
        <div class="crit-row">
            <span class="crit-label">LOHR & WISN.</span>
            <div class="progress-bg"><div class="progress-bar" id="bar-lohr"></div></div>
            <span class="crit-status" id="status-lohr">Incompleto</span>
        </div>
    </div>

    <div class="chk-grid">
        ${Object.keys(window.dbCatatonia).map(s => `
            <label class="chk-card" style="background:${window.dbCatatonia[s].color}">
                <input type="checkbox" data-sintoma="${s}" onchange="window.updateCatCount()">
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
    document.getElementById('info-expl').innerText = info?.expl || "";
};

window.viewCat = function(mode) {
    document.getElementById('cat-explorer').style.display = mode === 'exp' ? 'block' : 'none';
    document.getElementById('cat-checklist').style.display = mode === 'chk' ? 'block' : 'none';
};

/* --- SUSTITUYE TU FUNCIÓN updateCatCount ANTIGUA POR ESTA --- */
window.updateCatCount = function() {
    // 1. Contar totales
    const checkedCheckboxes = document.querySelectorAll('#cat-checklist input:checked');
    const n = checkedCheckboxes.length;
    document.getElementById('cat-count').innerText = `${n} / ${window.totalSintomas}`;

    // 2. Obtener los datos de los síntomas que están marcados actualmente
    const activos = Array.from(checkedCheckboxes).map(i => window.dbCatatonia[i.dataset.sintoma]);

    // --- LÓGICA DSM (3 o más síntomas marcados como TRUE en columna G) ---
    const dsmCount = activos.filter(s => s.dsm).length;
    const dsmPct = Math.min((dsmCount / 3) * 100, 100);
    document.getElementById('bar-dsm').style.width = dsmPct + '%';
    const dsmMet = dsmCount >= 3;
    document.getElementById('status-dsm').innerHTML = dsmMet ? '✅ CUMPLE DSM' : `${dsmCount} / 3`;
    document.getElementById('status-dsm').className = `crit-status ${dsmMet ? 'met' : ''}`;

    // --- LÓGICA TAYLOR & FINK (1 PRIM + 1 PRIMPLUS  Ó  2 de tipo PP/SEC) ---
    const fP = activos.filter(s => s.fink === 'PRIM').length;
    const fPP = activos.filter(s => s.fink === 'PRIMPLUS').length;
    const fS = activos.filter(s => s.fink === 'SEC').length;
    const finkMet = (fP >= 1 && fPP >= 1) || (fPP + fS >= 2);
    
    document.getElementById('bar-fink').style.width = finkMet ? '100%' : (fP+fPP+fS > 0 ? '50%' : '0%');
    document.getElementById('status-fink').innerHTML = finkMet ? '✅ CUMPLE FINK' : 'Incompleto';
    document.getElementById('status-fink').className = `crit-status ${finkMet ? 'met' : ''}`;

    // --- LÓGICA LOHR & WISNIEWSKI (1 PRIM + 2 SEC) ---
    const lP = activos.filter(s => s.lohr === 'PRIM').length;
    const lS = activos.filter(s => s.lohr === 'SEC').length;
    const lohrMet = (lP >= 1 && lS >= 2);
    
    let lohrPct = 0;
    if (lP >= 1) lohrPct += 34;
    lohrPct += Math.min(lS, 2) * 33;

    document.getElementById('bar-lohr').style.width = lohrPct + '%';
    document.getElementById('status-lohr').innerHTML = lohrMet ? '✅ CUMPLE LOHR' : 'Incompleto';
    document.getElementById('status-lohr').className = `crit-status ${lohrMet ? 'met' : ''}`;
};
