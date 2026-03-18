/**
 * ope_ped.js - Gestión unificada de exámenes OPE Pediatría
 * Incluye: Selector 2022/2020, Modo Snack, Ver explicación, Persistencia y Fallos.
 */
let preguntasPed = [];
let respuestasPed = {};
let preguntasVisiblesPed = 20;
let añoPedActual = "";

/**
 * Pantalla inicial: Selector de convocatoria y modo Snack
 */
function openPedSelector() {
    const modalData = document.getElementById('modalData');
    const modal = document.getElementById('modal');
    
    if (modal) modal.style.display = 'flex';

    modalData.innerHTML = `
        <div style="padding: 2.5rem 1.5rem; text-align: center; max-width: 500px; margin: auto;">
            <div style="margin-bottom: 2.5rem;">
                <i class="fas fa-baby fa-3x" style="color: #ef4444; margin-bottom: 1rem; opacity: 0.8;"></i>
                <h2 style="color: var(--text-main); font-weight: 900; margin: 0; font-size: 1.8rem;">OPE Pediatría</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.5rem;">Selecciona la convocatoria para comenzar</p>
            </div>
            
            <div style="display: grid; gap: 12px; margin-bottom: 2rem;">
                <button onclick="iniciarExamenPed('22')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <b style="color: var(--text-main); font-size: 1.1rem;">Convocatoria 2022</b>
                    <i class="fas fa-chevron-right" style="color: #ef4444;"></i>
                </button>

                <button onclick="iniciarExamenPed('20')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <b style="color: var(--text-main); font-size: 1.1rem;">Convocatoria 2020</b>
                    <i class="fas fa-chevron-right" style="color: #ef4444;"></i>
                </button>

                <button onclick="iniciarExamenPed('snack')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid #ef4444; background: rgba(239, 68, 68, 0.1); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <div>
                        <b style="color: #ef4444; font-size: 1.1rem;">Modo Snack</b>
                        <small style="display: block; color: var(--text-muted); font-size: 0.75rem;">(10 preguntas aleatorias mixtas)</small>
                    </div>
                    <i class="fas fa-bolt" style="color: #ef4444;"></i>
                </button>
            </div>

            <button onclick="abrirPortalExamenes()" style="background: none; border: none; color: var(--text-muted); font-weight: 800; cursor: pointer; font-size: 0.8rem; letter-spacing: 1px;">
                <i class="fas fa-arrow-left"></i> VOLVER AL PORTAL
            </button>
        </div>
    `;
}

/**
 * Persistencia: Guardar estado
 */
function guardarEstadoPed() {
    const estado = {
        año: añoPedActual,
        preguntas: preguntasPed,
        respuestas: respuestasPed,
        visibles: preguntasVisiblesPed
    };
    localStorage.setItem('psq_save_ped', JSON.stringify(estado));
}

/**
 * Carga de datos y lógica inicial
 */
async function iniciarExamenPed(año, esContinuacion = false) {
    if (!esContinuacion && localStorage.getItem('psq_save_ped')) {
        const data = JSON.parse(localStorage.getItem('psq_save_ped'));
        const nombreModo = data.año === 'snack' ? 'Snack' : `20${data.año}`;
        if (confirm(`Tienes un examen de Pediatría (${nombreModo}) a medias. ¿Quieres continuarlo?`)) {
            const save = JSON.parse(localStorage.getItem('psq_save_ped'));
            añoPedActual = save.año;
            preguntasPed = save.preguntas;
            respuestasPed = save.respuestas;
            preguntasVisiblesPed = save.visibles;
            renderizarExamenPed();
            return;
        }
    }

    añoPedActual = año;
    preguntasVisiblesPed = 20;
    respuestasPed = {};
    const modalData = document.getElementById('modalData');
    modalData.innerHTML = `<div style="padding:3rem; text-align:center;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:#ef4444;"></i><br><br><b>Preparando preguntas...</b></div>`;

    try {
        let rows = [];
        if (año === 'snack') {
            // Mezclamos ambos años para el modo Snack
            const [res22, res20] = await Promise.all([
                fetch(`${window.WORKER_URL}?sheet=Ope_Ped22`),
                fetch(`${window.WORKER_URL}?sheet=Ope_Ped20`)
            ]);
            const d22 = await res22.json();
            const d20 = await res20.json();
            rows = [...(d22.values || []), ...(d20.values || [])];
        } else {
            const response = await fetch(`${window.WORKER_URL}?sheet=Ope_Ped${año}`);
            const data = await response.json();
            rows = data.values || [];
        }

        preguntasPed = rows
            .filter(row => row[0] && row[0].trim() !== "")
            .map(row => ({
                pregunta: (row[0] || "").trim(),
                opciones: [(row[1] || "").trim(), (row[2] || "").trim(), (row[3] || "").trim(), (row[4] || "").trim()],
                correcta: (row[5] || "").trim().toUpperCase(),
                explicacion: (row[6] || "No hay explicación disponible.").trim()
            }));

        if (año === 'snack') {
            preguntasPed = preguntasPed.sort(() => Math.random() - 0.5).slice(0, 10);
            preguntasVisiblesPed = 10;
        }

        renderizarExamenPed();
        guardarEstadoPed();
    } catch (error) {
        modalData.innerHTML = `<div style="padding:2rem; text-align:center;">Error al cargar datos: ${error.message}</div>`;
    }
}

function renderizarExamenPed() {
    const container = document.getElementById('modalData');
    const tituloHeader = añoPedActual === 'snack' ? 'Snack Pediatría' : `OPE PEDIATRÍA 20${añoPedActual}`;
    
    let html = `
        <div style="padding:1.5rem; max-width:800px; margin:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom: 2px solid var(--border); padding-bottom:1.5rem;">
                <div>
                    <h2 style="margin:0; font-weight:900; color:#ef4444; font-size:1.6rem;">${tituloHeader}</h2>
                    <p style="margin:5px 0 0; font-size:0.75rem; color:var(--text-muted);">
                        Cargadas <span id="cont-preg-ped">${Math.min(preguntasVisiblesPed, preguntasPed.length)}</span> de ${preguntasPed.length}
                    </p>
                </div>
                <button onclick="openPedSelector()" style="background:var(--card); border:1px solid var(--border); color:var(--text-muted); padding:8px 12px; border-radius:10px; cursor:pointer; font-size:0.75rem; font-weight:800;">
                    <i class="fas fa-undo"></i> SALIR
                </button>
            </div>

            <div id="contenedor-preguntas-ped">${generarBloquePed(0, preguntasVisiblesPed)}</div>`;

    if (preguntasVisiblesPed < preguntasPed.length) {
        html += `<button id="btn-mas-ped" onclick="cargarMasPed()" style="width:100%; padding:1rem; margin-bottom:2rem; border-radius:15px; border:2px dashed var(--border); background:none; color:var(--text-muted); font-weight:800; cursor:pointer;">CARGAR MÁS PREGUNTAS...</button>`;
    }

    html += `
            <div id="footer-ped" style="position:sticky; bottom:10px; z-index:100; display:flex; gap:10px;">
                <button onclick="corregirExamenPed()" class="btn btn-primary" style="flex:1; height:55px; border-radius:15px; font-weight:900; background:#ef4444; border:none; color:white; cursor:pointer; box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);">
                    FINALIZAR Y CORREGIR
                </button>
            </div>
        </div>`;
    
    container.innerHTML = html;
}

function generarBloquePed(inicio, fin) {
    let bloqueHtml = '';
    const listaSlice = preguntasPed.slice(inicio, fin);

    listaSlice.forEach((p, i) => {
        const realIndex = inicio + i;
        const resPrevia = respuestasPed[realIndex] || "";
        bloqueHtml += `
            <div id="bloque-ped-${realIndex}" style="margin-bottom:2.5rem; padding:1.5rem; background:var(--bg); border-radius:1.5rem; border:1px solid var(--border);">
                <p style="font-weight:700; font-size:1.05rem; line-height:1.4; margin-bottom:1.5rem; color:var(--text-main);">${p.pregunta}</p>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${['A', 'B', 'C', 'D'].map((letra, idx) => `
                        <label style="display:flex; align-items:center; gap:12px; padding:15px; background:var(--card); border:1px solid var(--border); border-radius:12px; cursor:pointer; color:var(--text-main);">
                            <input type="radio" name="preg-ped-${realIndex}" value="${letra}" ${resPrevia === letra ? 'checked' : ''} onclick="respuestasPed[${realIndex}] = '${letra}'; guardarEstadoPed();">
                            <span style="font-size:0.95rem;">${p.opciones[idx]}</span>
                        </label>
                    `).join('')}
                </div>
                <button onclick="revelarIndividualPed(${realIndex})" style="margin-top:1.5rem; background:none; border:none; color:var(--text-muted); font-weight:800; font-size:0.7rem; cursor:pointer;"><i class="fas fa-lightbulb"></i> Ver explicación</button>
                <div id="feedback-ped-${realIndex}" style="display:none; margin-top:1.2rem; padding:1.2rem; background:var(--card); border-left:4px solid #ef4444; border-radius:12px;">
                    <strong style="color:#ef4444; display:block; margin-bottom:8px;">CORRECTA: ${p.correcta}</strong>
                    <div style="font-size:0.9rem; opacity:0.9;">${p.explicacion}</div>
                </div>
            </div>`;
    });
    return bloqueHtml;
}

function cargarMasPed() {
    const inicio = preguntasVisiblesPed;
    preguntasVisiblesPed = Math.min(preguntasVisiblesPed + 20, preguntasPed.length);
    document.getElementById('contenedor-preguntas-ped').insertAdjacentHTML('beforeend', generarBloquePed(inicio, preguntasVisiblesPed));
    document.getElementById('cont-preg-ped').innerText = preguntasVisiblesPed;
    if (preguntasVisiblesPed >= preguntasPed.length) document.getElementById('btn-mas-ped').style.display = 'none';
    guardarEstadoPed();
}

function revelarIndividualPed(idx) {
    const fb = document.getElementById(`feedback-ped-${idx}`);
    if (fb) fb.style.display = (fb.style.display === 'none' || fb.style.display === '') ? 'block' : 'none';
}

function corregirExamenPed() {
    let aciertos = 0;
    let fallosIndices = [];

    preguntasPed.forEach((p, idx) => {
        const bloque = document.getElementById(`bloque-ped-${idx}`);
        const feedback = document.getElementById(`feedback-ped-${idx}`);
        if (bloque && feedback) {
            feedback.style.display = 'block';
            if (respuestasPed[idx] === p.correcta) {
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

    localStorage.removeItem('psq_save_ped');

    if (fallosIndices.length > 0) {
        const footer = document.getElementById('footer-ped');
        footer.innerHTML = `
            <button onclick="repasarFallosPed([${fallosIndices}])" class="btn" style="flex:1; background:#ef4444; color:white; height:55px; border-radius:15px; font-weight:900; border:none; cursor:pointer;">
                REPASAR ${fallosIndices.length} FALLOS
            </button>
            <button onclick="openPedSelector()" class="btn" style="flex:1; background:var(--border); color:var(--text-main); height:55px; border-radius:15px; font-weight:900; border:none; cursor:pointer;">
                SALIR
            </button>`;
    }

    alert(`Examen finalizado.\nAciertos: ${aciertos} de ${preguntasPed.length}`);
    document.querySelector('.modal-content').scrollTo({top: 0, behavior: 'smooth'});
}

function repasarFallosPed(indices) {
    const nuevasPreguntas = indices.map(idx => preguntasPed[idx]);
    preguntasPed = nuevasPreguntas;
    respuestasPed = {};
    preguntasVisiblesPed = nuevasPreguntas.length;
    renderizarExamenPed();
}
