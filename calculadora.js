// --- CARGA DE DATOS, ESTILOS Y FUNCIÓN PRINCIPAL ---
window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    // A. INYECCIÓN DE ESTILOS
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
                // Guardamos el bruto para el cruce de instrucciones
                window.dbRaw = data.values; 
                // Mapeo para los datos básicos de los fármacos
                window.dbCalc = data.values.map(row => ({
                    farmaco: row[0],
                    factor: parseFloat(row[1]) || 1,
                    ed95: parseFloat(row[2]) || 0,
                    max: parseFloat(row[3]) || 0,
                    min: parseFloat(row[4]) || 0,
                    umbral: parseFloat(row[5]) || 0
                })).filter(f => f.farmaco && f.farmaco !== "Farmaco");
            }
        } catch (e) {
            console.error("Error en la calculadora:", e);
            container.innerHTML = `<div style="padding:2.5rem;">Error cargando datos: ${e.message}</div>`;
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
                <div id="res-alert"></div>
                <div id="res-tip"></div>
            </div>
            <p style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2rem; line-height: 1.3; font-style: italic;">
                Basado en Taylor (Maudsley Prescribing Guidelines), Leucht et al. e INTEGRATE. Juicio clínico indispensable.
            </p>
        </div>`;
}

// --- MOTOR DE TRADUCCIÓN (VERSIÓN CORREGIDA Y MEJORADA) ---
window.traducirPasos = function(rawStr, dOrig, targetMg) {
    if (!rawStr || rawStr.trim() === "" || rawStr === "undefined") {
        return "<span style='color: #999;'>No hay instrucciones de cambio disponibles para esta combinación.</span>";
    }

    const pasos = rawStr.split('|').map(p => p.trim()).filter(p => p.length > 0);
    let html = '<ul style="list-style:none; padding:0; margin:0;">';
    let objetivoAlcanzado = false;

    pasos.forEach(paso => {
        if (objetivoAlcanzado) return;

        let instruccion = paso;
        let incluirPaso = true;
        let dosisActualModificada = dOrig; // Para seguir la pista de la dosis del fármaco actual si se reduce

        // Comprobar si el paso tiene condición IF_ACTUAL_
        if (instruccion.startsWith('IF_ACTUAL_')) {
            // Expresión regular: IF_ACTUAL_([<>]=?)(\d+)mg?:(.*)
            const match = instruccion.match(/IF_ACTUAL_([<>]=?)(\d+)mg?:(.*)/);
            if (match) {
                const op = match[1];
                const valorCorte = parseFloat(match[2]);
                const resto = match[3]; // el resto después de la condición

                // Evaluar condición
                let cumple = false;
                if (op === '<') cumple = dOrig < valorCorte;
                else if (op === '>') cumple = dOrig > valorCorte;
                else if (op === '<=') cumple = dOrig <= valorCorte;
                else if (op === '>=') cumple = dOrig >= valorCorte;

                if (!cumple) {
                    incluirPaso = false;
                } else {
                    instruccion = resto;
                }
            } else {
                incluirPaso = false; // formato no reconocido
            }
        }

        if (!incluirPaso) return;

        // Ahora instruccion tiene el formato Día:Sujeto:Acción:Valor (puede tener más partes si el valor contiene ":" pero no debería)
        const partes = instruccion.split(':').map(s => s.trim());
        if (partes.length < 3) return;

        const dia = partes[0].replace('D', 'Día ');
        const sujeto = partes[1];
        const accion = partes[2];
        let valor = partes.slice(3).join(':'); // el valor puede ser algo como "50%", "50%_TARGET", "5mg", "TARGET", etc.

        let texto = `<b>${dia}:</b> `;

        if (sujeto === 'ACTUAL') {
            if (accion === 'STOP') {
                texto += 'Suspender fármaco origen.';
            } else if (accion === 'REDUCIR') {
                // El valor viene como "50%" (porcentaje de reducción? o porcentaje al que se reduce?)
                // En los datos, "REDUCIR:50%" significa reducir al 50% de la dosis actual.
                const porcentaje = parseFloat(valor.replace('%', ''));
                if (!isNaN(porcentaje)) {
                    const nuevaDosis = dOrig * porcentaje / 100;
                    texto += `Reducir fármaco origen a ${nuevaDosis.toFixed(1)} mg.`;
                } else {
                    texto += `Reducir fármaco origen (${valor}).`;
                }
            } else if (accion === 'MANTENER') {
                texto += 'Mantener dosis actual del fármaco origen.';
            } else {
                texto += `Acción desconocida sobre origen: ${accion}`;
            }
        } else if (sujeto === 'NUEVO') {
            if (accion === 'INICIAR' || accion === 'SUBIR') {
                // Valor puede ser "TARGET", "Xmg", "X%_TARGET", "X%"
                if (valor === 'TARGET') {
                    texto += `Alcanzar dosis objetivo de ${targetMg.toFixed(1)} mg.`;
                    objetivoAlcanzado = true;
                } else if (valor.includes('%_TARGET')) {
                    const porcentaje = parseFloat(valor.replace('%_TARGET', ''));
                    const mgCalculado = targetMg * porcentaje / 100;
                    texto += `Iniciar fármaco nuevo a ${mgCalculado.toFixed(1)} mg.`;
                } else if (valor.includes('%') && !valor.includes('_TARGET')) {
                    // Por si acaso aparece un porcentaje sin _TARGET (no debería)
                    const porcentaje = parseFloat(valor.replace('%', ''));
                    const mgCalculado = targetMg * porcentaje / 100;
                    texto += `Iniciar fármaco nuevo a ${mgCalculado.toFixed(1)} mg.`;
                } else if (valor.includes('mg')) {
                    const mgPaso = parseFloat(valor.replace(/[^0-9.]/g, ''));
                    if (!isNaN(mgPaso)) {
                        if (mgPaso >= targetMg) {
                            texto += `Alcanzar dosis objetivo de ${targetMg.toFixed(1)} mg.`;
                            objetivoAlcanzado = true;
                        } else {
                            texto += `Iniciar fármaco nuevo a ${mgPaso.toFixed(1)} mg.`;
                        }
                    } else {
                        texto += `Iniciar fármaco nuevo a ${valor}.`;
                    }
                } else {
                    texto += `Iniciar fármaco nuevo a ${valor}.`;
                }
            } else if (accion === 'TITULAR_PROGRESIVO') {
                texto += `Desde este día, titular progresivamente hasta alcanzar ${targetMg.toFixed(1)} mg.`;
                objetivoAlcanzado = true;
            } else {
                texto += `Acción desconocida sobre nuevo: ${accion}`;
            }
        } else {
            texto += `Sujeto desconocido: ${sujeto}`;
        }

        html += `<li style="margin-bottom:6px; line-height:1.4;">${texto}</li>`;
    });

    return html + '</ul>';
}

// --- FUNCIÓN DE CÁLCULO (CORREGIDA EN LA OBTENCIÓN DE INSTRUCCIONES) ---
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

    // CÁLCULOS
    let Maudsley = (dosisO / o.factor) * d.factor;
    let porcentajeRango = (dosisO / o.max) * 100;
    let dosisRango = (porcentajeRango / 100) * d.max;
    
    let bgColor = ""; let textColor = ""; let alertText = "";
    if (Maudsley > d.max) { bgColor = '#fee2e2'; textColor = "#b91c1c"; alertText = "⚠️ EXCEDE DOSIS MÁXIMA"; }
    else if (Maudsley > d.ed95) { bgColor = '#fef3c7'; textColor = "#b45309"; alertText = "⚠️ SUPERIOR A ED95"; }
    else if (Maudsley < d.min) { bgColor = '#f1f5f9'; textColor = "#475569"; alertText = "🔍 POR DEBAJO DE MÍNIMO"; }
    else { bgColor = '#dcfce7'; textColor = "#15803d"; alertText = "✅ RANGO ESTÁNDAR"; }

    const resBox = document.getElementById('res-box');
    resBox.style.display = 'block';
    resBox.style.background = bgColor;

    // UI DE RESULTADOS
    document.getElementById('res-val').innerHTML = `
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

    // --- CRUCE DE INSTRUCCIONES (CORREGIDO) ---
    // Buscar el fármaco origen en la columna A (índice 0)
    const rowIndex = window.dbRaw.findIndex(row => row[0] && row[0].toString().trim() === fOrigName);
    
    // Buscar el fármaco destino en la fila de encabezados (fila 13, índice 12) a partir de la columna G (índice 6)
    const headerRow = window.dbRaw[12]; // Fila 13
    let colIndex = -1;
    if (headerRow) {
        // Buscar desde la columna 6 hasta el final
        for (let i = 6; i < headerRow.length; i++) {
            if (headerRow[i] && headerRow[i].toString().trim() === fDestName) {
                colIndex = i;
                break;
            }
        }
    }

    let instruccionRaw = "";
    if (rowIndex > -1 && colIndex > -1) {
        instruccionRaw = window.dbRaw[rowIndex][colIndex];
        if (!instruccionRaw) instruccionRaw = "";
        console.log(`Instrucción encontrada: ${instruccionRaw}`); // Para depurar
    } else {
        console.warn(`No se encontró instrucción para ${fOrigName} -> ${fDestName}`);
    }
    
    document.getElementById('res-tip').innerHTML = `
        <div style="margin-top: 15px; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 12px; font-size: 0.9rem;">
            <b style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 8px;">Estrategia de Cambio</b>
            ${window.traducirPasos(instruccionRaw, dosisO, Maudsley)}
        </div>
    `;
}
