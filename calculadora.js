// --- CARGA DE DATOS, ESTILOS Y FUNCIÓN PRINCIPAL ---
window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    // A. INYECCIÓN DE ESTILOS (Idénticos a tu original)
    if (!document.getElementById('calc-internal-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'calc-internal-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.4rem; }
            .calc-ui h2 { margin: 0 0 1.5rem 0; font-weight: 800; }
            .calc-ui label { 
                font-size: 0.75rem; font-weight: 800; text-transform: uppercase; 
                color: var(--text-muted); margin-top: 0.8rem; display: block; 
            }
            .calc-ui select, .calc-ui input { 
                width: 100%; padding: 0.9rem; border-radius: 1rem; border: 2px solid var(--border); 
                background: var(--bg); color: var(--text-main); font-size: 1rem; 
                font-family: inherit; outline: none; box-sizing: border-box;
            }
            .calc-ui select:focus, .calc-ui input:focus { border-color: var(--primary); }
            .res-container { 
                padding: 1.5rem; border-radius: 1.5rem; margin-top: 1.5rem; 
                display: none; border: 1px solid rgba(0,0,0,0.05); 
            }
            .calc-ui .btn-primary { margin-top: 1.2rem; cursor: pointer; }
        `;
        document.head.appendChild(styleTag);
    }
    
    // 1. CARGA DE DATOS
    if (!window.dbCalc) {
        try {
            const pestaña = "Data_APS"; 
            const response = await fetch(`${window.WORKER_URL}?sheet=${pestaña}`);
            const data = await response.json();

            if (data.error) throw new Error(data.details || data.error);

            if (data.values) {
                window.dbRaw = data.values; // Almacenamos el Excel bruto para el cruce
                window.dbCalc = data.values.map(row => ({
                    farmaco: row[0] ? row[0].toString().trim() : "",
                    factor: parseFloat(row[1]) || 1,
                    ed95: parseFloat(row[2]) || 0,
                    max: parseFloat(row[3]) || 0,
                    min: parseFloat(row[4]) || 0,
                    umbral: parseFloat(row[5]) || 0
                })).filter(f => f.farmaco && f.farmaco !== "Farmaco");
            }
        } catch (e) {
            container.innerHTML = `<div style="padding:2.5rem;">Error: ${e.message}</div>`;
            return;
        }
    }

    const options = window.dbCalc.map(f => `<option value="${f.farmaco}">${f.farmaco}</option>`).join('');
    
    container.innerHTML = `
        <div class="calc-ui">
            <h2 style="margin-bottom:1.5rem;"><i class="fas fa-calculator"></i> Calculadora APS</h2>
            <label>Fármaco Origen</label>
            <select id="f_orig">${options}</select>
            <label>Dosis Actual (mg/día)</label>
            <input type="number" id="d_orig" placeholder="0.00">
            <label>Fármaco Destino</label>
            <select id="f_dest">${options}</select>
            <button class="btn btn-primary" style="width:100%;" onclick="ejecutarCalculo()">CALCULAR</button>
            <div id="res-box" class="res-container" style="background:var(--bg); margin-top: 1.5rem;">
                <div id="res-val" style="font-size:2.2rem; font-weight:900;"></div>
                <div id="res-alert"></div>
                <div id="res-tip"></div>
            </div>
        </div>`;
}

// --- MOTOR DE TRADUCCIÓN (TRADUCE EL FORMATO D1:ACTUAL...) ---
window.traducirPasos = function(rawStr, dOrig, targetMg) {
    if (!rawStr || rawStr.trim() === "") return "Pauta no definida.";

    const bloques = rawStr.split('|').map(b => b.trim()).filter(Boolean);
    let htmlPasos = '<ul style="list-style:none; padding:0; margin:0;">';
    let targetAlcanzado = false;

    bloques.forEach(bloque => {
        let instruccion = bloque;
        
        // Procesar IF_ACTUAL_ para cada bloque individualmente
        if (instruccion.startsWith("IF_ACTUAL_")) {
            const match = instruccion.match(/IF_ACTUAL_([<>]=?)(\d+)(?:mg)?:(.*)/);
            if (match) {
                const op = match[1], corte = parseFloat(match[2]), resto = match[3];
                const cumple = (op === '<' && dOrig < corte) || (op === '>' && dOrig > corte) || 
                               (op === '<=' && dOrig <= corte) || (op === '>=' && dOrig >= corte);
                if (!cumple) return; // Ignorar este bloque si no cumple
                instruccion = resto.trim();
            }
        }

        const partes = instruccion.split(':').map(s => s.trim());
        if (partes.length < 3) return;

        const dia = partes[0].replace('D', 'Día ');
        const sujeto = partes[1], accion = partes[2], valor = partes[3] || "";

        let texto = `<b>${dia}:</b> `;

        if (sujeto === "ACTUAL") {
            if (accion === "STOP") texto += "Suspender origen.";
            else if (accion === "REDUCIR") {
                const perc = parseFloat(valor);
                texto += isNaN(perc) ? `Reducir origen (${valor}).` : `Reducir origen a ${(dOrig * perc / 100).toFixed(1)} mg.`;
            } else if (accion === "MANTENER") texto += "Mantener dosis origen.";
        } else if (sujeto === "NUEVO" && !targetAlcanzado) {
            if (accion === "INICIAR" || accion === "SUBIR") {
                const mgPaso = parseFloat(valor.replace(/[^0-9.]/g, ''));
                if (valor === "TARGET" || (!isNaN(mgPaso) && mgPaso >= targetMg)) {
                    texto += `Alcanzar dosis objetivo de <b>${targetMg.toFixed(1)} mg</b>.`;
                    targetAlcanzado = true;
                } else if (valor.includes('%_TARGET')) {
                    const percT = parseFloat(valor);
                    texto += `Iniciar nuevo a ${(targetMg * percT / 100).toFixed(1)} mg.`;
                } else {
                    texto += `${accion === "INICIAR" ? "Iniciar" : "Subir"} nuevo a ${valor}.`;
                }
            } else if (accion === "TITULAR_PROGRESIVO") {
                texto += `Desde este día, titular hasta <b>${targetMg.toFixed(1)} mg</b>.`;
                targetAlcanzado = true;
            }
        } else { return; } // Saltamos si el nuevo ya llegó al target

        htmlPasos += `<li style="margin-bottom:6px;">${texto}</li>`;
    });

    return htmlPasos + '</ul>';
}

// --- FUNCIÓN DE CÁLCULO Y CRUCE ---
window.ejecutarCalculo = function() {
    const fOrigName = document.getElementById('f_orig').value;
    const fDestName = document.getElementById('f_dest').value;
    const dosisO = parseFloat(document.getElementById('d_orig').value);
    
    const o = window.dbCalc.find(f => f.farmaco === fOrigName);
    const d = window.dbCalc.find(f => f.farmaco === fDestName);
    
    if (!dosisO || isNaN(dosisO) || !o || !d) return alert("Dosis no válida.");

    // CÁLCULOS
    const Maudsley = (dosisO / o.factor) * d.factor;
    const porcentajeRango = (dosisO / o.max) * 100;
    const dosisRango = (porcentajeRango / 100) * d.max;
    
    // UI Y ALERTAS
    let color = Maudsley > d.max ? "#b91c1c" : (Maudsley > d.ed95 ? "#b45309" : "#15803d");
    let bg = Maudsley > d.max ? "#fee2e2" : (Maudsley > d.ed95 ? "#fef3c7" : "#dcfce7");
    let txt = Maudsley > d.max ? "⚠️ EXCEDE MÁXIMA" : (Maudsley > d.ed95 ? "⚠️ SUPERIOR ED95" : "✅ RANGO ESTÁNDAR");

    const resBox = document.getElementById('res-box');
    resBox.style.display = 'block';
    resBox.style.background = bg;

    document.getElementById('res-val').innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 15px;">
            <div style="background: rgba(255,255,255,0.7); padding: 1.5rem; border-radius: 1.2rem; text-align: center; border: 1px solid rgba(0,0,0,0.05);">
                <div style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 5px;">Dosis recomendada (Maudsley)</div>
                <div style="font-size: 2.8rem; font-weight: 900; line-height: 1;">${Maudsley.toFixed(1)} <span style="font-size: 1.2rem;">mg/d</span></div>
                <div style="display: inline-block; margin-top: 10px; padding: 4px 12px; border-radius: 50px; font-size: 0.75rem; font-weight: 900; background: white; color: ${color}; border: 1px solid ${color};">${txt}</div>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0 10px; font-size: 0.85rem; opacity: 0.8;">
                <span>Equivalencia Rango (${porcentajeRango.toFixed(0)}%)</span>
                <b>${dosisRango.toFixed(1)} mg</b>
            </div>
        </div>`;

    // --- EL CRUCE DEFINITIVO ---
    // 1. Buscamos la fila: Nombre en Columna A
    const rowIndex = window.dbRaw.findIndex(row => row[0] && row[0].toString().trim() === fOrigName);
    
    // 2. Buscamos la columna: Nombre en Fila 13 (Índice 12), buscando desde la columna G (Índice 6)
    const fila13 = window.dbRaw[12] || [];
    const colIndex = fila13.findIndex((cell, idx) => idx >= 6 && cell && cell.toString().trim().toLowerCase() === fDestName.toLowerCase());

    const rawStr = (rowIndex > -1 && colIndex > -1) ? window.dbRaw[rowIndex][colIndex] : "";
    
    document.getElementById('res-tip').innerHTML = `
        <div style="margin-top: 15px; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 12px; font-size: 0.9rem;">
            <b style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 8px;">Estrategia de Cambio</b>
            ${window.traducirPasos(rawStr, dosisO, Maudsley)}
        </div>`;
}
