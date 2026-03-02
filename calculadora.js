// ==========================================
// 1. MOTOR DE TRADUCCIÓN DE INSTRUCCIONES (DSL)
// ==========================================
window.traducirInstrucciones = function(rawString, dOrig, dTarget, targetMg) {
    if (!rawString || rawString.trim() === "" || rawString === "-") 
        return "No hay pauta específica definida para este cambio.";

    let instruccion = rawString;

    // A. Manejo de condicionales: IF_ACTUAL_<5mg:RESTO_DEL_CODIGO
    if (instruccion.startsWith("IF_ACTUAL_")) {
        const partes = instruccion.split(':');
        const condicion = partes[0]; // Ej: IF_ACTUAL_<5mg o IF_ACTUAL_<=37mg
        
        // Extraer operador y valor
        const match = condicion.match(/(<=|>=|<|>|=)(\d+)/);
        if (match) {
            const operador = match[1];
            const valorCorte = parseFloat(match[2]);
            let cumple = false;

            if (operador === '<') cumple = dOrig < valorCorte;
            else if (operador === '>') cumple = dOrig > valorCorte;
            else if (operador === '<=') cumple = dOrig <= valorCorte;
            else if (operador === '>=') cumple = dOrig >= valorCorte;
            else if (operador === '=') cumple = dOrig === valorCorte;

            if (cumple) {
                instruccion = partes.slice(1).join(':'); 
            } else {
                return "Dosis fuera de rango de pauta automática. Ajustar según juicio clínico.";
            }
        }
    }

    // B. Procesar pasos (separados por |)
    const pasos = instruccion.split('|').map(p => p.trim());
    let htmlPasos = '<ul style="list-style:none; padding:0; margin:0;">';
    let objetivoAlcanzado = false;

    for (let p of pasos) {
        if (objetivoAlcanzado) break;

        const partes = p.split(':');
        if (partes.length < 3) continue;

        const dia = partes[0].replace('D', 'Día ');
        const sujeto = partes[1]; // ACTUAL o NUEVO
        const accion = partes[2]; // STOP, INICIAR, REDUCIR, TITULAR...
        const valor = partes[3] || "";  

        let textoPaso = `<b>${dia}:</b> `;

        if (sujeto === "ACTUAL") {
            if (accion === "STOP") textoPaso += `Suspender fármaco de origen.`;
            if (accion === "REDUCIR") textoPaso += `Reducir fármaco de origen al ${valor}.`;
        } else {
            if (accion === "INICIAR") {
                const mgPaso = parseFloat(valor);
                if (!isNaN(mgPaso) && mgPaso >= targetMg) {
                    textoPaso += `Alcanzar dosis objetivo de ${targetMg.toFixed(1)} mg.`;
                    objetivoAlcanzado = true;
                } else {
                    textoPaso += `Iniciar/subir fármaco nuevo a ${valor}.`;
                }
            }
            if (accion === "TITULAR_PROGRESIVO") {
                textoPaso += `Desde este día, iniciar titulación progresiva hasta la dosis objetivo (${targetMg.toFixed(1)} mg).`;
                objetivoAlcanzado = true;
            }
        }
        htmlPasos += `<li style="margin-bottom:8px; line-height:1.4;">${textoPaso}</li>`;
    }

    htmlPasos += '</ul>';
    return htmlPasos;
};

// ==========================================
// 2. INTERFAZ Y CARGA DE DATOS
// ==========================================
window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    // Inyectar Estilos
    if (!document.getElementById('calc-internal-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'calc-internal-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.4rem; font-family: sans-serif; }
            .calc-ui h2 { margin: 0 0 1.5rem 0; font-weight: 800; color: #1e293b; }
            .calc-ui label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #64748b; margin-top: 0.8rem; display: block; }
            .calc-ui select, .calc-ui input { width: 100%; padding: 0.9rem; border-radius: 1rem; border: 2px solid #e2e8f0; background: #fff; font-size: 1rem; outline: none; box-sizing: border-box; }
            .res-container { padding: 1.5rem; border-radius: 1.5rem; margin-top: 1.5rem; display: none; border: 1px solid rgba(0,0,0,0.05); }
        `;
        document.head.appendChild(styleTag);
    }
    
    // Carga vía Worker
    if (!window.dbCalc) {
        try {
            const pestaña = "Data_APS"; 
            const response = await fetch(`${window.WORKER_URL}?sheet=${pestaña}`);
            const data = await response.json();

            if (data.values) {
                window.dbRaw = data.values; // Guardamos la matriz completa (importante para instrucciones)
                window.dbCalc = data.values.slice(1).map(row => ({
                    farmaco: row[0],
                    factor: parseFloat(row[1]) || 1,
                    ed95: parseFloat(row[2]) || 0,
                    max: parseFloat(row[3]) || 0,
                    min: parseFloat(row[4]) || 0,
                    umbral: parseFloat(row[5]) || 0
                })).filter(f => f.farmaco);
            }
        } catch (e) {
            container.innerHTML = `<div style="padding:2.5rem;">Error de conexión: ${e.message}</div>`;
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
            <button class="btn btn-primary" style="margin-top:1.5rem; width:100%; padding:1rem; border-radius:1rem; font-weight:bold; cursor:pointer;" onclick="ejecutarCalculo()">CALCULAR ESTRATEGIA</button>
            <div id="res-box" class="res-container">
                <div id="res-val"></div>
                <div id="res-tip"></div>
            </div>
        </div>`;
}

// ==========================================
// 3. FUNCIÓN DE CÁLCULO FINAL
// ==========================================
window.ejecutarCalculo = function() {
    const fOrigName = document.getElementById('f_orig').value;
    const fDestName = document.getElementById('f_dest').value;
    const dosisO = parseFloat(document.getElementById('d_orig').value);
    
    const oIndex = window.dbCalc.findIndex(f => f.farmaco === fOrigName);
    const dIndex = window.dbCalc.findIndex(f => f.farmaco === fDestName);
    const o = window.dbCalc[oIndex];
    const d = window.dbCalc[dIndex];

    if (!dosisO || isNaN(dosisO) || !o || !d) {
        alert("Introduce una dosis válida.");
        return;
    }

    // Cálculos
    let Maudsley = (dosisO / o.factor) * d.factor;
    
    // Semáforo de seguridad
    let bgColor = Maudsley > d.max ? '#fee2e2' : (Maudsley > d.ed95 ? '#fef3c7' : '#dcfce7');
    let textColor = Maudsley > d.max ? '#b91c1c' : (Maudsley > d.ed95 ? '#b45309' : '#15803d');
    let alertText = Maudsley > d.max ? "⚠️ EXCEDE MÁXIMA" : (Maudsley > d.ed95 ? "⚠️ RANGO ED95" : "✅ RANGO SEGURO");

    // Localizar instrucción en la matriz (Columna G es índice 6)
    const dColIndex = 6 + dIndex; 
    const rawInstruction = window.dbRaw[oIndex + 1][dColIndex]; 
    
    const tipTraducido = window.traducirInstrucciones(rawInstruction, dosisO, fDestName, Maudsley);

    const resBox = document.getElementById('res-box');
    resBox.style.display = 'block';
    resBox.style.background = bgColor;

    document.getElementById('res-val').innerHTML = `
        <div style="background: rgba(255,255,255,0.6); padding: 1.2rem; border-radius: 1rem; text-align: center; border: 1px solid rgba(0,0,0,0.05);">
            <div style="font-size: 0.7rem; font-weight: 800; color: #64748b; margin-bottom: 5px;">DOSIS EQUIVALENTE (MAUDSLEY)</div>
            <div style="font-size: 2.5rem; font-weight: 900; color: #1e293b;">${Maudsley.toFixed(1)} <span style="font-size: 1rem;">mg/día</span></div>
            <div style="margin-top: 10px; display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; background: #fff; color: ${textColor}; border: 1px solid ${textColor};">${alertText}</div>
        </div>`;

    document.getElementById('res-tip').innerHTML = `
        <div style="margin-top: 15px; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 12px;">
            <b style="font-size: 0.7rem; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 10px;">Estrategia de Cambio (Automática)</b>
            ${tipTraducido}
        </div>`;
};
