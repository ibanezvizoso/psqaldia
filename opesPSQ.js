// opesPSQ.js - Gestión unificada de exámenes OPE Psiquiatría
let preguntasExamen = [];
let respuestasUsuario = {};
let preguntasVisibles = 20;
let añoActual = "";

/**
 * Pantalla inicial: Selector de año con nuevo modo Snack
 */
function openExamenSelector() {
    const modalData = document.getElementById('modalData');
    const modal = document.getElementById('modal');
    
    if (modal) modal.style.display = 'flex';

    modalData.innerHTML = `
        <div style="padding: 2.5rem 1.5rem; text-align: center; max-width: 500px; margin: auto;">
            <div style="margin-bottom: 2.5rem;">
                <i class="fas fa-file-alt fa-3x" style="color: var(--primary); margin-bottom: 1rem; opacity: 0.8;"></i>
                <h2 style="color: var(--text-main); font-weight: 900; margin: 0; font-size: 1.8rem;">OPE Psiquiatría</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.5rem;">Selecciona la convocatoria para comenzar</p>
            </div>
            
            <div style="display: grid; gap: 12px; margin-bottom: 2rem;">
                <button onclick="iniciarExamen('22')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <b style="color: var(--text-main); font-size: 1.1rem;">Convocatoria 2022</b>
                    <i class="fas fa-chevron-right" style="color: var(--primary);"></i>
                </button>

                <button onclick="iniciarExamen('20')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <b style="color: var(--text-main); font-size: 1.1rem;">Convocatoria 2020</b>
                    <i class="fas fa-chevron-right" style="color: var(--primary);"></i>
                </button>

                <button onclick="iniciarExamen('snack')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--primary); background: rgba(67, 56, 202, 0.1); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <div>
                        <b style="color: var(--primary); font-size: 1.1rem;">Snack</b>
                        <small style="display: block; color: var(--text-muted); font-size: 0.75rem;">(10 preguntas aleatorias de ambos años)</small>
                    </div>
                    <i class="fas fa-bolt" style="color: var(--primary);"></i>
                </button>
            </div>

            <button onclick="abrirPortalExamenes()" style="background: none; border: none; color: var(--text-muted); font-weight: 800; cursor: pointer; font-size: 0.8rem; letter-spacing: 1px;">
                <i class="fas fa-arrow-left"></i> VOLVER AL PORTAL
            </button>
        </div>
    `;
}

/**
 * Persistencia: Guardar y Cargar estado
 */
function guardarEstado() {
    const estado = {
        año: añoActual,
        preguntas: preguntasExamen,
        respuestas: respuestasUsuario,
        visibles: preguntasVisibles
    };
    localStorage.setItem('psq_save_ope', JSON.stringify(estado));
}

function cargarEstadoGuardado() {
    const save = localStorage.getItem('psq_save_ope');
    if (save) {
        const data = JSON.parse(save);
        añoActual = data.año;
        preguntasExamen = data.preguntas;
        respuestasUsuario = data.respuestas;
        preguntasVisibles = data.visibles;
        renderizarExamen();
        return true;
    }
    return false;
}

/**
 * Carga de datos unificada
 */
async function iniciarExamen(año, esContinuacion = false) {
    // Si no es continuación, comprobamos si hay algo guardado
    if (!esContinuacion && localStorage.getItem('psq_save_ope')) {
        const data = JSON.parse(localStorage.getItem('psq_save_ope'));
        const nombreModo = data.año === 'snack' ? 'Snack' : `20${data.año}`;
        if (confirm(`Tienes un examen (${nombreModo}) a medias. ¿Quieres continuarlo?`)) {
            cargarEstadoGuardado();
            return;
        }
    }

    añoActual = año;
    preguntasVisibles = (año === 'snack') ? 10 : 20;
    respuestasUsuario = {};
    const modalData = document.getElementById('modalData');
    
    modalData.innerHTML = `<div style="padding:3rem; text-align:center;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:var(--primary);"></i><br><br><b style="color:var(--text-main);">Preparando examen...</b></div>`;

    try {
        let rows = [];
        if (año === 'snack') {
            const [res22, res20] = await Promise.all([
                fetch(`${window.WORKER_URL}?sheet=Ope_PSQ22`),
                fetch(`${window.WORKER_URL}?sheet=Ope_PSQ20`)
            ]);
            const d22 = await res22.json();
            const d20 = await res20.json();
            rows = [...(d22.values || []), ...(d20.values || [])];
        } else {
            const response = await fetch(`${window.WORKER_URL}?sheet=Ope_PSQ${año}`);
            const data = await response.json();
            rows = data.values || [];
        }

        preguntasExamen = rows
            .filter(row => row[0] && row[0].trim() !== "")
            .map(row => ({
                pregunta: (row[0] || "").trim(),
                opciones: [(row[1] || "").trim(), (row[2] || "").trim(), (row[3] || "").trim(), (row[4] || "").trim()],
                correcta: (row[5] || "").trim().toUpperCase(),
                explicacion: (row[6] || "No hay explicación disponible.").trim()
            }));

        if (año === 'snack') {
            preguntasExamen = preguntasExamen.sort(() => Math.random() - 0.5).slice(0, 10);
        }

        renderizarExamen();
        guardarEstado();
    } catch (error) {
        modalData.innerHTML = `<div style="padding:2rem; text-align:center;">Error: ${error.message}</div>`;
    }
}

function renderizarExamen() {
    const container = document.getElementById('modalData');
    const tituloHeader = añoActual === 'snack' ? 'Modo Snack' : `OPE 20${añoActual}`;
    
    let html = `
        <div style="padding:1.5rem; max-width:800px; margin:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom: 2px solid var(--border); padding-bottom:1.5rem;">
                <div>
                    <h2 style="margin:0; font-weight:900; color:var(--primary); font-size:1.6rem;">${tituloHeader}</h2>
                    <p style="margin:5px 0 0; font-size:0.75rem; color:var(--text-muted);">
                        Cargadas <span id="cont-preg">${Math.min(preguntasVisibles, preguntasExamen.length)}</span> de ${preguntasExamen.length}
                    </p>
                </div>
                <button onclick="openExamenSelector()" style="background:var(--card); border:1px solid var(--border); color:var(--text-muted); padding:8px 12px; border-radius:10px; cursor:pointer; font-size:0.75rem; font-weight:800;">
                    <i class="fas fa-undo"></i> SALIR
                </button>
            </div>

            <div id="contenedor-preguntas">${generarBloquePreguntas(0, preguntasVisibles)}</div>`;

    if (preguntasVisibles < preguntasExamen.length) {
        html += `<button id="btn-mas" onclick="cargarMasPreguntas()" style="width:100%; padding:1rem; margin-bottom:2rem; border-radius:15px; border:2px dashed var(--border); background:none; color:var(--text-muted); font-weight:800; cursor:pointer;">CARGAR MÁS PREGUNTAS...</button>`;
    }

    html += `
            <div id="footer-actions" style="position:sticky; bottom:10px; z-index:100; display:flex; gap:10px;">
                <button onclick="corregirExamen()" class="btn btn-primary" style="flex:1; height:55px; border-radius:15px; font-weight:900; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
                    FINALIZAR Y CORREGIR
                </button>
            </div>
        </div>`;
    
    container.innerHTML = html;
}

function generarBloquePreguntas(inicio, fin) {
    let bloqueHtml = '';
    const listaSlice = preguntasExamen.slice(inicio, fin);

    listaSlice.forEach((p, i) => {
        const realIndex = inicio + i;
        const resPrevia = respuestasUsuario[realIndex] || "";
        bloqueHtml += `
            <div id="bloque-${realIndex}" style="margin-bottom:2.5rem; padding:1.5rem; background:var(--bg); border-radius:1.5rem; border:1px solid var(--border);">
                <p style="font-weight:700; font-size:1.05rem; line-height:1.4; margin-bottom:1.5rem; color:var(--text-main);">${p.pregunta}</p>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${['A', 'B', 'C', 'D'].map((letra, idx) => `
                        <label style="display:flex; align-items:center; gap:12px; padding:15px; background:var(--card); border:1px solid var(--border); border-radius:12px; cursor:pointer; color:var(--text-main);">
                            <input type="radio" name="preg-${realIndex}" value="${letra}" ${resPrevia === letra ? 'checked' : ''} onclick="respuestasUsuario[${realIndex}] = '${letra}'; guardarEstado();">
                            <span style="font-size:0.95rem;">${p.opciones[idx]}</span>
                        </label>
                    `).join('')}
                </div>
                <button onclick="revelarIndividual(${realIndex})" style="margin-top:1.5rem; background:none; border:none; color:var(--text-muted); font-weight:800; font-size:0.7rem; cursor:pointer;"><i class="fas fa-lightbulb"></i> Ver explicación</button>
                <div id="feedback-${realIndex}" style="display:none; margin-top:1.2rem; padding:1.2rem; background:var(--card); border-left:4px solid var(--primary); border-radius:12px;">
                    <strong style="color:var(--primary); display:block; margin-bottom:8px;">CORRECTA: ${p.correcta}</strong>
                    <div style="font-size:0.9rem; opacity:0.9;">${p.explicacion}</div>
                </div>
            </div>`;
    });
    return bloqueHtml;
}

function cargarMasPreguntas() {
    const inicio = preguntasVisibles;
    preguntasVisibles = Math.min(preguntasVisibles + 20, preguntasExamen.length);
    document.getElementById('contenedor-preguntas').insertAdjacentHTML('beforeend', generarBloquePreguntas(inicio, preguntasVisibles));
    document.getElementById('cont-preg').innerText = preguntasVisibles;
    if (preguntasVisibles >= preguntasExamen.length) document.getElementById('btn-mas').style.display = 'none';
    guardarEstado();
}

function revelarIndividual(idx) {
    const fb = document.getElementById(`feedback-${idx}`);
    if (fb) fb.style.display = (fb.style.display === 'none' || fb.style.display === '') ? 'block' : 'none';
}

function corregirExamen() {
    let aciertos = 0;
    let fallosIndices = [];

    preguntasExamen.forEach((p, idx) => {
        const bloque = document.getElementById(`bloque-${idx}`);
        const feedback = document.getElementById(`feedback-${idx}`);
        if (bloque && feedback) {
            feedback.style.display = 'block';
            if (respuestasUsuario[idx] === p.correcta) {
                aciertos++;
                bloque.style.borderColor = '#22c55e';
                bloque.style.background = 'rgba(34, 197, 94, 0.05)';
            } else {
                fallosIndices.push(idx);
                bloque.style.borderColor = '#ef4444';
                bloque.style.background = 'rgba(239, 68, 68, 0.05)';
            }
        }
    });

    // Limpiar persistencia ya que el examen terminó
    localStorage.removeItem('psq_save_ope');

    // Añadir botón de repasar fallos si los hay
    if (fallosIndices.length > 0) {
        const footer = document.getElementById('footer-actions');
        footer.innerHTML = `
            <button onclick="repasarFallos([${fallosIndices}])" class="btn" style="flex:1; background:#ef4444; color:white; height:55px; border-radius:15px; font-weight:900;">
                REPASAR SOLO LOS ${fallosIndices.length} FALLOS
            </button>
            <button onclick="openExamenSelector()" class="btn" style="flex:1; background:var(--border); color:var(--text-main); height:55px; border-radius:15px; font-weight:900;">
                SALIR
            </button>`;
    }

    alert(`Examen finalizado.\n\nAciertos: ${aciertos} de ${preguntasExamen.length}`);
    document.querySelector('.modal-content').scrollTo({top: 0, behavior: 'smooth'});
}

/**
 * Nueva función para repasar solo lo fallado
 */
function repasarFallos(indices) {
    const nuevasPreguntas = indices.map(idx => preguntasExamen[idx]);
    preguntasExamen = nuevasPreguntas;
    respuestasUsuario = {};
    preguntasVisibles = nuevasPreguntas.length;
    añoActual = `${añoActual} (Fallos)`;
    renderizarExamen();
}
