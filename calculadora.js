// --- 1. CARGA DE DATOS (Filas 2-12 para parámetros) ---
window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    if (!document.getElementById('calc-internal-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'calc-internal-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; font-family: sans-serif; }
            .calc-ui select, .calc-ui input { width: 100%; padding: 0.8rem; border-radius: 0.8rem; border: 1px solid #ccc; margin-bottom: 0.5rem; }
            .btn-calc { padding: 1rem; background: #007bff; color: white; border: none; border-radius: 0.8rem; cursor: pointer; font-weight: bold; }
            .res-container { margin-top: 1.5rem; padding: 1rem; border-radius: 1rem; display: none; border: 1px solid #eee; }
        `;
        document.head.appendChild(styleTag);
    }
    
    if (!window.dbCalc) {
        try {
            const response = await fetch(`${window.WORKER_URL}?sheet=Data_APS`);
            const data = await response.json();
            if (data.values) {
                window.dbRaw = data.values; // Guardamos todo el Excel
                // Parámetros de conversión: Filas 2 a 12 (Índices 1 a 11)
                window.dbCalc = data.values.slice(1, 12).map(row => ({
                    farmaco: row[0] ? row[0].toString().trim() : "",
                    factor: parseFloat(row[1]) || 1,
                    max: parseFloat(row[3]) || 0,
                    ed95: parseFloat(row[2]) || 0
                })).filter(f => f.farmaco !== "");
            }
        } catch (e) {
            container.innerHTML = `Error: ${e.message}`;
            return;
        }
    }

    const options = window.dbCalc.map(f => `<option value="${f.farmaco}">${f.farmaco}</option>`).join('');
    container.innerHTML = `
        <div class="calc-ui">
            <h3>Calculadora APS</h3>
            <label>Origen</label><select id="f_orig">${options}</select>
            <label>Dosis Actual</label><input type="number" id="d_orig" placeholder="mg/día">
            <label>Destino</label><select id="f_dest">${options}</select>
            <button class="btn-calc" onclick="ejecutarCalculo()">CALCULAR ESTRATEGIA</button>
            <div id="res-box" class="res-container">
                <div id="res-val"></div>
                <div id="res-tip"></div>
            </div>
        </div>`;
}

// --- 2. TRADUCCIÓN DE LA INSTRUCCIÓN ---
window.traducirPasos = function(rawStr, dOrig, targetMg) {
    if (!rawStr || rawStr === "" || rawStr === "NaN") return "Pauta no definida en la matriz.";
    
    const bloques = rawStr.split('|').map(b => b.trim()).filter(Boolean);
    let html = '<ul style="padding-left:1.2rem;">';
    let targetReady = false;

    bloques.forEach(bloque => {
        let inst = bloque;
        // Manejo de condiciones IF
        if (inst.startsWith("IF_ACTUAL_")) {
            const match = inst.match(/IF_ACTUAL_([<>]=?)([\d.]+)(?:mg)?:(.*)/);
            if (match) {
                const cumple = eval(`${dOrig} ${match[1]} ${match[2]}`);
                if (!cumple) return;
                inst = match[3].trim();
            }
        }

        const p = inst.split(':').map(s => s.trim());
        if (p.length < 3) return;

        let linea = `<b>${p[0].replace('D', 'Día ')}:</b> `;
        if (p[1] === "ACTUAL") {
            if (p[2] === "STOP") linea += "Suspender origen.";
            else if (p[2] === "REDUCIR") linea += `Reducir origen al ${p[3]}% (${(dOrig * parseFloat(p[3]) / 100).toFixed(1)} mg).`;
        } else if (p[1] === "NUEVO" && !targetReady) {
            if (p[2] === "TITULAR_PROGRESIVO" || p[3] === "TARGET") {
                linea += `Titular hasta objetivo (<b>${targetMg.toFixed(1)} mg</b>).`;
                targetReady = true;
            } else {
                linea += `${p[2]} nuevo a ${p[3]}.`;
            }
        }
        html += `<li style="margin-bottom:5px;">${linea}</li>`;
    });
    return html + '</ul>';
}

// --- 3. EL CRUCE DE LA MATRIZ (A18-L28) ---
window.ejecutarCalculo = function() {
    const fOrig = document.getElementById('f_orig').value;
    const fDest = document.getElementById('f_dest').value;
    const dosis = parseFloat(document.getElementById('d_orig').value);
    
    const o = window.dbCalc.find(f => f.farmaco === fOrig);
    const d = window.dbCalc.find(f => f.farmaco === fDest);
    if (!dosis || !o || !d) return alert("Faltan datos");

    const Maudsley = (dosis / o.factor) * d.factor;
    const resBox = document.getElementById('res-box');
    resBox.style.display = 'block';
    resBox.style.background = Maudsley > d.max ? "#fff0f0" : "#f0fff0";

    document.getElementById('res-val').innerHTML = `
        <div style="text-align:center;">
            <span style="font-size:0.8rem; color:#666;">Dosis Recomendada</span>
            <div style="font-size:2rem; font-weight:bold;">${Maudsley.toFixed(1)} mg</div>
        </div>`;

    // FUNCIÓN DE CRUCE ORIGINAL
    const limpiar = (s) => s.toString().toLowerCase().trim();

    // A. Buscar FILA de Origen (Columna A, desde fila 18 -> índice 17)
    let rowIndex = -1;
    for (let i = 17; i < window.dbRaw.length; i++) {
        if (window.dbRaw[i][0] && limpiar(window.dbRaw[i][0]) === limpiar(fOrig)) {
            rowIndex = i;
            break;
        }
    }

    // B. Buscar COLUMNA de Destino (Fila 17 -> índice 16, desde columna B -> índice 1)
    const fila17 = window.dbRaw[16] || [];
    let colIndex = -1;
    for (let j = 1; j < fila17.length; j++) {
        if (fila17[j] && limpiar(fila17[j]) === limpiar(fDest)) {
            colIndex = j;
            break;
        }
    }

    const instruccion = (rowIndex > -1 && colIndex > -1) ? window.dbRaw[rowIndex][colIndex] : "";

    

    document.getElementById('res-tip').innerHTML = `
        <div style="margin-top:1rem; border-top:1px solid #ccc; padding-top:1rem;">
            <strong>PAUTA DE CAMBIO:</strong><br><br>
            ${window.traducirPasos(instruccion, dosis, Maudsley)}
        </div>`;
}
