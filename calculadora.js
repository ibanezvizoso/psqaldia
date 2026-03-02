/* =====================================================
   MOTOR VISUAL DE SWITCH APS
===================================================== */

window.traducirInstrucciones = function(rawString, dosisActual, nombreDestino, targetMg) {

    if (!rawString || rawString.trim() === "")
        return `<div style="opacity:0.6;">No hay pauta automática definida.</div>`;

    const pasos = rawString
        .split('|')
        .map(p => p.trim())
        .filter(Boolean);

    const timeline = {};

    pasos.forEach(p => {

        const partes = p.split(':');
        if (partes.length < 3) return;

        const diaNum = partes[0].replace('D', '').trim();
        const sujeto = partes[1];
        const accion = partes[2];
        const valor = partes[3] || null;

        if (!timeline[diaNum]) {
            timeline[diaNum] = { ACTUAL: [], NUEVO: [] };
        }

        let texto = "";

        /* =========================
           FÁRMACO ACTUAL
        ========================== */

        if (sujeto === "ACTUAL") {

            if (accion === "STOP")
                texto = "Suspender completamente";

            if (accion === "REDUCIR")
                texto = `Reducir al ${valor}`;

            if (accion === "MANTENER")
                texto = "Mantener dosis actual";

            if (texto) timeline[diaNum].ACTUAL.push(texto);
        }

        /* =========================
           FÁRMACO NUEVO
        ========================== */

        if (sujeto === "NUEVO") {

            if (accion === "INICIAR") {

                if (valor === "TARGET") {
                    texto = `Alcanzar dosis objetivo (${targetMg.toFixed(1)} mg)`;
                } else {
                    texto = `Ajustar a ${valor}`;
                }
            }

            if (accion === "SUBIR") {

                if (valor === "TARGET") {
                    texto = `Alcanzar dosis objetivo (${targetMg.toFixed(1)} mg)`;
                } else {
                    texto = `Subir a ${valor}`;
                }
            }

            if (accion === "TITULAR_PROGRESIVO") {
                texto = `Desde este día, titulación progresiva hasta ${targetMg.toFixed(1)} mg`;
            }

            if (texto) timeline[diaNum].NUEVO.push(texto);
        }

    });

    /* =========================
       RENDER VISUAL
    ========================== */

    let html = `<div style="margin-top:20px;display:flex;flex-direction:column;gap:16px;">`;

    Object.keys(timeline)
        .sort((a,b)=>parseInt(a)-parseInt(b))
        .forEach(dia => {

            html += `
            <div style="
                border:1px solid rgba(0,0,0,0.08);
                border-radius:18px;
                padding:18px;
                background:white;
            ">
                <div style="font-size:0.75rem;font-weight:800;opacity:0.6;margin-bottom:14px;">
                    Día ${dia}
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">

                    <div style="
                        background:#fff1f2;
                        border:1px solid #fecdd3;
                        padding:14px;
                        border-radius:14px;
                    ">
                        <div style="font-weight:800;margin-bottom:8px;">
                            Fármaco de origen
                        </div>
                        ${
                            timeline[dia].ACTUAL.length
                                ? timeline[dia].ACTUAL.map(t=>`<div style="margin-bottom:6px;">• ${t}</div>`).join('')
                                : `<div style="opacity:0.35;">—</div>`
                        }
                    </div>

                    <div style="
                        background:#f0fdf4;
                        border:1px solid #bbf7d0;
                        padding:14px;
                        border-radius:14px;
                    ">
                        <div style="font-weight:800;margin-bottom:8px;">
                            ${nombreDestino}
                        </div>
                        ${
                            timeline[dia].NUEVO.length
                                ? timeline[dia].NUEVO.map(t=>`<div style="margin-bottom:6px;">• ${t}</div>`).join('')
                                : `<div style="opacity:0.35;">—</div>`
                        }
                    </div>

                </div>
            </div>
            `;
        });

    html += `</div>`;

    return html;
};


/* =====================================================
   FUNCIÓN DE CÁLCULO COMPLETA
===================================================== */

window.ejecutarCalculo = function() {

    const fOrigName = document.getElementById('f_orig').value;
    const fDestName = document.getElementById('f_dest').value;
    const dosisO = parseFloat(document.getElementById('d_orig').value);

    const oIndex = window.dbCalc.findIndex(f => f.farmaco === fOrigName);
    const dIndex = window.dbCalc.findIndex(f => f.farmaco === fDestName);

    const o = window.dbCalc[oIndex];
    const d = window.dbCalc[dIndex];

    if (!dosisO || isNaN(dosisO) || !o || !d) {
        alert("Por favor, introduce una dosis válida.");
        return;
    }

    /* =========================
       CÁLCULO MAUDSLEY
    ========================== */

    let Maudsley = (dosisO / o.factor) * d.factor;
    let porcentajeRango = (dosisO / o.max) * 100;
    let dosisRango = (porcentajeRango / 100) * d.max;

    /* =========================
       ALERTAS
    ========================== */

    let bgColor = "";
    let textColor = "";
    let alertText = "";

    if (Maudsley > d.max) {
        bgColor = '#fee2e2';
        textColor = "#b91c1c";
        alertText = "⚠️ EXCEDE DOSIS MÁXIMA";
    } else if (Maudsley > d.ed95) {
        bgColor = '#fef3c7';
        textColor = "#b45309";
        alertText = "⚠️ SUPERIOR A ED95";
    } else {
        bgColor = '#dcfce7';
        textColor = "#15803d";
        alertText = "✅ RANGO ESTÁNDAR";
    }

    const resBox = document.getElementById('res-box');
    const resVal = document.getElementById('res-val');
    const resTip = document.getElementById('res-tip');

    resBox.style.display = 'block';
    resBox.style.background = bgColor;

    resVal.innerHTML = `
        <div style="background:white;padding:1.5rem;border-radius:1.2rem;text-align:center;">
            <div style="font-size:0.75rem;font-weight:800;opacity:0.6;margin-bottom:8px;">
                Dosis equivalente estimada
            </div>
            <div style="font-size:2.8rem;font-weight:900;">
                ${Maudsley.toFixed(1)} mg/día
            </div>
            <div style="margin-top:12px;font-weight:800;color:${textColor};">
                ${alertText}
            </div>
        </div>
    `;

    /* =========================
       LECTURA CORRECTA DEL SHEET
    ========================== */

    // dbRaw debe contener la hoja completa incluyendo cabeceras
    // Primera fila = cabecera
    // Primera columna = nombre fármaco

    const rawInstruction =
        window.dbRaw[oIndex + 1][dIndex + 6]; 
        // +1 por cabecera
        // +6 porque las instrucciones empiezan en columna G

    const timelineHTML =
        window.traducirInstrucciones(rawInstruction, dosisO, fDestName, Maudsley);

    resTip.innerHTML = `
        <div style="margin-top:20px;">
            <div style="font-size:0.75rem;font-weight:800;opacity:0.6;margin-bottom:10px;">
                Estrategia de Cambio
            </div>
            ${timelineHTML}
        </div>
    `;
};
