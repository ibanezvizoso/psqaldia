/**
 * opes_anest.js - Gestión unificada de exámenes OPE Anestesia
 * Incluye: Selector 2022/2020, Modo Snack y Persistencia.
 */
let preguntasAnest = [];
let respuestasAnest = {};
let preguntasVisiblesAnest = 20;
let añoAnestActual = "";

/**
 * Pantalla inicial: Selector de convocatoria y modo Snack
 */
function openAnestSelector() {
    const modalData = document.getElementById('modalData');
    const modal = document.getElementById('modal');
    
    if (modal) modal.style.display = 'flex';

   modalData.innerHTML = `
        <div style="padding: 2.5rem 1.5rem; text-align: center; max-width: 500px; margin: auto;">
            <div style="margin-bottom: 2.5rem;">
                <i class="fas fa-medkit fa-3x" style="color: var(--primary); margin-bottom: 1rem; opacity: 0.8;"></i>
                <h2 style="color: var(--text-main); font-weight: 900; margin: 0; font-size: 1.8rem;">OPE Anestesia</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.5rem;">Selecciona la convocatoria para comenzar</p>
            </div>
            
            <div style="display: grid; gap: 12px; margin-bottom: 2rem;">
                <button onclick="iniciarExamenAnest('22')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <b style="color: var(--text-main); font-size: 1.1rem;">Convocatoria 2022</b>
                    <i class="fas fa-chevron-right" style="color: var(--primary);"></i>
                </button>

                <button onclick="iniciarExamenAnest('20')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <b style="color: var(--text-main); font-size: 1.1rem;">Convocatoria 2020</b>
                    <i class="fas fa-chevron-right" style="color: var(--primary);"></i>
                </button>

                <button onclick="iniciarExamenAnest('snack')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--primary); background: rgba(67, 56, 202, 0.1); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <div>
                        <b style="color: var(--primary); font-size: 1.1rem;">Modo Snack</b>
                        <small style="display: block; color: var(--text-muted); font-size: 0.75rem;">(10 preguntas aleatorias mixtas)</small>
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
 * Persistencia: Guardar estado
 */
function guardarEstadoAnest() {
    const estado = {
        año: añoAnestActual,
        preguntas: preguntasAnest,
        respuestas: respuestasAnest,
        visibles: preguntasVisiblesAnest
    };
    localStorage.setItem('psq_save_anest', JSON.stringify(estado));
}

/**
 * Carga de datos y lógica inicial
 */
async function iniciarExamenAnest(año, esContinuacion = false) {
    if (!esContinuacion && localStorage.getItem('psq_save_anest')) {
        const data = JSON.parse(localStorage.getItem('psq_save_anest'));
        const nombreModo = data.año === 'snack' ? 'Snack' : `20${data.año}`;
        if (confirm(`Tienes un examen de Anestesia (${nombreModo}) a medias. ¿Quieres continuarlo?`)) {
            const save = JSON.parse(localStorage.getItem('psq_save_anest'));
            añoAnestActual = save.año;
            preguntasAnest = save.preguntas;
            respuestasAnest = save.respuestas;
            preguntasVisiblesAnest = save.visibles;
            renderizarExamenAnest();
            return;
        }
    }

    añoAnestActual = año;
    preguntasVisiblesAnest = (año === 'snack') ? 10 : 20;
    respuestasAnest = {};
    const modalData = document.getElementById('modalData');
    modalData.innerHTML = `<div style="padding:3rem; text-align:center;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:var(--primary);"></i><br><br><b>Preparando preguntas...</b></div>`;

    try {
        let rows = [];
        if (año === 'snack') {
            const [res22, res20] = await Promise.all([
                fetch(`/?sheet=Ope_Anest22`),
    fetch(`/?sheet=Ope_Anest20`)
            ]);
            const d22 = await res22.json();
            const d20 = await res20.json();
            rows = [...(d22.values || []), ...(d20.values || [])];
        } else {
            const response = await fetch(`/?sheet=Ope_Anest${año}`);
            const data = await response.json();
            rows = data.values || [];
        }

        preguntasAnest = rows
            .filter(row => row[0] && row[0].trim() !== "")
            .map(row => ({
                pregunta: (row[0] || "").trim(),
                opciones: [(row[1] || "").trim(), (row[2] || "").trim(), (row[3] || "").trim(), (row[4] || "").trim()],
                correcta: (row[5] || "").trim().toUpperCase(),
                explicacion: (row[6] || "No hay explicación disponible.").trim()
            }));

        if (año === 'snack') {
            preguntasAnest = preguntasAnest.sort(() => Math.random() - 0.5).slice(0, 10);
        }

        renderizarExamenAnest();
        guardarEstadoAnest();
    } catch (error) {
        modalData.innerHTML = `<div style="padding:2rem; text-align:center;">Error al cargar datos: ${error.message}</div>`;
    }
}

function renderizarExamenAnest() {
    const container = document.getElementById('modalData');
    const tituloHeader = añoAnestActual === 'snack' ? 'Snack Anestesia' : `OPE ANESTESIA 20${añoAnestActual}`;
    
    let html = `
        <div style="padding:1.5rem; max-width:800px; margin:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom: 2px solid var(--border); padding-bottom:1.5rem;">
                <div>
                    <h2 style="margin:0; font-weight:900; color:var(--primary); font-size:1.6rem;">${tituloHeader}</h2>
                    <p style="margin:5px 0 0; font-size:0.75rem; color:var(--text-muted);">
                        Cargadas <span id="cont-preg-anest">${Math.min(preguntasVisiblesAnest, preguntasAnest.length)}</span> de ${preguntasAnest.length}
                    </p>
                </div>
                <button onclick="openAnestSelector()" style="background:var(--card); border:1px solid var(--border); color:var(--text-muted); padding:8px 12px; border-radius:10px; cursor:pointer; font-size:0.75rem; font-weight:800;">
                    <i class="fas fa-undo"></i> SALIR
                </button>
            </div>

            <div id="contenedor-preguntas-anest">${generarBloqueAnest(0, preguntasVisiblesAnest)}</div>`;

    if (preguntasVisiblesAnest < preguntasAnest.length) {
        html += `<button id="btn-mas-anest" onclick="cargarMasAnest()" style="width:100%; padding:1rem; margin-bottom:2rem; border-radius:15px; border:2px dashed var(--border); background:none; color:var(--text-muted); font-weight:800; cursor:pointer;">CARGAR MÁS PREGUNTAS...</button>`;
    }

    html += `
            <div id="footer-anest" style="position:sticky; bottom:10px; z-index:100; display:flex; gap:10px;">
                <button onclick="corregirExamenAnest()" class="btn btn-primary" style="flex:1; height:55px; border-radius:15px; font-weight:900; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
                    FINALIZAR Y CORREGIR
                </button>
            </div>
        </div>`;
    
    container.innerHTML = html;
}

function generarBloqueAnest(inicio, fin) {
    let bloqueHtml = '';
    const listaSlice = preguntasAnest.slice(inicio, fin);

    listaSlice.forEach((p, i) => {
        const realIndex = inicio + i;
        const resPrevia = respuestasAnest[realIndex] || "";
        bloqueHtml += `
            <div id="bloque-anest-${realIndex}" style="margin-bottom:2.5rem; padding:1.5rem; background:var(--bg); border-radius:1.5rem; border:1px solid var(--border);">
                <p style="font-weight:700; font-size:1.05rem; line-height:1.4; margin-bottom:1.5rem; color:var(--text-main);">${p.pregunta}</p>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${['A', 'B', 'C', 'D'].map((letra, idx) => `
                        <label style="display:flex; align-items:center; gap:12px; padding:15px; background:var(--card); border:1px solid var(--border); border-radius:12px; cursor:pointer; color:var(--text-main);">
                            <input type="radio" name="preg-anest-${realIndex}" value="${letra}" ${resPrevia === letra ? 'checked' : ''} onclick="respuestasAnest[${realIndex}] = '${letra}'; guardarEstadoAnest();">
                            <span style="font-size:0.95rem;">${p.opciones[idx]}</span>
                        </label>
                    `).join('')}
                </div>
                <button onclick="revelarIndividualAnest(${realIndex})" style="margin-top:1.5rem; background:none; border:none; color:var(--text-muted); font-weight:800; font-size:0.7rem; cursor:pointer;"><i class="fas fa-lightbulb"></i> Ver explicación</button>
                <div id="feedback-anest-${realIndex}" style="display:none; margin-top:1.2rem; padding:1.2rem; background:var(--card); border-left:4px solid var(--primary); border-radius:12px;">
                    <strong style="color:var(--primary); display:block; margin-bottom:8px;">CORRECTA: ${p.correcta}</strong>
                    <div style="font-size:0.9rem; opacity:0.9;">${p.explicacion}</div>
                </div>
            </div>`;
    });
    return bloqueHtml;
}

function cargarMasAnest() {
    const inicio = preguntasVisiblesAnest;
    preguntasVisiblesAnest = Math.min(preguntasVisiblesAnest + 20, preguntasAnest.length);
    document.getElementById('contenedor-preguntas-anest').insertAdjacentHTML('beforeend', generarBloqueAnest(inicio, preguntasVisiblesAnest));
    document.getElementById('cont-preg-anest').innerText = preguntasVisiblesAnest;
    if (preguntasVisiblesAnest >= preguntasAnest.length) document.getElementById('btn-mas-anest').style.display = 'none';
    guardarEstadoAnest();
}

function revelarIndividualAnest(idx) {
    const fb = document.getElementById(`feedback-anest-${idx}`);
    if (fb) fb.style.display = (fb.style.display === 'none' || fb.style.display === '') ? 'block' : 'none';
}

function corregirExamenAnest() {
    let aciertos = 0;
    let fallosIndices = [];

    preguntasAnest.forEach((p, idx) => {
        const bloque = document.getElementById(`bloque-anest-${idx}`);
        const feedback = document.getElementById(`feedback-anest-${idx}`);
        if (bloque && feedback) {
            feedback.style.display = 'block';
            if (respuestasAnest[idx] === p.correcta) {
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

    localStorage.removeItem('psq_save_anest');

    if (fallosIndices.length > 0) {
        const footer = document.getElementById('footer-anest');
        footer.innerHTML = `
            <button onclick="repasarFallosAnest([${fallosIndices}])" class="btn" style="flex:1; background:#ef4444; color:white; height:55px; border-radius:15px; font-weight:900;">
                REPASAR ${fallosIndices.length} FALLOS
            </button>
            <button onclick="openAnestSelector()" class="btn" style="flex:1; background:var(--border); color:var(--text-main); height:55px; border-radius:15px; font-weight:900;">
                SALIR
            </button>`;
    }

    alert(`Examen finalizado.\nAciertos: ${aciertos} de ${preguntasAnest.length}`);
    document.querySelector('.modal-content').scrollTo({top: 0, behavior: 'smooth'});
}

function repasarFallosAnest(indices) {
    const nuevasPreguntas = indices.map(idx => preguntasAnest[idx]);
    preguntasAnest = nuevasPreguntas;
    respuestasAnest = {};
    preguntasVisiblesAnest = nuevasPreguntas.length;
    renderizarExamenAnest();
}
