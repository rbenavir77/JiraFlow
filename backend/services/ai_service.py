import os
from openai import OpenAI
from dotenv import load_dotenv

# Cargamos el .env desde la carpeta backend
base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(base_path, ".env"))

class AIService:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

        if not api_key:
            raise ValueError("OPENAI_API_KEY no está configurada en backend/.env")

        self.client = OpenAI(api_key=api_key)
        self.model = model
        print(f"[AIService] Configurado para usar OpenAI ({self.model})")

    def _generate_content(self, prompt):
        """Llamada a OpenAI API con gpt-4o-mini."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                temperature=0.7,
                max_completion_tokens=2000,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"[AIService] Error en llamada a OpenAI: {e}")
            return f"Error de IA (OpenAI {self.model}): {str(e)}"

    def refine_story(self, draft_text):
        """Refina una historia de usuario usando principios INVEST."""
        prompt = f"""
        Actúa como un Senior Product Owner con mucha experiencia en el rubro retail.
        Revisa la siguiente historia de usuario borrador y aplícale los principios INVEST (Independiente, Negociable, Valiosa, Estimable, Pequeña, Testeable).

        Borrador: {draft_text}

        Por favor entrega el resultado EXACTAMENTE en este formato Markdown:
        
        ### 📖 Historia Refinada
        **Como** [persona]  
        **quiero** [acción]  
        **para** [beneficio]  
        
        (IMPORTANTE: Cada cláusula DEBE ir en una línea distinta).

        ### ✅ Criterios de Aceptación
        - [Criterio 1]
        - [Criterio 2]
        ...

        ### 🔍 Ambigüedades y Notas
        - [Punto 1]
        ...

        Responde en español con un tono profesional y técnico.
        """
        return self._generate_content(prompt)

    def generate_test_cases(self, refined_story):
        """Genera casos de prueba basados en una historia refinada."""
        prompt = f"""
        Actúa como un Senior QA Automation Engineer.
        Basado en la siguiente Historia de Usuario y sus Criterios de Aceptación, genera un conjunto completo de casos de prueba.

        Historia: {refined_story}

        REGLAS ESTRICTAS PARA LOS CASOS DE PRUEBA (Diseñados para importación a X-ray con nuevo formato):
        1. El "NOMBRE CASO PRUEBA" de CADA caso de prueba DEBE comenzar OBLIGATORIAMENTE con el prefijo "[Ecommerce_SB] ".
        2. Genera los casos de prueba siguiendo estrictamente el ORDEN LÓGICO Y CRONOLÓGICO de las tareas, desarrollos y criterios de aceptación descritos en la historia (muy importante para releases con múltiples desarrollos).
        3. Incluye Caminos felices (Positive paths), Casos de borde (Edge cases) y Escenarios de error (Negative tests).
        4. Fija "TIPO TC" a "Funcional".
        5. Fija "SISTEMA AFECTADO" a "eCommerce SB".
        6. Fija "CREADO POR" y "PERSONA ASIGNADA" a "Ricardo Alberto Benavides Rozas".

        Formatea el resultado ÚNICAMENTE como datos en formato CSV encerrados en un bloque de código ```csv ... ```.
        Usa EXACTAMENTE el carácter ";" (punto y coma) como separador de columnas. Encierra los valores relevantes entre comillas dobles si contienen comas o saltos de línea.
        Las cabeceras deben ser EXACTAMENTE:
        NOMBRE CASO PRUEBA;TIPO TC;SISTEMA AFECTADO;CREADO POR;PERSONA ASIGNADA;STEP;DESCRIPCION;ACCION;DATA;RESULTADO ESPERADO

        Ejemplo:
        ```csv
        NOMBRE CASO PRUEBA;TIPO TC;SISTEMA AFECTADO;CREADO POR;PERSONA ASIGNADA;STEP;DESCRIPCION;ACCION;DATA;RESULTADO ESPERADO
        "[Ecommerce_SB] Login exitoso";"Funcional";"eCommerce SB";"Ricardo Alberto Benavides Rozas";"Ricardo Alberto Benavides Rozas";"1";"Validar inicio de sesión exitoso";"1. Abrir web 2. Ingresar rut";"Credenciales válidas";"El usuario ingresa correctamente y ve el home"
        ```
        """
        return self._generate_content(prompt)

    def generate_daily_status(self, notes):
        """Genera un reporte diario basado en notas sueltas, con formato estructurado."""
        prompt = f"""
        Actúa como un Senior QA Lead redactando un Daily Status profesional.
        
        CONTEXTO: Proyecto eCommerce SB (QA testing). El reporte será presentado en la Daily Standup del equipo.
        
        Basado en las siguientes notas/actividades, redacta un reporte Daily Status estructurado y coherente:
        
        NOTAS DEL DÍA: {notes}
        
        REGLAS OBLIGATORIAS:
        1. Usa un tono profesional, técnico y conciso (máximo 200 palabras totales).
        2. Estructura el reporte con exactamente estas 3 secciones con headers en negrita:
           - **¿Que hice hoy?**: redacta de mejor forma lo que ya yo entrego por escrito.
           - **¿Qué haré hoy?**: Especifica qué vas a hacer hoy, prioridades.
           - **¿Tengo impedimentos/bloqueantes?**: Lista solo impedimentos reales. Si no hay, escribe "Ninguno en este momento."
        
        Responde SOLO con el reporte formateado, sin introducción ni explicaciones adicionales.
        """
        return self._generate_content(prompt)
