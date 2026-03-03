/**
 * CALCULADORA APS (Antipsychotic Switch)
 * Lógica: Origen (Col A) | Destino (Col A) para Dosis
 * Lógica: Origen (Col A) | Destino (Fila 13) para Switch
 */

window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    // 1. ESTILOS
    if (!document.getElementById('calc-internal-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'calc-internal-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.6rem; }
            .calc-ui h2 { margin: 0 0 1rem 0; font-weight: 800; display: flex; align-items: center; gap: 12px; color: var(--text-main); }
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

    // 2. CARGA DE DATOS
    if (!window.dbCalc) {
        try {
            const pestaña = "Data_APS";
            const response = await fetch(`${window.WORKER_URL}?sheet=${pestaña}`);
            const data = await response.json();
            
            if (data.values) {
                window.dbRaw = data.values;
                window.dbCalc = [];
                window.mapColFila13 = {};

                // A. Mapeamos la FILA 13 (Índice 12) para encontrar las columnas de destino
                const fila13 = data.values[12];
                if (fila13) {
                    fila13.forEach((nombre, idx) => {
                        if (nombre) window.mapColFila13[nombre.toString().trim().toUpperCase()] = idx;
                    });
                }

                // B. Cargamos fármacos de la COLUMNA A (desde Fila 2 / Índice 1)
                // Esto asegura que el Haloperidol (A2) sea el primero.
                for (let i = 1; i < data.values.length; i++) {
                    const row = data.values[i];
                    if (row && row[0]) {
                        const nombre = row[0].toString().trim();
                        if (nombre !== "" && nombre.toLowerCase() !== "farmaco") {
                            window.dbCalc.push({
                                nombre: nombre,
                                filaIdx: i, // Guardamos su fila real para el cruce
                                factor: parseFloat(row[1]) || 1,
                                max: parseFloat(row[3]) || 0,
                                categoria: row[11] || "Antipsicótico"
                            });
                        }
                    }
                }
            }
        } catch (e) {
            container.innerHTML = `<div style="padding:2rem;">Error: ${e.message}</div>`;
            return;
        }
    }

    // 3. RENDERIZADO (Usamos dbCalc que empieza en A2)
    const options = window.dbCalc.map(f => `<option value="${f.nombre}">${f.nombre}</option>`).join('');
    container.innerHTML = `
        <div class="calc-ui">
            <h2><i class="fas fa-random"></i> APS Switch Manager</h2>
            <label>Fármaco Origen</label>
            <select id="f_orig">${options}</select>
            <label>Dosis Actual (mg/día)</label>
            <input type="number" id="d_orig" placeholder="0.00" step="any">
            <label>Fármaco Destino</label>
            <select id="f_dest">${options}</select>
            <button class="btn-ejecutar" onclick="ejecutarCalculo()">CALCULAR ESTRATEGIA</button>
            <div id="res-box" class="res-container">
                <div id="res-header" class="res-header"></div>
                <div id="res-pauta" class="res-pauta"></div>
            </div>
        </div>`;
};

// 4. LÓGICA DE CÁLCULO E INTERSECCIÓN (TU SOLUCIÓN)
window.ejecutarCalculo = function() {
    const fOrigNom = document.getElementById('f_orig').value;
    const fDestNom = document.getElementById('f_dest').value;
    const dosisO = parseFloat(document.getElementById('d_orig').value);
    
    // Buscar ambos en dbCalc (Columna A) para la conversión de mg
    const o = window.dbCalc.find(f => f.nombre === fOrigNom);
    const d = window.dbCalc.find(f => f.nombre === fDestNom);
    
    if (isNaN(dosisO) || !o || !d) return;

    // Cálculo Maudsley: (Dosis Origen / Factor Origen) * Factor Destino
    const Maudsley = (dosisO / o.factor) * d.factor;
    
    const resBox = document.getElementById('res-box');
    const header = document.getElementById('res-header');
    resBox.style.display = 'block';

    header.style.background = `hsl(${(fDestNom.length * 60) % 360}, 80%, 94%)`;
    header.innerHTML = `
        <div style="font-size: 0.7rem; font-weight: 800; opacity: 0.6; text-transform: uppercase;">Dosis Maudsley Estimada</div>
        <div style="font-size: 2.8rem; font-weight: 900;">${Maudsley.toFixed(1)} <span style="font-size: 1.2rem;">mg/día</span></div>
    `;

    // --- INTERSECCIÓN PARA EL SWITCH ---
    // Origen: Fila del fármaco en Col A | Destino: Columna mapeada de la Fila 13
    const filaIdx = o.filaIdx;
    const colIdx = window.mapColFila13[fDestNom.trim().toUpperCase()];

    let rawInstr = "";
    if (colIdx !== undefined && window.dbRaw[filaIdx]) {
        rawInstr = window.dbRaw[filaIdx][colIdx] ? window.dbRaw[filaIdx][colIdx].toString() : "";
    }

    document.getElementById('res-pauta').innerHTML = `
        <h4 style="margin:0 0 1rem 0; font-size:0.8rem; text-transform:uppercase; color:var(--text-muted);">Estrategia Sugerida</h4>
        ${fOrigNom === fDestNom ? 'Origen y destino son iguales.' : window.traducirPasos(rawInstr, dosisO, Maudsley)}
    `;
};

// 5. TRADUCTOR DE PASOS
window.traducirPasos = function(rawStr, dOrig, targetMg) {
    if (!rawStr || rawStr.trim() === "" || rawStr === "NaN") return "Pauta de switch no definida.";
    const bloques = rawStr.split('|').map(b => b.trim()).filter(Boolean);
    let html = '';
    bloques.forEach(bloque => {
        let texto = bloque;
        if (texto.startsWith("IF_ACTUAL_")) {
            const m = texto.match(/IF_ACTUAL_([<>]=?)([\d.]+)(?:mg)?:(.*)/);
            if (m) {
                const op = m[1], corte = parseFloat(m[2]), resto = m[3];
                const cumple = eval(`${dOrig} ${op === '=' ? '==' : op} ${corte}`);
                if (!cumple) return; texto = resto.trim();
            }
        }
        const p = texto.split(':').map(s => s.trim());
        if (p.length < 3) return;
        const dia = p[0].replace('D', 'Día '), sujeto = p[1], accion = p[2], valor = p[3] || "";
        let desc = '';
        if (sujeto === 'ACTUAL') {
            if (accion === 'STOP') desc = 'Suspender origen.';
            else if (accion === 'REDUCIR') desc = `Bajar origen al ${valor} (<b>${(dOrig * parseFloat(valor) / 100).toFixed(1)} mg</b>).`;
            else desc = `${accion} ${valor}`;
        } else {
            if (valor.includes('TARGET')) {
                const pct = valor.includes('%') ? parseFloat(valor) : 100;
                desc = `Nuevo fármaco al ${pct}% (<b>${(targetMg * pct / 100).toFixed(1)} mg</b>).`;
            } else desc = `Iniciar nuevo a ${valor}.`;
        }
        html += `<div class="pauta-step"><div class="step-idx">${dia.replace('Día ', '')}</div><div class="step-body"><span class="tag-farm ${sujeto === 'NUEVO' ? 'tag-dest' : 'tag-orig'}">${sujeto === 'ACTUAL' ? 'Origen' : 'Nuevo'}</span><div class="step-txt">${desc}</div></div></div>`;
    });
    return html;
};
