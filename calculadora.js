// --- CARGA DE DATOS, ESTILOS Y FUNCIÓN PRINCIPAL ---
window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    // A. INYECCIÓN DE ESTILOS (Idénticos a tu código original)
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
    
    // 1. CARGA AUTÓNOMA DE DATOS
    if (!window.dbCalc) {
        try {
            const pestaña = "Data_APS"; 
            const response = await fetch(`${window.WORKER_URL}?sheet=${pestaña}`);
            const data = await response.json();

            if (data.error) throw new Error(data.details || data.error);

            if (data.values) {
                // IMPORTANTE: Guardamos el bruto para el switch (dbRaw) y el mapeo para los cálculos (dbCalc)
                window.dbRaw = data.values;
                window.dbCalc = data.values.slice(1, 12).map(row => ({
                    farmaco: row[0],
                    factor: parseFloat(row[1]) || 1,
                    ed95: parseFloat(row[2]) || 0,
                    max: parseFloat(row[3]) || 0,
                    min: parseFloat(row[4]) || 0,
                    umbral: parseFloat(row[5]) || 0
                })).filter(f => f.farmaco);
            }
        } catch (e) {
            console.error("Error en la calculadora:", e);
            container.innerHTML = `<div style="padding:2.5rem;">Error cargando datos: ${e.message}</div>`;
            return;
        }
    }

    // 2. RENDERIZADO (Como tu código original)
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
            
            <p style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2rem; line-height: 1.3; font-style: italic;">
                Basado en Taylor (Maudsley Prescribing Guidelines), Leucht et al. e INTEGRATE. Juicio clínico indispensable.
            </p>
        </div>`;
}

// --- NUEVO MOTOR DE TRADUCCIÓN LÓGICA ---
window.traducirInstrucciones = function(rawString, dOrig, dTarget, targetMg) {
    if (!rawString || rawString.trim() === "") return "Pauta no definida en la matriz.";

    let instruccion = rawString.trim();

    // 1. Manejo de condicionales IF_ACTUAL
    if (instruccion.startsWith("IF_ACTUAL_")) {
        const match = instruccion.match(/IF_ACTUAL_([<>]=?)(\d+):/);
        if (match) {
            const op = match[1];
            const corte = parseFloat(match[2]);
            const cumple = (op === '<' && dOrig < corte) || (op === '>' && dOrig > corte) || 
                           (op === '<=' && dOrig <= corte) || (op === '>=' && dOrig >= corte);
            if (cumple) {
                instruccion = instruccion.substring(instruccion.indexOf(':') + 1);
            } else {
                return "La dosis actual no requiere pauta de switch automática.";
            }
        }
    }

    const pasos = instruccion.split('|').map(p => p.trim());
    let htmlPasos = '<ul style="list-style:none; padding:0; margin:0;">';
    let objetivoAlcanzado = false;

    pasos.forEach(p => {
        if (objetivoAlcanzado) return;
        const partes = p.split(':');
        if (partes.length < 3) return;

        const dia = partes[0].replace('D', 'Día ');
        const sujeto = partes[1]; // ACTUAL o NUEVO
        const accion = partes[2]; // STOP, INICIAR, TITULAR...
        const valor = partes[3] || "";

        let texto = `<b>${dia}:</b> `;

        if (sujeto === "ACTUAL") {
            if (accion === "STOP") texto += "Suspender completamente fármaco de origen.";
            if (accion === "REDUCIR") texto += `Reducir fármaco de origen al ${valor}.`;
            if (accion === "MANTENER") texto += "Mantener dosis de origen.";
        } else {
            // Lógica Destino + Regla del Techo
            if (accion === "INICIAR" || accion === "SUBIR") {
                const mgPaso = parseFloat(valor.replace(/[^0-9.]/g, ''));
                if (valor === "TARGET" || (!isNaN(mgPaso) && mgPaso >= targetMg)) {
                    texto += `Alcanzar dosis objetivo de <b>${targetMg.toFixed(1)} mg</b>.`;
                    objetivoAlcanzado = true;
                } else {
                    texto += `${accion === "INICIAR" ? "Iniciar" : "Subir"} fármaco nuevo a ${valor}.`;
                }
            }
            if (accion === "TITULAR_PROGRESIVO") {
                texto += `Desde este día, titular progresivamente hasta <b>${targetMg.toFixed(1)} mg</b>.`;
                objetivoAlcanzado = true;
            }
        }
        htmlPasos += `<li style="margin-bottom:6px;">${texto}</li>`;
    });

    return htmlPasos + '</ul>';
}

// --- FUNCIÓN DE CÁLCULO (Con lógica de cruce de celdas) ---
window.ejecutarCalculo = function() {
    const fOrigName = document.getElementById('f_orig').value;
    const fDestName = document.getElementById('f_dest').value;
    const dosisO = parseFloat(document.getElementById('d_orig').value);
    
    const o = window.dbCalc.find(f => f.farmaco === fOrigName);
    const d = window.dbCalc.find(f => f.farmaco === fDestName);
    
    if (!dosisO || isNaN(dosisO) || !o || !d) {
        alert("Por favor, introduce una dosis válida.");
        return;
    }

    // CÁLCULOS ORIGINALES
    let Maudsley = (dosisO / o.factor) * d.factor;
    let porcentajeRango = (dosisO / o.max) * 100;
    let dosisRango = (porcentajeRango / 100) * d.max;
    
    // COLORES Y ALERTAS (Idénticos a tu lógica)
    let bgColor = ""; let textColor = ""; let alertText = "";
    if (Maudsley > d.max) { bgColor = '#fee2e2'; textColor = "#b91c1c"; alertText = "⚠️ EXCEDE DOSIS MÁXIMA"; }
    else if (Maudsley > d.ed95) { bgColor = '#fef3c7'; textColor = "#b45309"; alertText = "⚠️ SUPERIOR A ED95"; }
    else if (Maudsley < d.min) { bgColor = '#f1f5f9'; textColor = "#475569"; alertText = "🔍 POR DEBAJO DE MÍNIMO"; }
    else { bgColor = '#dcfce7'; textColor = "#15803d"; alertText = "✅ RANGO ESTÁNDAR"; }

    const resBox = document.getElementById('res-box');
    const resVal = document.getElementById('res-val');
    const resAlert = document.getElementById('res-alert');
    const resTip = document.getElementById('res-tip');

    resBox.style.display = 'block';
    resBox.style.background = bgColor;

    // RENDER DE DOSIS (Idéntico a tu estructura original)
    resVal.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 15px;">
            <div style="background: rgba(255,255,255,0.7); padding: 1.5rem; border-radius: 1.2rem; text-align: center; border: 1px solid rgba(0,0,0,0.05);">
                <div style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 5px; letter-spacing: 0.5px;">Dosis de prescripción (Maudsley)</div>
                <div style="font-size: 2.8rem; font-weight: 900; line-height: 1; color: var(--text-main);">${Maudsley.toFixed(1)} <span style="font-size: 1.2rem;">mg/día</span></div>
                <div style="display: inline-block; margin-top: 12px; padding: 6px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 900; background: white; color: ${textColor}; border: 1px solid ${textColor}; line-height: 1.2;">
                    ${alertText}
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 10px;">
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Equivalencia en su rango (${porcentajeRango.toFixed(0)}%)</div>
                <div style="font-size: 1.1rem; font-weight: 800; opacity: 0.8;">${dosisRango.toFixed(1)} <span style="font-size: 0.8rem;">mg</span></div>
            </div>
        </div>
    `;

    // --- LÓGICA DE BÚSQUEDA DEL SWITCH ---
    // 1. Buscamos fila de origen (Columna A)
    const rowIndex = window.dbRaw.findIndex(row => row[0] && row[0].toString().trim() === fOrigName);
    // 2. Buscamos columna de destino (Fila 13 -> índice 12)
    const fila13 = window.dbRaw[12] || [];
    const colIndex = fila13.findIndex(cell => cell && cell.toString().trim() === fDestName);

    const rawStr = (rowIndex > -1 && colIndex > -1) ? window.dbRaw[rowIndex][colIndex] : "";
    
    // Render de Instrucciones Traducidas
    resTip.innerHTML = `
        <div style="margin-top: 15px; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 12px; font-size: 0.9rem;">
            <b style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 8px;">Estrategia de Cambio</b>
            ${window.traducirInstrucciones(rawStr, dosisO, fDestName, Maudsley)}
        </div>
    `;
}
