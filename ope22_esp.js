// ope22_esp.js
let preguntasExamenEsp = [];
let respuestasUsuarioEsp = {};
let preguntasVisibles = 20;

async function openExamenEspUI() {
    preguntasVisibles = 20; 
    // Definimos solo la pestaña, el Worker ya se encarga del resto
    const pestaña = 'Ope_Esp22'; 
    const url = `${window.WORKER_URL}?sheet=${pestaña}`;

    const modalData = document.getElementById('modalData');
    modalData.innerHTML = `<div style="padding:3rem; text-align:center;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:var(--primary);"></i><br><br><b style="color:var(--text-main);">Cargando examen...</b></div>`;
    document.getElementById('modal').style.display = 'flex';

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Control de errores del Worker
        if (data.error) throw new Error(data.details || data.error);
        if (!data.values) throw new Error("No se encontraron preguntas en Ope_Esp22");

        preguntasExamenEsp = data.values
            .filter(row => row[0] && row[0].trim() !== "")
            .map(row => ({
                pregunta: (row[0] || "").trim(),
                opciones: [
                    (row[1] || "").trim(), 
                    (row[2] || "").trim(), 
                    (row[3] || "").trim(), 
                    (row[4] || "").trim()
                ],
                correcta: (row[5] || "").trim().toUpperCase(), 
                explicacion: (row[6] || "No hay explicación disponible.").trim()
            }));

        renderizarExamenEsp();
    } catch (error) {
        console.error("Error en Ope_Esp:", error);
        modalData.innerHTML = `<div style="padding:2.5rem; text-align:center; color:var(--text-main);">
            <i class="fas fa-exclamation-circle fa-2x" style="color:#ef4444; margin-bottom:1rem;"></i><br>
            Error al cargar el examen.<br>
            <small style="color:var(--text-muted);">${error.message}</small>
        </div>`;
    }
}

function renderizarExamenEsp() {
    const container = document.getElementById('modalData');
    let html = `
        <div style="padding:1.5rem; max-width:800px; margin:auto;">
            <div style="margin-bottom:2rem; border-bottom: 2px solid var(--border); padding-bottom:1.5rem;">
                <h2 style="margin:0; font-weight:900; color:var(--primary); font-size:1.6rem;">OPE PSIQUIATRÍA 2022</h2>
                <p style="margin:5px 0 0; font-size:0.85rem; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Preguntas cargadas: <span id="contador-preg">${preguntasVisibles}</span> de ${preguntasExamenEsp.length}</p>
            </div>
            <div id="contenedor-preguntas-esp">
                ${generarBloquePreguntas(0, preguntasVisibles)}
            </div>`;

    if (preguntasVisibles < preguntasExamenEsp.length) {
        html += `<button id="btn-cargar-mas" onclick="cargarMasPreguntas()" style="width:100%; padding:1rem; margin-bottom:2rem; border-radius:15px; border:2px dashed var(--border); background:none; color:var(--text-muted); font-weight:800; cursor:pointer;">CARGAR MÁS PREGUNTAS...</button>`;
    }

    html += `
            <button onclick="corregirExamenEsp()" class="btn btn-primary" style="width:100%; height:50px; border-radius:15px; font-size:1rem; margin-top:1rem; position:sticky; bottom:10px; z-index:100; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
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
                            <input type="radio" name="preg-esp-${realIndex}" value="${letra}" onclick="respuestasUsuarioEsp[${realIndex}] = '${letra}'">
                            <span style="font-size:0.95rem;">${p.opciones[idx]}</span>
                        </label>
                    `).join('')}
                </div>
                
                <button onclick="revelarIndividualEsp(${realIndex})" style="margin-top:1.5rem; background:none; border:none; color:var(--text-muted); font-weight:800; font-size:0.7rem; text-transform:uppercase; cursor:pointer; display:flex; align-items:center; gap:5px;">
                    <i class="fas fa-lightbulb"></i> Ver explicación
                </button>

                <div id="feedback-esp-${realIndex}" style="display:none; margin-top:1.2rem; padding:1.2rem; background:var(--card); border-left:4px solid var(--primary); border-radius:12px; font-size:0.9rem; color:var(--text-main);">
                    <strong style="color:var(--primary); display:block; margin-bottom:8px; font-weight:900;">RESPUESTA CORRECTA: ${p.correcta}</strong>
                    <div style="opacity:0.9; line-height:1.5;">${p.explicacion}</div>
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

// Función de revelado corregida
function revelarIndividualEsp(idx) {
    const fb = document.getElementById(`feedback-esp-${idx}`);
    if (fb) {
        fb.style.display = (fb.style.display === 'none' || fb.style.display === '') ? 'block' : 'none';
    }
}

function corregirExamenEsp() {
    let aciertos = 0;
    preguntasExamenEsp.forEach((p, idx) => {
        const bloque = document.getElementById(`bloque-esp-${idx}`);
        const feedback = document.getElementById(`feedback-esp-${idx}`);
        
        // Si el bloque existe (ha sido cargado), lo marcamos
        if (bloque && feedback) {
            feedback.style.display = 'block';
            if (respuestasUsuarioEsp[idx] === p.correcta) {
                aciertos++;
                bloque.style.borderColor = '#22c55e';
                bloque.style.background = 'rgba(34, 197, 94, 0.05)';
            } else {
                bloque.style.borderColor = '#ef4444';
                bloque.style.background = 'rgba(239, 68, 68, 0.05)';
            }
        }
    });
    alert(`Examen finalizado.\n\nAciertos: ${aciertos} de ${preguntasExamenEsp.length}`);
    document.querySelector('.modal-content').scrollTo({top: 0, behavior: 'smooth'});
}
