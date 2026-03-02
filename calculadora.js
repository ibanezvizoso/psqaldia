// --- CARGA DE DATOS, ESTILOS Y FUNCIÓN PRINCIPAL ---
window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    // ... (estilos, igual que antes) ...

    if (!window.dbCalc) {
        try {
            const pestaña = "Data_APS"; 
            const response = await fetch(`${window.WORKER_URL}?sheet=${pestaña}`);
            const data = await response.json();

            if (data.error) throw new Error(data.details || data.error);

            if (data.values) {
                window.dbRaw = data.values; 
                window.dbCalc = data.values.map(row => ({
                    farmaco: row[0],
                    factor: parseFloat(row[1]) || 1,
                    ed95: parseFloat(row[2]) || 0,
                    max: parseFloat(row[3]) || 0,
                    min: parseFloat(row[4]) || 0,
                    umbral: parseFloat(row[5]) || 0
                })).filter(f => f.farmaco && f.farmaco !== "Farmaco");
                
                // Verificación en consola
                console.log("Datos cargados. Filas totales:", window.dbRaw.length);
                console.log("Fila 13 (índice 12) - Destinos:", window.dbRaw[12]);
            }
        } catch (e) {
            console.error("Error en la calculadora:", e);
            container.innerHTML = `<div style="padding:2.5rem;">Error cargando datos: ${e.message}</div>`;
            return;
        }
    }

    const options = window.dbCalc.map(f => `<option value="${f.farmaco}">${f.farmaco}</option>`).join('');
    
    container.innerHTML = ` ... `; // igual que antes
}

// --- NORMALIZACIÓN PARA COMPARAR NOMBRES ---
function normalizar(nombre) {
    if (!nombre) return "";
    return nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// --- TRADUCCIÓN DE PASOS (mejorada) ---
window.traducirPasos = function(rawStr, dOrig, targetMg) {
    if (!rawStr || rawStr.trim() === "") {
        return "<span style='color: #999;'>No hay instrucciones de cambio para esta combinación.</span>";
    }

    const pasos = rawStr.split('|').map(p => p.trim()).filter(p => p.length > 0);
    let html = '<ul style="list-style:none; padding:0; margin:0;">';
    let objetivoAlcanzado = false;
    let dosisActual = dOrig; // para seguir reducciones

    pasos.forEach(paso => {
        if (objetivoAlcanzado) return;

        let instruccion = paso;
        let incluirPaso = true;

        // Manejar IF_ACTUAL_
        if (instruccion.startsWith('IF_ACTUAL_')) {
            const match = instruccion.match(/IF_ACTUAL_([<>]=?)(\d+)mg?:(.*)/);
            if (match) {
                const op = match[1];
                const valorCorte = parseFloat(match[2]);
                const resto = match[3];
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

        const partes = instruccion.split(':').map(s => s.trim());
        if (partes.length < 3) return;

        const dia = partes[0].replace('D', 'Día ');
        const sujeto = partes[1];
        const accion = partes[2];
        const valor = partes.slice(3).join(':');

        let texto = `<b>${dia}:</b> `;

        if (sujeto === 'ACTUAL') {
            if (accion === 'STOP') {
                texto += 'Suspender fármaco origen.';
                dosisActual = 0;
            } else if (accion === 'REDUCIR') {
                const porcentaje = parseFloat(valor.replace('%', ''));
                if (!isNaN(porcentaje)) {
                    const nuevaDosis = dosisActual * porcentaje / 100;
                    texto += `Reducir fármaco origen a ${nuevaDosis.toFixed(1)} mg.`;
                    dosisActual = nuevaDosis;
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
                if (valor === 'TARGET') {
                    texto += `Alcanzar dosis objetivo de ${targetMg.toFixed(1)} mg.`;
                    objetivoAlcanzado = true;
                } else if (valor.includes('%_TARGET')) {
                    const porcentaje = parseFloat(valor.replace('%_TARGET', ''));
                    const mgCalculado = targetMg * porcentaje / 100;
                    texto += `Iniciar fármaco nuevo a ${mgCalculado.toFixed(1)} mg.`;
                } else if (valor.includes('%')) {
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

// --- FUNCIÓN DE CÁLCULO (CON BÚSQUEDA EN FILA 13) ---
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

    // Cálculos (Maudsley, etc.)
    let Maudsley = (dosisO / o.factor) * d.factor;
    let porcentajeRango = (dosisO / o.max) * 100;
    let dosisRango = (porcentajeRango / 100) * d.max;
    
    let bgColor, textColor, alertText;
    if (Maudsley > d.max) { bgColor = '#fee2e2'; textColor = "#b91c1c"; alertText = "⚠️ EXCEDE DOSIS MÁXIMA"; }
    else if (Maudsley > d.ed95) { bgColor = '#fef3c7'; textColor = "#b45309"; alertText = "⚠️ SUPERIOR A ED95"; }
    else if (Maudsley < d.min) { bgColor = '#f1f5f9'; textColor = "#475569"; alertText = "🔍 POR DEBAJO DE MÍNIMO"; }
    else { bgColor = '#dcfce7'; textColor = "#15803d"; alertText = "✅ RANGO ESTÁNDAR"; }

    const resBox = document.getElementById('res-box');
    resBox.style.display = 'block';
    resBox.style.background = bgColor;

    document.getElementById('res-val').innerHTML = `...`; // igual que antes

    // --- CRUCE CORRECTO: Origen en columna A, Destino en fila 13 (índice 12) ---
    const fOrigNorm = normalizar(fOrigName);
    const fDestNorm = normalizar(fDestName);

    // Buscar fila del origen (columna A)
    const rowIndex = window.dbRaw.findIndex(row => normalizar(row?.[0]) === fOrigNorm);

    // Buscar columna del destino en la FILA 13 (índice 12) desde columna G (índice 6)
    const headerRow = window.dbRaw[12]; // ¡Esta es la fila 13!
    let colIndex = -1;
    if (headerRow) {
        for (let i = 6; i < headerRow.length; i++) {
            if (headerRow[i] && normalizar(headerRow[i]) === fDestNorm) {
                colIndex = i;
                break;
            }
        }
    }

    // Depuración: mostrar en consola lo encontrado
    console.log("Origen normalizado:", fOrigNorm, "Fila:", rowIndex);
    console.log("Destino normalizado:", fDestNorm, "Columna:", colIndex);
    if (rowIndex > -1 && colIndex > -1) {
        console.log("Instrucción cruda:", window.dbRaw[rowIndex][colIndex]);
    }

    let instruccionRaw = "";
    let mensajeDepuracion = "";

    if (rowIndex === -1) {
        mensajeDepuracion = `No se encontró el fármaco origen "${fOrigName}" en la columna A.`;
    } else if (colIndex === -1) {
        mensajeDepuracion = `No se encontró el fármaco destino "${fDestName}" en la fila 13.`;
    } else {
        instruccionRaw = window.dbRaw[rowIndex][colIndex];
        if (!instruccionRaw || instruccionRaw.toString().trim() === "") {
            mensajeDepuracion = `La celda (fila ${rowIndex+1}, columna ${colIndex+1}) está vacía.`;
        }
    }

    let contenidoEstrategia = instruccionRaw 
        ? window.traducirPasos(instruccionRaw, dosisO, Maudsley)
        : `<span style="color: #999;">${mensajeDepuracion || "Instrucción no disponible."}</span>`;

    document.getElementById('res-tip').innerHTML = `
        <div style="margin-top: 15px; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 12px; font-size: 0.9rem;">
            <b style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 8px;">Estrategia de Cambio</b>
            ${contenidoEstrategia}
        </div>
    `;
}
