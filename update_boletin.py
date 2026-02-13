import os
import requests
import json
import re
from datetime import datetime
from google import genai

def get_pubmed_data():
    search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
    query = "(JAMA Psychiatry[Journal] OR Lancet Psychiatry[Journal] OR American Journal of Psychiatry[Journal]) AND (last 30 days[dp])"
    
    try:
        r_search = requests.get(search_url, params={"db": "pubmed", "term": query, "retmax": 3, "retmode": "json"})
        ids = r_search.json().get("esearchresult", {}).get("idlist", [])
        if not ids:
            return "No hay artículos específicos. Resume tendencias generales en psiquiatría de la última semana."

        r_fetch = requests.get(fetch_url, params={"db": "pubmed", "id": ",".join(ids), "retmode": "json"})
        data = r_fetch.json()
        
        info = ""
        for idx in ids:
            res = data['result'][idx]
            info += f"- {res.get('title')} ({res.get('fulljournalname')})\n"
        return info
    except:
        return "Error en PubMed."

try:
    evidencias = get_pubmed_data()

    # --- EL CAMBIO CLAVE ESTÁ AQUÍ ---
    # Forzamos al cliente a usar la versión 'v1' estable
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
        http_options={'api_version': 'v1'} 
    )

    prompt = f"""
    Eres un psiquiatra experto. Resume estos artículos de PubMed para un boletín médico serio.
    Artículos: {evidencias}
    
    Responde SOLO con este JSON:
    {{
      "fecha": "AUTO",
      "titulo": "Boletín semanal experimental",
      "resumen": "Contenido técnico detallado...",
      "categoria": "BOLETINES",
      "link": "https://pubmed.ncbi.nlm.nih.gov/"
    }}
    """

    response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents=prompt
    )
    
    match = re.search(r'\{.*\}', response.text, re.DOTALL)
    data = json.loads(match.group(0))
    data["fecha"] = datetime.now().strftime("%d/%m/%Y")

    with open("boletin.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("✅ ¡LOGRADO!")

except Exception as e:
    with open("boletin.json", "w", encoding="utf-8") as f:
        json.dump({"fecha": "Error", "resumen": str(e)}, f)
    print(f"❌ Fallo: {str(e)}")
