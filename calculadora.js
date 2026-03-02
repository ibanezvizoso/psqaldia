/* =========================================================
   MOTOR DE SWITCH PSQALDÍA – VERSION LIMPIA Y ROBUSTA
   ========================================================= */

/* ------------------------------
   PARSER DE CONDICIONALES
--------------------------------*/

function resolverCondicional(rawString, dosisActual) {
    if (!rawString) return "";

    let bloques = rawString.split('|').map(b => b.trim()).filter(Boolean);
    let resultado = [];

    for (let bloque of bloques) {

        if (bloque.startsWith("IF_ACTUAL_")) {
            // Ejemplo: IF_ACTUAL_<5mg:D1:ACTUAL:STOP
            const match = bloque.match(/IF_ACTUAL_([<>]=?)(\d+)mg:(.+)/);

            if (match) {
                const operador = match[1];
                const valor = parseFloat(match[2]);
                const resto = match[3];

                let cumple = false;

                if (operador === "<") cumple = dosisActual < valor;
                if (operador === ">") cumple = dosisActual > valor;
                if (operador === "<=") cumple = dosisActual <= valor;
                if (operador === ">=") cumple = dosisActual >= valor;

                if (cumple) resultado.push(resto);
            }

        } else {
            resultado.push(bloque);
        }
    }

    return resultado;
}

/* ------------------------------
   TRADUCTOR A ESTRUCTURA POR DÍAS
--------------------------------*/

window.traducirInstrucciones = function(rawString, dosisActual, nombreDestino, targetMg) {

    if (!rawString || rawString.trim() === "")
        return `<div style="opacity:0.7;">No hay pauta específica definida.</div>`;

    const pasosProcesados = resolverCondicional(rawString, dosisActual);

    if (!pasosProcesados.length)
        return `<div style="opacity:0.7;">Dosis fuera de rango de pauta automática.</div>`;

    // Estructura por día
    const timeline = {};

    pasosProcesados.forEach(p => {
        const partes = p.split(':');

        if (partes.length < 3) return;

        const dia = partes[0].replace('D', '');
        const sujeto = partes[1];
        const accion = partes[2];
        const valor = partes[3] || null;

        if (!timeline[dia]) {
            timeline[dia] = {
                ACTUAL: [],
                NUEVO: []
            };
        }

        let texto = "";

        /* ----- ACCIONES ORIGEN ----- */
        if (sujeto === "ACTUAL") {

            if (accion === "STOP")
                texto = "Suspender completamente";

            if (accion === "REDUCIR")
                texto = `Reducir al ${valor}`;

            if (accion === "MANTENER")
                texto = "Mantener dosis actual";

            timeline[dia].ACTUAL.push(texto);
        }

        /* ----- ACCIONES NUEVO ----- */
        if (sujeto === "NUEVO") {

            if (accion === "INICIAR") {
                if (valor === "TARGET") {
                    texto = `Iniciar directamente a dosis objetivo (${targetMg.toFixed(1)} mg)`;
                } else {
                    texto = `Iniciar a ${valor}`;
                }
            }

            if (accion === "TITULAR_PROGRESIVO")
                texto = `Iniciar titulación progresiva hasta ${targetMg.toFixed(1)} mg`;

            if (accion === "SUBIR")
                texto = `Subir a ${valor}`;

            timeline[dia].NUEVO.push(texto);
        }

    });

    /* ------------------------------
       RENDER VISUAL
    --------------------------------*/

    let html = `
    <div style="margin-top:20px; display:flex; flex-direction:column; gap:12px;">
    `;

    Object.keys(timeline)
        .sort((a,b)=>parseInt(a)-parseInt(b))
        .forEach(dia => {

            html += `
            <div style="
                border:1px solid rgba(0,0,0,0.08);
                border-radius:16px;
                padding:14px;
                background:white;
                box-shadow:0 2px 8px rgba(0,0,0,0.04);
            ">
                <div style="
                    font-size:0.75rem;
                    font-weight:800;
                    text-transform:uppercase;
                    margin-bottom:10px;
                    opacity:0.6;
                ">
                    Día ${dia}
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    
                    <div style="
                        background:#fff1f2;
                        border:1px solid #fecdd3;
                        padding:10px;
                        border-radius:12px;
                        font-size:0.85rem;
                    ">
                        <div style="font-weight:700; margin-bottom:6px;">Fármaco de origen</div>
                        ${timeline[dia].ACTUAL.length 
                            ? timeline[dia].ACTUAL.map(t=>`<div>• ${t}</div>`).join('')
                            : `<div style="opacity:0.4;">—</div>`}
                    </div>

                    <div style="
                        background:#f0fdf4;
                        border:1px solid #bbf7d0;
                        padding:10px;
                        border-radius:12px;
                        font-size:0.85rem;
                    ">
                        <div style="font-weight:700; margin-bottom:6px;">${nombreDestino}</div>
                        ${timeline[dia].NUEVO.length 
                            ? timeline[dia].NUEVO.map(t=>`<div>• ${t}</div>`).join('')
                            : `<div style="opacity:0.4;">—</div>`}
                    </div>

                </div>
            </div>
            `;
        });

    html += `</div>`;

    return html;
};


/* =========================================================
   FUNCIÓN PRINCIPAL DE CÁLCULO
   ========================================================= */

window.ejecutarCalculo = function() {

    const fOrigName = document.getElementById('f_orig').value;
    const fDestName = document.getElementById('f_dest').value;
    const dosisO = parseFloat(document.getElementById('d_orig').value);

    const oIndex = window.dbCalc.findIndex(f => f.farmaco === fOrigName);
    const o = window.dbCalc[oIndex];
    const d = window.dbCalc.find(f => f.farmaco === fDestName);

    const dColIndex = 6 + window.dbCalc.findIndex(f => f.farmaco === fDestName);

    if (!dosisO || isNaN(dosisO) || !o || !d) {
        alert("Introduce una dosis válida.");
        return;
    }

    /* --- CÁLCULO MAUDSLEY --- */
    let Maudsley = (dosisO / o.factor) * d.factor;

    let bgColor = Maudsley > d.max ? '#fee2e2'
                 : (Maudsley > d.ed95 ? '#fef3c7'
                 : '#dcfce7');

    let textColor = Maudsley > d.max ? '#b91c1c'
                   : (Maudsley > d.ed95 ? '#b45309'
                   : '#15803d');

    let alertText = Maudsley > d.max
        ? "⚠️ EXCEDE DOSIS MÁXIMA"
        : "✅ RANGO ESTÁNDAR";

    const resBox = document.getElementById('res-box');
    const resVal = document.getElementById('res-val');
    const resTip = document.getElementById('res-tip');

    resBox.style.display = 'block';
    resBox.style.background = bgColor;

    resVal.innerHTML = `
        <div style="text-align:center;">
            <div style="font-size:0.75rem; font-weight:800; opacity:0.6;">
                Dosis equivalente (Maudsley)
            </div>
            <div style="font-size:2.8rem; font-weight:900;">
                ${Maudsley.toFixed(1)} mg/día
            </div>
            <div style="
                margin-top:10px;
                font-size:0.75rem;
                font-weight:800;
                color:${textColor};
            ">
                ${alertText}
            </div>
        </div>
    `;

    const rawInstruction = window.dbRaw[oIndex + 1][dColIndex];

    const tipTraducido = window.traducirInstrucciones(
        rawInstruction,
        dosisO,
        fDestName,
        Maudsley
    );

    resTip.innerHTML = `
        <div style="margin-top:20px;">
            <div style="
                font-size:0.75rem;
                font-weight:800;
                text-transform:uppercase;
                opacity:0.6;
                margin-bottom:10px;
            ">
                Estrategia automática de cambio
            </div>
            ${tipTraducido}
        </div>
    `;
};
