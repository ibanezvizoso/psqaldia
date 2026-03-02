// --- CARGA DE DATOS, ESTILOS Y FUNCIÓN PRINCIPAL ---
window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    if (!document.getElementById('calc-internal-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'calc-internal-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.4rem; font-family: inherit; }
            .calc-ui h2 { margin: 0 0 1.5rem 0; font-weight: 800; }
            .calc-ui label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-top: 0.8rem; display: block; }
            .calc-ui select, .calc-ui input { width: 100%; padding: 0.9rem; border-radius: 1rem; border: 2px solid var(--border); background: var(--bg); color: var(--text-main); font-size: 1rem; outline: none; box-sizing: border-box; }
            .calc-ui select:focus, .calc-ui input:focus { border-color: var(--primary); }
            .res-container { padding: 1.5rem; border-radius: 1.5rem; margin-top: 1.5rem; display: none; border: 1px solid rgba(0,0,0,0.05); }
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
                // Guardamos los valores brutos para las instrucciones
                window.dbRaw = data.values; 
                // Mapeamos los datos numéricos (asumiendo que los datos empiezan en la fila 1)
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
            console.error("Error cargando datos:", e);
            container.innerHTML = `<div style="padding:2.5rem;">Error: ${e.message}</div>`;
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
            <button class="btn btn-primary" style="width:100%; margin-top:1.2rem;" onclick="ejecutarCalculo()">CALCULAR</button>
            <div id="res-box" class="res-container">
                <div id="res-val"></div>
                <div id="res-tip"></div>
            </div>
        </div>`;
}

// --- MOTOR DE TRADUCCIÓN LÓGICA ---
window.traducirInstrucciones = function(rawString, dOrig, nombreDestino, targetMg) {
    if (!rawString || rawString.trim() === "") return `<div style="opacity:0.5;">No hay pauta definida en el Excel para este cruce.</div>`;

    let instruccion = rawString;

    // 1. Lógica IF_ACTUAL
    if (instruccion.startsWith("IF_ACTUAL_")) {
        const regex = /IF_ACTUAL_([<>])(\d+):/;
        const match = instruccion.match(regex);
        if (match) {
            const operador = match[1];
            const valorCorte = parseFloat(match[2]);
            const cumple = (operador === '<') ? dOrig < valorCorte : dOrig > valorCorte;
            
            if (cumple) {
                instruccion = instruccion.replace(/IF_ACTUAL_[<>]\d+:/, '');
            } else {
                return `<div style="padding:10px; opacity:0.7;">Dosis fuera de rango para pauta automática. Ajustar según criterio clínico.</div>`;
            }
        }
    }

    const pasos = instruccion.split('|').map(p => p.trim()).filter(Boolean);
    const timeline = {};
    let objetivoAlcanzado = false;

    pasos.forEach(p => {
        const partes = p.split(':');
        if (partes.length < 3) return;

        const dia = partes[0].replace('D', '').trim();
        const sujeto = partes[1]; // ACTUAL o NUEVO
        const accion = partes[2]; // STOP, INICIAR, SUBIR, etc.
        const valor = partes[3] || "";

        if (!timeline[dia]) timeline[dia] = { ACTUAL: [], NUEVO: [] };

        if (sujeto === "ACTUAL") {
            if (accion === "STOP") timeline[dia].ACTUAL.push("Suspender completamente");
            if (accion === "REDUCIR") timeline[dia].ACTUAL.push(`Reducir al ${valor}`);
            if (accion === "MANTENER") timeline[dia].ACTUAL.push("Mantener dosis");
        } 
        else if (sujeto === "NUEVO" && !objetivoAlcanzado) {
            if (accion === "INICIAR" || accion === "SUBIR") {
                const mgPaso = parseFloat(valor);
                if (valor === "TARGET" || (!isNaN(mgPaso) && mgPaso >= targetMg)) {
                    timeline[dia].NUEVO.push(`Alcanzar dosis objetivo de <b>${targetMg.toFixed(1)} mg</b>`);
                    objetivoAlcanzado = true;
                } else {
                    timeline[dia].NUEVO.push(`${accion === "INICIAR" ? "Iniciar" : "Subir"} a ${valor}`);
                }
            }
            if (accion === "TITULAR_PROGRESIVO") {
                timeline[dia].NUEVO.push(`Desde este día, titular hasta <b>${targetMg.toFixed(1)} mg</b>`);
                objetivoAlcanzado = true;
            }
        }
    });

    // Renderizado en tarjetas
    let html = `<div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">`;
    Object.keys(timeline).sort((a,b) => a-b).forEach(d => {
        html += `
            <div style="background:white; border-radius:12px; padding:12px; border:1px solid rgba(0,0,0,0.06);">
                <div style="font-size:0.65rem; font-weight:900; color:var(--primary); text-transform:uppercase; margin-bottom:8px;">Día ${d}</div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <div style="background:#fff1f2; padding:8px; border-radius:8px; font-size:0.85rem;">
                        <div style="font-size:0.6rem; font-weight:800; opacity:0.4; text-transform:uppercase;">Origen</div>
                        ${timeline[d].ACTUAL.length ? timeline[d].ACTUAL.join('<br>') : '—'}
                    </div>
                    <div style="background:#f0fdf4; padding:8px; border-radius:8px; font-size:0.85rem;">
                        <div style="font-size:0.6rem; font-weight:800; opacity:0.4; text-transform:uppercase;">${nombreDestino}</div>
                        ${timeline[d].NUEVO.length ? timeline[d].NUEVO.join('<br>') : '—'}
                    </div>
                </div>
            </div>`;
    });
    return html + `</div>`;
}

// --- FUNCIÓN DE CÁLCULO FINAL ---
window.ejecutarCalculo = function() {
    const fOrigName = document.getElementById('f_orig').value;
    const fDestName = document.getElementById('f_dest').value;
    const dosisO = parseFloat(document.getElementById('d_orig').value);
    
    const o = window.dbCalc.find(f => f.farmaco === fOrigName);
    const d = window.dbCalc.find(f => f.farmaco === fDestName);
    
    if (!dosisO || isNaN(dosisO) || !o || !d) {
        alert("Introduce una dosis válida.");
        return;
    }

    const Maudsley = (dosisO / o.factor) * d.factor;
    const porcentajeRango = (dosisO / o.max) * 100;
    const dosisRango = (porcentajeRango / 100) * d.max;
    
    // Alertas visuales
    let color = Maudsley > d.max ? "#b91c1c" : (Maudsley > d.ed95 ? "#b45309" : "#15803d");
    let bg = Maudsley > d.max ? "#fee2e2" : (Maudsley > d.ed95 ? "#fef3c7" : "#dcfce7");
    let txt = Maudsley > d.max ? "⚠️ EXCEDE MÁXIMA" : (Maudsley > d.ed95 ? "⚠️ SUPERIOR ED95" : "✅ RANGO ESTÁNDAR");

    document.getElementById('res-box').style.display = 'block';
    document.getElementById('res-box').style.background = bg;
    
    document.getElementById('res-val').innerHTML = `
        <div style="background:rgba(255,255,255,0.6); padding:1rem; border-radius:1rem; text-align:center; border:1px solid rgba(0,0,0,0.05);">
            <div style="font-size:0.65rem; font-weight:800; text-transform:uppercase; color:var(--text-muted);">Dosis Maudsley</div>
            <div style="font-size:2.2rem; font-weight:900;">${Maudsley.toFixed(1)} <span style="font-size:1rem;">mg/d</span></div>
            <div style="font-size:0.7rem; font-weight:800; color:${color}; border:1px solid ${color}; display:inline-block; padding:2px 8px; border-radius:20px; margin-top:5px;">${txt}</div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:10px; padding:0 5px; opacity:0.8; font-size:0.8rem;">
            <span>Equivalencia Rango (${porcentajeRango.toFixed(0)}%)</span>
            <b>${dosisRango.toFixed(1)} mg</b>
        </div>
    `;

    // Localizar la instrucción en dbRaw
    // Fila: Buscamos el fármaco de origen (saltando cabecera)
    const rowIndex = window.dbRaw.findIndex(row => row[0] === fOrigName);
    // Columna: Buscamos el nombre del destino en la fila de cabecera (Fila 0)
    const colIndex = window.dbRaw[0].findIndex(cell => cell && cell.toString().trim().toUpperCase() === fDestName.toUpperCase());

    const rawStr = (rowIndex > -1 && colIndex > -1) ? window.dbRaw[rowIndex][colIndex] : "";
    
    document.getElementById('res-tip').innerHTML = `
        <div style="margin-top:15px; border-top:1px solid rgba(0,0,0,0.1); padding-top:10px;">
            <span style="font-size:0.7rem; font-weight:900; text-transform:uppercase; opacity:0.5;">Estrategia de Cambio</span>
            ${window.traducirInstrucciones(rawStr, dosisO, fDestName, Maudsley)}
        </div>
    `;
}
