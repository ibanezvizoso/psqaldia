/**
 * CALCULADORA APS - SOLUCIÓN FINAL SWITCH
 * 1. Datos: Columna A (Haloperidol en A2)
 * 2. Mapa de Switch: Cruce entre Fila (Origen A) y Columna (Destino Fila 13)
 */

window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    // 1. ESTILOS
    if (!document.getElementById('calc-internal-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'calc-internal-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.6rem; }
            .calc-ui h2 { margin: 0 0 1rem 0; font-weight: 800; display: flex; align-items: center; gap: 10px; }
            .calc-ui label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-top: 0.8rem; display: block; }
            .calc-ui select, .calc-ui input { 
                width: 100%; padding: 0.9rem; border-radius: 1rem; border: 2px solid var(--border); 
                background: var(--bg); color: var(--text-main); font-size: 1rem; outline: none; box-sizing: border-box;
            }
            .btn-primary { margin-top: 1.2rem; padding: 1.1rem; background: var(--primary); color: white; border: none; border-radius: 1.2rem; cursor: pointer; font-weight: 900; font-size: 1rem; }
            .res-container { margin-top: 1.5rem; border-radius: 1.5rem; display: none; border: 1px solid rgba(0,0,0,0.05); overflow: hidden; }
            .res-header { padding: 1.5rem; text-align: center; border-bottom: 1px solid rgba(0,0,0,0.05); }
            .res-pauta { padding: 1.5rem; background: var(--bg); }
            .pauta-step { display: flex; gap: 1rem; margin-bottom: 1.2rem; position: relative; }
            .pauta-step:not(:last-child)::after { content: ''; position: absolute; left: 17px; top: 35px; bottom: -15px; width: 2px; background: var(--border); opacity: 0.5; }
            .step-idx { min-width: 36px; height: 36px; background: white; border: 2px solid var(--border); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.8rem; z-index: 1; }
            .tag-farm { font-weight: 800; font-size: 0.65rem; text-transform: uppercase; padding: 3px 8px; border-radius: 6px; display: inline-block; margin-bottom: 6px; }
            .tag-orig { background: #fee2e2; color: #b91c1c; }
            .tag-dest { background: #dcfce7; color: #15803d; }
            .step-txt { font-size: 0.95rem; line-height: 1.4; color: var(--text-main); }
        `;
        document.head.appendChild(styleTag);
    }

    // 2. CARGA DE DATOS (Fila 13 para switch, Columna A para fármacos)
    if (!window.dbCalc) {
        try {
            const pestaña = "Data_APS";
            const response = await fetch(`${window.WORKER_URL}?sheet=${pestaña}`);
            const data = await response.json();

            if (data.values) {
                window.dbRaw = data.values;
                
                // Cargamos dbCalc desde Columna A (respetando tu mapeo original que lee A2)
                window.dbCalc = data.values.map((row, index) => ({
                    farmaco: row[0] ? row[0].toString().trim() : "",
                    factor: parseFloat(row[1]) || 1,
                    ed95: parseFloat(row[2]) || 0,
                    max: parseFloat(row[3]) || 0,
                    min: parseFloat(row[4]) || 0,
                    umbral: parseFloat(row[5]) || 0,
                    filaIdx: index 
                })).filter(f => f.farmaco && f.farmaco.toLowerCase() !== "farmaco");

                // MAPEAMOS LA FILA 13 (Índice 12) para encontrar las columnas de destino
                window.mapDestinoSwitch = {};
                const fila13 = data.values[12];
                if (fila13) {
                    fila13.forEach((val, idx) => {
                        if (val) {
                            // Guardamos el nombre en MAYÚSCULAS y sin espacios para que la búsqueda sea infalible
                            const nombreLimpio = val.toString().trim().toUpperCase();
                            window.mapDestinoSwitch[nombreLimpio] = idx;
                        }
                    });
                }
            }
        } catch (e) {
            container.innerHTML = `<div style="padding:2.5rem;">Error: ${e.message}</div>`;
            return;
        }
    }

    const options = window.dbCalc.map(f => `<option value="${f.farmaco}">${f.farmaco}</option>`).join('');
    container.innerHTML = `
        <div class="calc-ui">
            <h2><i class="fas fa-calculator"></i> Calculadora APS</h2>
            <label>Fármaco Origen</label>
            <select id="f_orig">${options}</select>
            <label>Dosis Actual (mg/día)</label>
            <input type="number" id="d_orig" placeholder="0.00">
            <label>Fármaco Destino</label>
            <select id="f_dest">${options}</select>
            <button class="btn-primary" onclick="ejecutarCalculo()">CALCULAR ESTRATEGIA</button>
            <div id="res-box" class="res-container">
                <div id="res-header" class="res-header"></div>
                <div id="res-pauta" class="res-pauta"></div>
            </div>
        </div>`;
}

// 4. CÁLCULO Y LOCALIZACIÓN DE PAUTA
window.ejecutarCalculo = function() {
    const fOrigNom = document.getElementById('f_orig').value;
    const fDestNom = document.getElementById('f_dest').value;
    const dosisO = parseFloat(document.getElementById('d_orig').value);
    
    const o = window.dbCalc.find(f => f.farmaco === fOrigNom);
    const d = window.dbCalc.find(f => f.farmaco === fDestNom);
    
    if (isNaN(dosisO) || !o || !d) return;

    // Conversión Maudsley
    const Maudsley = (dosisO / o.factor) * d.factor;
    
    document.getElementById('res-box').style.display = 'block';
    const header = document.getElementById('res-header');
    header.style.background = `hsl(${(fDestNom.length * 65) % 360}, 85%, 94%)`;
    header.innerHTML = `
        <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Dosis Maudsley Estimada</div>
        <div style="font-size: 2.8rem; font-weight: 900; color: var(--text-main);">${Maudsley.toFixed(1)} <span style="font-size: 1.2rem;">mg/día</span></div>
    `;

    // --- BÚSQUEDA EN LA MATRIZ ---
    // Fila: La que guardamos de la Columna A
    // Columna: La que buscamos en el mapa de la Fila 13
    const filaIdx = o.filaIdx;
    const colIdx = window.mapDestinoSwitch[fDestNom.trim().toUpperCase()];

    let rawInstr = "";
    if (colIdx !== undefined && window.dbRaw[filaIdx]) {
        rawInstr = window.dbRaw[filaIdx][colIdx] ? window.dbRaw[filaIdx][colIdx].toString() : "";
    }

    document.getElementById('res-pauta').innerHTML = `
        <h4 style="margin:0 0 1rem 0; font-size:0.8rem; text-transform:uppercase; color:var(--text-muted);">Estrategia de Cambio</h4>
        ${fOrigNom === fDestNom ? 'Cambio no necesario.' : window.traducirPasos(rawInstr, dosisO, Maudsley)}
    `;
}

// 5. TRADUCTOR DE PASOS
window.traducirPasos = function(rawStr, dOrig, targetMg) {
    if (!rawStr || rawStr.trim() === "" || rawStr === "NaN") {
        return `<div style="color:var(--text-muted); font-style:italic;">No hay pauta específica para este cruce en la matriz. Revise la fila 13 y la columna A del Excel.</div>`;
    }
    const bloques = rawStr.split('|').map(b => b.trim()).filter(Boolean);
    let html = '';
    bloques.forEach(bloque => {
        let texto = bloque;
        if (texto.startsWith("IF_ACTUAL_")) {
            const m = texto.match(/IF_ACTUAL_([<>]=?)([\d.]+)(?:mg)?:(.*)/);
            if (m) {
                const cumple = eval(`${dOrig} ${m[1] === '=' ? '==' : m[1]} ${m[2]}`);
                if (!cumple) return; texto = m[3].trim();
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
                desc = `Nuevo fármaco al ${pct}% de dosis objetivo (<b>${(targetMg * pct / 100).toFixed(1)} mg</b>).`;
            } else desc = `Iniciar nuevo a ${valor}.`;
        }
        html += `<div class="pauta-step"><div class="step-idx">${dia.replace('Día ', '')}</div><div class="step-body"><span class="tag-farm ${sujeto === 'NUEVO' ? 'tag-dest' : 'tag-orig'}">${sujeto}</span><div class="step-txt">${desc}</div></div></div>`;
    });
    return html;
}
