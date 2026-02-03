const MATRIZ_INTEGRATE = {
  "AMISULPRIDA-ARIPIPRAZOL": "Solapamiento 14d: Iniciar Aripiprazol Día 1. Mantener Amisulprida total 7 días. 50% el Día 8. Stop Día 14.",
  "RISPERIDONA-PALIPERIDONA": "Cambio Directo: Stop origen e iniciar dosis equivalente el Día 1.",
  "DESTINO-CARIPRAZINA": "Cambio Lento (4 sem): Iniciar 1.5 mg. Mantener origen total 21 días. Reducir origen al 50% día 22. Stop día 29.",
  "DESTINO-BREXPIPRAZOL": "Solapamiento 12d: Día 1: 1 mg, Día 2: 2 mg. Reducir origen al 50% y suspender el Día 12.",
  "ORIGEN-ARIPIPRAZOL": "Elección: A) Stop Día 1 o B) Reducir al 50% el Día 1 y Stop el Día 14.",
  "ORIGEN-QUETIAPINA": "Si dosis > 300 mg: IR: Reducir 25% cada 4 días (Stop día 13). MR: Reducir 50% 1 semana (Stop día 8).",
  "ORIGEN-AGONISTA_PARCIAL": "Stop & Start: Suspender origen el Día 1. Iniciar destino el Día 1 (titulando según fármaco)."
};

function ejecutarCalculo() {
    // 1. CAPTURA DE DATOS
    const fOrigName = document.getElementById('f_orig').value;
    const fDestName = document.getElementById('f_dest').value;
    const dosisO = parseFloat(document.getElementById('d_orig').value);
    
    const o = window.dbCalc.find(f => f.farmaco === fOrigName);
    const d = window.dbCalc.find(f => f.farmaco === fDestName);
    
    if (!dosisO || isNaN(dosisO) || !o || !d) {
        alert("Por favor, introduce una dosis válida.");
        return;
    }

    // 2. CÁLCULOS MATEMÁTICOS (Maudsley y Rangos)
    let Maudsley = (dosisO / o.factor) * d.factor;
    let porcentajeRango = (dosisO / o.max) * 100;
    let dosisRango = (porcentajeRango / 100) * d.max;
    
    // 3. LÓGICA DE ALERTAS Y COLORES
    let textColor = Maudsley > d.max ? "#b91c1c" : (Maudsley > d.ed95 ? "#b45309" : "#15803d");
    let alertText = Maudsley > d.max ? "⚠️ EXCEDE DOSIS MÁXIMA" : (Maudsley > d.ed95 ? "⚠️ SUPERIOR A ED95" : "✅ RANGO ESTÁNDAR");
    const bgColor = Maudsley > d.max ? '#fee2e2' : (Maudsley > d.ed95 ? '#fef3c7' : '#dcfce7');

    const resBox = document.getElementById('res-box');
    resBox.style.display = 'block';
    resBox.style.background = bgColor;

    // 4. RENDERIZADO DE RESULTADOS (UX)
    document.getElementById('res-val').innerHTML = `
        <div style="text-align: center; padding: 1rem;">
            <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Dosis Maudsley</div>
            <div style="font-size: 2.8rem; font-weight: 900; color: var(--text-main); line-height: 1;">${Maudsley.toFixed(1)} <span style="font-size: 1rem;">mg</span></div>
            <div style="color: ${textColor}; font-weight: 800; font-size: 0.75rem; margin-top: 10px; border: 1px solid ${textColor}; display: inline-block; padding: 4px 12px; border-radius: 20px;">${alertText}</div>
        </div>
    `;

    // 5. MOTOR LÓGICO INTEGRATE (La jerarquía que pediste)
    let tip = "";
    const oName = o.farmaco.toUpperCase();
    const dName = d.farmaco.toUpperCase();
    const parClave = `${oName}-${dName}`;

    // Nivel 1: Parejas exactas (Amisul-Aripi / Risper-Pali)
    if (MATRIZ_INTEGRATE[parClave]) {
        tip = MATRIZ_INTEGRATE[parClave];
    } 
    // Nivel 2: Destinos con farmacocinética especial (Cariprazina / Brexpiprazol)
    else if (dName === "CARIPRAZINA") {
        tip = MATRIZ_INTEGRATE["DESTINO-CARIPRAZINA"];
    } else if (dName === "BREXPIPRAZOL") {
        tip = MATRIZ_INTEGRATE["DESTINO-BREXPIPRAZOL"];
    } 
    // Nivel 3: Orígenes con manejo especial (Aripiprazol / Agonistas / Quetiapina)
    else if (oName === "ARIPIPRAZOL") {
        tip = MATRIZ_INTEGRATE["ORIGEN-ARIPIPRAZOL"];
    } else if (oName === "CARIPRAZINA" || oName === "BREXPIPRAZOL") {
        tip = MATRIZ_INTEGRATE["ORIGEN-AGONISTA_PARCIAL"];
    } else if (oName === "QUETIAPINA") {
        tip = MATRIZ_INTEGRATE["ORIGEN-QUETIAPINA"];
    } 
    // Nivel 4: Regla General (Haloperidol, Olanzapina, etc.) basada en Umbral
    else {
        if (dosisO <= o.umbral) {
            tip = "Dosis baja de origen: Se recomienda cambio directo (Stop/Start) el Día 1.";
        } else {
            tip = `Reducción gradual: Reducir ${o.farmaco} al 50% el Día 1 y suspender tras 7 días de solapamiento con el nuevo fármaco.`;
        }
    }

    document.getElementById('res-tip').innerHTML = `
        <div style="margin-top: 15px; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 12px;">
            <b style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 5px;">Estrategia de Cambio</b>
            <p style="font-size: 0.95rem; line-height: 1.4; color: var(--text-main); margin: 0;">${tip}</p>
        </div>
    `;
}
