/**
 * AutoEPP v1.0 - Generador de Exploración Psicopatológica
 * PSQALDÍA © 2026
 */

let dbEPP = [];
let state = {}; // { esfera: { active: true, sel1: '', sel2: '', sel3: '' } }
let config = { genero: 'masculino', formato: 'apartados', mostrarRiesgo: false };

async function iniciarAutoEPP() {
    const container = document.getElementById('modalData');
    container.innerHTML = `<div style="padding:4rem; text-align:center;"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Sincronizando esferas...</p></div>`;

    try {
        const res = await fetch(`${window.WORKER_URL}?sheet=epp`);
        const data = await res.json();
        dbEPP = data.values.map(row => ({
            esfera: row[0],
            opciones: row[1]?.split('-') || [],
            defecto: row[2],
            categoria: row[3],
            cond1: { if: row[4], then: row[5]?.split('-') || [] },
            cond2: { if: row[6], then: row[7]?.split('-') || [] }
        }));

        // Inicializar estado con valores por defecto
        dbEPP.forEach(item => {
            state[item.esfera] = {
                active: true,
                sel1: item.defecto || item.opciones[0],
                sel2: '',
                sel3: ''
            };
        });

        renderEPPUI();
    } catch (e) {
        container.innerHTML = `<p>Error al cargar: ${e.message}</p>`;
    }
}

function renderEPPUI() {
    const container = document.getElementById('modalData');
    container.innerHTML = `
        <style>
            .epp-layout { display: flex; flex-direction: column; gap: 15px; font-family: 'Inter', sans-serif; padding: 15px; background: #f8fafc; color: #1e293b; height: 90vh; }
            .epp-header { display: flex; justify-content: space-between; align-items: center; background: white; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .epp-main { display: grid; grid-template-columns: 220px 1fr; gap: 15px; flex-grow: 1; overflow: hidden; }
            
            /* Columna Izquierda */
            .epp-sidebar { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow-y: auto; padding: 10px; }
            .esfera-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-radius: 8px; margin-bottom: 5px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: 0.2s; border: 1px solid transparent; }
            .esfera-item:hover { background: #f1f5f9; }
            .esfera-item.active-esfera { background: #eef2ff; border-color: #4338ca; color: #4338ca; }
            .btn-del { color: #94a3b8; font-size: 0.8rem; padding: 4px; }
            .btn-del:hover { color: #ef4444; }

            /* Panel de Opciones */
            .epp-content { display: flex; flex-direction: column; gap: 15px; overflow: hidden; }
            .options-panel { background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; min-height: 120px; }
            .option-group { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
            .chip { padding: 6px 14px; border-radius: 20px; border: 1px solid #e2e8f0; background: #f8fafc; cursor: pointer; font-size: 0.8rem; font-weight: 500; transition: 0.2s; }
            .chip.selected { background: #4338ca; color: white; border-color: #4338ca; }

            /* Resultado */
            .result-area { flex-grow: 1; display: flex; flex-direction: column; gap: 10px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 15px; }
            #epp-text { width: 100%; flex-grow: 1; border: none; font-family: 'Georgia', serif; font-size: 1rem; line-height: 1.6; resize: none; outline: none; color: #334155; }
            .actions-bar { display: flex; justify-content: space-between; align-items: center; }
            .btn-epp { padding: 10px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; border: none; font-size: 0.85rem; }
            .btn-primary { background: #4338ca; color: white; }
            .btn-secondary { background: #f1f5f9; color: #475569; }
        </style>

        <div class="epp-layout">
            <div class="epp-header">
                <div style="display:flex; gap:15px;">
                    <select onchange="updateConfig('genero', this.value)" class="chip">
                        <option value="masculino">Hombre</option>
                        <option value="femenino">Mujer</option>
                    </select>
                    <select onchange="updateConfig('formato', this.value)" class="chip">
                        <option value="apartados">Apartados</option>
                        <option value="bloque">Bloque Único</option>
                    </select>
                </div>
                <button class="btn-epp btn-secondary" onclick="reiniciarEPP()"><i class="fas fa-undo"></i> Reiniciar Estándar</button>
            </div>

            <div class="epp-main">
                <div class="epp-sidebar" id="sidebar"></div>
                <div class="epp-content">
                    <div class="options-panel" id="options-panel">
                        <p style="color:#94a3b8; font-size:0.8rem; text-align:center;">Selecciona una esfera de la izquierda</p>
                    </div>
                    <div class="result-area">
                        <textarea id="epp-text" readonly></textarea>
                        <div class="actions-bar">
                            <span style="font-size:0.7rem; color:#94a3b8; font-weight:700;">PSQALDÍA - AUTO EPP v1.0</span>
                            <button class="btn-epp btn-primary" onclick="copiarEPP()"><i class="far fa-copy"></i> COPIAR EPP</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <label style="display:flex; align-items:center; gap:10px; padding:10px; background:white; border-radius:12px; font-size:0.85rem; font-weight:700; cursor:pointer;">
                <input type="checkbox" onchange="updateConfig('mostrarRiesgo', this.checked)"> Incluir valoración de Intento de Suicidio
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
                <i class="fas fa-times btn-del" onclick="event.stopPropagation(); toggleEsfera('${item.esfera}')" style="opacity:${state[item.esfera].active ? 1 : 0.2}"></i>
            </div>
        `).join('');
}

function selectEsfera(nombre) {
    window.activeEsfera = nombre;
    renderSidebar();
    const item = dbEPP.find(i => i.esfera === nombre);
    const s = state[nombre];
    const panel = document.getElementById('options-panel');

    // Construir Niveles de Opciones
    let html = `<strong>${nombre}</strong><div class="option-group">`;
    const todasLasOpciones = [...item.opciones, "No valorable"];
    todasLasOpciones.forEach(opt => {
        html += `<div class="chip ${s.sel1 === opt ? 'selected' : ''}" onclick="setOption('${nombre}', 1, '${opt}')">${opt}</div>`;
    });
    html += `</div>`;

    // Nivel 2 (if/then)
    if (s.sel1 === item.cond1.if) {
        html += `<div class="option-group" style="border-left:2px solid #4338ca; padding-left:10px;">`;
        item.cond1.then.forEach(opt => {
            html += `<div class="chip ${s.sel2 === opt ? 'selected' : ''}" onclick="setOption('${nombre}', 2, '${opt}')">${opt}</div>`;
        });
        html += `</div>`;
    }

    // Nivel 3 (if2/then2)
    if (s.sel2 === item.cond2.if) {
        html += `<div class="option-group" style="border-left:2px solid #4338ca; padding-left:20px;">`;
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
    // 1. Manejo de Masculino/Femenino: "Orientado/a" o "Orientado/Orientada"
    let res = texto.replace(/(\w+)\/(\w+)/g, (match, m, f) => {
        return config.genero === 'masculino' ? m : f;
    });
    // 2. Reemplazo de X por nombre de esfera
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

// Iniciar
document.addEventListener('DOMContentLoaded', iniciarAutoEPP);
