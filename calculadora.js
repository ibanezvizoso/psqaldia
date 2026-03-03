// --- LÓGICA DE COORDENADAS QUE FUNCIONA (CONFIG) ---
const CONFIG = {
    FILA_INICIO_FARMACOS: 0,      // Haloperidol está en el índice 0 del array
    COL_INICIO_DESTINOS: 6        // Los destinos en la matriz empiezan en la columna G (6)
};

window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    // 1. ESTILOS (Timeline + Alertas + Diseño Pro)
    if (!document.getElementById('calc-internal-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'calc-internal-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
            .calc-ui h2 { margin: 0 0 1rem 0; font-weight: 800; display: flex; align-items: center; gap: 10px; }
            .calc-ui label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-top: 0.6rem; display: block; }
            .calc-ui select, .calc-ui input { 
                width: 100%; padding: 0.9rem; border-radius: 1rem; border: 2px solid var(--border); 
                background: var(--bg); color: var(--text-main); font-size: 1rem; outline: none; box-sizing: border-box;
            }
            .btn-ejecutar { 
                margin-top: 1rem; padding: 1.1rem; background: var(--primary); color: white; 
                border: none; border-radius: 1.2rem; cursor: pointer; font-weight: 900; font-size: 1.1rem;
            }
            .res-container { margin-top: 1.5rem; border-radius: 1.5rem; display: none; border: 1px solid rgba(0,0,0,0.08); overflow: hidden; }
            .res-header { padding: 1.5rem; text-align: center; border-bottom: 1px solid rgba(0,0,0,0.05); }
            .res-pauta { padding: 1.5rem; background: var(--bg); }
            
            /* Estética Timeline */
            .pauta-step { display: flex; gap: 1rem; margin-bottom: 1.2rem; position: relative; }
            .pauta-step:not(:last-child)::after { 
                content: ''; position: absolute; left: 17px; top: 35px; bottom: -15px; 
                width: 2px; background: var(--border); opacity: 0.5; 
            }
            .step-idx { 
                min-width: 36px; height: 36px; background: white; border: 2px solid var(--border); 
                border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                font-weight: 900; font-size: 0.8rem; z-index: 1;
            }
            .tag-farm { font-weight: 800; font-size: 0.65rem; text-transform: uppercase; padding: 3px 8px; border-radius: 6px; display: inline-block; margin-bottom: 6px; }
            .tag-orig { background: #fee2e2; color: #b91c1c; }
            .tag-dest { background: #dcfce7; color: #15803d; }
            .step-txt { font-size: 0.95rem; line-height: 1.4; color: var(--text-main); }
        `;
        document.head.appendChild(styleTag);
    }

    // 2. CARGA DE DATOS (Tu lógica exacta de FILA_INICIO_FARMACOS)
    if (!window.dbCalc) {
        try {
            const response = await fetch(`${window.WORKER_URL}?sheet=Data_APS`);
            const data = await response.json();
            if (data.error) throw new Error(data.details);
            
            window.dbRaw = data.values;
            window.listaFarmacos = [];
            
            for (let i = CONFIG.FILA_INICIO_FARMACOS; i < window.dbRaw.length; i++) {
                const nombre = window.dbRaw[i]?.[0];
                if (nombre && nombre.toString().trim() !== '') {
                    window.listaFarmacos.push(nombre.toString().trim());
                }
            }

            window.dbCalc = window.listaFarmacos.map((nombre, idx) => {
                const fila = CONFIG.FILA_INICIO_FARMACOS + idx;
                return {
                    farmaco: nombre,
                    factor: parseFloat(window.dbRaw[fila]?.[1]) || 1,
                    ed95: parseFloat(window.dbRaw[fila]?.[2]) || 0,
                    max: parseFloat(window.dbRaw[fila]?.[3]) || 0,
                    min: parseFloat(window.dbRaw[fila]?.[4]) || 0,
                    umbral: parseFloat(window.dbRaw[fila]?.[5]) || 0
                };
            });
        } catch (e) {
            container.innerHTML = `Error: ${e.message}`;
            return;
        }
    }

    // 3. RENDERIZADO
    const options = window.listaFarmacos.map(f => `<option value="${f}">${f}</option>`).join('');
    container.innerHTML = `
        <div class="calc-ui">
            <h2><i class="fas fa-random"></i> APS Switch Manager</h2>
            <label>Fármaco Origen</label>
            <select id="f_orig">${options}</select>
            <label>Dosis Actual (mg/día)</label>
            <input type="number" id="d_orig" step="any" value="10">
            <label>Fármaco Destino</label>
            <select id="f_dest">${options}</select>
            <button class="btn-ejecutar" onclick="ejecutarCalculo()">CALCULAR ESTRATEGIA</button>
            <div id="res-box" class="res-container">
                <div id="res-header" class="res-header"></div>
                <div id="res-pauta" class="res-pauta"></div>
            </div>
        </div>`;
};

// 4. TRADUCCIÓN DE PASOS (Lógica que funciona + Visual Timeline)
window.traducirPasos = function(raw, dosisActual, dosisObjetivo) {
    if (!raw || raw.trim() === '') return '<span style="color:var(--text-muted);">Sin pauta específica.</span>';
    const bloques = raw.split('|').map(b => b.trim()).filter(Boolean);
    let html = '';
    let dosisAct = dosisActual;

    bloques.forEach(bloque => {
        let texto = bloque;
        if (texto.startsWith('IF_ACTUAL_')) {
            const match = texto.match(/IF_ACTUAL_([<>]=?)(\d+)mg?:(.*)/);
            if (match) {
                const op = match[1], corte = parseFloat(match[2]), resto = match[3];
                const cumple = eval(`${dosisActual} ${op === '=' ? '==' : op} ${corte}`);
                if (!cumple) return;
                texto = resto;
            }
        }

        const p = texto.split(':').map(s => s.trim());
        if (p.length < 3) return;
        
        const dia = p[0].replace('D', 'Día ');
        const sujeto = p[1];
        const accion = p[2];
        const valor = p.slice(3).join(':');

        let desc = '';
        if (sujeto === 'ACTUAL') {
            if (accion === 'STOP') desc = 'Suspender origen.';
            else if (accion === 'REDUCIR') {
                const pct = parseFloat(valor);
                desc = `Reducir origen al ${valor} (<b>${(dosisActual * pct / 100).toFixed(1)} mg</b>).`;
            } else desc = `${accion} ${valor}`;
        } else {
            if (valor === 'TARGET' || accion === 'TITULAR_PROGRESIVO') {
                desc = `Alcanzar objetivo de <b>${dosisObjetivo.toFixed(1)} mg</b>.`;
            } else if (valor.includes('%')) {
                const pct = parseFloat(valor);
                desc = `Iniciar nuevo al ${pct}% (<b>${(dosisObjetivo * pct / 100).toFixed(1)} mg</b>).`;
            } else desc = `Iniciar nuevo a <b>${valor}</b>.`;
        }

        html += `
            <div class="pauta-step">
                <div class="step-idx">${dia.replace('Día ', '')}</div>
                <div class="step-body">
                    <span class="tag-farm ${sujeto === 'NUEVO' ? 'tag-dest' : 'tag-orig'}">${sujeto}</span>
                    <div class="step-txt">${desc}</div>
                </div>
            </div>`;
    });
    return html;
};

// 5. CÁLCULO Y ALERTAS (Exactamente como lo querías)
window.ejecutarCalculo = function() {
    const orig = document.getElementById('f_orig').value;
    const dest = document.getElementById('f_dest').value;
    const dosis = parseFloat(document.getElementById('d_orig').value);
    
    const o = window.dbCalc.find(f => f.farmaco === orig);
    const d = window.dbCalc.find(f => f.farmaco === dest);
    
    if (isNaN(dosis) || !o || !d) return;

    const equivalente = (dosis / o.factor) * d.factor;
    const porcentajeRango = (dosis / o.max) * 100;
    const dosisRango = (porcentajeRango / 100) * d.max;

    let bg, color, alerta;
    if (equivalente > d.max) { bg = '#fee2e2'; color = '#b91c1c'; alerta = '⚠️ EXCEDE MÁXIMA'; }
    else if (equivalente > d.ed95) { bg = '#fef3c7'; color = '#b45309'; alerta = '⚠️ SUPERIOR A ED95'; }
    else if (equivalente < d.min) { bg = '#f1f5f9'; color = '#475569'; alerta = '🔍 BAJO MÍNIMO EFECTIVO'; }
    else { bg = '#dcfce7'; color = '#15803d'; alerta = '✅ RANGO TERAPÉUTICO'; }

    const resBox = document.getElementById('res-box');
    resBox.style.display = 'block';
    resBox.style.background = bg;

    document.getElementById('res-header').innerHTML = `
        <div style="background: rgba(255,255,255,0.7); padding: 1.5rem; border-radius: 1.2rem; margin-bottom: 10px;">
            <div style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 5px;">Dosis de prescripción (Maudsley)</div>
            <div style="font-size: 2.8rem; font-weight: 900; color: var(--text-main);">${equivalente.toFixed(1)} <span style="font-size: 1.2rem;">mg/día</span></div>
            <div style="display: inline-block; margin-top: 10px; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 900; background: white; color: ${color}; border: 1px solid ${color};">
                ${alerta}
            </div>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 0 10px; font-size: 0.8rem;">
            <span style="color: var(--text-muted); font-weight: 600;">Equivalencia en rango (${porcentajeRango.toFixed(0)}%)</span>
            <span style="font-weight: 800; opacity: 0.8;">${dosisRango.toFixed(1)} mg</span>
        </div>
    `;

    // --- INTERSECCIÓN DE MATRIZ (TU LÓGICA DE COORDENADAS) ---
    const idxOrig = window.listaFarmacos.indexOf(orig);
    const idxDest = window.listaFarmacos.indexOf(dest);
    const fila = CONFIG.FILA_INICIO_FARMACOS + idxOrig;
    const col = CONFIG.COL_INICIO_DESTINOS + idxDest;

    let rawInstr = "";
    if (window.dbRaw[fila] && window.dbRaw[fila][col]) {
        rawInstr = window.dbRaw[fila][col].toString();
    }

    document.getElementById('res-pauta').innerHTML = `
        <h4 style="margin:0 0 1.2rem 0; font-size:0.8rem; text-transform:uppercase; color:var(--text-muted);">Estrategia Sugerida</h4>
        ${orig === dest ? 'Origen y destino son iguales.' : window.traducirPasos(rawInstr, dosis, equivalente)}
    `;
};
