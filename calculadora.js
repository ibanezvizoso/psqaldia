// --- CONFIGURACIÓN ABSOLUTA: No se toca si ya te funciona ---
const CONFIG = {
    FILA_INICIO_FARMACOS: 1,      // Haloperidol en índice 0 (Fila 2)
    COL_INICIO_DESTINOS: 6        // Destinos en índice 6 (Columna G)
};

window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    // 1. ESTILOS (Timeline + Diseño Pulido)
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
            .btn-primary { 
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

    // 2. CARGA DE DATOS (Usando tus índices CONFIG)
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

    const options = window.listaFarmacos.map(f => `<option value="${f}">${f}</option>`).join('');
    container.innerHTML = `
        <div class="calc-ui">
            <h2><i class="fas fa-calculator"></i> Calculadora APS</h2>
            <label>Fármaco Origen</label>
            <select id="f_orig">${options}</select>
            <label>Dosis Actual (mg/día)</label>
            <input type="number" id="d_orig" step="0.1" value="10">
            <label>Fármaco Destino</label>
            <select id="f_dest">${options}</select>
            <button class="btn btn-primary" onclick="ejecutarCalculo()">CALCULAR ESTRATEGIA</button>
            <div id="res-box" class="res-container">
                <div id="res-header" class="res-header"></div>
                <div id="res-pauta" class="res-pauta"></div>
            </div>
        </div>`;
};

// 3. TRADUCCIÓN DE PASOS (Tu lógica + Estética Timeline)
window.traducirPasos = function(raw, dosisActual, dosisObjetivo) {
    if (!raw || raw.trim() === '') return '<span style="color:var(--text-muted);">Sin pauta específica.</span>';
    const pasos = raw.split('|').map(p => p.trim()).filter(p => p);
    let html = '';
    let dosisAct = dosisActual;

    pasos.forEach(p => {
        let inst = p;
        if (inst.startsWith('IF_ACTUAL_')) {
            const match = inst.match(/IF_ACTUAL_([<>]=?)(\d+)mg?:(.*)/);
            if (match) {
                const op = match[1], corte = parseFloat(match[2]), resto = match[3];
                const cumple = eval(`${dosisActual} ${op === '=' ? '==' : op} ${corte}`);
                if (!cumple) return;
                inst = resto;
            }
        }

        const partes = inst.split(':').map(s => s.trim());
        if (partes.length < 3) return;
        const dia = partes[0].replace('D', 'Día ');
        const sujeto = partes[1];
        const accion = partes[2];
        const valor = partes.slice(3).join(':');

        let desc = '';
        if (sujeto === 'ACTUAL') {
            if (accion === 'STOP') desc = 'Suspender fármaco de origen.';
            else if (accion === 'REDUCIR') {
                const pct = parseFloat(valor);
                desc = `Bajar origen al ${valor} (<b>${(dosisActual * pct / 100).toFixed(1)} mg</b>).`;
            } else desc = `${accion} ${valor}`;
        } else {
            if (valor === 'TARGET' || accion === 'TITULAR_PROGRESIVO') {
                desc = `Alcanzar dosis objetivo (<b>${dosisObjetivo.toFixed(1)} mg</b>).`;
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

// 4. EJECUCIÓN: Cálculo Maudsley + Alertas + Intersección Matriz
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
    else if (equivalente > d.ed95) { bg = '#fef3c7'; color = '#b45309'; alerta = '⚠️ SOBRE ED95'; }
    else if (equivalente < d.min) { bg = '#f1f5f9'; color = '#475569'; alerta = '🔍 BAJO MÍNIMO'; }
    else { bg = '#dcfce7'; color = '#15803d'; alerta = '✅ RANGO ESTÁNDAR'; }

    const resBox = document.getElementById('res-box');
    resBox.style.display = 'block';
    resBox.style.background = bg;

    document.getElementById('res-header').innerHTML = `
        <div style="background: rgba(255,255,255,0.7); padding: 1.5rem; border-radius: 1.2rem; margin-bottom: 10px;">
            <div style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 5px;">Dosis Objetivo (Maudsley)</div>
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

    // --- INTERSECCIÓN DE MATRIZ (Tus coordenadas CONFIG) ---
    const idxOrig = window.listaFarmacos.indexOf(orig);
    const idxDest = window.listaFarmacos.indexOf(dest);
    const fila = CONFIG.FILA_INICIO_FARMACOS + idxOrig;
    const col = CONFIG.COL_INICIO_DESTINOS + idxDest;

    let instruccion = '';
    if (window.dbRaw[fila] && window.dbRaw[fila][col]) {
        instruccion = window.dbRaw[fila][col].toString();
    }

    document.getElementById('res-pauta').innerHTML = `
        <h4 style="margin:0 0 1.2rem 0; font-size:0.8rem; text-transform:uppercase; color:var(--text-muted); letter-spacing: 1px;">Estrategia Sugerida</h4>
        ${orig === dest ? 'Origen y destino iguales.' : window.traducirPasos(instruccion, dosis, equivalente)}
    `;
};
