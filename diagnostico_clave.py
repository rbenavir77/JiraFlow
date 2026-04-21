import os
import google.generativeai as genai
from google.api_core import exceptions
from google.oauth2.credentials import Credentials
from dotenv import load_dotenv

# Cargamos el .env
load_dotenv('backend/.env')
api_key = os.getenv("GEMINI_API_KEY")

print("--- INICIANDO DIAGNÓSTICO DE CLAVE ---")
print(f"Clave detectada: {api_key[:10]}...{api_key[-5:] if api_key else ''}")

def test_as_api_key():
    print("\n[Prueba 1] Intentando como API KEY estandar...")
    try:
        # Forzamos limpieza de config previa
        genai.configure(api_key=api_key, credentials=None, transport='rest')
        
        model = genai.GenerativeModel('models/gemini-1.5-flash')
        response = model.generate_content("Dime 'OK'", request_options={"timeout": 10})
        print("EXITO: La clave funciona como API KEY estandar.")
        return True
    except Exception as e:
        print(f"FALLO: {str(e)[:250]}")
        return False

def test_as_bearer_token():
    print("\n[Prueba 2] Intentando como BEARER TOKEN (OAuth2)...")
    try:
        # Forzamos limpieza de config previa y usamos Credentials
        creds = Credentials(token=api_key)
        genai.configure(api_key=None, credentials=creds, transport='rest')
        model = genai.GenerativeModel('models/gemini-1.5-flash')
        response = model.generate_content("Dime 'OK'", request_options={"timeout": 10})
        print("EXITO: La clave funciona como BEARER TOKEN.")
        return True
    except Exception as e:
        print(f"FALLO: {str(e)[:250]}")
        return False

if not api_key:
    print("Error: No se encontro GEMINI_API_KEY en backend/.env")
else:
    # Probamos ambos independientemente
    res1 = test_as_api_key()
    res2 = test_as_bearer_token()

    if not res1 and not res2:
        print("\n--- CONCLUSION ---")
        print("La clave NO funciona con ninguno de los metodos de Google Gemini.")
        print("IMPORTANTE: Se sospecha que podrias estar pegando un TOKEN DE JIRA por error.")
        print("Las claves de Jira suelen empezar por AQ. o ATATT.")
        print("Las claves de Gemini DEBEN empezar por AIza.")

print("\n--- DIAGNÓSTICO FINALIZADO ---")
