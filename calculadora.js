// --- CARGA DE DATOS Y DEPURACIÓN TOTAL ---
window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    // Inyección de estilos (igual, no los toco)
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
    
    try {
        const pestaña = "Data_APS"; 
        const response = await fetch(`${window.WORKER_URL}?sheet=${pestaña}`);
        const data = await response.json();
        if (data.error) throw new Error(data.details || data.error);
        if (data.values) {
            window.dbRaw = data.values;
            
            // --- IMPRIMIR TODO EN CONSOLA PARA DEPURAR ---
            console.log("========== MATRIZ COMPLETA ==========");
            for (let i = 0; i < window.dbRaw.length; i++) {
                let fila = window.dbRaw[i].map(celda => celda ? celda.toString().substring(0,20) : "(vacío)");
                console.log(`Fila ${i}:`, fila);
            }
            console.log("======================================");
            
            // Extraer fármacos desde columna A (índice 0) desde la fila que TÚ creas que empiezan
            // Por defecto, empezamos en fila 1 (índice 1) porque la 0 suele ser "Farmaco"
            window.listaFarmacos = [];
            for (let i = 1; i < data.values.length; i++) {
                const nombre = data.values[i]?.[0];
                if (nombre && nombre.toString().trim() !== "") {
                    window.listaFarmacos.push(nombre.toString().trim());
                }
            }
            console.log("📌 Lista de fármacos (desde fila 1):", window.listaFarmacos);
            
            // Mostrar los nombres en la fila 13 (índice 12) desde columna G (índice 6)
            const headerRow = data.values[12];
            if (headerRow) {
                let destinos = [];
                for (let i = 6; i < headerRow.length; i++) {
                    if (headerRow[i]) destinos.push(headerRow[i].toString().trim());
                }
                console.log("📌 Destinos en fila 13 (desde col 6):", destinos);
            }
            
            // Crear dbCalc para factores
            window.dbCalc = data.values.map((row, idx) => ({
                farmaco: row[0] ? row[0].toString().trim() : "",
                factor: parseFloat(row[1]) || 1,
                ed95: parseFloat(row[2]) || 0,
                max: parseFloat(row[3]) || 0,
                min: parseFloat(row[4]) || 0,
                umbral: parseFloat(row[5]) || 0
            })).filter(f => f.farmaco && f.farmaco !== "");
            
            // Generar interfaz
            const options = window.listaFarmacos.map(f => `<option value="${f}">${f}</option>`).join('');
            container.innerHTML = `
                <div class="calc-ui">
                    <h2><i class="fas fa-calculator"></i> Calculadora APS</h2>
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
    } catch (e) {
        container.innerHTML = `<div style="padding:2.5rem;">Error cargando datos: ${e.message}</div>`;
    }
}

// --- TRADUCCIÓN DE PASOS (sin cambios) ---
window.traducirPasos = function(rawStr, dOrig, targetMg) {
    if (!rawStr || rawStr.trim() === "") {
        return "<span style='color: #999;'>No hay instrucciones de cambio para esta combinación.</span>";
    }
    const pasos = rawStr.split('|').map(p => p.trim()).filter(p => p.length > 0);
    let html = '<ul style="list-style:none; padding:0; margin:0;">';
    let objetivoAlcanzado = false;
    let dosisActual = dOrig;

    pasos.forEach(paso => {
        if (objetivoAlcanzado) return;
        let instruccion = paso;
        let incluirPaso = true;

        while (instruccion.startsWith('IF_ACTUAL_')) {
            const match = instruccion.match(/IF_ACTUAL_([<>]=?)(\d+)mg?:(.*)/);
            if (!match) { incluirPaso = false; break; }
            const op = match[1], valorCorte = parseFloat(match[2]), resto = match[3];
            let cumple = false;
            if (op === '<') cumple = dOrig < valorCorte;
            else if (op === '>') cumple = dOrig > valorCorte;
            else if (op === '<=') cumple = dOrig <= valorCorte;
            else if (op === '>=') cumple = dOrig >= valorCorte;
            if (!cumple) { incluirPaso = false; break; }
            else instruccion = resto;
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
            if (accion === 'STOP') texto += 'Suspender fármaco origen.';
            else if (accion === 'REDUCIR') {
                const pct = parseFloat(valor.replace('%', ''));
                if (!isNaN(pct)) {
                    const nueva = dosisActual * pct / 100;
                    texto += `Reducir fármaco origen a ${nueva.toFixed(1)} mg.`;
                    dosisActual = nueva;
                } else texto += `Reducir fármaco origen (${valor}).`;
            } else if (accion === 'MANTENER') texto += 'Mantener dosis actual del fármaco origen.';
            else texto += `Acción desconocida sobre origen: ${accion}`;
        } else if (sujeto === 'NUEVO') {
            if (accion === 'INICIAR' || accion === 'SUBIR') {
                if (valor === 'TARGET') {
                    texto += `Alcanzar dosis objetivo de ${targetMg.toFixed(1)} mg.`;
                    objetivoAlcanzado = true;
                } else if (valor.includes('%_TARGET')) {
                    const pct = parseFloat(valor.replace('%_TARGET', ''));
                    texto += `Iniciar fármaco nuevo a ${(targetMg * pct / 100).toFixed(1)} mg.`;
                } else if (valor.includes('%')) {
                    const pct = parseFloat(valor.replace('%', ''));
                    texto += `Iniciar fármaco nuevo a ${(targetMg * pct / 100).toFixed(1)} mg.`;
                } else if (valor.includes('mg')) {
                    const mg = parseFloat(valor.replace(/[^0-9.]/g, ''));
                    if (!isNaN(mg)) {
                        if (mg >= targetMg) {
                            texto += `Alcanzar dosis objetivo de ${targetMg.toFixed(1)} mg.`;
                            objetivoAlcanzado = true;
                        } else texto += `Iniciar fármaco nuevo a ${mg.toFixed(1)} mg.`;
                    } else texto += `Iniciar fármaco nuevo a ${valor}.`;
                } else texto += `Iniciar fármaco nuevo a ${valor}.`;
            } else if (accion === 'TITULAR_PROGRESIVO') {
                texto += `Desde este día, titular progresivamente hasta alcanzar ${targetMg.toFixed(1)} mg.`;
                objetivoAlcanzado = true;
            } else texto += `Acción desconocida sobre nuevo: ${accion}`;
        } else texto += `Sujeto desconocido: ${sujeto}`;

        html += `<li style="margin-bottom:6px; line-height:1.4;">${texto}</li>`;
    });
    return html + '</ul>';
}

// --- FUNCIÓN DE CÁLCULO CON BÚSQUEDA DIRECTA (AJUSTA TÚ LOS ÍNDICES) ---
window.ejecutarCalculo = function() {
    const fOrigName = document.getElementById('f_orig').value.trim();
    const fDestName = document.getElementById('f_dest').value.trim();
    const dosisO = parseFloat(document.getElementById('d_orig').value);
    
    const o = window.dbCalc.find(f => f.farmaco === fOrigName);
    const d = window.dbCalc.find(f => f.farmaco === fDestName);
    
    if (!dosisO || isNaN(dosisO) || !o || !d) {
        alert("Dosis inválida.");
        return;
    }

    let Maudsley = (dosisO / o.factor) * d.factor;
    let porcentajeRango = (dosisO / o.max) * 100;
    let dosisRango = (porcentajeRango / 100) * d.max;
    
    let bgColor, textColor, alertText;
    if (Maudsley > d.max) { bgColor = '#fee2e2'; textColor = "#b91c1c"; alertText = "⚠️ EXCEDE DOSIS MÁXIMA"; }
    else if (Maudsley > d.ed95) { bgColor = '#fef3c7'; textColor = "#b45309"; alertText = "⚠️ SUPERIOR A ED95"; }
    else if (Maudsley < d.min) { bgColor = '#f1f5f9'; textColor = "#475569"; alertText = "🔍 POR DEBAJO DE MÍNIMO"; }
    else { bgColor = '#dcfce7'; textColor = "#15803d"; alertText = "✅ RANGO ESTÁNDAR"; }

    document.getElementById('res-box').style.display = 'block';
    document.getElementById('res-box').style.background = bgColor;
    document.getElementById('res-val').innerHTML = `...`; // (lo mismo de antes, lo omito por espacio)

    // --- BÚSQUEDA MANUAL: TÚ AJUSTAS ESTOS VALORES SEGÚN LA CONSOLA ---
    // Índices de fármacos en la lista (empiezan en 0)
    const indiceOrigen = window.listaFarmacos.indexOf(fOrigName);
    const indiceDestino = window.listaFarmacos.indexOf(fDestName);
    
    // Parámetros que TÚ debes ajustar según lo que veas en consola
    const offsetFilaOrigen = 1;    // ¿En qué fila empiezan los fármacos en columna A? (0=primera fila, 1=segunda, etc.)
    const offsetColumnaDestino = 6; // ¿En qué columna empiezan los destinos en fila 13? (0=A, 1=B, ..., 6=G)
    
    const filaOrigen = offsetFilaOrigen + indiceOrigen;
    const columnaDestino = offsetColumnaDestino + indiceDestino;
    
    console.log(`🔍 Buscando en dbRaw[${filaOrigen}][${columnaDestino}] (fila ${filaOrigen}, col ${columnaDestino})`);
    
    let instruccion = "";
    if (filaOrigen < window.dbRaw.length && columnaDestino < window.dbRaw[filaOrigen].length) {
        instruccion = window.dbRaw[filaOrigen][columnaDestino];
        console.log("📦 Valor encontrado:", instruccion);
    } else {
        console.error("❌ Índices fuera de rango");
    }

    document.getElementById('res-tip').innerHTML = `
        <div style="margin-top: 15px; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 12px; font-size: 0.9rem;">
            <b style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 8px;">Estrategia de Cambio</b>
            ${instruccion ? window.traducirPasos(instruccion, dosisO, Maudsley) : "<span style='color:#999'>Celda vacía</span>"}
        </div>
    `;
}
