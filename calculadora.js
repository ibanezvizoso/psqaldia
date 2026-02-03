/**
 * MOTOR LÓGICO DE LA CALCULADORA PSQALDÍA
 */

const MATRIZ_INTEGRATE = {
  "AMISULPRIDA-ARIPIPRAZOL": "Solapamiento 14d: Iniciar Aripiprazol Día 1. Mantener Amisulprida total 7 días. 50% el Día 8. Stop Día 14.",
  "RISPERIDONA-PALIPERIDONA": "Cambio Directo: Stop origen e iniciar dosis equivalente el Día 1.",
  "DESTINO-CARIPRAZINA": "Cambio Lento (4 sem): Iniciar 1.5 mg. Mantener origen total 21 días. Reducir origen al 50% día 22. Stop día 29.",
  "DESTINO-BREXPIPRAZOL": "Solapamiento 12d: Día 1: 1 mg, Día 2: 2 mg. Reducir origen al 50% y suspender el Día 12.",
  "ORIGEN-ARIPIPRAZOL": "Elección: A) Stop Día 1 o B) Reducir al 50% el Día 1 y Stop el Día 14.",
  "ORIGEN-QUETIAPINA": "Si dosis > 300 mg: IR: Reducir 25% cada 4 días (Stop día 13). MR: Reducir 50% 1 semana (Stop día 8).",
  "ORIGEN-AGONISTA_PARCIAL": "Stop & Start: Suspender origen el Día 1. Iniciar destino el Día 1 (titulando según fármaco).",
  "ESTANDAR": "Regla Umbral: Si Dosis < Umbral_Switch, Stop Día 1. Si > Umbral_Switch, 50% Día 1 y Stop Día 7."
};

function obtenerInstruccion(origen, destino) {
  const o = origen.toUpperCase().trim();
  const d = destino.toUpperCase().trim();
  const parClave = `${o}-${d}`;

  if (MATRIZ_INTEGRATE[parClave]) return MATRIZ_INTEGRATE[parClave];
  if (d === "CARIPRAZINA") return MATRIZ_INTEGRATE["DESTINO-CARIPRAZINA"];
  if (d === "BREXPIPRAZOL") return MATRIZ_INTEGRATE["DESTINO-BREXPIPRAZOL"];
  if (o === "ARIPIPRAZOL") return MATRIZ_INTEGRATE["ORIGEN-ARIPIPRAZOL"];
  if (o === "CARIPRAZINA" || o === "BREXPIPRAZOL") return MATRIZ_INTEGRATE["ORIGEN-AGONISTA_PARCIAL"];
  if (o === "QUETIAPINA") return MATRIZ_INTEGRATE["ORIGEN-QUETIAPINA"];

  return MATRIZ_INTEGRATE["ESTANDAR"];
}

function ejecutarCalculo() {
    const fOrigName = document.getElementById('f_orig').value;
    const fDestName = document.getElementById('f_dest').value;
    const dosisO = parseFloat(document.getElementById('d_orig').value);
    
    const o = window.dbCalc.find(f => f.farmaco === fOrigName);
    const d = window.dbCalc.find(f => f.farmaco === fDestName);
    
    if (!dosisO || isNaN(dosisO) || !o || !d) {
        alert("Por favor, introduce datos válidos.");
        return;
    }

    let Maudsley = (dosisO / o.factor) * d.factor;
    let porcentajeRango = (dosisO / o.max) * 100;
    let dosisRango = (porcentajeRango / 100) * d.max;
    
    const resBox = document.getElementById('res-box');
    const resVal = document.getElementById('res-val');
    const resTip = document.getElementById('res-tip');

    resBox.style.display = 'block';
    
    // 1. COLORES Y ALERTAS
    let bgColor = ""; let textColor = ""; let alertText = "";
    if (Maudsley > d.max) {
        bgColor = '#fee2e2'; textColor = "#b91c1c"; alertText = "⚠️ EXCEDE DOSIS MÁXIMA";
    } else if (Maudsley > d.ed95) {
        bgColor = '#fef3c7'; textColor = "#b45309"; alertText = "⚠️ SUPERIOR A ED95";
    } else if (Maudsley < d.min) {
        bgColor = '#f1f5f9'; textColor = "#475569"; alertText = "🔍 POR DEBAJO DE MÍNIMO";
    } else {
        bgColor = '#dcfce7'; textColor = "#15803d"; alertText = "✅ RANGO ESTÁNDAR";
    }

    resBox.style.background = bgColor;

    // 2. RENDERIZADO PRINCIPAL
    resVal.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 15px;">
            <div style="background: rgba(255,255,255,0.7); padding: 1.5rem; border-radius: 1.2rem; text-align: center; border: 1px solid rgba(0,0,0,0.05);">
                <div style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 5px;">Dosis Maudsley</div>
                <div style="font-size: 2.8rem; font-weight: 900; line-height: 1; color: #1e293b;">${Maudsley.toFixed(1)} <span style="font-size: 1.2rem;">mg/día</span></div>
                <div style="display: inline-block; margin-top: 12px; padding: 6px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 900; background: white; color: ${textColor}; border: 1px solid ${textColor};">
                    ${alertText}
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 10px;">
                <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">Equivalencia en rango (${porcentajeRango.toFixed(0)}%)</div>
                <div style="font-size: 1.1rem; font-weight: 800; opacity: 0.8;">${dosisRango.toFixed(1)} <span style="font-size: 0.8rem;">mg</span></div>
            </div>
        </div>
    `;

    // 3. ESTRATEGIA DE CAMBIO (Corregido)
    let tip = obtenerInstruccion(o.farmaco, d.farmaco);

    // Sobreescribir si la dosis es menor al umbral de switch (Regla Umbral)
    // Solo si no es una pareja específica (como Amisulprida-Aripiprazol) que tiene su propio plan
    const parClave = `${o.farmaco.toUpperCase()}-${d.farmaco.toUpperCase()}`;
    if (dosisO <= o.umbral && !MATRIZ_INTEGRATE[parClave]) {
        tip = "Dosis baja de origen: Se recomienda cambio directo (Stop/Start) el Día 1.";
    }

    resTip.innerHTML = `
        <div style="margin-top: 15px; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 12px; font-size: 0.9rem;">
            <b style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 5px;">Estrategia de Cambio</b>
            ${tip}
        </div>
    `;
}
