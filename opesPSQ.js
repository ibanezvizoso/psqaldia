// opesPSQ.js - Gestión unificada de exámenes OPE Psiquiatría
let preguntasExamen = [];
let respuestasUsuario = {};
let preguntasVisibles = 20;
let añoActual = "";

// Intentamos obtener la URL del worker desde el index, si no, usamos la de producción
const BASE_WORKER_URL = window.WORKER_URL || "https://psqaldia-worker.psqaldia.workers.dev/";

/**
 * Pantalla inicial: Selector de año
 * Se ejecuta al pulsar la tarjeta en el index
 */
function openExamenSelector() {
    const modalData = document.getElementById('modalData');
    const modal = document.getElementById('modal');
    
    // Forzamos que el modal se vea por si acaso
    if (modal) modal.style.display = 'flex';

    modalData.innerHTML = `
        <div style="padding: 2.5rem 1.5rem; text-align: center; max-width: 500px; margin: auto;">
            <div style="margin-bottom: 2.5rem;">
                <i class="fas fa-file-alt fa-3x" style="color: var(--primary); margin-bottom: 1rem; opacity: 0.8;"></i>
                <h2 style="color: var(--text-main); font-weight: 900; margin: 0; font-size: 1.8rem;">OPE Psiquiatría</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.5rem;">Selecciona el año del examen</p>
            </div>
            
            <div style="display: grid; gap: 15px;">
                <button onclick="iniciarExamen('22')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <div>
                        <b style="display: block; color: var(--text-main); font-size: 1.1rem;">Examen 2022</b>
                        <small style="color: var(--text-muted);">Pestaña: Ope_PSQ22</small>
                    </div>
                    <i class="fas fa-chevron-right" style="color: var(--primary);"></i>
                </button>

                <button onclick="iniciarExamen('20')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <div>
                        <b style="display: block; color: var(--text-main); font-size: 1.1rem;">Examen 2020</b>
                        <small style="color: var(--text-muted);">Pestaña: Ope_PSQ20</small>
                    </div>
                    <i class="fas fa-chevron-right" style="color: var(--primary);"></i>
                </button>
            </div>

            <p style="margin-top: 3rem; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 2px; font-weight: 800;">Psicofármacos & Psiquiatría</p>
        </div>
    `;
}

/**
 * Carga de datos desde el Worker
 */
async function iniciarExamen(año) {
    añoActual = año;
    preguntasVisibles = 20;
    respuestasUsuario = {};
    
    const pestaña = `Ope_PSQ${año}`;
    const url = `${BASE_WORKER_URL}?sheet=${pestaña}`;

    const modalData = document.getElementById('modalData');
    modalData.innerHTML = `
        <div style="padding:5rem; text-align:center;">
            <i class="fas fa-circle-notch fa-spin fa-2x" style="color:var(--primary);"></i>
            <br><br><b style="color:var(--text-main);">Cargando Examen 20${año}...</b>
        </div>`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) throw new Error(data.details || data.error);
        if (!data.values) throw new Error(`No se encontraron preguntas en ${pestaña}`);

        // Limpiamos y procesamos filas (suponiendo: 0:Preg, 1-4:Opciones, 5:Correcta, 6:Expl)
        preguntasExamen = data.values
            .filter(row => row[0] && row[0].trim() !== "")
            .map(row => ({
                pregunta: (row[0] || "").trim(),
                opciones: [(row[1] || "").trim(), (row[2] || "").trim(), (row[3] || "").trim(), (row[4] || "").trim()],
                correcta: (row[5] || "").trim().toUpperCase(),
                explicacion: (row[6] || "No hay explicación disponible.").trim()
            }));

        renderizarExamen();
    } catch (error) {
        console.error("Error al cargar examen:", error);
        modalData.innerHTML = `
            <div style="padding:3rem; text-align:center;">
                <i class="fas fa-exclamation-triangle fa-2x" style="color:#ef4444; margin-bottom:1rem;"></i>
                <p style="color:var(--text-main); font-weight:700;">Error al cargar el examen</p>
                <small style="color:var(--text-muted);">${error.message}</small>
                <br><br>
                <button onclick="openExamenSelector()" class="btn" style="background:var(--border); color:var(--text-main);">Volver al selector</button>
            </div>`;
    }
}

/**
 * Renderizado de la interfaz del examen
 */
function renderizarExamen() {
    const container = document.getElementById('modalData');
    let html = `
        <div style="padding:1.5rem; max-width:800px; margin:auto;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:2rem; border-bottom: 2px solid var(--border); padding-bottom:1.5rem;">
                <div>
                    <h2 style="margin:0; font-weight:900; color:var(--primary); font-size:1.6rem;">OPE 20${añoActual}</h2>
                    <p style="margin:5px 0 0; font-size:0.85rem; font-weight:700; color:var(--text-muted); text-transform:uppercase;">
                        Preguntas cargadas: <span id="contador-preg">${Math.min(preguntasVisibles, preguntasExamen.length)}</span> de ${preguntasExamen.length}
                    </p>
                </div>
                <button onclick="openExamenSelector()" style="background:var(--card); border:1px solid var(--border); color:var(--text-muted); padding:8px 12px; border-radius:10px; cursor:pointer; font-size:0.75rem; font-weight:800;">
                    <i class="fas fa-arrow-left"></i> CAMBIAR AÑO
                </button>
            </div>

            <div id="contenedor-preguntas">
                ${generarBloquePreguntas(0, preguntasVisibles)}
            </div>`;

    if (preguntasVisibles < preguntasExamen.length) {
        html += `<button id="btn-cargar-mas" onclick="cargarMasPreguntas()" style="width:100%; padding:1rem; margin-bottom:2rem; border-radius:15px; border:2px dashed var(--border); background:none; color:var(--text-muted); font-weight:800; cursor:pointer;">CARGAR MÁS PREGUNTAS...</button>`;
    }

    html += `
            <button onclick="corregirExamen()" class="btn btn-primary" style="width:100%; height:50px; border-radius:15px; font-size:1rem; margin-top:1rem; position:sticky; bottom:10px; z-index:100; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
                FINALIZAR Y CORREGIR TODO
            </button>
        </div>`;
    
    container.innerHTML = html;
}

function generarBloquePreguntas(inicio, fin) {
    let bloqueHtml = '';
    const listaSlice = preguntasExamen.slice(inicio, fin);

    listaSlice.forEach((p, i) => {
        const idx = inicio + i;
        bloqueHtml += `
            <div id="bloque-${idx}" style="margin-bottom:2.5rem; padding:1.5rem; background:var(--bg); border-radius:1.5rem; border:1px solid var(--border);">
                <p style="font-weight:700; font-size:1.05rem; line-height:1.4; margin-bottom:1.5rem; color:var(--text-main);"><span style="color:var(--primary); margin-right:8px;">#${idx + 1}</span> ${p.pregunta}</p>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${['A', 'B', 'C', 'D'].map((letra, oIdx) => `
                        <label style="display:flex; align-items:center; gap:12px; padding:15px; background:var(--card); border:1px solid var(--border); border-radius:12px; cursor:pointer; color:var(--text-main);">
                            <input type="radio" name="preg-${idx}" value="${letra}" onclick="respuestasUsuario[${idx}] = '${letra}'">
                            <span style="font-size:0.95rem;">${p.opciones[oIdx]}</span>
                        </label>
                    `).join('')}
                </div>
                
                <button onclick="revelarIndividual(${idx})" style="margin-top:1.5rem; background:none; border:none; color:var(--text-muted); font-weight:800; font-size:0.7rem; text-transform:uppercase; cursor:pointer; display:flex; align-items:center; gap:5px;">
                    <i class="fas fa-lightbulb"></i> Ver respuesta y explicación
                </button>

                <div id="feedback-${idx}" style="display:none; margin-top:1.2rem; padding:1.2rem; background:var(--card); border-left:4px solid var(--primary); border-radius:12px; font-size:0.9rem; color:var(--text-main);">
                    <strong style="color:var(--primary); display:block; margin-bottom:8px; font-weight:900;">RESPUESTA CORRECTA: ${p.correcta}</strong>
                    <div style="opacity:0.9; line-height:1.5;">${p.explicacion}</div>
                </div>
            </div>`;
    });
    return bloqueHtml;
}

function cargarMasPreguntas() {
    const inicio = preguntasVisibles;
    preguntasVisibles = Math.min(preguntasVisibles + 20, preguntasExamen.length);
    
    const nuevoBloque = generarBloquePreguntas(inicio, preguntasVisibles);
    document.getElementById('contenedor-preguntas').insertAdjacentHTML('beforeend', nuevoBloque);
    document.getElementById('contador-preg').innerText = preguntasVisibles;

    if (preguntasVisibles >= preguntasExamen.length) {
        document.getElementById('btn-cargar-mas').style.display = 'none';
    }
}

function revelarIndividual(idx) {
    const fb = document.getElementById(`feedback-${idx}`);
    if (fb) fb.style.display = (fb.style.display === 'none') ? 'block' : 'none';
}

function corregirExamen() {
    let aciertos = 0;
    let contestadas = Object.keys(respuestasUsuario).length;

    preguntasExamen.forEach((p, idx) => {
        const bloque = document.getElementById(`bloque-${idx}`);
        const feedback = document.getElementById(`feedback-${idx}`);
        
        if (bloque && feedback) {
            feedback.style.display = 'block';
            if (respuestasUsuario[idx] === p.correcta) {
                aciertos++;
                bloque.style.borderColor = '#22c55e';
                bloque.style.background = 'rgba(34, 197, 94, 0.05)';
            } else if (respuestasUsuario[idx]) {
                bloque.style.borderColor = '#ef4444';
                bloque.style.background = 'rgba(239, 68, 68, 0.05)';
            }
        }
    });
    alert(`Resultado OPE 20${añoActual}:\n\nHas acertado ${aciertos} de ${preguntasExamen.length} preguntas.\nContestadas: ${contestadas}`);
    document.querySelector('.modal-content').scrollTo({top: 0, behavior: 'smooth'});
}
