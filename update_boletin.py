import os
import google.generativeai as genai
import json
import re
from datetime import datetime

try:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("API KEY no detectada en los Secrets de GitHub")
        
    genai.configure(api_key=api_key)

    # Configuración de seguridad total para evitar bloqueos por términos médicos
    model = genai.GenerativeModel(
        model_name='gemini-1.5-flash',
        safety_settings=[
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
        ]
    )

    # PROMPT DE ALTO RENDIMIENTO
    prompt = """
    CONTEXTO: Eres un Documentalista Científico especializado en Psiquiatría y Neurociencias.
    TAREA: Generar un resumen ejecutivo de los 3 estudios más relevantes publicados en la última semana.
    
    FUENTES DE PRIORIDAD: 
    1. The Lancet Psychiatry 
    2. JAMA Psychiatry 
    3. World Psychiatry 
    4. American Journal of Psychiatry
    
    ESTRUCTURA DE CADA NOTICIA:
    - Título del estudio (traducido al español).
    - Hallazgo clave: Resumen de 2 frases con rigor clínico y datos si están disponibles.
    - Cita: Referencia breve al autor o revista.

    REGLA DE SALIDA: Debes responder ÚNICAMENTE con un objeto JSON. No añadas introducciones ni despedidas.
    
    JSON SCHEMA:
    {
      "fecha": "FECHA_AUTOMATICA",
      "titulo": "Boletín semanal experimental",
      "resumen": "Boletín experimental no supervisado. Gemini ha seleccionado los artículos de interés y actualidad:\\n\\n1. [Estudio 1]: [Hallazgo] (Fuente)\\n\\n2. [Estudio 2]: [Hallazgo] (Fuente)\\n\\n3. [Estudio 3]: [Hallazgo] (Fuente)",
      "categoria": "BOLETINES",
      "link": "https://pubmed.ncbi.nlm.nih.gov/"
    }
    """

    response = model.generate_content(prompt)
    res_text = response.text.strip()
    
    # Extracción robusta del JSON usando Regex
    json_match = re.search(r'\{.*\}', res_text, re.DOTALL)
    if json_match:
        data = json.loads(json_match.group(0))
    else:
        raise ValueError(f"Respuesta no válida. Texto recibido: {res_text[:100]}")

    # Aseguramos la fecha actual
    data["fecha"] = datetime.now().strftime("%d/%m/%Y")

    with open('boletin.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("✅ Boletín generado con éxito.")

except Exception as e:
    error_msg = str(e)
    print(f"❌ ERROR: {error_msg}")
    fallback = {
        "fecha": datetime.now().strftime("%d/%m/%Y"),
        "titulo": "Boletín semanal experimental",
        "resumen": f"Error técnico en la generación de noticias: {error_msg}. Por favor, verifique la configuración de la API y los filtros de seguridad.",
        "categoria": "BOLETINES",
        "link": "#"
    }
    with open('boletin.json', 'w', encoding='utf-8') as f:
        json.dump(fallback, f, ensure_ascii=False, indent=2)
