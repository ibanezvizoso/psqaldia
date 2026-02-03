/**
 * MOTOR LÓGICO DE LA CALCULADORA PSQALDÍA 
 * Corrección de conversión y seguridad
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
    const dosisInput = document.getElementById('d_orig').value;
    const dosisO = parseFloat(dosisInput);
    
    // Validación de entrada
    if (!dosisInput || isNaN(dosisO) || dosisO <= 0) {
        alert("Por favor, introduce una dosis válida.");
        return;
    }

    // Acceso a datos globales
    const o = window.dbCalc.find(f => f.farmaco === fOrigName);
    const d = window.dbCalc.find(f => f.farmaco === fDestName);
    
    if (!o || !d) {
        alert("Error al cargar los datos de los fármacos. Revisa la pestaña Data_APS.");
        return;
    }

    // 1. CÁLCULO DE EQUIVALENCIA (Fórmula Maudsley)
    // DosisD = (DosisO / FactorO) * FactorD
    let Maudsley = (dosisO / o.factor) * d.factor;
    
    const resBox = document.getElementById('res-box');
    const resVal = document.getElementById('res-val');
    const resAlert = document.getElementById('res-alert');
    const resTip = document.getElementById('res-tip');

    // Reset de estilos y visibilidad
    resBox.style.display = 'block';
    resBox.style.padding = '1.5rem';
    resBox.style.marginTop = '1.5rem';
    resBox.style.borderRadius = '15px';
    resBox.style.backgroundColor = "var(--bg)"; 
    
    // 2. LÓGICA DE SEGURIDAD (Colores de Borde y Fondo)
    let mensajeSeguridad = "";
    let borderColor = "";

    if (Maudsley > d.max) {
        borderColor = "#ef4444"; // Rojo (Tailwind red-500)
        mensajeSeguridad = `⚠️ <b>ALERTA:</b> La dosis equivalente (${Maudsley.toFixed(1)}mg) supera la <b>Dosis Máxima</b> autorizada (${d.max}mg).`;
    } 
    else if (Maudsley > d.ed95) {
        borderColor = "#f59e0b"; // Ámbar (Tailwind amber-500)
        mensajeSeguridad = `ℹ️ <b>AVISO:</b> Dosis superior a la <b>ED95</b> (${d.ed95}mg). Por encima de este nivel no suele haber mayor eficacia, pero sí más efectos secundarios.`;
    } 
    else if (Maudsley < d.min) {
        borderColor = "#64748b"; // Gris (Tailwind slate-500)
        mensajeSeguridad = `🔍 <b>INFO:</b> Dosis por debajo del <b>Mínimo Efectivo</b> recomendado (${d.min}mg).`;
    } 
    else {
        borderColor = "#22c55e"; // Verde (Tailwind green-500)
        mensajeSeguridad = `✅ <b>RANGO ÓPTIMO:</b> Dosis dentro del rango terapéutico estándar (entre ${d.min}mg y ${d.ed95}mg).`;
    }

    // Aplicar el color de seguridad al borde izquierdo
    resBox.style.borderLeft = `8px solid ${borderColor}`;

    // 3. RENDERIZADO DE TEXTOS
    resVal.innerText = Maudsley.toFixed(1) + " mg/día";
    resVal.style.color = "var(--text-main)";
    resAlert.innerHTML = mensajeSeguridad;
    resAlert.style.color = "var(--text-main)";

    // 4. ESTRATEGIA DE CAMBIO (INTEGRATE)
    const key = `${o.farmaco}-${d.farmaco}`.toUpperCase();
    const keyGen = `${o.farmaco}-CUALQUIERA`.toUpperCase();
    let tip = MATRIZ_INTEGRATE[key] || MATRIZ_INTEGRATE[keyGen] || MATRIZ_INTEGRATE["ESTANDAR"];

    // Regla de dosis baja (Umbral)
    if (dosisO <= o.umbral && !MATRIZ_INTEGRATE[key]) {
        tip = "Dosis baja de origen: Se recomienda cambio directo (Stop/Start) el Día 1.";
    }

    resTip.innerHTML = `<div style="margin-top:15px; border-top:1px solid var(--border); padding-top:15px; color:var(--text-muted);">
        <b style="color:var(--text-main);">Estrategia de Cambio (INTEGRATE):</b><br>${tip}
    </div>`;
}
