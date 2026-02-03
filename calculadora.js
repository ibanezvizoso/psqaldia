/**
 * MOTOR LÓGICO DE LA CALCULADORA PSQALDÍA
 * UX Refinada: Foco en dosis de prescripción y alerta
 */

const MATRIZ_INTEGRATE = {
    "AMISULPRIDA-ARIPIPRAZOL": "Iniciar Aripiprazol dosis objetivo Día 1. Mantener Amisulprida total 7 días. Amisulprida al 50% Día 8. Stop Día 14.",
    "AMISULPRIDA-CARIPRAZINA": "Iniciar 1.5mg Día 1. Mantener Amisulprida dosis total 21 días. Día 22: Amisulprida al 50%. Día 29: Stop Amisulprida.",
    "CARIPRAZINA-CUALQUIERA": "Suspender Cariprazina el Día 1. Iniciar nuevo fármaco el Día 1 con titulación lenta (3-4 semanas).",
    "BREXPIPRAZOL-CUALQUIERA": "Suspender Brexpiprazol el Día 1. Iniciar nuevo fármaco el Día 1.",
    "ARIPIPRAZOL-CUALQUIERA": "Opción A: Stop Día 1. Opción B: Reducir al 50% el Día 1 y Stop el Día 14.",
    "RISPERIDONA-PALIPERIDONA": "Cambio directo a dosis equivalente el Día 1. Sin solapamiento.",
    "QUETIAPINA-CUALQUIERA": "Si >300mg e IR: Reducir 25% cada 4 días (Stop día 13). Si MR: 50% una semana y Stop.",
    "ESTANDAR": "Reducir origen al 50% el Día 1. Suspender tras 7 días de solapamiento."
};

function ejecutarCalculo() {
    const fOrigName = document.getElementById('f_orig').value;
    const fDestName = document.getElementById('f_dest').value;
    const dosisO = parseFloat(document.getElementById('d_orig').value);
    
    const o = window.dbCalc.find(f => f.farmaco === fOrigName);
    const d = window.dbCalc.find(f => f.farmaco === fDestName);
    
    if (!dosisO || isNaN(dosisO)) {
        alert("Por favor, introduce una dosis válida.");
        return;
    }

    let Maudsley = (dosisO / o.factor) * d.factor;
    let porcentajeRango = (dosisO / o.max) * 100;
    let dosisRango = (porcentajeRango / 100) * d.max;
    
    const resBox = document.getElementById('res-box');
    const resVal = document.getElementById('res-val');
    const resAlert = document.getElementById('res-alert');
    const resTip = document.getElementById('res-tip');

    resBox.style.display = 'block';
    
    // 1. Colores de fondo del Recuadro Grande (Semáforo muy suave)
    let bgColor = "";
    let textColor = "";
    let alertText = "";

    if (Maudsley > d.max) {
        bgColor = '#fee2e2'; textColor = "#b91c1c"; alertText = "⚠️ EXCEDE DOSIS MÁXIMA en ficha técnica";
    } else if (Maudsley > d.ed95) {
        bgColor = '#fef3c7'; textColor = "#b45309"; alertText = "⚠️ SUPERIOR A dosis eficaz para reducción de 95% síntomas (ED95)";
    } else if (Maudsley < d.min) {
        bgColor = '#f1f5f9'; textColor = "#475569"; alertText = "🔍 POR DEBAJO DE MÍNIMO EFECTIVO en primer episodio psicótico";
    } else {
        bgColor = '#dcfce7'; textColor = "#15803d"; alertText = "✅ RANGO ESTÁNDAR";
    }

    resBox.style.background = bgColor;

    // 2. RENDERIZADO UX: Foco interno blanco para dosis principal + alerta
    resVal.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 15px;">
            
            <div style="background: rgba(255,255,255,0.7); padding: 1.5rem; border-radius: 1.2rem; text-align: center; border: 1px solid rgba(0,0,0,0.05);">
                <div style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 5px; letter-spacing: 0.5px;">Dosis de prescripción (Maudsley)</div>
                <div style="font-size: 2.8rem; font-weight: 900; line-height: 1; color: var(--text-main);">${Maudsley.toFixed(1)} <span style="font-size: 1.2rem;">mg/día</span></div>
                
                <div id="status-tag" style="display: inline-block; margin-top: 12px; padding: 4px 12px; border-radius: 50px; font-size: 0.75rem; font-weight: 900; background: white; color: ${textColor}; border: 1px solid ${textColor};">
                    ${alertText}
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 10px;">
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Equivalencia en su rango (${porcentajeRango.toFixed(0)}%)</div>
                <div style="font-size: 1.1rem; font-weight: 800; opacity: 0.8;">${dosisRango.toFixed(1)} <span style="font-size: 0.8rem;">mg</span></div>
            </div>

        </div>
    `;

    // Limpiamos el resAlert viejo (ahora está dentro del resVal)
    resAlert.innerText = "";

    // 3. Estrategia INTEGRATE
    const key = `${o.farmaco}-${d.farmaco}`.toUpperCase();
    const keyGen = `${o.farmaco}-CUALQUIERA`.toUpperCase();
    let tip = MATRIZ_INTEGRATE[key] || MATRIZ_INTEGRATE[keyGen] || MATRIZ_INTEGRATE["ESTANDAR"];

    if (dosisO <= o.umbral && !MATRIZ_INTEGRATE[key]) {
        tip = "Dosis baja de origen: Se recomienda cambio directo (Stop/Start) el Día 1.";
    }

    resTip.innerHTML = `
        <div style="margin-top: 15px; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 12px; font-size: 0.9rem;">
            <b style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 5px;">Estrategia de Cambio</b>
            ${tip}
        </div>
    `;
}
