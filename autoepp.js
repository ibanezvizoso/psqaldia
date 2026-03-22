/**
 * AutoEPP v1.2 - Generador de Exploración Psicopatológica
 * PSQALDÍA © 2026
 */

let dbEPP = [];
let state = {}; 
let config = { genero: 'masculino', formato: 'apartados', mostrarRiesgo: false };
window.activeEsfera = null;

async function iniciarAutoEPP() {
    const container = document.getElementById('modalData');
    
    // El worker interceptará esta petición en la raíz
    const workerUrl = `${window.location.origin}/?sheet=epp`;

    try {
        const res = await fetch(workerUrl);
        const data = await res.json();

        if (!data.values || data.values.length === 0) throw new Error("No se encontraron datos");

        dbEPP = data.values.map(row => ({
            esfera: row[0] || "",
            opciones: row[1] ? row[1].split('-') : [],
            defecto: row[2] || "",
            categoria: row[3] || "epp",
            cond1: { if: row[4] || null, then: row[5] ? row[5].split('-') : [] },
            cond2: { if: row[6] || null, then: row[7] ? row[7].split('-') : [] }
        }));

        // Inicializamos el estado con los valores por defecto de la columna C
        dbEPP.forEach(item => {
            state[item.esfera] = {
                active: true,
                sel1: item.defecto || (item.opciones[0] || ""),
                sel2: '',
                sel3: ''
            };
        });

        renderEPPUI();
    } catch (e) {
        container.innerHTML = `<div style="padding:2rem; text-align:center; color:#ef4444;">
            <i class="fas fa-exclamation-circle fa-2x"></i>
            <p>Error: ${e.message}</p>
        </div>`;
    }
}

function renderEPPUI() {
    const container = document.getElementById('modalData');
    container.innerHTML = `
        <style>
            .epp-layout { display: flex; flex-direction: column; gap: 15px; padding: 15px; background: #f8fafc; height: 85vh; font-family: sans-serif; }
            .epp-header { display: flex; justify-content: space-between; align-items: center; background: white; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .epp-main { display: grid; grid-template-columns: 240px 1fr; gap: 15px; flex-grow: 1; overflow: hidden; }
            
            .epp-sidebar { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow-y: auto; padding: 10px; }
            .esfera-item { display: flex; align-items: center; justify-content: space-between; padding: 10px; border-radius: 8px; margin-bottom: 5px; cursor: pointer; font-size: 0.9rem; font-weight: 600; color: #475569; border: 1px solid transparent; }
            .esfera-item:hover { background: #f1f5f9; }
            .esfera-item.active-esfera { background: #eef2ff; border-color: #4338ca; color: #4338ca; }
            
            .options-panel { background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; min-height: 140px; }
            .option-group { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
            
            .chip { padding: 8px 16px; border-radius: 20px; border: 1px solid #e2e8f0; background: #f8fafc; cursor: pointer; font-size: 0.85rem; font-weight: 500; transition: all 0.2s; }
            .chip.selected { background: #4338ca; color: white; border-color: #4338ca; }

            .result-area { flex-grow: 1; display: flex; flex-direction: column; background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 15px; margin-top:10px; overflow: hidden; }
            #epp-text { width: 100%; flex-grow: 1; border: none; font-family: 'Georgia', serif; font-size: 1.1rem; line-height: 1.6; resize: none; outline: none; color: #1e293b; background: transparent; }
            .btn-copy { background: #4338ca; color: white; border: none; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer; width: 100%; margin-top: 10px; }
        </style>

        <div class="epp-layout">
            <div class="epp-header">
                <div style="display:flex; gap:10px;">
                    <select onchange="updateConfig('genero', this.value)" class="chip">
                        <option value="masculino">Hombre</option>
                        <option value="femenino">Mujer</option>
                    </select>
                    <select onchange="updateConfig('formato', this.value)" class="chip">
                        <option value="apartados">Apartados</option>
                        <option value="bloque">Bloque</option>
                    </select>
                </div>
                <button class="chip" onclick="reiniciarEPP()"><i class="fas fa-undo"></i> Reiniciar</button>
            </div>

            <div class="epp-main">
                <div class="epp-sidebar" id="sidebar"></div>
                <div style="display:flex; flex-direction:column; overflow:hidden;">
                    <div class="options-panel" id="options-panel"></div>
                    <div class="result-area">
                        <textarea id="epp-text" readonly></textarea>
                        <button class="btn-copy" onclick="copiarEPP()"><i class="far fa-copy"></i> COPIAR EXPLORACIÓN</button>
                    </div>
                </div>
            </div>
            
            <label style="background:white; padding:10px; border-radius:10px; border:1px solid #e2e8f0; cursor:pointer; font-size:0.9rem; font-weight:700;">
                <input type="checkbox" onchange="updateConfig('mostrarRiesgo', this.checked)"> Incluir Riesgo Suicida
            </label>
        </div>
    `;
    renderSidebar();
    generarTextoFinal();
}

function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = dbEPP
        .filter(item => config.mostrarRiesgo || item.categoria === 'epp')
        .map(item => `
            <div class="esfera-item ${window.activeEsfera === item.esfera ? 'active-esfera' : ''}" onclick="selectEsfera('${item.esfera}')">
                <span>${item.esfera}</span>
                <i class="fas fa-times" style="opacity:${state[item.esfera].active ? 1 : 0.2}; padding: 5px;" 
                   onclick="event.stopPropagation(); toggleEsfera('${item.esfera}')"></i>
            </div>
        `).join('');
}

function selectEsfera(nombre) {
    window.activeEsfera = nombre;
    renderSidebar();
    const item = dbEPP.find(i => i.esfera === nombre);
    const s = state[nombre];
    const panel = document.getElementById('options-panel');

    let html = `<strong>${nombre}</strong><div class="option-group">`;
    [...item.opciones, "No valorable"].forEach(opt => {
        html += `<div class="chip ${s.sel1 === opt ? 'selected' : ''}" onclick="setOption('${nombre}', 1, '${opt}')">${opt}</div>`;
    });
    html += `</div>`;

    // Nivel 2: if -> then
    if (s.sel1 === item.cond1.if && item.cond1.then.length > 0) {
        html += `<div class="option-group" style="border-left:3px solid #4338ca; padding-left:10px; margin-top:10px;">`;
        item.cond1.then.forEach(opt => {
            html += `<div class="chip ${s.sel2 === opt ? 'selected' : ''}" onclick="setOption('${nombre}', 2, '${opt}')">${opt}</div>`;
        });
        html += `</div>`;
    }

    // Nivel 3: if2 -> then2 (Columna H)
    if (s.sel2 === item.cond2.if && item.cond2.then.length > 0) {
        html += `<div class="option-group" style="border-left:3px solid #4338ca; padding-left:20px; margin-top:10px;">`;
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

function procesarGramatica(texto, esfera) {
    if (!texto) return "";
    // Manejo de / (masculino/femenino)
    let res = texto.replace(/(\w+)\/(\w+)/g, (match, m, f) => {
        if (config.genero === 'masculino') return m;
        return f.length === 1 ? m.slice(0, -1) + f : f;
    });
    // Reemplazo de X por el nombre de la esfera
    return res.replace(/X/g, esfera);
}

function generarTextoFinal() {
    let finalArr = [];
    dbEPP.forEach(item => {
        const s = state[item.esfera];
        if (!s.active) return;
        if (!config.mostrarRiesgo && item.categoria !== 'epp') return;

        let fragmento = s.sel1 === "No valorable" ? `${item.esfera} no valorable` : `${s.sel1} ${s.sel2} ${s.sel3}`.trim();
        fragmento = procesarGramatica(fragmento, item.esfera);
        
        if (config.formato === 'apartados') {
            finalArr.push(`${item.esfera}: ${fragmento}.`);
        } else {
            finalArr.push(`${fragmento}.`);
        }
    });
    document.getElementById('epp-text').value = finalArr.join(config.formato === 'apartados' ? '\n' : ' ');
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

function reiniciarEPP() {
    dbEPP.forEach(item => {
        state[item.esfera] = { active: true, sel1: item.defecto || item.opciones[0], sel2: '', sel3: '' };
    });
    generarTextoFinal();
    if (window.activeEsfera) selectEsfera(window.activeEsfera);
}

function copiarEPP() {
    const text = document.getElementById('epp-text');
    text.select();
    document.execCommand('copy');
    alert("EPP copiada");
}

document.addEventListener('DOMContentLoaded', iniciarAutoEPP);
    
