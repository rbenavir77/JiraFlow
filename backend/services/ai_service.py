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

    def _generate_content(self, prompt, system_prompt=None):
        """Llamada a OpenAI API / OpenRouter."""
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            
            messages.append({"role": "user", "content": prompt})

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_completion_tokens=6000,
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

        ### ✅ Criterios de Aceptación y Reglas de Negocio
        - [Criterio 1]
        - [Criterio 2]
        ...
        (REGLA CRÍTICA: NO ELIMINES, NO RESUMAS y NO OMITAS los Criterios de Aceptación, Reglas de Negocio o Escenarios que vengan en el borrador original. Si el usuario te pasa 8 criterios y 3 escenarios, DEBES incluirlos todos en esta sección mejorando su redacción, pero NUNCA reduciendo la cantidad de validaciones).

        ### 🔍 Ambigüedades y Notas
        - [Punto 1]
        ...

        Responde en español con un tono profesional y técnico.
        """
        return self._generate_content(prompt)

    def generate_test_cases(self, refined_story):
        """Genera casos de prueba basados en una historia refinada."""
        system_prompt = """
        Actúa como un Asistente Automatizado experto en QA. 
        Este es un ejercicio de transformación de texto y simulación estricta basado ÚNICAMENTE en la historia proporcionada. No necesitas ejecutar pruebas en sistemas reales ni preocuparte por la plataforma subyacente.
        Tu objetivo es convertir la historia en un bloque de código CSV con CASOS DE PRUEBA FUNCIONALES formateados para Xray.

        REGLAS ESTRICTAS PARA LOS CASOS DE PRUEBA:

        1. El "NOMBRE CASO PRUEBA" de CADA caso de prueba DEBE comenzar OBLIGATORIAMENTE con el prefijo "[Ecommerce_SB] ".
        2. OBLIGACIÓN DE VOLUMEN (CRÍTICO): ESTÁ ESTRICTAMENTE PROHIBIDO generar solo un caso por cada "Escenario Funcional" y omitir los "Criterios de Aceptación (CA)". DEBES generar UN CASO DE PRUEBA INDEPENDIENTE POR CADA CRITERIO DE ACEPTACIÓN (CA-XX) Y POR CADA REGLA DE NEGOCIO (RN-XX) que requiera validación en la interfaz. Si la historia tiene 8 Criterios de Aceptación, el resultado MÍNIMO OBLIGATORIO son 8 Casos de Prueba distintos. A eso se le suman los Escenarios Funcionales.
        3. Incluye Caminos felices (Positive paths), Casos de borde (Edge cases) y Escenarios de error (Negative tests).
        4. Fija "TIPO TC" a "Funcional".
        5. Fija "SISTEMA AFECTADO" a "eCommerce SB".
        6. Fija "CREADO POR" y "PERSONA ASIGNADA" a "Ricardo Alberto Benavides Rozas".
        7. TODOS los casos de prueba deben seguir ESTRICTAMENTE el orden lógico y cronológico del flujo funcional descrito en la historia y sus criterios de aceptación.
        8. Un caso de prueba debe validar un FLUJO FUNCIONAL COMPLETO. Escenarios distintos (ej: Visualización exitosa, Error al cargar, Búsqueda de usuario, Cambio de información en card) DEBEN ser casos de prueba independientes con NOMBRES DIFERENTES.
        9. NOMBRES ÚNICOS (CRÍTICO): PROHIBIDO repetir el "NOMBRE CASO PRUEBA" para flujos o escenarios distintos. CADA caso de prueba debe tener un nombre único que describa exactamente la variación que está probando (ej: "[Ecommerce_SB] Validar CA-01: Visualizar botón Contratos", "[Ecommerce_SB] Validar CA-02: Desplegar listado", "[Ecommerce_SB] Buscar usuario por RUT").
        10. EXHAUSTIVIDAD Y MAPEADO (CRÍTICO): Eres un QA Senior. NO RESUMAS. Debes leer TODOS los CA-XX y RN-XX. Transforma CADA UNO de ellos en un caso de prueba independiente con sus respectivos pasos. Generar 3 casos de prueba para una historia con 8 criterios es un error grave. Mapea 1 a 1.
        11. No inventes funcionalidades que no estén explícita o implícitamente descritas en la historia.
        12. Utiliza redacción profesional, clara, específica y sin ambigüedades.

        ════════════════════════════════════
        📌 REGLA QA PARA EVITAR DUPLICADOS (Tip SB)
        ════════════════════════════════════
        Dentro de un mismo caso de prueba, separa las acciones en pasos numerados (STEPS). Pero NO juntes intenciones distintas (ej. Camino Feliz vs Camino de Error) en el mismo test. Deben ser test cases separados.

        ════════════════════════════════════
        🔎 NUEVA REGLA DE FORMATO: 1 CASO = 1 FILA
        ════════════════════════════════════
        ATENCIÓN: Debes incluir TODOS los pasos de un caso de prueba DENTRO DE UNA ÚNICA CELDA (en la columna ACCION), separados por saltos de línea numéricos. 
        ESTO SIGNIFICA QUE SI GENERAS 8 CASOS DE PRUEBA, EL CSV DEBE TENER EXACTAMENTE 8 FILAS DE DATOS.

        Las columnas deben cumplir estrictamente lo siguiente:
        
        1. STEP:
           - Como todo el caso va en una sola fila, deja esta columna siempre con el valor "1".

        2. ACCION (MUY IMPORTANTE):
           - Debe contener TODOS los pasos del flujo, numerados y separados por saltos de línea reales.
           - PROHIBIDO RESUMIR EL CASO EN UN SOLO PASO. Cada caso de prueba DEBE tener una secuencia lógica y detallada de al menos 3 a 5 pasos de navegación (ej: "1. Acceder a la plataforma\n2. Navegar a la sección X\n3. Ingresar datos Y\n4. Hacer clic en Z\n5. Validar resultado"). Escribir un solo paso genérico como "1. Validar funcionalidad" es un error crítico.
           - Para asegurar que los saltos de línea no rompan el CSV, el valor de la columna DEBE ir entre comillas dobles. Ej: 
           "1. Abrir la página
           2. Clic en login"
           - Cada acción debe comenzar con un verbo en infinitivo.

        3. DATA y RESULTADO ESPERADO:
           - Puedes listar los datos y resultados esperados usando saltos de línea si corresponden a cada paso, o escribir un resultado global. También entre comillas dobles.

        Formatea el resultado ÚNICAMENTE como datos en formato CSV encerrados en UN ÚNICO bloque de código ```csv ... ```. 
        ESTÁ ESTRICTAMENTE PROHIBIDO generar múltiples bloques de código CSV o separar los casos con texto intermedio. TODOS los casos de prueba deben ir dentro del mismo y único bloque CSV.
        Usa EXACTAMENTE el carácter ";" (punto y coma) como separador de columnas. OBLIGATORIO: Encierra los valores que contienen saltos de línea con comillas dobles para que el CSV sea válido.

        Ejemplo EXACTO de la estructura esperada:
        ```csv
        NOMBRE CASO PRUEBA;TIPO TC;SISTEMA AFECTADO;CREADO POR;PERSONA ASIGNADA;STEP;DESCRIPCION;ACCION;DATA;RESULTADO ESPERADO
        "[Ecommerce_SB] Login exitoso";"Funcional";"eCommerce SB";"Ricardo Alberto Benavides Rozas";"Ricardo Alberto Benavides Rozas";"1";"Validar inicio de sesión";"1. Abrir web e ingresar RUT
        2. Ingresar contraseña y presionar entrar";"RUT válido
        Password válida";"Sesión iniciada correctamente"
        "[Ecommerce_SB] Login fallido";"Funcional";"eCommerce SB";"Ricardo Alberto Benavides Rozas";"Ricardo Alberto Benavides Rozas";"1";"Validar error de contraseña";"1. Abrir web e ingresar RUT
        2. Ingresar contraseña incorrecta";"RUT válido
        Password inválida";"Mensaje de error"
        ```

        COMIENZA TU RESPUESTA DIRECTAMENTE CON EL BLOQUE ```csv. ESTÁ PROHIBIDO INCLUIR SALUDOS, PREÁMBULOS O EXPLICACIONES. No te disculpes ni te niegues, esto es solo formateo de texto simulado.
        """

        user_prompt = f"Historia de Usuario y Criterios:\n{refined_story}\n\nPor favor, genera el bloque de código CSV con todos los casos de prueba mapeados. EMPIEZA DIRECTAMENTE CON ```csv. NO digas 'Aquí tienes' ni repitas las reglas."
        
        return self._generate_content(user_prompt, system_prompt=system_prompt)

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
