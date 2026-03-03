/**
 * CALCULADORA APS - VERSIÓN PREMIUM 
 * Fusión: Lógica de Matriz (Fila 13) + Interfaz Avanzada
 */

window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    // 1. ESTILOS FUSIONADOS (Timeline + UI Pulida)
    if (!document.getElementById('calc-internal-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'calc-internal-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; font-family: inherit; }
            .calc-ui h2 { margin: 0 0 1rem 0; font-weight: 800; display: flex; align-items: center; gap: 10px; }
            .calc-ui label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-top: 0.6rem; display: block; }
            .calc-ui select, .calc-ui input { 
                width: 100%; padding: 0.9rem; border-radius: 1rem; border: 2px solid var(--border); 
                background: var(--bg); color: var(--text-main); font-size: 1rem; outline: none; box-sizing: border-box;
            }
            .btn-ejecutar { 
                margin-top: 1rem; padding: 1.1rem; background: var(--primary); color: white; 
                border: none; border-radius: 1.2rem; cursor: pointer; font-weight: 900; font-size: 1rem;
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

    // 2. CARGA DE DATOS (Mapeo Fila 13 + Datos Columna A)
    if (!window.dbCalc) {
        try {
            const pestaña = "Data_APS";
            const response = await fetch(`${window.WORKER_URL}?sheet=${pestaña}`);
            const data = await response.json();
            
            if (data.values) {
                window.dbRaw = data.values;
                window.listaFarmacos = [];
                window.dbCalc = [];

                // Cargar fármacos desde A2 (índice 1)
                for (let i = 1; i < data.values.length; i++) {
                    const row = data.values[i];
                    if (row && row[0] && row[0] !== "Farmaco") {
                        const nombre = row[0].toString().trim();
                        window.listaFarmacos.push(nombre);
                        window.dbCalc.push({
                            farmaco: nombre,
                            factor: parseFloat(row[1]) || 1,
                            ed95: parseFloat(row[2]) || 0,
                            max: parseFloat(row[3]) || 0,
                            min: parseFloat(row[4]) || 0,
                            umbral: parseFloat(row[5]) || 0,
                            filaIdx: i // Guardamos fila para el switch
                        });
                    }
                }
            }
        } catch (e) {
            container.innerHTML = `<div style="padding:2rem;">Error: ${e.message}</div>`;
            return;
        }
    }

    // 3. RENDERIZADO INTERFAZ
    const options = window.listaFarmacos.map(f => `<option value="${f}">${f}</option>`).join('');
    container.innerHTML = `
        <div class="calc-ui">
            <h2><i class="fas fa-calculator"></i> APS Switch Manager</h2>
            <label>Fármaco Origen</label>
            <select id="f_orig">${options}</select>
            <label>Dosis Actual (mg/día)</label>
            <input type="number" id="d_orig" placeholder="0.00" value="10">
            <label>Fármaco Destino</label>
            <select id="f_dest">${options}</select>
            <button class="btn-ejecutar" onclick="ejecutarCalculo()">CALCULAR ESTRATEGIA</button>
            <div id="res-box" class="res-container">
                <div id="res-header" class="res-header"></div>
                <div id="res-pauta" class="res-pauta"></div>
            </div>
        </div>`;
};

// 4. LÓGICA DE TRADUCCIÓN DE PASOS
window.traducirPasos = function(raw, dosisActual, dosisObjetivo) {
    if (!raw || raw.trim() === '' || raw === "NaN") return '<span style="color:var(--text-muted);">Sin pauta específica.</span>';
    const pasos = raw.split('|').map(p => p.trim()).filter(p => p);
    let html = '';
    let dosisAct = dosisActual;

    pasos.forEach(p => {
        let inst = p;
        let incluir = true;

        if (inst.startsWith('IF_ACTUAL_')) {
            const m = inst.match(/IF_ACTUAL_([<>]=?)(\d+):(.*)/);
            if (m) {
                const op = m[1], corte = parseFloat(m[2]), resto = m[3];
                const cumple = eval(`${dosisActual} ${op === '=' ? '==' : op} ${corte}`);
                if (!cumple) { incluir = false; }
                inst = resto;
            }
        }
        if (!incluir) return;

        const partes = inst.split(':').map(s => s.trim());
        if (partes.length < 3) return;
        
        const dia = partes[0].replace('D', 'Día ');
        const sujeto = partes[1];
        const accion = partes[2];
        const valor = partes.slice(3).join(':');

        let desc = '';
        if (sujeto === 'ACTUAL') {
            if (accion === 'STOP') desc = 'Suspender origen.';
            else if (accion === 'REDUCIR') {
                const pct = parseFloat(valor);
                desc = `Reducir origen al ${valor} (<b>${(dosisActual * pct / 100).toFixed(1)} mg</b>).`;
            } else desc = `${accion} ${valor}`;
        } else {
            if (valor === 'TARGET' || accion === 'TITULAR_PROGRESIVO') {
                desc = `Alcanzar dosis objetivo de <b>${dosisObjetivo.toFixed(1)} mg</b>.`;
            } else if (valor.includes('%')) {
                const pct = parseFloat(valor);
                desc = `Iniciar nuevo al ${pct}% (<b>${(dosisObjetivo * pct / 100).toFixed(1)} mg</b>).`;
            } else {
                desc = `Iniciar nuevo a <b>${valor}</b>.`;
            }
        }

        html += `
            <div class="pauta-step">
                <div class="step-idx">${dia.replace('Día ', '')}</div>
                <div class="step-body">
                    <span class="tag-farm ${sujeto === 'NUEVO' ? 'tag-dest' : 'tag-orig'}">${sujeto === 'ACTUAL' ? 'Origen' : 'Nuevo'}</span>
                    <div class="step-txt">${desc}</div>
                </div>
            </div>`;
    });
    return html;
};

// 5. CÁLCULO Y VISUALIZACIÓN
window.ejecutarCalculo = function() {
    const orig = document.getElementById('f_orig').value;
    const dest = document.getElementById('f_dest').value;
    const dosis = parseFloat(document.getElementById('d_orig').value);
    
    const o = window.dbCalc.find(f => f.farmaco === orig);
    const d = window.dbCalc.find(f => f.farmaco === dest);
    
    if (isNaN(dosis) || !o || !d) return;

    // Cálculo Maudsley y Equivalencia en Rango
    const equivalente = (dosis / o.factor) * d.factor;
    const porcentajeRango = (dosis / o.max) * 100;
    const dosisRango = (porcentajeRango / 100) * d.max;

    // Alertas de seguridad
    let bg, color, alerta;
    if (equivalente > d.max) { bg = '#fee2e2'; color = '#b91c1c'; alerta = '⚠️ EXCEDE MÁXIMA'; }
    else if (equivalente > d.ed95) { bg = '#fef3c7'; color = '#b45309'; alerta = '⚠️ SUPERIOR A ED95'; }
    else if (equivalente < d.min) { bg = '#f1f5f9'; color = '#475569'; alerta = '🔍 BAJO MÍNIMO EFECTIVO'; }
    else { bg = '#dcfce7'; color = '#15803d'; alerta = '✅ RANGO TERAPÉUTICO'; }

    const resBox = document.getElementById('res-box');
    resBox.style.display = 'block';
    resBox.style.background = bg;

    document.getElementById('res-header').innerHTML = `
        <div style="background: rgba(255,255,255,0.6); padding: 1.5rem; border-radius: 1.2rem; margin-bottom: 10px;">
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

    // --- OBTENER INSTRUCCIÓN DE MATRIZ ---
    const fila = o.filaIdx;
    // Buscamos la columna del destino en la FILA 13 (Col G en adelante = índice 6)
    const fila13 = window.dbRaw[12];
    const colIdx = fila13.findIndex((val, idx) => idx >= 6 && val && val.toString().trim() === dest);

    let rawInstr = "";
    if (colIdx !== -1 && window.dbRaw[fila]) {
        rawInstr = window.dbRaw[fila][colIdx] ? window.dbRaw[fila][colIdx].toString() : "";
    }

    document.getElementById('res-pauta').innerHTML = `
        <h4 style="margin:0 0 1.2rem 0; font-size:0.8rem; text-transform:uppercase; color:var(--text-muted); letter-spacing: 1px;">Estrategia Sugerida</h4>
        ${orig === dest ? 'Origen y destino iguales.' : window.traducirPasos(rawInstr, dosis, equivalente)}
    `;
};
