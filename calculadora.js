// --- 1. CARGA DE DATOS ---
window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    if (!document.getElementById('calc-internal-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'calc-internal-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; font-family: sans-serif; }
            .calc-ui h2 { font-weight: 800; margin-bottom: 1rem; }
            .calc-ui select, .calc-ui input { width: 100%; padding: 0.8rem; border-radius: 0.8rem; border: 2px solid #ddd; margin-bottom: 0.5rem; font-size: 1rem; }
            .btn-calc { padding: 1rem; background: #2563eb; color: white; border: none; border-radius: 0.8rem; cursor: pointer; font-weight: bold; width: 100%; }
            .res-container { margin-top: 1.5rem; padding: 1.2rem; border-radius: 1.2rem; display: none; border: 1px solid #eee; }
        `;
        document.head.appendChild(styleTag);
    }
    
    if (!window.dbCalc) {
        try {
            const response = await fetch(`${window.WORKER_URL}?sheet=Data_APS`);
            const data = await response.json();
            if (data.values) {
                window.dbRaw = data.values; 
                // DATOS DE SIEMPRE: Filas 2 a 12 (Índices 1 a 11)
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
            <h2>Calculadora APS</h2>
            <label>Fármaco Origen</label><select id="f_orig">${options}</select>
            <label>Dosis Actual (mg/d)</label><input type="number" id="d_orig" step="any">
            <label>Fármaco Destino</label><select id="f_dest">${options}</select>
            <button class="btn-calc" onclick="ejecutarCalculo()">CALCULAR ESTRATEGIA</button>
            <div id="res-box" class="res-container">
                <div id="res-val"></div>
                <div id="res-tip"></div>
            </div>
        </div>`;
}

// --- 2. TRADUCCIÓN DE INSTRUCCIONES (RESILIENTE) ---
window.traducirPasos = function(rawStr, dOrig, targetMg) {
    if (!rawStr || rawStr === "" || rawStr === "NaN") return "<i>Pauta no definida en la matriz.</i>";
    
    // Corregimos errores de pegado en Excel (ej. "TARGETIF_ACTUAL" -> "TARGET | IF_ACTUAL")
    let cleanStr = rawStr.replace(/TARGETIF_ACTUAL/g, "TARGET | IF_ACTUAL");
    
    const bloques = cleanStr.split('|').map(b => b.trim()).filter(Boolean);
    let html = '<ul style="padding-left:1.2rem; margin:0;">';
    let targetReady = false;

    bloques.forEach(bloque => {
        let inst = bloque;
        
        // Manejo de condiciones IF (soporta decimales)
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
            else if (p[2] === "REDUCIR") linea += `Reducir origen al ${p[3]}% (<b>${(dOrig * parseFloat(p[3]) / 100).toFixed(1)} mg</b>).`;
            else if (p[2] === "MANTENER") linea += "Mantener dosis origen.";
        } else if (p[1] === "NUEVO" && !targetReady) {
            if (p[2] === "TITULAR_PROGRESIVO" || p[3] === "TARGET" || p[3].includes("TARGET")) {
                linea += `Titular hasta dosis objetivo (<b>${targetMg.toFixed(1)} mg</b>).`;
                targetReady = true;
            } else if (p[3].includes('%_TARGET')) {
                linea += `Iniciar nuevo a <b>${(targetMg * parseFloat(p[3]) / 100).toFixed(1)} mg</b>.`;
            } else {
                linea += `${p[2]} nuevo a <b>${p[3]}</b>.`;
            }
        }
        html += `<li style="margin-bottom:8px; line-height:1.4;">${linea}</li>`;
    });
    return html + '</ul>';
}

// --- 3. LÓGICA DE CRUCE (MATRIZ A18-L28) ---
window.ejecutarCalculo = function() {
    const fOrig = document.getElementById('f_orig').value;
    const fDest = document.getElementById('f_dest').value;
    const dosis = parseFloat(document.getElementById('d_orig').value);
    
    const o = window.dbCalc.find(f => f.farmaco === fOrig);
    const d = window.dbCalc.find(f => f.farmaco === fDest);
    if (!dosis || isNaN(dosis) || !o || !d) return alert("Faltan datos");

    const Maudsley = (dosis / o.factor) * d.factor;
    const resBox = document.getElementById('res-box');
    resBox.style.display = 'block';
    resBox.style.background = Maudsley > d.max ? "#fee2e2" : "#dcfce7";

    document.getElementById('res-val').innerHTML = `
        <div style="text-align:center; padding:1rem; background:white; border-radius:1rem; border:1px solid #eee;">
            <small style="color:#666; font-weight:bold;">DOSIS RECOMENDADA (MAUDSLEY)</small>
            <div style="font-size:2.5rem; font-weight:900;">${Maudsley.toFixed(1)} <span style="font-size:1rem;">mg/d</span></div>
        </div>`;

    // CRUCE DE MATRIZ GEOGRÁFICO
    const limpiar = (s) => s.toString().toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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

    // Depuración en consola para ver qué está pasando
    console.log(`Cruce: Origen ${fOrig}(Fila ${rowIndex}), Destino ${fDest}(Col ${colIndex})`);

    const instruccion = (rowIndex > -1 && colIndex > -1) ? window.dbRaw[rowIndex][colIndex] : "";

    document.getElementById('res-tip').innerHTML = `
        <div style="margin-top:1.5rem; border-top:1px solid #ddd; padding-top:1rem;">
            <strong style="font-size:0.75rem; color:#888;">ESTRATEGIA DE CAMBIO</strong><br><br>
            ${window.traducirPasos(instruccion, dosis, Maudsley)}
        </div>`;
}
