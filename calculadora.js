/**
 * MOTOR LÓGICO DE LA CALCULADORA PSQALDÍA
 * Basado en Maudsley, Leucht e INTEGRATE
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

    // 1. Cálculo Equivalencia Maudsley (Principal)
    let Maudsley = (dosisO / o.factor) * d.factor;

    // 2. Cálculo por Porcentaje de Rango (Secundario)
    let porcentajeRango = (dosisO / o.max) * 100;
    let dosisRango = (porcentajeRango / 100) * d.max;
    
    const resBox = document.getElementById('res-box');
    const resVal = document.getElementById('res-val');
    const resAlert = document.getElementById('res-alert');
    const resTip = document.getElementById('res-tip');

    resBox.style.display = 'block';
    
    // 3. Lógica de Colores (Semáforo) basada en Maudsley
    if (Maudsley > d.max) {
        resBox.style.background = '#fee2e2'; 
        resAlert.innerText = "ALERTA: EXCEDE DOSIS MÁXIMA";
        resAlert.style.color = "#b91c1c";
    } else if (Maudsley > d.ed95) {
        resBox.style.background = '#fef3c7'; 
        resAlert.innerText = "AVISO: SUPERIOR A EFICACIA MÁXIMA (ED95)";
        resAlert.style.color = "#b45309";
    } else if (Maudsley < d.min) {
        resBox.style.background = '#f1f5f9'; 
        resAlert.innerText = "DOSIS POR DEBAJO DEL MÍNIMO EFECTIVO";
        resAlert.style.color = "#475569";
    } else {
        resBox.style.background = '#dcfce7'; 
        resAlert.innerText = "RANGO DE DOSIS ESTÁNDAR";
        resAlert.style.color = "#15803d";
    }

    // 4. Renderizado de resultados con Maudsley a la izquierda y Rango a la derecha
    resVal.innerHTML = `
        <div style="display: flex; align-items: baseline; gap: 20px; flex-wrap: wrap;">
            <div>
                <span style="font-size: 1.8rem; font-weight: 800;">${Maudsley.toFixed(1)}</span> 
                <span style="font-size: 0.9rem; font-weight: 600;">mg/día</span>
                <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-top: -5px;">Maudsley (Potencia)</div>
            </div>
            
            <div style="padding-left: 15px; border-left: 1px solid rgba(0,0,0,0.1);">
                <span style="font-size: 1.2rem; font-weight: 700; opacity: 0.8;">${dosisRango.toFixed(1)}</span> 
                <span style="font-size: 0.8rem; font-weight: 600; opacity: 0.8;">mg</span>
                <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600; line-height: 1;">Equivalencia por Rango (${porcentajeRango.toFixed(0)}%)</div>
            </div>
        </div>
    `;

    // 5. Obtener consejo INTEGRATE
    const key = `${o.farmaco}-${d.farmaco}`.toUpperCase();
    const keyGen = `${o.farmaco}-CUALQUIERA`.toUpperCase();
    let tip = MATRIZ_INTEGRATE[key] || MATRIZ_INTEGRATE[keyGen] || MATRIZ_INTEGRATE["ESTANDAR"];

    if (dosisO <= o.umbral && !MATRIZ_INTEGRATE[key]) {
        tip = "Dosis baja de origen: Se recomienda cambio directo (Stop/Start) el Día 1.";
    }

    resTip.innerHTML = `<strong>Estrategia de Cambio:</strong><br>${tip}`;
}
