/**
 * MOTOR LÓGICO DE LA CALCULADORA PSQALDÍA
 */

const MATRIZ_INTEGRATE = {
    "AMISULPRIDA-ARIPIPRAZOL": "Iniciar Aripiprazol dosis objetivo Día 1. Mantener Amisulprida total 7 días. Amisulprida al 50% Día 8. Stop Día 14.",
    "AMISULPRIDA-CARIPRAZINA": "Iniciar 1.5mg Día 1. Mantener Amisulprida dosis total 21 días. Día 22: Amisulprida al 50%. Día 29: Stop Amisulprida.",
    "CARIPRAZINA-CUALQUIERA": "Suspender Cariprazina el Día 1. Iniciar nuevo fármaco el Día 1 con titulación lenta.",
    "BREXPIPRAZOL-CUALQUIERA": "Suspender Brexpiprazol el Día 1. Iniciar nuevo fármaco el Día 1.",
    "ARIPIPRAZOL-CUALQUIERA": "Opción A: Stop Día 1. Opción B: Reducir al 50% el Día 1 y Stop el Día 14.",
    "RISPERIDONA-PALIPERIDONA": "Cambio directo a dosis equivalente el Día 1.",
    "QUETIAPINA-CUALQUIERA": "Si >300mg e IR: Reducir 25% cada 4 días (Stop día 13). Si MR: 50% una semana y Stop.",
    "ESTANDAR": "Reducir origen al 50% el Día 1. Suspender tras 7 días de solapamiento."
};

function ejecutarCalculo() {
    const selectorOrig = document.getElementById('f_orig');
    const selectorDest = document.getElementById('f_dest');
    const inputDosis = document.getElementById('d_orig');
    
    const o = dbCalc.find(f => f.farmaco === selectorOrig.value);
    const d = dbCalc.find(f => f.farmaco === selectorDest.value);
    const dosisO = parseFloat(inputDosis.value);
    
    if (!dosisO) return alert("Por favor, introduce una dosis válida");

    // 1. Cálculo Equivalencia Maudsley
    let Maudsley = (dosisO / o.factor) * d.factor;
    
    const resBox = document.getElementById('res-box');
    const resVal = document.getElementById('res-val');
    const resAlert = document.getElementById('res-alert');
    const resTip = document.getElementById('res-tip');

    resBox.style.display = 'block';
    
    // 2. Lógica de Colores (Semáforo)
    if (Maudsley > d.max) {
        resBox.style.background = '#fee2e2'; // Rojo
        resAlert.innerText = "ALERTA: EXCEDE DOSIS MÁXIMA";
        resAlert.style.color = "#b91c1c";
    } else if (Maudsley > d.ed95) {
        resBox.style.background = '#fef3c7'; // Amarillo
        resAlert.innerText = "AVISO: SUPERIOR A EFICACIA MÁXIMA (ED95)";
        resAlert.style.color = "#b45309";
    } else {
        resBox.style.background = '#dcfce7'; // Verde
        resAlert.innerText = "RANGO DE DOSIS ESTÁNDAR";
        resAlert.style.color = "#15803d";
    }

    resVal.innerText = Maudsley.toFixed(1) + " mg/día";

    // 3. Obtener consejo INTEGRATE
    const key = `${o.farmaco}-${d.farmaco}`.toUpperCase();
    const keyGen = `${o.farmaco}-CUALQUIERA`.toUpperCase();
    let tip = MATRIZ_INTEGRATE[key] || MATRIZ_INTEGRATE[keyGen] || MATRIZ_INTEGRATE["ESTANDAR"];

    // Regla de dosis baja
    if (dosisO <= o.umbral && !MATRIZ_INTEGRATE[key]) {
        tip = "Dosis baja de origen: Se recomienda cambio directo (Stop/Start) el Día 1.";
    }

    resTip.innerHTML = `<strong>Estrategia de Cambio:</strong><br>${tip}`;
}
