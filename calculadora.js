// --- CARGA DE DATOS, ESTILOS Y FUNCIÓN PRINCIPAL ---
window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    // A. INYECCIÓN DE ESTILOS (Para que el diseño sea autónomo)
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
    
    // 1. CARGA AUTÓNOMA DE DATOS (Solo si no existen)
    if (!window.dbCalc) {
        try {
            const pestaña = "Data_APS"; 
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${window.SHEET_ID}/values/${pestaña}!A2:F100?key=${window.API_KEY}`;
            
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                alert("Error de Google Sheets: " + data.error.message);
                throw new Error(data.error.message);
            }

            if (data.values) {
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
            alert("Fallo crítico en la carga: " + e.message);
            container.innerHTML = `<div style="padding:2.5rem;">Error cargando datos: ${e.message}</div>`;
            return;
        }
    }

    // 2. TU CÓDIGO ORIGINAL DE RENDERIZADO
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

// --- TU MATRIZ ORIGINAL ---
const MATRIZ_INTEGRATE = {
  "AMISULPRIDA-ARIPIPRAZOL": "Solapamiento 14d: Iniciar Aripiprazol Día 1. Mantener Amisulprida total 7 días. 50% el Día 8. Stop Día 14.",
  "RISPERIDONA-PALIPERIDONA": "Cambio Directo: Stop origen e iniciar dosis equivalente el Día 1.",
  "DESTINO-CARIPRAZINA": "Cambio Lento (4 sem): Iniciar 1.5 mg. Mantener origen total 21 días. Reducir origen al 50% día 22. Stop día 29.",
  "DESTINO-BREXPIPRAZOL": "Solapamiento 12d: Día 1: 1 mg, Día 2: 2 mg. Reducir origen al 50% y suspender el Día 12.",
  "ORIGEN-ARIPIPRAZOL": "Elección: A) Stop Día 1 o B) Reducir al 50% el Día 1 y Stop el Día 14.",
  "ORIGEN-QUETIAPINA": "Si dosis > 300 mg: IR: Reducir 25% cada 4 días (Stop día 13). MR: Reducir 50% 1 semana (Stop día 8).",
  "ORIGEN-AGONISTA_PARCIAL": "Stop & Start: Suspender origen el Día 1. Iniciar destino el Día 1 (titulando según fármaco)."
};

// --- TU FUNCIÓN DE CÁLCULO ORIGINAL (Globalizada) ---
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

    let Maudsley = (dosisO / o.factor) * d.factor;
    let porcentajeRango = (dosisO / o.max) * 100;
    let dosisRango = (porcentajeRango / 100) * d.max;
    
    let bgColor = ""; let textColor = ""; let alertText = "";

    if (Maudsley > d.max) {
        bgColor = '#fee2e2'; textColor = "#b91c1c"; 
        alertText = "⚠️ EXCEDE DOSIS MÁXIMA en ficha técnica";
    } else if (Maudsley > d.ed95) {
        bgColor = '#fef3c7'; textColor = "#b45309"; 
        alertText = "⚠️ SUPERIOR A ED95 (dosis para 95% respuesta)";
    } else if (Maudsley < d.min) {
        bgColor = '#f1f5f9'; textColor = "#475569"; 
        alertText = "🔍 POR DEBAJO DE MÍNIMO EFECTIVO";
    } else {
        bgColor = '#dcfce7'; textColor = "#15803d"; 
        alertText = "✅ RANGO ESTÁNDAR";
    }

    const resBox = document.getElementById('res-box');
    const resVal = document.getElementById('res-val');
    const resAlert = document.getElementById('res-alert');
    const resTip = document.getElementById('res-tip');

    resBox.style.display = 'block';
    resBox.style.background = bgColor;
    if(resAlert) resAlert.innerHTML = ""; 

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

    let tip = "";
    const oName = o.farmaco.toUpperCase();
    const dName = d.farmaco.toUpperCase();
    const parClave = `${oName}-${dName}`;

    if (MATRIZ_INTEGRATE[parClave]) {
        tip = MATRIZ_INTEGRATE[parClave];
    } else if (dName === "CARIPRAZINA") {
        tip = MATRIZ_INTEGRATE["DESTINO-CARIPRAZINA"];
    } else if (dName === "BREXPIPRAZOL") {
        tip = MATRIZ_INTEGRATE["DESTINO-BREXPIPRAZOL"];
    } else if (oName === "ARIPIPRAZOL") {
        tip = MATRIZ_INTEGRATE["ORIGEN-ARIPIPRAZOL"];
    } else if (oName === "CARIPRAZINA" || oName === "BREXPIPRAZOL") {
        tip = MATRIZ_INTEGRATE["ORIGEN-AGONISTA_PARCIAL"];
    } else if (oName === "QUETIAPINA") {
        tip = MATRIZ_INTEGRATE["ORIGEN-QUETIAPINA"];
    } else {
        if (dosisO <= o.umbral) {
            tip = "Dosis baja de origen: Se recomienda cambio directo (Stop/Start) el Día 1.";
        } else {
            tip = `Reducción gradual: Reducir ${o.farmaco} al 50% el Día 1 y suspender tras 7 días de solapamiento con el nuevo fármaco.`;
        }
    }

    if (dName === "QUETIAPINA") {
        tip += "<br><br>Iniciar Quetiapina de forma gradual (ej. 25-50mg) y subir hasta la dosis objetivo en 4-7 días.";
    }
    resTip.innerHTML = `
        <div style="margin-top: 15px; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 12px; font-size: 0.9rem;">
            <b style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 5px;">Estrategia de Cambio</b>
            ${tip}
        </div>
    `;
}
