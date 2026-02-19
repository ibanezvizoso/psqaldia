// ope22_anest.js
let preguntasExamenAnest = [];
let respuestasUsuarioAnest = {};
let preguntasVisiblesAnest = 20;

async function openExamenAnestUI() {
    preguntasVisiblesAnest = 20; 
    // Solo necesitamos el nombre de la pestaña, el Worker ya pide el rango A2:Z500
const pestaña = 'Ope_Anest22'; 
const url = `${window.WORKER_URL}?sheet=${pestaña}`;

const modalData = document.getElementById('modalData');
modalData.innerHTML = `<div style="padding:3rem; text-align:center;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:var(--primary);"></i><br><br><b style="color:var(--text-main);">Cargando Examen de Anestesia...</b></div>`;
document.getElementById('modal').style.display = 'flex';

try {
    const response = await fetch(url);
    const data = await response.json();

    // Verificamos si el Worker nos devuelve un error
    if (data.error) throw new Error(data.details || data.error);
    if (!data.values) throw new Error("No hay datos en Ope_Anest22");
    
    // ... resto del mapeo (se mantiene igual)

        preguntasExamenAnest = data.values
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

        renderizarExamenAnest();
    } catch (error) {
        console.error("Error Guardián Anest:", error);
        modalData.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--text-main);">
            <i class="fas fa-exclamation-triangle fa-2x" style="color:#ef4444; margin-bottom:1rem;"></i><br>
            No se pudo cargar el examen de anestesia.<br><small style="color:var(--text-muted);">Verifica la pestaña <b>Ope_Anest22</b></small>
        </div>`;
    }
}

function renderizarExamenAnest() {
    const container = document.getElementById('modalData');
    let html = `
        <div style="padding:1.5rem; max-width:800px; margin:auto;">
            <div style="display:flex; flex-direction:column; gap:5px; margin-bottom:2rem; border-bottom: 2px solid var(--border); padding-bottom:1.5rem;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h2 style="margin:0; font-weight:900; color:var(--primary); font-size:1.6rem; letter-spacing:-0.5px;">OPE ANESTESIA 2022</h2>
                    <span style="background:#ec4899; color:white; padding:4px 10px; border-radius:8px; font-size:0.7rem; font-weight:900; text-transform:uppercase;">Específico</span>
                </div>
                <p style="margin:0; font-size:0.85rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px;">Servicio Gallego de Salud (SERGAS)</p>
                <p style="margin:5px 0 0; font-size:0.75rem; color:var(--text-muted);">Cargadas <span id="cont-anest">${preguntasVisiblesAnest}</span> de ${preguntasExamenAnest.length} preguntas</p>
            </div>
            <div id="contenedor-preguntas-anest">
                ${generarBloqueAnest(0, preguntasVisiblesAnest)}
            </div>`;

    if (preguntasVisiblesAnest < preguntasExamenAnest.length) {
        html += `<button id="btn-mas-anest" onclick="cargarMasAnest()" style="width:100%; padding:1rem; margin-bottom:2rem; border-radius:15px; border:2px dashed var(--border); background:none; color:var(--text-muted); font-weight:800; cursor:pointer;">CARGAR MÁS PREGUNTAS...</button>`;
    }

    html += `
            <button onclick="corregirExamenAnest()" class="btn btn-primary" style="width:100%; height:50px; border-radius:15px; font-size:1rem; margin-top:1rem; position:sticky; bottom:10px; z-index:100; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
                FINALIZAR Y CORREGIR TODO
            </button>
        </div>`;
    
    container.innerHTML = html;
}

function generarBloqueAnest(inicio, fin) {
    let bloqueHtml = '';
    const listaSlice = preguntasExamenAnest.slice(inicio, fin);

    listaSlice.forEach((p, i) => {
        const realIndex = inicio + i;
        bloqueHtml += `
            <div id="bloque-anest-${realIndex}" style="margin-bottom:2.5rem; padding:1.5rem; background:var(--bg); border-radius:1.5rem; border:1px solid var(--border);">
                <p style="font-weight:700; font-size:1.05rem; line-height:1.4; margin-bottom:1.5rem; color:var(--text-main);">${p.pregunta}</p>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${['A', 'B', 'C', 'D'].map((letra, idx) => `
                        <label style="display:flex; align-items:center; gap:12px; padding:15px; background:var(--card); border:1px solid var(--border); border-radius:12px; cursor:pointer; color:var(--text-main);">
                            <input type="radio" name="preg-anest-${realIndex}" value="${letra}" style="accent-color:var(--primary); width:18px; height:18px;" onclick="respuestasUsuarioAnest[${realIndex}] = '${letra}'">
                            <span style="font-size:0.95rem;">${p.opciones[idx]}</span>
                        </label>
                    `).join('')}
                </div>
                <button onclick="revelarIndividualAnest(${realIndex})" style="margin-top:1.5rem; background:none; border:none; color:var(--text-muted); font-weight:800; font-size:0.7rem; text-transform:uppercase; cursor:pointer; display:flex; align-items:center; gap:5px;">
                    <i class="fas fa-lightbulb"></i> Ver explicación
                </button>
                <div id="feedback-anest-${realIndex}" style="display:none; margin-top:1.2rem; padding:1.2rem; background:var(--card); border-left:4px solid var(--primary); border-radius:12px; font-size:0.9rem; color:var(--text-main);">
                    <strong style="color:var(--primary); display:block; margin-bottom:8px;">RESPUESTA CORRECTA: ${p.correcta}</strong>
                    <div style="opacity:0.9; line-height:1.5;">${p.explicacion}</div>
                </div>
            </div>`;
    });
    return bloqueHtml;
}

function cargarMasAnest() {
    const inicio = preguntasVisiblesAnest;
    preguntasVisiblesAnest = Math.min(preguntasVisiblesAnest + 20, preguntasExamenAnest.length);
    const nuevoBloque = generarBloqueAnest(inicio, preguntasVisiblesAnest);
    document.getElementById('contenedor-preguntas-anest').insertAdjacentHTML('beforeend', nuevoBloque);
    document.getElementById('cont-anest').innerText = preguntasVisiblesAnest;
    if (preguntasVisiblesAnest >= preguntasExamenAnest.length) document.getElementById('btn-mas-anest').style.display = 'none';
}

function revelarIndividualAnest(idx) {
    const fb = document.getElementById(`feedback-anest-${idx}`);
    if (fb) fb.style.display = (fb.style.display === 'none' || fb.style.display === '') ? 'block' : 'none';
}

function corregirExamenAnest() {
    let aciertos = 0;
    preguntasExamenAnest.forEach((p, idx) => {
        const bloque = document.getElementById(`bloque-anest-${idx}`);
        const feedback = document.getElementById(`feedback-anest-${idx}`);
        if (bloque && feedback) {
            feedback.style.display = 'block';
            if (respuestasUsuarioAnest[idx] === p.correcta) {
                aciertos++;
                bloque.style.borderColor = '#22c55e';
                bloque.style.background = 'rgba(34, 197, 94, 0.05)';
            } else {
                bloque.style.borderColor = '#ef4444';
                bloque.style.background = 'rgba(239, 68, 68, 0.05)';
            }
        }
    });
    alert(`Examen de Anestesia finalizado.\n\nAciertos: ${aciertos} de ${preguntasExamenAnest.length}`);
    document.querySelector('.modal-content').scrollTo({top: 0, behavior: 'smooth'});
}
