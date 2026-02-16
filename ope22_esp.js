    // ope22_esp.js
let preguntasExamenEsp = [];
let respuestasUsuarioEsp = {};
let preguntasVisibles = 20; // Bloque inicial

async function openExamenEspUI() {
    preguntasVisibles = 20; // Reiniciamos el contador al abrir
    const RANGO = 'Ope_Esp22!A2:G150'; 
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGO}?key=${API_KEY}`;

    const modalData = document.getElementById('modalData');
    modalData.innerHTML = `<div style="padding:3rem; text-align:center;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:var(--primary);"></i><br><br><b style="color:var(--text-main);">Optimizando 110 preguntas...</b></div>`;
    document.getElementById('modal').style.display = 'flex';

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (!data.values) throw new Error("No hay datos");

        preguntasExamenEsp = data.values
            .filter(row => row[0] && row[0].trim() !== "")
            .map(row => ({
                pregunta: (row[0] || "").trim(),
                opciones: [(row[1]||"").trim(), (row[2]||"").trim(), (row[3]||"").trim(), (row[4]||"").trim()],
                correcta: (row[5] || "").trim().toUpperCase(), 
                explicacion: (row[6] || "No hay explicación disponible.").trim()
            }));

        renderizarExamenEsp();
    } catch (error) {
        modalData.innerHTML = `<div style="padding:2rem; text-align:center;">Error de carga.</div>`;
    }
}

function renderizarExamenEsp() {
    const container = document.getElementById('modalData');
    
    let html = `
        <div style="padding:1.5rem; max-width:800px; margin:auto;">
            <div style="margin-bottom:2rem; border-bottom: 2px solid var(--border); padding-bottom:1.5rem;">
                <h2 style="margin:0; font-weight:900; color:var(--primary); font-size:1.6rem;">OPE PSIQUIATRÍA 2022</h2>
                <p style="margin:5px 0 0; font-size:0.85rem; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Cargadas <span id="contador-preg">${preguntasVisibles}</span> de ${preguntasExamenEsp.length} preguntas</p>
            </div>
            <div id="contenedor-preguntas-esp">`;

    // Solo renderizamos hasta el límite de preguntasVisibles
    html += generarBloquePreguntas(0, preguntasVisibles);

    html += `</div>`; // Cierre de contenedor-preguntas-esp

    // Botón para cargar más si quedan
    if (preguntasVisibles < preguntasExamenEsp.length) {
        html += `<button id="btn-cargar-mas" onclick="cargarMasPreguntas()" style="width:100%; padding:1rem; margin-bottom:2rem; border-radius:15px; border:2px dashed var(--border); background:none; color:var(--text-muted); font-weight:800; cursor:pointer;">CARGAR 20 MÁS...</button>`;
    }

    html += `
            <button onclick="corregirExamenEsp()" class="btn btn-primary" style="width:100%; height:50px; border-radius:15px; font-size:1rem; margin-top:1rem; position:sticky; bottom:10px; z-index:100;">
                FINALIZAR Y CORREGIR TODO
            </button>
        </div>`;
    
    container.innerHTML = html;
}

function generarBloquePreguntas(inicio, fin) {
    let bloqueHtml = '';
    const listaSlice = preguntasExamenEsp.slice(inicio, fin);

    listaSlice.forEach((p, i) => {
        const realIndex = inicio + i;
        bloqueHtml += `
            <div id="bloque-esp-${realIndex}" style="margin-bottom:2.5rem; padding:1.5rem; background:var(--bg); border-radius:1.5rem; border:1px solid var(--border);">
                <p style="font-weight:700; font-size:1.05rem; line-height:1.4; margin-bottom:1.5rem; color:var(--text-main);">${p.pregunta}</p>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${['A', 'B', 'C', 'D'].map((letra, idx) => `
                        <label style="display:flex; align-items:center; gap:12px; padding:15px; background:var(--card); border:1px solid var(--border); border-radius:12px; cursor:pointer; color:var(--text-main);">
                            <input type="radio" name="preg-esp-${realIndex}" value="${letra}" style="accent-color:var(--primary); width:18px; height:18px;" onclick="respuestasUsuarioEsp[${realIndex}] = '${letra}'">
                            <span style="font-size:0.95rem;">${p.opciones[idx]}</span>
                        </label>
                    `).join('')}
                </div>
                <button onclick="revelarIndividualEsp(${realIndex})" style="margin-top:1.5rem; background:none; border:none; color:var(--text-muted); font-weight:800; font-size:0.7rem; text-transform:uppercase; cursor:pointer;">
                    <i class="fas fa-lightbulb"></i> Ver explicación
                </button>
                <div id="feedback-esp-${realIndex}" style="display:none; margin-top:1.2rem; padding:1.2rem; background:var(--card); border-left:4px solid var(--primary); border-radius:12px; font-size:0.9rem;">
                    <strong style="color:var(--primary); display:block; margin-bottom:8px;">RESPUESTA CORRECTA: ${p.correcta}</strong>
                    ${p.explicacion}
                </div>
            </div>`;
    });
    return bloqueHtml;
}

function cargarMasPreguntas() {
    const inicio = preguntasVisibles;
    preguntasVisibles = Math.min(preguntasVisibles + 20, preguntasExamenEsp.length);
    
    const nuevoBloque = generarBloquePreguntas(inicio, preguntasVisibles);
    document.getElementById('contenedor-preguntas-esp').insertAdjacentHTML('beforeend', nuevoBloque);
    document.getElementById('contador-preg').innerText = preguntasVisibles;

    if (preguntasVisibles >= preguntasExamenEsp.length) {
        document.getElementById('btn-cargar-mas').style.display = 'none';
    }
}

// ... Mantén revelarIndividualEsp y corregirExamenEsp igual que antes
