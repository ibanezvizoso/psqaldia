// ==========================================
// 1. MOTOR DE TRADUCCIÓN (EL NUEVO SWITCH)
// ==========================================
window.traducirInstrucciones = function(rawString, dOrig, dTarget, targetMg) {
    if (!rawString || rawString.trim() === "" || rawString === "-") 
        return "No hay pauta específica definida.";

    let instruccion = rawString;

    // A. Manejo de condicionales (Ej: IF_ACTUAL_<5mg:...)
    if (instruccion.startsWith("IF_ACTUAL_")) {
        const partes = instruccion.split(':');
        const condicion = partes[0]; 
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
    return htmlPasos + '</ul>';
};

// ==========================================
// 2. CARGA DE DATOS Y ESTILOS
// ==========================================
window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    // Inyectar Estilos (Tus estilos originales)
    if (!document.getElementById('calc-internal-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'calc-internal-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.4rem; }
            .calc-ui h2 { margin: 0 0 1.5rem 0; font-weight: 800; }
            .calc-ui label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-top: 0.8rem; display: block; }
            .calc-ui select, .calc-ui input { width: 100%; padding: 0.9rem; border-radius: 1rem; border: 2px solid var(--border); background: var(--bg); color: var(--text-main); font-size: 1rem; font-family: inherit; outline: none; box-sizing: border-box; }
            .calc-ui select:focus, .calc-ui input:focus { border-color: var(--primary); }
            .res-container { padding: 1.5rem; border-radius: 1.5rem; margin-top: 1.5rem; display: none; border: 1px solid rgba(0,0,0,0.05); }
            .calc-ui .btn-primary { margin-top: 1.2rem; cursor: pointer; }
        `;
        document.head.appendChild(styleTag);
    }

    if (!window.dbCalc) {
        try {
            const pestaña = "Data_APS"; 
            const response = await fetch(`${window.WORKER_URL}?sheet=${pestaña}`);
            const data = await response.json();

            if (data.values) {
                // GUARDAMOS EL RAW (Matriz completa para instrucciones)
                window.dbRaw = data.values; 
                // GUARDAMOS EL PROCESADO (Para matemáticas)
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
            container.innerHTML = `<div style="padding:2.5rem;">Error cargando datos: ${e.message}</div>`;
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
            <button class="btn btn-primary" onclick="ejecutarCalculo()">CALCULAR</button>
            <div id="res-box" class="res-container">
                <div id="res-val"></div>
                <div id="res-tip"></div>
            </div>
            <p style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2rem; line-height: 1.3; font-style: italic;">
                Basado en Maudsley Prescribing Guidelines e INTEGRATE. Juicio clínico indispensable.
            </p>
        </div>`;
};

// ==========================================
// 3. FUNCIÓN DE CÁLCULO (LA NUEVA LÓGICA)
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

    // Fórmula de Maudsley:
    // $$Dosis_{Objetivo} = \frac{Dosis_{Origen}}{Factor_{Origen}} \times Factor_{Destino}$$
    let Maudsley = (dosisO / o.factor) * d.factor;
    
    // Semáforo visual
    let bgColor = Maudsley > d.max ? '#fee2e2' : (Maudsley > d.ed95 ? '#fef3c7' : '#dcfce7');
    let textColor = Maudsley > d.max ? '#b91c1c' : (Maudsley > d.ed95 ? '#b45309' : '#15803d');
    let alertText = Maudsley > d.max ? "⚠️ EXCEDE MÁXIMA" : (Maudsley > d.ed95 ? "⚠️ RANGO ALTO" : "✅ RANGO ESTÁNDAR");

    // BUSCAR INSTRUCCIÓN: Columna G (índice 6) + índice del fármaco destino
    const dColIndex = 6 + dIndex; 
    const rawInstruction = window.dbRaw[oIndex + 1][dColIndex]; 
    
    const tipTraducido = window.traducirInstrucciones(rawInstruction, dosisO, fDestName, Maudsley);

    const resBox = document.getElementById('res-box');
    resBox.style.display = 'block';
    resBox.style.background = bgColor;

    document.getElementById('res-val').innerHTML = `
        <div style="background: rgba(255,255,255,0.7); padding: 1.5rem; border-radius: 1.2rem; text-align: center;">
            <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-muted);">Dosis de prescripción</div>
            <div style="font-size: 2.8rem; font-weight: 900; color: var(--text-main);">${Maudsley.toFixed(1)} <span style="font-size: 1.2rem;">mg</span></div>
            <div style="margin-top: 10px; display: inline-block; padding: 6px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 900; background: white; color: ${textColor}; border: 1px solid ${textColor};">${alertText}</div>
        </div>`;

    document.getElementById('res-tip').innerHTML = `
        <div style="margin-top: 15px; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 12px;">
            <b style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 10px;">Estrategia Automática</b>
            ${tipTraducido}
        </div>`;
};
