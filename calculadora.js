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

    // --- CARGA AUTÓNOMA DE DATOS ---
    if (!window.dbCalc) {
        try {
            const pestaña = "Data_APS";
            const response = await fetch(`${window.WORKER_URL}?sheet=${pestaña}`);
            const data = await response.json();

            if (data.error) {
                throw new Error(data.details || data.error);
            }

            if (data.values) {

                // Guardamos la hoja completa para leer switches
                window.rawSheet = data.values;

                // Construimos base farmacológica (columnas A-F)
                window.dbCalc = data.values.map(row => ({
                    farmaco: row[0],
                    factor: parseFloat(row[1]) || 1,
                    ed95: parseFloat(row[2]) || 0,
                    max: parseFloat(row[3]) || 0,
                    min: parseFloat(row[4]) || 0,
                    umbral: parseFloat(row[5]) || 0
                }));
            }

        } catch (e) {
            console.error("Error en la calculadora:", e);
            container.innerHTML = `<div style="padding:2.5rem;">Error cargando datos: ${e.message}</div>`;
            return;
        }
    }

    const options = window.dbCalc
        .filter(f => f.farmaco)
        .map(f => `<option value="${f.farmaco}">${f.farmaco}</option>`)
        .join('');

    container.innerHTML = `
        <div class="calc-ui">
            <h2 style="margin-bottom:1.5rem;">
                <i class="fas fa-calculator"></i> Calculadora APS
            </h2>
            
            <label>Fármaco Origen</label>
            <select id="f_orig">${options}</select>
            
            <label>Dosis Actual (mg/día)</label>
            <input type="number" id="d_orig" placeholder="0.00">
            
            <label>Fármaco Destino</label>
            <select id="f_dest">${options}</select>
            
            <button class="btn btn-primary" style="width:100%;" onclick="ejecutarCalculo()">
                CALCULAR
            </button>
            
            <div id="res-box" class="res-container" style="background:var(--bg); margin-top: 1.5rem;">
                <div id="res-val" style="font-size:2.2rem; font-weight:900;"></div>
                <div id="res-alert"></div>
                <div id="res-tip"></div>
            </div>
            
            <p style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2rem; line-height: 1.3; font-style: italic;">
                Basado en equivalencias APS. Juicio clínico indispensable.
            </p>
        </div>`;
};

// --- FUNCIÓN DE CÁLCULO ---
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

    // --- CÁLCULO ---
    let Maudsley = (dosisO / o.factor) * d.factor;
    let porcentajeRango = (dosisO / o.max) * 100;
    let dosisRango = (porcentajeRango / 100) * d.max;

    let bgColor = "";
    let textColor = "";
    let alertText = "";

    if (Maudsley > d.max) {
        bgColor = '#fee2e2'; 
        textColor = "#b91c1c"; 
        alertText = "⚠️ EXCEDE DOSIS MÁXIMA";
    } else if (Maudsley > d.ed95) {
        bgColor = '#fef3c7'; 
        textColor = "#b45309"; 
        alertText = "⚠️ SUPERIOR A ED95";
    } else if (Maudsley < d.min) {
        bgColor = '#f1f5f9'; 
        textColor = "#475569"; 
        alertText = "🔍 POR DEBAJO DE MÍNIMO EFECTIVO";
    } else {
        bgColor = '#dcfce7'; 
        textColor = "#15803d"; 
        alertText = "✅ RANGO ESTÁNDAR";
    }

    const resBox = document.getElementById('res-box');
    const resVal = document.getElementById('res-val');
    const resTip = document.getElementById('res-tip');

    resBox.style.display = 'block';
    resBox.style.background = bgColor;

    resVal.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 15px;">
            <div style="background: rgba(255,255,255,0.7); padding: 1.5rem; border-radius: 1.2rem; text-align: center;">
                <div style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 5px;">
                    Dosis de prescripción
                </div>
                <div style="font-size: 2.8rem; font-weight: 900;">
                    ${Maudsley.toFixed(1)} mg/día
                </div>
                <div style="margin-top: 12px; font-weight: 800; color: ${textColor};">
                    ${alertText}
                </div>
            </div>
            <div style="font-size: 0.85rem;">
                Equivalencia en su rango (${porcentajeRango.toFixed(0)}%): 
                <b>${dosisRango.toFixed(1)} mg</b>
            </div>
        </div>
    `;

    // --- NUEVA LÓGICA DE SWITCH DESDE EXCEL ---
    let tip = "";

    if (window.rawSheet) {

        const sheet = window.rawSheet;

        // Buscar fila del fármaco origen (columna A)
        const filaOrigen = sheet.findIndex(row =>
            row[0] && row[0].toString().trim().toUpperCase() === fOrigName.toUpperCase()
        );

        // Fila 13 (índice 12) contiene cabecera de destinos desde G13
        const filaCabecera = sheet[12];

        let colDestino = -1;

        if (filaCabecera) {
            colDestino = filaCabecera.findIndex(cell =>
                cell && cell.toString().trim().toUpperCase() === fDestName.toUpperCase()
            );
        }

        if (filaOrigen !== -1 && colDestino !== -1) {
            tip = sheet[filaOrigen][colDestino] || "";
        }
    }

    if (!tip || tip.trim() === "") {
        tip = "No hay instrucción específica definida para este cambio.";
    }

    resTip.innerHTML = `
        <div style="margin-top: 15px; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 12px; font-size: 0.9rem;">
            <b style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 5px;">
                Estrategia de Cambio
            </b>
            ${tip}
        </div>
    `;
};
