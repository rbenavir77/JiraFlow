import os
from openai import OpenAI
from dotenv import load_dotenv

# Cargamos el .env desde la carpeta backend
base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(base_path, ".env"))

class AIService:
    def __init__(self):
        openai_key = os.getenv("OPENAI_API_KEY")
        openrouter_key = os.getenv("OPENROUTER_API_KEY")
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

        # Preferimos OpenAI si hay clave; si no, usamos OpenRouter (API compatible).
        if openai_key:
            self.client = OpenAI(api_key=openai_key)
            self.model = model
            print(f"[AIService] Configurado para usar OpenAI ({self.model})")
        elif openrouter_key:
            self.client = OpenAI(
                api_key=openrouter_key,
                base_url="https://openrouter.ai/api/v1",
            )
            self.model = model
            print(f"[AIService] Configurado para usar OpenRouter ({self.model})")
        else:
            raise ValueError(
                "Configura OPENAI_API_KEY u OPENROUTER_API_KEY en backend/.env"
            )

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
        Actúa como un Senior QA Automation Engineer especializado en eCommerce SB.
        Tu objetivo es generar CASOS DE PRUEBA FUNCIONALES DE ALTA CALIDAD, claros, ordenados y listos para ser importados en Xray (nuevo formato).


        Historia: {refined_story}

        REGLAS ESTRICTAS PARA LOS CASOS DE PRUEBA (Diseñados para importación a X-ray con nuevo formato):

        1. El "NOMBRE CASO PRUEBA" de CADA caso de prueba DEBE comenzar OBLIGATORIAMENTE con el prefijo "[Ecommerce_SB] ".
        2. Genera los casos de prueba siguiendo estrictamente el ORDEN LÓGICO Y CRONOLÓGICO de las tareas, desarrollos y criterios de aceptación descritos en la historia (muy importante para releases con múltiples desarrollos).
        3. Incluye Caminos felices (Positive paths), Casos de borde (Edge cases) y Escenarios de error (Negative tests).
        4. Fija "TIPO TC" a "Funcional".
        5. Fija "SISTEMA AFECTADO" a "eCommerce SB".
        6. Fija "CREADO POR" y "PERSONA ASIGNADA" a "Ricardo Alberto Benavides Rozas".
        7. TODOS los casos de prueba deben seguir ESTRICTAMENTE el orden lógico y cronológico del flujo funcional descrito en la historia y sus criterios de aceptación.
        8. Un caso de prueba debe validar un FLUJO FUNCIONAL COMPLETO, NO un paso individual. Acciones como "Acceder", "Editar", "Guardar" y "Verificar" deben ser pasos (STEPS) dentro del MISMO test, no tests independientes.
        9. Escenarios distintos (ej: Usuario Registrado vs Usuario Invitado, o Caso Positivo vs Error de Datos) SÍ deben ser casos de prueba independientes.
        10. Incluye cobertura completa de: Caminos felices (Positive), Casos de borde (Edge), Escenarios negativos / de error (Negative).
        11. No inventes funcionalidades que no estén explícita o implícitamente descritas en la historia.
        12. Utiliza redacción profesional, clara, específica y sin ambigüedades.

        ════════════════════════════════════
        📌 REGLA QA PARA EVITAR DUPLICADOS (Tip SB)
        ════════════════════════════════════
        Un caso de prueba debe validar un objetivo o flujo completo. 
        NO separes los pasos de una misma intención funcional en pruebas distintas.
        Ejemplo: Iniciar sesión, Acceder al perfil, Editar dirección y Guardar cambios corresponden a UN SOLO caso de prueba "[Ecommerce_SB] Editar dirección correctamente".

        ════════════════════════════════════
        🔎 REGLAS AVANZADAS PARA EL PASO A PASO (OBLIGATORIAS)
        ════════════════════════════════════
        Las columnas STEP y ACCION son CRÍTICAS y deben cumplir estrictamente lo siguiente:
        
        1. STEP:
           - Debe ser numérico, secuencial y comenzar en 1 para cada caso de prueba.
           - Cada STEP representa UNA acción única y atómica.

        2. ACCION:
           - Debe describir acciones reales y ejecutables, no conceptos genéricos.
           - Cada acción debe comenzar con un verbo en infinitivo (Ej: "Abrir", "Ingresar", "Seleccionar", "Validar", "Confirmar").
           - NO usar frases vagas como:
           "Realizar el proceso", "Completar flujo", "Ejecutar acción", "Validar comportamiento".
           - Debe indicar explícitamente:
           - Dónde actúa el usuario (pantalla, sección, módulo)
              - Qué elemento interactúa (botón, campo, selector, link)
           - Qué acción realiza

        3. Descomposición obligatoria de PASOS:
           - No combines múltiples acciones en un solo paso del CSV.
           - Si una acción requiere datos, la acción debe indicarlo claramente.
           - Navegación, ingreso de datos, confirmaciones y validaciones deben ir en pasos (STEPS) separados, pero SIEMPRE bajo el mismo nombre de caso de prueba si pertenecen al mismo flujo.

        4. Contexto eCommerce SB:
           - Usa términos reales del dominio eCommerce (ej: carrito, checkout, medio de pago, despacho, resumen de compra).
           - Asume flujos web reales (no acciones abstractas).

        Ejemplo INCORRECTO:
        "ACCION": "Completar proceso de compra"

        Ejemplo CORRECTO (Dentro de un mismo Caso de Prueba):
        "STEP";"ACCION"
        "1";"Acceder al carrito de compras"
        "2";"Presionar botón 'Ir a pagar'"
        "3";"Seleccionar dirección de despacho"
        "4";"Seleccionar medio de pago válido"
        "5";"Confirmar la orden de compra"

        Formatea el resultado ÚNICAMENTE como datos en formato CSV encerrados en un bloque de código ```csv ... ```.
        Usa EXACTAMENTE el carácter ";" (punto y coma) como separador de columnas. Encierra los valores relevantes entre comillas dobles si contienen comas o saltos de línea.
        Las cabeceras deben ser EXACTAMENTE:
        NOMBRE CASO PRUEBA;TIPO TC;SISTEMA AFECTADO;CREADO POR;PERSONA ASIGNADA;STEP;DESCRIPCION;ACCION;DATA;RESULTADO ESPERADO

        Ejemplo:
        ```csv
        NOMBRE CASO PRUEBA;TIPO TC;SISTEMA AFECTADO;CREADO POR;PERSONA ASIGNADA;STEP;DESCRIPCION;ACCION;DATA;RESULTADO ESPERADO
        "[Ecommerce_SB] Login exitoso";"Funcional";"eCommerce SB";"Ricardo Alberto Benavides Rozas";"Ricardo Alberto Benavides Rozas";"1";"Validar inicio de sesión";"Abrir web e ingresar RUT";"RUT válido";"Acceso exitoso al home"
        "[Ecommerce_SB] Login exitoso";"Funcional";"eCommerce SB";"Ricardo Alberto Benavides Rozas";"Ricardo Alberto Benavides Rozas";"2";"Validar inicio de sesión";"Ingresar contraseña y presionar entrar";"Password válida";"Sesión iniciada correctamente"
        ```

        """
        return self._generate_content(prompt)

    def generate_daily_status(self, notes):
        """Genera un reporte diario basado en notas sueltas, actuando como un organizador lógico estricto."""
        prompt = f"""
        Actúa como un transcriptor y organizador lógico de Daily Status para un QA Senior.
        Tu objetivo es clasificar lo que el usuario escribe de corrido en 3 secciones específicas, sin añadir NADA de tu propia cosecha.

        NOTAS DEL USUARIO: "{notes}"

        INSTRUCCIONES DE CLASIFICACIÓN (Mapeo Lógico):
        1. Sección "¿Qué hice hoy?": Aquí debes poner todo lo que el usuario mencione como pasado o realizado hoy (ej: "hoy hice", "avancé", "terminé", "ayer", "participé").
        2. Sección "¿Qué haré mañana?": Aquí debes poner lo que el usuario mencione como futuro o pendiente (ej: "mañana", "voy a", "haré", "quedó pendiente", "tengo que"). 
           *Si el usuario no menciona nada para mañana, deja solo un punto que diga: "Continuar con las actividades del ciclo."
        3. Sección "¿Tengo impedimentos/bloqueantes?": Aquí va cualquier problema mencionado. 
           *Si el usuario dice "sin bloqueos", "sin impedimentos" o no menciona nada negativo, escribe obligatoriamente: "Ninguno en este momento."

        REGLAS DE ORO (PROHIBICIONES):
        - PROHIBIDO inventar porcentajes (ej: no pongas "40%" si el usuario no lo dijo).
        - PROHIBIDO inventar nombres de proyectos o releases.
        - PROHIBIDO añadir frases de relleno como "Me enfocaré en..." o "Se espera que...".
        - Usa un lenguaje directo y técnico, tal como lo haría un QA.

        FORMATO DE SALIDA (ESTRICTO):
        ¿Qué hice hoy?
        ● [Punto 1]
        ● [Punto 2]
        
        ¿Qué haré mañana?
        ● [Punto 1]

        ¿Tengo impedimentos/bloqueantes?
        ● [Punto 1]

        IMPORTANTE: 
        - Usa solo el círculo '●' para las viñetas.
        - No uses negritas ni Markdown extra. Solo texto plano estructurado.
        - Responde ÚNICAMENTE con el reporte.
        """
        return self._generate_content(prompt)
