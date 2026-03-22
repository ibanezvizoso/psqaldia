/**
 * AutoEPP v1.0 - Generador de Exploración Psicopatológica
 * PSQALDÍA © 2026
 */

let dbEPP = [];
let state = {}; 
let config = { genero: 'masculino', formato: 'bloque', mostrarRiesgo: false }; // Por defecto Bloque Único
window.activeEsfera = null;

async function iniciarAutoEPP() {
    const container = document.getElementById('modalData');
    container.innerHTML = `<div style="padding:4rem; text-align:center;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary);"></i><p>Sincronizando esferas clínicas...</p></div>`;

    try {
        const res = await fetch(`${window.WORKER_URL}?sheet=epp`);
        const data = await res.json();
        
        if (!data.values) throw new Error("No se encontraron datos");

        dbEPP = data.values.map(row => ({
            esfera: row[0],
            opciones: row[1]?.split('-') || [],
            defecto: row[2],
            categoria: row[3],
            cond1: { if: row[4], then: row[5]?.split('-') || [] },
            cond2: { if: row[6], then: row[7]?.split('-') || [] }
        })).filter(i => i.esfera);

        dbEPP.forEach(item => {
            state[item.esfera] = {
                active: true,
                sel1: item.defecto || item.opciones[0],
                sel2: '',
                sel3: ''
            };
        });

        window.activeEsfera = dbEPP[0].esfera;
        renderEPPUI();
    } catch (e) {
        container.innerHTML = `<div style="padding:2rem; text-align:center;"><p>Error al cargar: ${e.message}</p></div>`;
    }
}

function renderEPPUI() {
    const container = document.getElementById('modalData');
    container.innerHTML = `
        <style>
            .epp-layout { 
                display: flex; 
                flex-direction: column; 
                gap: 15px; 
                font-family: 'Inter', sans-serif; 
                padding: 15px; 
                background: #f8fafc; 
                color: #1e293b; 
                min-height: 100%; 
                height: auto; 
                overflow: visible; 
            }
            
            .epp-header { display: flex; justify-content: space-between; align-items: center; background: white; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; flex-wrap: wrap; gap: 10px; }
            
            .epp-main { display: grid; grid-template-columns: 240px 1fr; gap: 15px; flex-grow: 1; }
            
            @media (max-width: 768px) {
                .epp-main { grid-template-columns: 1fr; }
            }

            .epp-sidebar { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 10px; display: flex; flex-direction: column; gap: 5px; height: fit-content; max-height: 500px; overflow-y: auto; }
            .esfera-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 700; transition: 0.2s; border: 1px solid transparent; background: #f8fafc; }
            .esfera-item:hover { background: #f1f5f9; }
            .esfera-item.active-esfera { background: #eef2ff; border-color: #4338ca; color: #4338ca; }
            .esfera-item.inactive { opacity: 0.4; filter: grayscale(1); }
            
            .epp-content { display: flex; flex-direction: column; gap: 15px; }
            .options-panel { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; min-height: 150px; }
            .option-group { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #f1f5f9; }
            .chip { padding: 8px 16px; border-radius: 20px; border: 1px solid #e2e8f0; background: #f8fafc; cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: 0.2s; }
            .chip.selected { background: #4338ca; color: white; border-color: #4338ca; }

            .result-area { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 15px; }
            #epp-text { width: 100%; min-height: 200px; border: none; font-family: 'Georgia', serif; font-size: 1rem; line-height: 1.6; resize: vertical; outline: none; color: #334155; }
            
            .btn-epp { padding: 12px 24px; border-radius: 10px; font-weight: 800; cursor: pointer; border: none; font-size: 0.85rem; }
            .btn-primary { background: #4338ca; color: white; }
        </style>

        <div class="epp-layout">
            <div class="epp-header">
                <div style="display:flex; gap:10px;">
                    <select onchange="updateConfig('genero', this.value)" class="chip">
                        <option value="masculino">Varón</option>
                        <option value="femenino">Mujer</option>
                    </select>
                    <select onchange="updateConfig('formato', this.value)" class="chip">
                        <option value="bloque" selected>Bloque Único</option>
                        <option value="apartados">Por Apartados</option>
                    </select>
                </div>
                <button class="chip" style="background:#f1f5f9;" onclick="reiniciarEPP()">Reiniciar Estándar</button>
            </div>

            <div class="epp-main">
                <div class="epp-sidebar">
                    <div id="sidebar-list"></div>
                    <label style="margin-top:20px; padding-top:10px; border-top:1px solid #f1f5f9; display:flex; align-items:center; gap:8px; font-size:0.75rem; font-weight:800; cursor:pointer;">
                        <input type="checkbox" onchange="updateConfig('mostrarRiesgo', this.checked)"> Valoración de Riesgo
                    </label>
                </div>
                
                <div class="epp-content">
                    <div class="options-panel" id="options-panel"></div>
                    <div class="result-area">
                        <textarea id="epp-text" readonly></textarea>
                        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #f1f5f9; padding-top:10px; margin-top:10px;">
                            <span style="font-size:0.7rem; color:#94a3b8; font-weight:800; letter-spacing:1px;">AUTO EPP v1.0</span>
                            <button class="btn-epp btn-primary" onclick="copiarEPP()"><i class="far fa-copy"></i> COPIAR EPP</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    renderSidebar();
    selectEsfera(window.activeEsfera);
    generarTextoFinal();
}

function renderSidebar() {
    const list = document.getElementById('sidebar-list');
    list.innerHTML = dbEPP
        .filter(item => config.mostrarRiesgo || item.categoria === 'epp')
        .map(item => `
            <div class="esfera-item ${window.activeEsfera === item.esfera ? 'active-esfera' : ''} ${!state[item.esfera].active ? 'inactive' : ''}" onclick="selectEsfera('${item.esfera}')">
                <span>${item.esfera}</span>
                <i class="fas fa-times btn-del" onclick="event.stopPropagation(); toggleEsfera('${item.esfera}')"></i>
            </div>
        `).join('');
}

// Función auxiliar para manejar la lógica OR
function cumpleCondicion(valorSeleccionado, condicion) {
    if (!condicion) return false;
    // Divide por " OR " y limpia espacios para comparar cada opción
    const opcionesCondicion = condicion.split(' OR ').map(opt => opt.trim());
    return opcionesCondicion.includes(valorSeleccionado);
}

function selectEsfera(nombre) {
    window.activeEsfera = nombre;
    renderSidebar();
    const item = dbEPP.find(i => i.esfera === nombre);
    const s = state[nombre];
    const panel = document.getElementById('options-panel');

    let html = `<div style="margin-bottom:10px; font-weight:800; color:#4338ca; text-transform:uppercase; font-size:0.75rem;">Opciones: ${nombre}</div>`;
    html += `<div class="option-group">`;
    [...item.opciones, "No valorable"].forEach(opt => {
        html += `<div class="chip ${s.sel1 === opt ? 'selected' : ''}" onclick="setOption('${nombre}', 1, '${opt}')">${opt}</div>`;
    });
    html += `</div>`;

    // Aplicación de lógica OR para cond1
    if (cumpleCondicion(s.sel1, item.cond1.if)) {
        html += `<div class="option-group" style="background:#f1f5f9; padding:10px; border-radius:10px;">`;
        item.cond1.then.forEach(opt => {
            html += `<div class="chip ${s.sel2 === opt ? 'selected' : ''}" onclick="setOption('${nombre}', 2, '${opt}')">${opt}</div>`;
        });
        html += `</div>`;
    }

    // Aplicación de lógica OR para cond2
    if (cumpleCondicion(s.sel2, item.cond2.if)) {
        html += `<div class="option-group" style="background:#e0e7ff; padding:10px; border-radius:10px;">`;
        item.cond2.then.forEach(opt => {
            html += `<div class="chip ${s.sel3 === opt ? 'selected' : ''}" onclick="setOption('${nombre}', 3, '${opt}')">${opt}</div>`;
        });
        html += `</div>`;
    }
    panel.innerHTML = html;
}

function setOption(esfera, nivel, valor) {
    if (nivel === 1) { state[esfera].sel1 = valor; state[esfera].sel2 = ''; state[esfera].sel3 = ''; }
    if (nivel === 2) { state[esfera].sel2 = valor; state[esfera].sel3 = ''; }
    if (nivel === 3) { state[esfera].sel3 = valor; }
    selectEsfera(esfera);
    generarTextoFinal();
}

function updateConfig(key, val) {
    config[key] = val;
    if (key === 'mostrarRiesgo') renderSidebar();
    generarTextoFinal();
}

function toggleEsfera(nombre) {
    state[nombre].active = !state[nombre].active;
    renderSidebar();
    generarTextoFinal();
}

function procesarGramatica(texto, esfera) {
    if (!texto) return "";
    let res = texto;
    res = res.replace(/([^\s/]+)\/([^\s]+)/g, (match, m, f) => {
        return config.genero === 'masculino' ? m : f;
    });
    res = res.replace(/X/g, esfera);
    return res;
}

function generarTextoFinal() {
    let finalArr = [];
    dbEPP.forEach(item => {
        const s = state[item.esfera];
        if (!s.active) return;
        if (!config.mostrarRiesgo && item.categoria !== 'epp') return;

        let fragmento = "";
        if (s.sel1 === "No valorable") {
            fragmento = `${item.esfera} no valorable`;
        } else {
            fragmento = s.sel1;
            if (s.sel2) fragmento += ` ${s.sel2}`;
            if (s.sel3) fragmento += ` ${s.sel3}`;
        }
        fragmento = procesarGramatica(fragmento, item.esfera);
        if (config.formato === 'apartados') {
            finalArr.push(`${item.esfera}: ${fragmento}.`);
        } else {
            finalArr.push(`${fragmento}.`);
        }
    });
    document.getElementById('epp-text').value = finalArr.join(config.formato === 'apartados' ? '\n' : ' ');
}

function copiarEPP() {
    const text = document.getElementById('epp-text');
    text.select();
    document.execCommand('copy');
    alert("EPP copiada al portapapeles");
}

function reiniciarEPP() {
    dbEPP.forEach(item => {
        state[item.esfera] = { active: true, sel1: item.defecto || item.opciones[0], sel2: '', sel3: '' };
    });
    generarTextoFinal();
    if (window.activeEsfera) selectEsfera(window.activeEsfera);
}
