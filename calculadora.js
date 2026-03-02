/* ============================================================
   CALCULADORA APS – MOTOR COMPLETO CORREGIDO
============================================================ */

(async function() {

    const container = document.getElementById("calc-container");
    if (!container) return;

    /* =========================
       1️⃣ ESTILOS AUTÓNOMOS
    ========================== */

    if (!document.getElementById('calc-internal-styles')) {

        const styleTag = document.createElement('style');
        styleTag.id = 'calc-internal-styles';

        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display:flex; flex-direction:column; gap:0.6rem; }
            .calc-ui label { font-size:0.75rem; font-weight:800; text-transform:uppercase; opacity:0.6; margin-top:0.8rem; }
            .calc-ui select, .calc-ui input {
                width:100%;
                padding:0.9rem;
                border-radius:1rem;
                border:2px solid #e5e7eb;
                font-size:1rem;
                box-sizing:border-box;
            }
            .calc-ui select:focus, .calc-ui input:focus {
                outline:none;
                border-color:#6366f1;
            }
            .res-container { margin-top:1.5rem; display:none; }
        `;
        document.head.appendChild(styleTag);
    }

    /* =========================
       2️⃣ CARGA DESDE WORKER
    ========================== */

    if (!window.dbCalc) {

        const pestaña = "Data_APS";

        const response = await fetch(`${window.WORKER_URL}?sheet=${pestaña}`);
        const data = await response.json();

        if (data.error) {
            container.innerHTML = "Error cargando datos";
            return;
        }

        window.dbRaw = data.values;

        window.dbCalc = data.values.slice(1).map(row => ({
            farmaco: row[0],
            factor: parseFloat(row[1]) || 1,
            ed95: parseFloat(row[2]) || 0,
            max: parseFloat(row[3]) || 0,
            min: parseFloat(row[4]) || 0,
            umbral: parseFloat(row[5]) || 0
        }));
    }

    const options = window.dbCalc
        .map(f => `<option value="${f.farmaco}">${f.farmaco}</option>`)
        .join('');

    /* =========================
       3️⃣ RENDER UI
    ========================== */

    container.innerHTML = `
        <div class="calc-ui">

            <h2>Calculadora APS</h2>

            <label>Fármaco Origen</label>
            <select id="f_orig">${options}</select>

            <label>Dosis actual (mg/día)</label>
            <input type="number" id="d_orig" placeholder="0">

            <label>Fármaco Destino</label>
            <select id="f_dest">${options}</select>

            <button onclick="ejecutarCalculo()" style="
                margin-top:1rem;
                padding:1rem;
                border-radius:1rem;
                border:none;
                background:#111827;
                color:white;
                font-weight:800;
                cursor:pointer;
            ">
                CALCULAR
            </button>

            <div id="res-box" class="res-container">
                <div id="res-val"></div>
                <div id="res-tip"></div>
            </div>

        </div>
    `;

})();

/* ============================================================
   4️⃣ PARSER DE INSTRUCCIONES
============================================================ */

window.traducirInstrucciones = function(rawString, targetMg, nombreDestino) {

    if (!rawString) return "";

    const pasos = rawString
        .split('|')
        .map(p => p.trim())
        .filter(Boolean);

    const timeline = {};

    pasos.forEach(p => {

        const partes = p.split(':');
        if (partes.length < 3) return;

        const dia = partes[0].replace('D','').trim();
        const sujeto = partes[1];
        const accion = partes[2];
        const valor = partes[3] || null;

        if (!timeline[dia]) {
            timeline[dia] = { ACTUAL: [], NUEVO: [] };
        }

        let texto = "";

        if (sujeto === "ACTUAL") {

            if (accion === "STOP")
                texto = "Suspender completamente";

            if (accion === "REDUCIR")
                texto = `Reducir al ${valor}`;

            if (accion === "MANTENER")
                texto = "Mantener dosis actual";

            if (texto) timeline[dia].ACTUAL.push(texto);
        }

        if (sujeto === "NUEVO") {

            if (accion === "INICIAR") {
                if (valor === "TARGET")
                    texto = `Alcanzar dosis objetivo (${targetMg.toFixed(1)} mg)`;
                else
                    texto = `Ajustar a ${valor}`;
            }

            if (accion === "SUBIR") {
                if (valor === "TARGET")
                    texto = `Alcanzar dosis objetivo (${targetMg.toFixed(1)} mg)`;
                else
                    texto = `Subir a ${valor}`;
            }

            if (accion === "TITULAR_PROGRESIVO") {
                texto = `Desde este día, titulación progresiva hasta ${targetMg.toFixed(1)} mg`;
            }

            if (texto) timeline[dia].NUEVO.push(texto);
        }

    });

    /* ===== RENDER VISUAL ===== */

    let html = `<div style="margin-top:20px;display:flex;flex-direction:column;gap:18px;">`;

    Object.keys(timeline)
        .sort((a,b)=>parseInt(a)-parseInt(b))
        .forEach(dia => {

            html += `
                <div style="border:1px solid #e5e7eb;border-radius:20px;padding:20px;background:white;">

                    <div style="font-weight:800;opacity:0.6;margin-bottom:15px;">
                        Día ${dia}
                    </div>

                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">

                        <div style="background:#fff1f2;border:1px solid #fecdd3;padding:14px;border-radius:14px;">
                            <div style="font-weight:800;margin-bottom:8px;">
                                Fármaco de origen
                            </div>
                            ${
                                timeline[dia].ACTUAL.length
                                ? timeline[dia].ACTUAL.map(t=>`<div style="margin-bottom:6px;">• ${t}</div>`).join('')
                                : `<div style="opacity:0.3;">—</div>`
                            }
                        </div>

                        <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:14px;border-radius:14px;">
                            <div style="font-weight:800;margin-bottom:8px;">
                                ${nombreDestino}
                            </div>
                            ${
                                timeline[dia].NUEVO.length
                                ? timeline[dia].NUEVO.map(t=>`<div style="margin-bottom:6px;">• ${t}</div>`).join('')
                                : `<div style="opacity:0.3;">—</div>`
                            }
                        </div>

                    </div>
                </div>
            `;
        });

    html += `</div>`;

    return html;
};

/* ============================================================
   5️⃣ FUNCIÓN PRINCIPAL
============================================================ */

window.ejecutarCalculo = function() {

    const fOrigName = document.getElementById('f_orig').value;
    const fDestName = document.getElementById('f_dest').value;
    const dosisO = parseFloat(document.getElementById('d_orig').value);

    const oIndex = window.dbCalc.findIndex(f => f.farmaco === fOrigName);
    const dIndex = window.dbCalc.findIndex(f => f.farmaco === fDestName);

    const o = window.dbCalc[oIndex];
    const d = window.dbCalc[dIndex];

    if (!dosisO || isNaN(dosisO) || !o || !d) {
        alert("Introduce una dosis válida");
        return;
    }

    /* ===== CÁLCULO ===== */

    const Maudsley = (dosisO / o.factor) * d.factor;

    const resBox = document.getElementById('res-box');
    const resVal = document.getElementById('res-val');
    const resTip = document.getElementById('res-tip');

    resBox.style.display = 'block';

    resVal.innerHTML = `
        <div style="background:#f9fafb;padding:20px;border-radius:20px;margin-top:20px;">
            <div style="font-size:0.75rem;font-weight:800;opacity:0.6;margin-bottom:6px;">
                Dosis equivalente (Maudsley)
            </div>
            <div style="font-size:2.5rem;font-weight:900;">
                ${Maudsley.toFixed(1)} mg/día
            </div>
        </div>
    `;

    /* ===== LEER INSTRUCCIÓN CORRECTA ===== */

    const rawInstruction = window.dbRaw[oIndex + 1][6 + dIndex];

    const timelineHTML = window.traducirInstrucciones(
        rawInstruction,
        Maudsley,
        fDestName
    );

    resTip.innerHTML = timelineHTML;
};
