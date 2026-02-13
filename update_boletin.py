import os
import google.generativeai as genai
import json
from datetime import datetime

try:
    api_key = os.environ.get("GEMINI_API_KEY")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')

    # PROMPT EXIGENTE Y ESPECÍFICO
    prompt = """
    Eres un experto en Psiquiatría de Enlace y Neuropsiquiatría con rigor académico. 
    Tu tarea es redactar el 'Boletín semanal experimental'.
    
    FUENTES REQUERIDAS: The Lancet Psychiatry, JAMA Psychiatry, World Psychiatry o NEJM.
    CONTENIDO: Selecciona las 3 noticias o artículos más relevantes de los últimos 7 días.
    
    REQUISITOS DE REDACCIÓN:
    - No inventes datos. Si no hay noticias de esta semana, selecciona las más recientes de alto impacto.
    - Cada noticia debe incluir: Título del estudio, hallazgo principal (con datos estadísticos si existen) y la fuente bibliográfica.
    
    FORMATO JSON ESTRICTO (No incluyas texto fuera del JSON):
    {
      "fecha": "FECHA_ACTUAL",
      "titulo": "Boletín semanal experimental",
      "resumen": "Boletín experimental no supervisado. Gemini ha seleccionado los artículos y noticias de interés y actualidad, y se ha automatizado la creación de la tarjeta.\\n\\nNOTICIAS SELECCIONADAS:\\n\\n1. [Estudio]: [Hallazgo] (Fuente).\\n\\n2. [Estudio]: [Hallazgo] (Fuente).\\n\\n3. [Estudio]: [Hallazgo] (Fuente).",
      "categoria": "BOLETINES",
      "link": "https://pubmed.ncbi.nlm.nih.gov/"
    }
    """

    response = model.generate_content(prompt)
    texto = response.text.strip()
    
    # Limpieza de markdown si la IA lo incluye
    if "```json" in texto:
        texto = texto.split("```json")[1].split("```")[0].strip()
    elif "```" in texto:
        texto = texto.split("```")[1].strip()

    data = json.loads(texto)
    data["fecha"] = datetime.now().strftime("%d/%m/%Y")

    with open('boletin.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("Éxito: boletin.json actualizado.")

except Exception as e:
    print(f"Error: {e}")
    # Fallback para evitar que GitHub Actions marque error de archivo no encontrado
    backup = {
        "fecha": datetime.now().strftime("%d/%m/%Y"),
        "titulo": "Boletín semanal experimental",
        "resumen": "Error al recuperar noticias. Por favor, revisa las fuentes habituales directamente.",
        "categoria": "BOLETINES",
        "link": "#"
    }
    with open('boletin.json', 'w', encoding='utf-8') as f:
        json.dump(backup, f, ensure_ascii=False, indent=2)
