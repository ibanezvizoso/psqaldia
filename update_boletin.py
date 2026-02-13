import os
import requests
import json
import re
from datetime import datetime, timedelta
from google import genai  # <--- Librería nueva y estable

# 1. CONFIGURACIÓN DE BÚSQUEDA REAL EN PUBMED
def get_pubmed_data():
    search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
    
    # Ampliamos a 30 días para asegurar que siempre encuentre artículos de impacto
    query = "(JAMA Psychiatry[Journal] OR Lancet Psychiatry[Journal] OR American Journal of Psychiatry[Journal]) AND (last 30 days[dp])"
    
    try:
        # Búsqueda de IDs
        r_search = requests.get(search_url, params={
            "db": "pubmed",
            "term": query,
            "retmax": 3,
            "retmode": "json"
        })
        ids = r_search.json().get("esearchresult", {}).get("idlist", [])
        
        if not ids:
            # Plan B: Psiquiatría general si las TOP no tienen nada
            query_alt = "psychiatry[Journal] AND (last 7 days[dp])"
            r_search = requests.get(search_url, params={"db": "pubmed", "term": query_alt, "retmax": 3, "retmode": "json"})
            ids = r_search.json().get("esearchresult", {}).get("idlist", [])

        if not ids:
            return "No se encontraron artículos recientes en PubMed."

        # Obtención de detalles
        r_fetch = requests.get(fetch_url, params={
            "db": "pubmed",
            "id": ",".join(ids),
            "retmode": "json"
        })
        data = r_fetch.json()
        
        articles_info = ""
        for i, idx in enumerate(ids, 1):
            title = data['result'][idx].get('title', 'Sin título')
            journal = data['result'][idx].get('fulljournalname', 'Revista desconocida')
            articles_info += f"\nARTÍCULO {i}: {title} (Revista: {journal})\n"
        
        return articles_info

    except Exception as e:
        return f"Error conectando con PubMed: {str(e)}"

def main():
    try:
        # Extraer información real de PubMed
        evidencia_real = get_pubmed_data()
        
        # 2. CONFIGURACIÓN DEL NUEVO CLIENTE DE GEMINI
        # Este cliente fuerza la versión estable v1, evitando el error 404
        client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

        prompt = f"""
        Actúa como un psiquiatra académico experto. Tu tarea es resumir estos artículos REALES extraídos de PubMed para un boletín profesional.
        
        EVIDENCIA EXTRAÍDA:
        {evidencia_real}

        REQUISITOS:
        - Traduce los títulos al español con rigor médico.
        - Redacta resúmenes técnicos (incluye n, p-valor o hallazgos clave).
        - No inventes artículos; si no hay artículos disponibles, informa de ello con tono profesional.

        RESPONDE ÚNICAMENTE CON ESTE JSON:
        {{
          "fecha": "AUTO",
          "titulo": "Boletín semanal experimental",
          "resumen": "Boletín experimental no supervisado. Selección de artículos reales de PubMed:\\n\\n1. [Resumen técnico 1]\\n2. [Resumen técnico 2]",
          "categoria": "BOLETINES",
          "link": "https://pubmed.ncbi.nlm.nih.gov/"
        }}
        """

        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt
        )
        
        # Limpieza y parsing del JSON
        res_text = response.text
        json_match = re.search(r'\{.*\}', res_text, re.DOTALL)
        data = json.loads(json_match.group(0))
        
        # Forzar fecha actual
        data["fecha"] = datetime.now().strftime("%d/%m/%Y")

        with open("boletin.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print("✅ Boletín generado con éxito desde PubMed.")

    except Exception as e:
        # Fallback detallado en caso de error
        error_msg = str(e)
        fallback = {
            "fecha": datetime.now().strftime("%d/%m/%Y"),
            "titulo": "Boletín semanal experimental",
            "resumen": f"Error técnico en el proceso: {error_msg}. Compruebe la configuración de la API y PubMed.",
            "categoria": "BOLETINES",
            "link": "#"
        }
        with open("boletin.json", "w", encoding="utf-8") as f:
            json.dump(fallback, f, ensure_ascii=False, indent=2)
        print(f"❌ Error: {error_msg}")

if __name__ == "__main__":
    main()
