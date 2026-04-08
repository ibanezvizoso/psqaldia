// ope_cardio.js - PSQ al día
// Configuración específica para el examen de Cardiología
const CONFIG_OPE = {
    sheetName: "Ope_Car22", // Nombre exacto de tu pestaña en Sheets
    titulo: "OPE Cardiología 2022",
    slug: "ope-cardio"
};

document.addEventListener('DOMContentLoaded', () => {
    cargarExamenCardio();
});

async function cargarExamenCardio() {
    const contenedor = document.getElementById('contenedor-examen');
    if (!contenedor) return;

    contenedor.innerHTML = '<div class="cargando">Cargando preguntas de Cardiología...</div>';

    try {
        // Llamada a tu Worker usando el parámetro ?sheet
        const response = await fetch(`https://psqaldia.com/?sheet=${encodeURIComponent(CONFIG_OPE.sheetName)}`);
        const data = await response.json();

        if (!data || !data.values) {
            throw new Error("No se encontraron datos en la hoja.");
        }

        renderizarPreguntas(data.values);

    } catch (error) {
        console.error("Error:", error);
        contenedor.innerHTML = `<div class="error">Error al cargar el examen: ${error.message}</div>`;
    }
}

function renderizarPreguntas(filas) {
    const contenedor = document.getElementById('contenedor-examen');
    contenedor.innerHTML = ''; // Limpiar cargando

    // Suponiendo que la estructura es: [Pregunta, Opción A, Opción B, Opción C, Opción D, Correcta, Explicación]
    filas.forEach((fila, index) => {
        if (!fila[0]) return; // Saltar filas vacías

        const div = document.createElement('div');
        div.className = 'pregunta-card';
        div.innerHTML = `
            <p class="enunciado"><strong>${index + 1}.</strong> ${fila[0]}</p>
            <div class="opciones">
                ${renderOpcion(fila[1], 'A', index)}
                ${renderOpcion(fila[2], 'B', index)}
                ${renderOpcion(fila[3], 'C', index)}
                ${renderOpcion(fila[4], 'D', index)}
            </div>
            <div id="feedback-${index}" class="feedback hidden">
                <p class="correcta-text">Correcta: ${fila[5]}</p>
                <p class="explicacion">${fila[6] || ''}</p>
            </div>
        `;
        contenedor.appendChild(div);
    });
    
    // Añadir botón de finalizar (opcional, según tu estilo actual)
    const btnFin = document.createElement('button');
    btnFin.textContent = "Corregir Examen";
    btnFin.onclick = corregirExamen;
    contenedor.appendChild(btnFin);
}

function renderOpcion(texto, letra, index) {
    if (!texto) return '';
    return `
        <label class="opcion-item">
            <input type="radio" name="p${index}" value="${letra}">
            <span>${letra}. ${texto}</span>
        </label>
    `;
}

// Nota: Reutiliza tus funciones de corregirExamen() de opes_comun.js para mantener consistencia
