// --- 1. CONFIGURACIÓN Y CARGA DE DATOS ---
window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    if (!document.getElementById('calc-internal-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'calc-internal-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.4rem; font-family: sans-serif; }
            .calc-ui h2 { margin: 0 0 1.5rem 0; font-weight: 800; color: #1a1a1a; }
            .calc-ui label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #666; margin-top: 0.8rem; display: block; }
            .calc-ui select, .calc-ui input { 
                width: 100%; padding: 0.9rem; border-radius: 1rem; border: 2px solid #e5e7eb; 
                background: #fff; color: #1a1a1a; font-size: 1rem; outline: none; box-sizing: border-box;
            }
            .calc-ui select:focus, .calc-ui input:focus { border-color: #3b82f6; }
            .res-container { padding: 1.5rem; border-radius: 1.5rem; margin-top: 1.5rem; display: none; border: 1px solid rgba(0,0,0,0.05); }
            .btn-calc { margin-top: 1.2rem; cursor: pointer; background: #2563eb; color: white; border: none; padding: 1rem; border-radius: 1rem; font-weight: bold; width: 100%; }
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
                    ed95: row[2] || "0", // Lo dejamos como string por si hay rangos (5-10)
                    max: parseFloat(row[3]) || 0,
                    min: parseFloat(row[4]) || 0
                })).filter(f => f.farmaco !== "");
            }
        } catch (e) {
            container.innerHTML = `<div style="padding:2rem;">Error al cargar Excel: ${e.message}</div>`;
            return;
        }
    }

    const options = window.dbCalc.map(f => `<option value="${f.farmaco}">${f.farmaco}</option>`).join('');
    container.innerHTML = `
        <div class="calc-ui">
            <h2>Calculadora APS</h2>
            <label>Fármaco Origen</label><select id="f_orig">${options}</select>
            <label>Dosis Actual (mg/día)</label><input type="number" id="d_orig" step="any" placeholder="0.00">
            <label>Fármaco Destino</label><select id="f_dest">${options}</select>
            <button class="btn-calc" onclick="ejecutarCalculo()">CALCULAR ESTRATEGIA</button>
            <div id="res-box" class="res-container">
                <div id="res-val"></div>
                <div id="res-tip"></div>
            </div>
        </div>`;
}

// --- 2. MOTOR DE TRADUCCIÓN DE INSTRUCCIONES ---
window.traducirPasos = function(rawStr, dOrig, targetMg) {
    if (!rawStr || rawStr.trim() === "" || rawStr === "NaN") return "<span style='opacity:0.5;'>Pauta no definida en la matriz.</span>";
    
    const bloques = rawStr.split('|').map(b => b.trim()).filter(Boolean);
    let html = '<ul style="list-style:none; padding:0; margin:0;">';
    let targetAlcanzado = false;

    bloques.forEach(bloque => {
        let inst = bloque;
        if (inst.startsWith("IF_ACTUAL_")) {
            const m = inst.match(/IF_ACTUAL_([<>]=?)([\d.]+)(?:mg)?:(.*)/);
            if (m) {
                const op = m[1], corte = parseFloat(m[2]), resto = m[3];
                const cumple = eval(`${dOrig} ${op} ${corte}`);
                if (!cumple) return;
                inst = resto.trim();
            }
        }

        const p = inst.split(':').map(s => s.trim());
        if (p.length < 3) return;

        let txt = `<b>${p[0].replace('D', 'Día ')}:</b> `;
        if (p[1] === "ACTUAL") {
            if (p[2] === "STOP") txt += "Suspender origen.";
            else if (p[2] === "REDUCIR") txt += `Reducir origen a <b>${(dOrig * parseFloat(p[3]) / 100).toFixed(1)} mg</b>.`;
            else if (p[2] === "MANTENER") txt += "Mantener dosis origen.";
        } else if (p[1] === "NUEVO" && !targetAlcanzado) {
            if (p[2] === "TITULAR_PROGRESIVO" || p[3] === "TARGET") {
                txt += `Titular hasta dosis objetivo (<b>${targetMg.toFixed(1)} mg</b>).`;
                targetAlcanzado = true;
            } else if (p[3].includes('%_TARGET')) {
                txt += `Iniciar nuevo a <b>${(targetMg * parseFloat(p[3]) / 100).toFixed(1)} mg</b>.`;
            } else {
                txt += `${p[2] === "INICIAR" ? "Iniciar" : "Subir"} nuevo a <b>${p[3]}</b>.`;
            }
        }
        html += `<li style="margin-bottom:8px; line-height:1.4;">${txt}</li>`;
    });
    return html + '</ul>';
}

// --- 3. LÓGICA DE CÁLCULO Y CRUCE DE LA NUEVA MATRIZ ---
window.ejecutarCalculo = function() {
    const fOrig = document.getElementById('f_orig').value;
    const fDest = document.getElementById('f_dest').value;
    const dosis = parseFloat(document.getElementById('d_orig').value);
    
    const o = window.dbCalc.find(f => f.farmaco === fOrig);
    const d = window.dbCalc.find(f => f.farmaco === fDest);
    if (!dosis || isNaN(dosis) || !o || !d) return alert("Introduce una dosis válida.");

    const Maudsley = (dosis / o.factor) * d.factor;
    const ed95_num = parseFloat(d.ed95.toString().split('-')[0]) || 0; // Maneja rangos como "5-10"

    let color = Maudsley > d.max ? "#b91c1c" : (Maudsley > ed95_num ? "#b45309" : "#15803d");
    let bg = Maudsley > d.max ? "#fee2e2" : (Maudsley > ed95_num ? "#fef3c7" : "#dcfce7");
    let estado = Maudsley > d.max ? "⚠️ EXCEDE MÁXIMA" : (Maudsley > ed95_num ? "⚠️ SUPERIOR ED95" : "✅ RANGO ESTÁNDAR");

    const resBox = document.getElementById('res-box');
    resBox.style.display = 'block';
    resBox.style.background = bg;

    document.getElementById('res-val').innerHTML = `
        <div style="background: rgba(255,255,255,0.7); padding: 1.2rem; border-radius: 1rem; text-align: center; border: 1px solid rgba(0,0,0,0.05);">
            <div style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #666; margin-bottom: 5px;">Dosis Maudsley</div>
            <div style="font-size: 2.5rem; font-weight: 900; line-height: 1;">${Maudsley.toFixed(1)} <span style="font-size: 1rem;">mg/d</span></div>
            <div style="display: inline-block; margin-top: 10px; padding: 4px 12px; border-radius: 50px; font-size: 0.7rem; font-weight: 900; background: white; color: ${color}; border: 1px solid ${color};">${estado}</div>
        </div>`;

    // --- CRUCE DE LA NUEVA MATRIZ (A17-L28) ---
    const limpiar = (s) => s ? s.toString().toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
    const fOrigLimpiar = limpiar(fOrig);
    const fDestLimpiar = limpiar(fDest);

    // A. Buscar FILA de Origen (A18 a A28 -> Índices 17 a 27)
    let rowIndex = -1;
    for (let i = 17; i < 28; i++) {
        if (window.dbRaw[i] && limpiar(window.dbRaw[i][0]) === fOrigLimpiar) {
            rowIndex = i;
            break;
        }
    }

    // B. Buscar COLUMNA de Destino (B17 a L17 -> Fila índice 16, Columnas 1 a 11)
    const fila17 = window.dbRaw[16] || [];
    let colIndex = -1;
    for (let j = 1; j < 12; j++) {
        if (fila17[j] && limpiar(fila17[j]) === fDestLimpiar) {
            colIndex = j;
            break;
        }
    }

    const instruccionRaw = (rowIndex > -1 && colIndex > -1) ? window.dbRaw[rowIndex][colIndex] : "";
    
    

    document.getElementById('res-tip').innerHTML = `
        <div style="margin-top: 20px; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 15px;">
            <span style="font-size: 0.75rem; font-weight: 900; text-transform: uppercase; opacity: 0.5; display: block; margin-bottom: 12px;">Estrategia de Cambio</span>
            <div style="background: white; padding: 1rem; border-radius: 1rem; border: 1px solid rgba(0,0,0,0.05);">
                ${window.traducirPasos(instruccionRaw, dosis, Maudsley)}
            </div>
        </div>`;
}
