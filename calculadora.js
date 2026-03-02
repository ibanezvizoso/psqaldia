// --- NUEVO MOTOR DE TRADUCCIÓN DE INSTRUCCIONES ---
window.traducirInstrucciones = function(rawString, dOrig, dTarget, targetMg) {
    if (!rawString || rawString.trim() === "") return "No hay pauta específica definida.";

    let instruccion = rawString;

    // 1. Manejo de condicionales: IF_ACTUAL_<5mg:RESTO_DEL_CODIGO
    if (instruccion.startsWith("IF_ACTUAL_")) {
        const partes = instruccion.split(':');
        const condicion = partes[0]; // Ej: IF_ACTUAL_<5mg
        const valorCorte = parseFloat(condicion.match(/\d+/)[0]);
        const operador = condicion.includes('<') ? '<' : '>';

        const cumple = operador === '<' ? dOrig < valorCorte : dOrig > valorCorte;
        
        if (cumple) {
            instruccion = partes.slice(1).join(':'); // Quitamos el IF
        } else {
            // Si no cumple, buscamos si hay un ELSE o simplemente decimos que use juicio clínico
            return "Dosis fuera de rango de pauta automática. Ajustar según juicio clínico.";
        }
    }

    // 2. Procesar pasos (separados por |)
    const pasos = instruccion.split('|').map(p => p.trim());
    let htmlPasos = '<ul style="list-style:none; padding:0; margin:0;">';
    let objetivoAlcanzado = false;

    for (let p of pasos) {
        if (objetivoAlcanzado) break;

        // Formato esperado: D1:ACTUAL:STOP o D1:NUEVO:INICIAR:37mg
        const partes = p.split(':');
        const dia = partes[0].replace('D', 'Día ');
        const sujeto = partes[1]; // ACTUAL o NUEVO
        const accion = partes[2]; // STOP, INICIAR, REDUCIR, TITULAR...
        const valor = partes[3];  // Cantidad (37mg, 50%, TARGET...)

        let textoPaso = `<b>${dia}:</b> `;

        if (sujeto === "ACTUAL") {
            if (accion === "STOP") textoPaso += `Suspender fármaco de origen.`;
            if (accion === "REDUCIR") textoPaso += `Reducir fármaco de origen al ${valor}.`;
        } else {
            // Lógica para el Fármaco NUEVO
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

// --- FUNCIÓN DE CÁLCULO ACTUALIZADA ---
window.ejecutarCalculo = function() {
    const fOrigName = document.getElementById('f_orig').value;
    const fDestName = document.getElementById('f_dest').value;
    const dosisO = parseFloat(document.getElementById('d_orig').value);
    
    // Necesitamos los datos mapeados y la fila original para las instrucciones
    const oIndex = window.dbCalc.findIndex(f => f.farmaco === fOrigName);
    const o = window.dbCalc[oIndex];
    const d = window.dbCalc.find(f => f.farmaco === fDestName);
    
    // El índice de columna para el destino (Basado en tu fila 13)
    // Asumimos que las columnas de instrucciones empiezan en la G (índice 6)
    const dColIndex = 6 + window.dbCalc.findIndex(f => f.farmaco === fDestName);

    if (!dosisO || isNaN(dosisO) || !o || !d) {
        alert("Por favor, introduce una dosis válida.");
        return;
    }

    let Maudsley = (dosisO / o.factor) * d.factor;
    let porcentajeRango = (dosisO / o.max) * 100;
    let dosisRango = (porcentajeRango / 100) * d.max;
    
    // ... (Aquí va tu lógica de colores y alertas que ya tenías) ...
    let bgColor = Maudsley > d.max ? '#fee2e2' : (Maudsley > d.ed95 ? '#fef3c7' : '#dcfce7');
    let textColor = Maudsley > d.max ? '#b91c1c' : (Maudsley > d.ed95 ? '#b45309' : '#15803d');
    let alertText = Maudsley > d.max ? "⚠️ EXCEDE DOSIS MÁXIMA" : "✅ RANGO ESTÁNDAR";

    const resBox = document.getElementById('res-box');
    const resVal = document.getElementById('res-val');
    const resTip = document.getElementById('res-tip');

    resBox.style.display = 'block';
    resBox.style.background = bgColor;

    resVal.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 15px;">
            <div style="background: rgba(255,255,255,0.7); padding: 1.5rem; border-radius: 1.2rem; text-align: center; border: 1px solid rgba(0,0,0,0.05);">
                <div style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 5px; letter-spacing: 0.5px;">Dosis de prescripción (Maudsley)</div>
                <div style="font-size: 2.8rem; font-weight: 900; line-height: 1; color: var(--text-main);">${Maudsley.toFixed(1)} <span style="font-size: 1.2rem;">mg/día</span></div>
                <div style="display: inline-block; margin-top: 12px; padding: 6px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 900; background: white; color: ${textColor}; border: 1px solid ${textColor};">${alertText}</div>
            </div>
        </div>`;

    // Obtener la instrucción desde la matriz original cargada por el Worker
    // window.dbRaw contiene los valores sin procesar del fetch
    const rawInstruction = window.dbRaw[oIndex + 1][dColIndex]; // +1 por la cabecera
    
    const tipTraducido = window.traducirInstrucciones(rawInstruction, dosisO, fDestName, Maudsley);

    resTip.innerHTML = `
        <div style="margin-top: 15px; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 12px; font-size: 0.9rem;">
            <b style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 10px;">Estrategia de Cambio Automática</b>
            ${tipTraducido}
        </div>`;
};
