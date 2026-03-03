/**
 * CALCULADORA APS - VERSIÓN "ÚLTIMA BALA"
 * 1. Lee Haloperidol en A2 sin filtros que lo borren.
 * 2. Usa la Fila 13 como GPS absoluto para el Switch.
 */

window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    // 1. ESTILOS (Timeline + UI Limpia)
    if (!document.getElementById('calc-internal-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'calc-internal-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.6rem; }
            .calc-ui h2 { margin: 0 0 1rem 0; font-weight: 800; display: flex; align-items: center; gap: 10px; }
            .calc-ui label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-top: 0.8rem; display: block; }
            .calc-ui select, .calc-ui input { width: 100%; padding: 0.9rem; border-radius: 1rem; border: 2px solid var(--border); background: var(--bg); color: var(--text-main); font-size: 1rem; outline: none; box-sizing: border-box; }
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

    try {
        const response = await fetch(`${window.WORKER_URL}?sheet=Data_APS`);
        const data = await response.json();

        if (data.values) {
            window.dbRaw = data.values;
            window.dbCalc = [];
            window.mapSwitchCol = {};

            // --- PASO 1: CARGAR LISTA DE FÁRMACOS (COLUMNA A, desde A2) ---
            // Recorremos el array. data.values[1] ES la celda A2.
            for (let i = 1; i < data.values.length; i++) {
                const fila = data.values[i];
                if (fila && fila[0]) {
                    const nombre = fila[0].toString().trim();
                    // Solo evitamos la palabra "Farmaco" si está en la celda A1, pero aquí i=1.
                    window.dbCalc.push({
                        farmaco: nombre,
                        filaIdx: i, // Guardamos que Haloperidol es la fila 1
                        factor: parseFloat(fila[1]) || 1,
                        max: parseFloat(fila[3]) || 0
                    });
                }
            }

            // --- PASO 2: MAPEAR LA FILA 13 (GPS PARA SWITCH) ---
            // Fila 13 en Excel es el índice 12 en el array de JavaScript.
            const fila13 = data.values[12];
            if (fila13) {
                fila13.forEach((celda, idx) => {
                    if (celda) {
                        const nombreDest = celda.toString().trim().toUpperCase();
                        window.mapSwitchCol[nombreDest] = idx;
                    }
                });
            }

            // --- RENDERIZADO DE LA UI ---
            const options = window.dbCalc.map(f => `<option value="${f.farmaco}">${f.farmaco}</option>`).join('');
            
            container.innerHTML = `
                <div class="calc-ui">
                    <h2><i class="fas fa-calculator"></i> APS Switch</h2>
                    
                    <label>Fármaco Origen (De A2 en adelante)</label>
                    <select id="f_orig">${options}</select>
                    
                    <label>Dosis Actual (mg/día)</label>
                    <input type="number" id="d_orig" placeholder="0.00">
                    
                    <label>Fármaco Destino (De A2 en adelante)</label>
                    <select id="f_dest">${options}</select>
                    
                    <button class="btn-primary" onclick="ejecutarCalculo()">CALCULAR ESTRATEGIA</button>
                    
                    <div id="res-box" class="res-container">
                        <div id="res-header" class="res-header"></div>
                        <div id="res-pauta" class="res-pauta"></div>
                    </div>
                </div>`;
            
            // Debug: Mostrar en consola si leyó Haloperidol
            console.log("Fármacos cargados:", window.dbCalc.map(f => f.farmaco));
        }
    } catch (e) {
        container.innerHTML = "Error en la carga: " + e.message;
    }
}

// 4. LÓGICA DE CÁLCULO E INTERSECCIÓN (TU SOLUCIÓN)
window.ejecutarCalculo = function() {
    const fOrigNom = document.getElementById('f_orig').value;
    const fDestNom = document.getElementById('f_dest').value;
    const dosisO = parseFloat(document.getElementById('d_orig').value);
    
    // Buscar ambos en la lista de Columna A para la dosis
    const o = window.dbCalc.find(f => f.farmaco === fOrigNom);
    const d = window.dbCalc.find(f => f.farmaco === fDestNom);
    
    if (isNaN(dosisO) || !o || !d) return;

    // Cálculo Maudsley: (Dosis / FactorOrigen) * FactorDestino
    const Maudsley = (dosisO / o.factor) * d.factor;
    
    document.getElementById('res-box').style.display = 'block';
    const header = document.getElementById('res-header');
    header.style.background = `hsl(${(fDestNom.length * 80) % 360}, 85%, 94%)`;
    header.innerHTML = `
        <div style="font-size:0.7rem; font-weight:800; opacity:0.6; text-transform:uppercase;">Dosis Objetivo Maudsley</div>
        <div style="font-size:2.8rem; font-weight:900;">${Maudsley.toFixed(1)} <span style="font-size:1.2rem;">mg/día</span></div>
    `;

    // --- EL CRUCE MAESTRO ---
    // Fila: Viene de la posición en Columna A (guardada en filaIdx)
    // Columna: Viene del nombre buscado en la Fila 13
    const filaReal = o.filaIdx; 
    const colReal = window.mapSwitchCol[fDestNom.trim().toUpperCase()];

    let rawInstr = "";
    if (colReal !== undefined && window.dbRaw[filaReal]) {
        // Obtenemos el texto del switch justo en el cruce [Fila A][Columna 13]
        rawInstr = window.dbRaw[filaReal][colReal] ? window.dbRaw[filaReal][colReal].toString() : "";
    }

    document.getElementById('res-pauta').innerHTML = `
        <h4 style="margin:0 0 1.2rem 0; font-size:0.8rem; text-transform:uppercase; color:var(--text-muted);">Estrategia</h4>
        ${fOrigNom === fDestNom ? 'Origen y destino iguales.' : window.traducirPasos(rawInstr, dosisO, Maudsley)}
    `;
}

// 5. TRADUCTOR DE PASOS
window.traducirPasos = function(rawStr, dOrig, targetMg) {
    if (!rawStr || rawStr.trim() === "" || rawStr === "NaN") return "Pauta de switch no definida en la matriz para este cruce.";
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
        let desc = (sujeto === 'ACTUAL') 
            ? (accion === 'REDUCIR' ? `Bajar origen al ${valor} (<b>${(dOrig * parseFloat(valor) / 100).toFixed(1)} mg</b>)` : `${accion} ${valor}`)
            : (valor.includes('TARGET') ? `Nuevo al ${valor.includes('%') ? parseFloat(valor) : 100}% (<b>${(targetMg * (parseFloat(valor) || 100) / 100).toFixed(1)} mg</b>)` : `Iniciar nuevo a ${valor}`);
        
        html += `<div class="pauta-step"><div class="step-idx">${dia.replace('Día ', '')}</div><div class="step-body"><span class="tag-farm ${sujeto === 'NUEVO' ? 'tag-dest' : 'tag-orig'}">${sujeto}</span><div class="step-txt">${desc}</div></div></div>`;
    });
    return html;
}
