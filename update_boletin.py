import os
import google.generativeai as genai
import json
import re
from datetime import datetime

try:
    # 1. Configuración de la API
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("API KEY no detectada en los Secrets de GitHub")
        
    genai.configure(api_key=api_key)

    # 2. Selección de modelo estable (Corregido para evitar el 404)
    model = genai.GenerativeModel('gemini-1.5-flash')

    # 3. PROMPT DE ALTA EXIGENCIA CLÍNICA
    prompt = """
    ROL: Actúa como un experto en Psiquiatría Clínica y Metodología de la Investigación.
    TAREA: Elaborar el 'Boletín semanal experimental' para psiquiatras en ejercicio.
    
    INSTRUCCIONES DE BÚSQUEDA Y SELECCIÓN:
    - Identifica los 3 estudios más disruptivos o relevantes publicados en los últimos 7 días.
    - PRIORIDAD ABSOLUTA de fuentes: The Lancet Psychiatry, JAMA Psychiatry, World Psychiatry y American Journal of Psychiatry.
    - Los temas deben ser de relevancia clínica (psicofarmacología, neurobiología, guías de práctica clínica o metaanálisis de alto impacto).

    REQUISITOS DE REDACCIÓN (Campo 'resumen'):
    - Comienza con la frase: "Boletín experimental no supervisado. Gemini ha seleccionado los artículos de interés y actualidad para la práctica clínica:"
    - Para cada noticia usa este formato:
        1. [Nombre del Estudio/Título traducido]: Breve descripción del hallazgo con datos estadísticos (OR, IC95%, p-valor) si están disponibles. Cita la revista y año.
    - Mantén un tono serio, profesional y técnico.

    FORMATO DE SALIDA: ÚNICAMENTE JSON.
    {
      "fecha": "FECHA",
      "titulo": "Boletín semanal experimental",
      "resumen": "CONTENIDO_REDACTADO",
      "categoria": "BOLETINES",
      "link": "https://pubmed.ncbi.nlm.nih.gov/"
    }
    """

    # 4. Generación y limpieza robusta
    response = model.generate_content(prompt)
    res_text = response.text.strip()
    
    # Extraemos el JSON sin importar si la IA pone texto basura alrededor
    json_match = re.search(r'\{.*\}', res_text, re.DOTALL)
    if json_match:
        data = json.loads(json_match.group(0))
    else:
        raise ValueError("La respuesta de la IA no contiene un formato JSON válido.")

    # Aseguramos metadatos correctos
    data["fecha"] = datetime.now().strftime("%d/%m/%Y")
    data["categoria"] = "BOLETINES"

    # 5. Escritura del archivo
    with open('boletin.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("✅ Boletín Élite generado con éxito.")

except Exception as e:
    error_msg = str(e)
    print(f"❌ ERROR: {error_msg}")
    
    # Fallback detallado para depuración en la web
    fallback = {
        "fecha": datetime.now().strftime("%d/%m/%Y"),
        "titulo": "Boletín semanal experimental",
        "resumen": f"AVISO TÉCNICO: La generación automática ha fallado. Motivo: {error_msg}. Se recomienda verificar la vigencia de la API Key y la conexión con Google AI Studio.",
        "categoria": "BOLETINES",
        "link": "#"
    }
    with open('boletin.json', 'w', encoding='utf-8') as f:
        json.dump(fallback, f, ensure_ascii=False, indent=2)
