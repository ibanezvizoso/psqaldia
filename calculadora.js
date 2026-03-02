// --- 1. INICIALIZACIÓN Y CARGA DE DATOS ---
window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

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
    
    if (!window.dbCalc) {
        try {
            const pestaña = "Data_APS"; 
            const response = await fetch(`${window.WORKER_URL}?sheet=${pestaña}`);
            const data = await response.json();

            if (data.error) throw new Error(data.details || data.error);

            if (data.values) {
                window.dbRaw = data.values; // Guardamos el Excel completo
                // Mapeamos datos de fármacos (Filas 2 a 12 de la Columna A)
                window.dbCalc = data.values.slice(1, 12).map(row => ({
                    farmaco: row[0] ? row[0].toString().trim() : "",
                    factor: parseFloat(row[1]) || 1,
                    ed95: parseFloat(row[2]) || 0,
                    max: parseFloat(row[3]) || 0,
                    min: parseFloat(row[4]) || 0,
                    umbral: parseFloat(row[5]) || 0
                })).filter(f => f.farmaco !== "");
            }
        } catch (e) {
            container.innerHTML = `<div style="padding:2.5rem;">Error cargando Excel: ${e.message}</div>`;
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
                <div id="res-val"></div>
                <div id="res-tip"></div>
            </div>
            <p style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2rem; line-height: 1.3; font-style: italic;">
                Basado en Taylor (Maudsley), Leucht e INTEGRATE. Juicio clínico indispensable.
            </p>
        </div>`;
}

// --- 2. MOTOR DE TRADUCCIÓN (LISTA LIMPIA + REGLA DEL TECHO) ---
window.traducirPasos = function(rawStr, dOrig, targetMg) {
    if (!rawStr || rawStr.trim() === "") return "<span style='opacity:0.5;'>Pauta no definida en el cruce del Excel.</span>";

    const bloques = rawStr.split('|').map(b => b.trim()).filter(Boolean);
    let htmlPasos = '<ul style="list-style:none; padding:0; margin:0;">';
    let targetAlcanzado = false;

    bloques.forEach(bloque => {
        let instruccion = bloque;
        
        if (instruccion.startsWith("IF_ACTUAL_")) {
            const match = instruccion.match(/IF_ACTUAL_([<>]=?)(\d+)(?:mg)?:(.*)/);
            if (match) {
                const op = match[1], corte = parseFloat(match[2]), resto = match[3];
                const cumple = (op === '<' && dOrig < corte) || (op === '>' && dOrig > corte) || 
                               (op === '<=' && dOrig <= corte) || (op === '>=' && dOrig >= corte);
                if (!cumple) return; 
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
                    texto += `Alcanzar dosis objetivo (<b>${targetMg.toFixed(1)} mg</b>).`;
                    targetAlcanzado = true;
                } else if (valor.includes('%_TARGET')) {
                    texto += `Iniciar nuevo a ${(targetMg * parseFloat(valor) / 100).toFixed(1)} mg.`;
                } else {
                    texto += `${accion === "INICIAR" ? "Iniciar" : "Subir"} nuevo a ${valor}.`;
                }
            } else if (accion === "TITULAR_PROGRESIVO") {
                texto += `Desde este día, titular hasta alcanzar <b>${targetMg.toFixed(1)} mg</b>.`;
                targetAlcanzado = true;
            }
        } else { return; }

        htmlPasos += `<li style="margin-bottom:6px;">${texto}</li>`;
    });
    return htmlPasos + '</ul>';
}

// --- 3. FUNCIÓN DE CÁLCULO Y CRUCE DE MATRIZ ---
window.ejecutarCalculo = function() {
    const fOrigName = document.getElementById('f_orig').value;
    const fDestName = document.getElementById('f_dest').value;
    const dosisO = parseFloat(document.getElementById('d_orig').value);
    
    const o = window.dbCalc.find(f => f.farmaco === fOrigName);
    const d = window.dbCalc.find(f => f.farmaco === fDestName);
    
    if (!dosisO || isNaN(dosisO) || !o || !d) return alert("Dosis no válida.");

    const Maudsley = (dosisO / o.factor) * d.factor;
    const porcentajeRango = (dosisO / o.max) * 100;
    const dosisRango = (porcentajeRango / 100) * d.max;
    
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
                <span>Equivalencia por Rango (${porcentajeRango.toFixed(0)}%)</span>
                <b>${dosisRango.toFixed(1)} mg</b>
            </div>
        </div>`;

    // --- CRUCE DE LA MATRIZ ---
    // Fila: Buscamos el nombre de Origen en la Columna A (índice 0)
    const rowIndex = window.dbRaw.findIndex(row => row[0] && row[0].toString().trim().toLowerCase() === fOrigName.toLowerCase());
    
    // Columna: Buscamos el Destino específicamente en la Fila 13 (índice 12 del array dbRaw)
    const fila13 = window.dbRaw[12] || [];
    const colIndex = fila13.findIndex(cell => cell && cell.toString().trim().toLowerCase() === fDestName.toLowerCase());

    const instruccionRaw = (rowIndex > -1 && colIndex > -1) ? window.dbRaw[rowIndex][colIndex] : "";
    
    document.getElementById('res-tip').innerHTML = `
        <div style="margin-top: 20px; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 15px;">
            <span style="font-size: 0.75rem; font-weight: 900; text-transform: uppercase; opacity: 0.5; display: block; margin-bottom: 10px;">Estrategia de Cambio</span>
            ${window.traducirPasos(instruccionRaw, dosisO, Maudsley)}
        </div>
    `;
}
