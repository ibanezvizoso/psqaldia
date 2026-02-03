/**
 * MOTOR LÓGICO DE LA CALCULADORA PSQALDÍA
 */

const PERFILES = {
    "Haloperidol": "#f1f5f9", // FGA - Gris claro
    "Risperidona": "#e0f2fe", // SGA Alta Potencia - Azul muy claro
    "Paliperidona": "#e0f2fe",
    "Lurasidona": "#e0f2fe",
    "Ziprasidona": "#e0f2fe",
    "Olanzapina": "#fef3c7",  // SGA MARTA - Amarillento claro
    "Quetiapina": "#fef3c7",
    "Amisulprida": "#dcfce7", // D2/D3 Selectivo - Verde muy claro
    "Aripiprazol": "#fae8ff", // Agonista Parcial - Púrpura muy claro
    "Brexpiprazol": "#fae8ff",
    "Cariprazina": "#fae8ff"
};

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

    // Aplicar color de perfil a los selectores para feedback visual
    document.getElementById('f_orig').style.backgroundColor = PERFILES[fOrigName] || 'white';
    document.getElementById('f_dest').style.backgroundColor = PERFILES[fDestName] || 'white';

    // 1. CÁLCULO DE EQUIVALENCIA
    let Maudsley = (dosisO / o.factor) * d.factor;
    
    const resBox = document.getElementById('res-box');
    const resVal = document.getElementById('res-val');
    const resAlert = document.getElementById('res-alert');
    const resTip = document.getElementById('res-tip');

    resBox.style.display = 'block';
    
    // 2. LÓGICA DE SEGURIDAD (Semáforo de fondo)
    let mensajeSeguridad = "";
    
    if (Maudsley > d.max) {
        resBox.style.borderLeft = "8px solid #b91c1c";
        mensajeSeguridad = `⚠️ <b>ALERTA:</b> La dosis equivalente supera la <b>Dosis Máxima</b> autorizada en Ficha Técnica (${d.max}mg).`;
    } 
    else if (Maudsley > d.ed95) {
        resBox.style.borderLeft = "8px solid #b45309";
        mensajeSeguridad = `ℹ️ <b>AVISO:</b> Dosis superior a la <b>ED95</b> (${d.ed95}mg). Según la evidencia, por encima de este nivel no suele haber mayor eficacia.`;
    } 
    else if (Maudsley < d.min) {
        resBox.style.borderLeft = "8px solid #475569";
        mensajeSeguridad = `🔍 <b>INFO:</b> Dosis por debajo del <b>Mínimo Efectivo</b> recomendado para un primer episodio psicótico (${d.min}mg).`;
    } 
    else {
        resBox.style.borderLeft = "8px solid #15803d";
        mensajeSeguridad = `✅ <b>RANGO ÓPTIMO:</b> Dosis dentro del rango terapéutico estándar (entre ${d.min}mg y ${d.ed95}mg).`;
    }

    // Color de fondo del cuadro basado en el perfil del fármaco DESTINO
    resBox.style.backgroundColor = PERFILES[fDestName] || 'var(--card)';

    // 3. RENDERIZADO
    resVal.innerText = Maudsley.toFixed(1) + " mg/día";
    resAlert.innerHTML = mensajeSeguridad;

    // 4. ESTRATEGIA INTEGRATE
    const key = `${o.farmaco}-${d.farmaco}`.toUpperCase();
    const keyGen = `${o.farmaco}-CUALQUIERA`.toUpperCase();
    let tip = MATRIZ_INTEGRATE[key] || MATRIZ_INTEGRATE[keyGen] || MATRIZ_INTEGRATE["ESTANDAR"];

    if (dosisO <= o.umbral && !MATRIZ_INTEGRATE[key]) {
        tip = "Dosis baja de origen: Se recomienda cambio directo (Stop/Start) el Día 1.";
    }

    resTip.innerHTML = `<div style="margin-top:10px; border-top:1px solid rgba(0,0,0,0.1); padding-top:10px;">
        <b>Estrategia de Cambio (INTEGRATE):</b><br>${tip}
    </div>`;
}
