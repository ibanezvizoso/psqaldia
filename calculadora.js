// --- CARGA DE DATOS, ESTILOS Y FUNCIÓN PRINCIPAL ---
window.iniciarInterfazCalculadora = async function() {

    const container = document.getElementById('modalData');

    // --- INYECCIÓN DE ESTILOS ---
    if (!document.getElementById('calc-internal-styles')) {

        const styleTag = document.createElement('style');
        styleTag.id = 'calc-internal-styles';

        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
            .calc-ui h2 { margin-bottom: 1.5rem; font-weight: 800; }
            .calc-ui label {
                font-size: 0.75rem;
                font-weight: 800;
                text-transform: uppercase;
                color: var(--text-muted);
                margin-top: 0.8rem;
            }
            .calc-ui select, .calc-ui input {
                width: 100%;
                padding: 0.9rem;
                border-radius: 1rem;
                border: 2px solid var(--border);
                background: var(--bg);
                font-size: 1rem;
                box-sizing: border-box;
            }
            .calc-ui select:focus, .calc-ui input:focus {
                border-color: var(--primary);
            }
            .res-container {
                padding: 1.5rem;
                border-radius: 1.2rem;
                margin-top: 1.5rem;
                display: none;
            }
        `;

        document.head.appendChild(styleTag);
    }

    // --- CARGA DE DATOS CON RANGO FIJO (CRÍTICO) ---
    if (!window.dbCalc) {

        try {

            // ⚠️ RANGO FIJO PARA NO PERDER COLUMNAS VACÍAS
            const response = await fetch(
                `${window.WORKER_URL}?sheet=Data_APS!A1:AZ200`
            );

            const data = await response.json();

            if (data.error) {
                throw new Error(data.details || data.error);
            }

            if (data.values) {

                // Guardamos hoja completa
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

            container.innerHTML =
                `<div style="padding:2rem;">Error cargando datos: ${e.message}</div>`;

            return;
        }
    }

    // --- RENDER ---
    const options = window.dbCalc
        .filter(f => f.farmaco)
        .map(f => `<option value="${f.farmaco}">${f.farmaco}</option>`)
        .join('');

    container.innerHTML = `
        <div class="calc-ui">
            <h2><i class="fas fa-calculator"></i> Calculadora APS</h2>

            <label>Fármaco Origen</label>
            <select id="f_orig">${options}</select>

            <label>Dosis Actual (mg/día)</label>
            <input type="number" id="d_orig" placeholder="0.00">

            <label>Fármaco Destino</label>
            <select id="f_dest">${options}</select>

            <button class="btn btn-primary" onclick="ejecutarCalculo()">
                CALCULAR
            </button>

            <div id="res-box" class="res-container">
                <div id="res-val"></div>
                <div id="res-tip"></div>
            </div>
        </div>
    `;
};


// --- FUNCIÓN DE CÁLCULO ---
window.ejecutarCalculo = function() {

    const fOrigName = document.getElementById('f_orig').value.trim().toUpperCase();
    const fDestName = document.getElementById('f_dest').value.trim().toUpperCase();
    const dosisO = parseFloat(document.getElementById('d_orig').value);

    const o = window.dbCalc.find(f =>
        f.farmaco && f.farmaco.toUpperCase() === fOrigName
    );

    const d = window.dbCalc.find(f =>
        f.farmaco && f.farmaco.toUpperCase() === fDestName
    );

    if (!dosisO || isNaN(dosisO) || !o || !d) {
        alert("Introduce una dosis válida.");
        return;
    }

    // --- CÁLCULO ---
    const Maudsley = (dosisO / o.factor) * d.factor;

    const resBox = document.getElementById('res-box');
    const resVal = document.getElementById('res-val');
    const resTip = document.getElementById('res-tip');

    resBox.style.display = 'block';

    resVal.innerHTML = `
        <div style="font-size:2.2rem;font-weight:900;">
            ${Maudsley.toFixed(1)} mg/día
        </div>
    `;

    // --- LECTURA DE INTERSECCIÓN REAL DESDE EXCEL ---
    let tip = "";
    const sheet = window.rawSheet;

    if (sheet && sheet.length > 12) {

        // 1️⃣ Buscar fila del origen (columna A)
        const filaOrigen = sheet.findIndex(row =>
            row[0] &&
            row[0].toString().trim().toUpperCase() === fOrigName
        );

        // 2️⃣ Buscar columna destino en fila 13 (índice 12)
        const filaCabecera = sheet[12];
        let colDestino = -1;

        if (filaCabecera) {

            for (let col = 0; col < filaCabecera.length; col++) {

                if (
                    filaCabecera[col] &&
                    filaCabecera[col].toString().trim().toUpperCase() === fDestName
                ) {
                    colDestino = col;
                    break;
                }
            }
        }

        // 3️⃣ Leer intersección (ej: H2)
        if (
            filaOrigen !== -1 &&
            colDestino !== -1 &&
            sheet[filaOrigen] &&
            sheet[filaOrigen][colDestino] !== undefined
        ) {
            tip = sheet[filaOrigen][colDestino];
        }
    }

    if (!tip || tip.trim() === "") {
        tip = "No hay instrucción específica definida para este cambio.";
    }

    resTip.innerHTML = `
        <div style="margin-top:1rem;font-size:0.9rem;">
            <b>Estrategia de Cambio</b><br>
            ${tip}
        </div>
    `;
};
