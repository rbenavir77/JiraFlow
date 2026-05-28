# ⚡ JiraFlow QA Assistant

[![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Pandas](https://img.shields.io/badge/Data%20Engine-Pandas-150458?style=for-the-badge&logo=pandas)](https://pandas.pydata.org/)
[![Jira](https://img.shields.io/badge/Integration-Jira%20Cloud-0052CC?style=for-the-badge&logo=jira)](https://www.atlassian.com/software/jira)
[![Local First](https://img.shields.io/badge/Security-Local%20First-4CAF50?style=for-the-badge)](https://github.com/rbenavir77/JiraFlow)

> **JiraFlow QA Assistant** es el copiloto de certificación definitivo para ingenieros de QA. Diseñado con una arquitectura moderna de alto rendimiento y una interfaz con estilo *glassmorphism*, automatiza las tareas operativas diarias, desde el refinamiento de historias de usuario con Inteligencia Artificial hasta la auditoría contable de paridad entre ambientes locales.

---

## 🌟 Características Clave

### 1. 📋 Gestión Inteligente en Jira
* **Creación de Subtareas en 1 Clic:** Genera automáticamente el flujo estándar de 7 tareas de certificación QA para cualquier ticket.
* **Documentación Directa:** Vinculación directa con páginas de **Confluence** desde la interfaz del listado.
* **Fecha de Asignación:** Cada tarea muestra la fecha en que fue asignada (`DD/MM/YYYY`) directamente en la tarjeta.

### 2. ⏱️ Calculadora de Tiempo de Subtareas
* **Suma Automática de Estimaciones:** Desde el módulo **Daily Status**, calcula el tiempo total de todas las subtareas de la iniciativa en curso sumando el campo *Estimación Original* de cada una.
* **Desglose Detallado:** Muestra un panel expandible con el detalle de cada subtarea y su estimación individual.
* **Formato Doble:** Presenta el total tanto en **horas** (ej. `12h 30m`) como en **días hábiles** (ej. `1.56 días`), sin necesidad de hacer cálculos manuales.

### 3. 🧠 Copiloto AI Integrado
* **Refinamiento de Historias:** Estructura historias de usuario bajo el estándar ágil óptimo.
* **Generador de Casos de Prueba:** Diseña suites de pruebas detalladas a partir del análisis de historias de usuario.
* **Exportación Masiva para Jira:** Permite exportar los casos de prueba generados en formato **CSV formateado y estructurado** listo para importar masivamente en Jira (Zephyr/Xray), mapeando campos clave como nombre, pasos y resultados esperados.
* **Reporte Diario (Daily Status):** Compila reportes clasificados entre tareas completadas y planificación futura de forma profesional.

### 4. 📂 Historial de Trabajo

#### Iniciativas Finalizadas
* **Listado completo** de todas las tareas finalizadas traídas desde Jira.
* **Fecha de Asignación** (`DD/MM/YYYY`) y **Fecha de Término** (fecha de resolución en Jira) visibles en cada tarjeta.
* **Paginación Dinámica:** Selector de ítems por página (5 / 10 / 20 / 50) y paginador numérico para navegar rápidamente por el historial sin desplazamiento excesivo.
* **Buscador en Tiempo Real:** Filtrado instantáneo por clave Jira o resumen de la iniciativa.
* **Exportación a Excel:** Botón verde *"Exportar Excel"* que descarga un archivo `.xlsx` ordenado con columnas: Clave, Resumen, Estado, Fecha Asignación, Fecha Término, TQA Vinculado y URL Jira.

#### Mis Defectos / Errores
* **Sub-pestaña dedicada** que consulta Jira en tiempo real con la query: `project in ("Team QA") AND issuetype = Error AND assignee = <usuario>`.
* **Badges de Prioridad** tematizados: 🔴 Alta/Crítica · 🟡 Media · 🔵 Baja.
* **Badges de Estado** con colores semánticos:
  * 🟢 **Verde** → Cerrado / Done / Resolved / Fixed / Finalizado
  * 🟡 **Amarillo** → Diferido / On Hold / Postpuesto
  * 🔴 **Rojo** → Abierto / En progreso / Activo
* **Exportación a Excel:** Botón verde *"Exportar Excel"* que descarga un archivo `.xlsx` con columnas: Clave, Resumen, Prioridad, Estado, Fecha Creación, Fecha Cierre y URL Jira.
* Paginación y buscador compartidos con la sub-pestaña de iniciativas.

### 5. ⚖️ Comparador de BD (Auditoría Contable Local)
* **Compatibilidad Multi-formato:** Soporta la carga cruzada de archivos `CSV`, `Excel (XLSX)` y `JSON`.
* **Motor Contable Robusto:** Valida la regla contable central de Salcobrand: `Total Bruto - Descuentos = Pago Real`.
* **Tolerancia de Redondeo:** Maneja diferencias de hasta `$1` para mitigar desfases menores de redondeo.
* **Auto-Aplanado de JSON:** Capacidad inteligente para extraer datos de estructuras de JSON anidadas o complejas de forma automatizada.
* **100% Seguro y Privado:** Procesamiento local en memoria; no requiere conexión externa a bases de datos ni guarda información confidencial fuera de tu entorno.

### 6. 📂 Documentador de Evidencias de Pruebas
* **Compilación de Reportes Word y HTML:** Diseña documentos de certificación formal en formatos **DOCX (Word)** y **HTML**.
* **Generación basada en Videos y Capturas:** Procesa las grabaciones de video previas hechas durante tus ejecuciones de pruebas de QA para extraer las secuencias y armar el reporte de evidencias detalladamente.
* **Estructura de Carpetas Automática:** Crea de forma automatizada la jerarquía de carpetas local correspondiente a la iniciativa y casos de prueba para mantener un orden riguroso.

### 7. 📅 Sincronizador de Calendario & Horas
* **Cálculo Automático:** Extrae tus reuniones de hoy y calcula el total de horas automáticamente.
* **Formato Humano Legible:** Convierte horas decimales (ej. `1.67h`) a formatos claros e intuitivos (ej. `1h 40m`) tanto en reportes como en listados.
* **Envío a Jira:** Registra tus horas calculadas directamente como estimación original en tus tareas activas de Jira.

### 8. 📱 Interfaz Premium y Responsiva
* **Navegación Segmentada:** Barra superior unificada con efectos visuales *glassmorphism* y transiciones sutiles.
* **Menú Hamburguesa Móvil:** Menú dinámico que se oculta en pantallas de escritorio y se activa con animaciones fluidas (`fadeIn`) en dispositivos móviles.
* **Layout Fluido:** Soporte completo de auto-ajuste para pantallas intermedias (tablets y laptops pequeñas) mediante grids dinámicos.

---

## 🛠️ Stack Tecnológico

* **Frontend:** React (TypeScript), Lucide Icons, SheetJS (`xlsx`), Vanilla CSS con variables de diseño personalizadas.
* **Backend:** FastAPI (Python), Uvicorn, OpenCV (procesamiento de video), python-docx (reportes Word).
* **Procesamiento de Datos:** Pandas, OpenPyXL, Decimal Engine (para precisión contable absoluta).
* **AI:** OpenAI API Integration (`gpt-4o-mini`).
* **Integración:** Jira Cloud REST API v3 (JQL, issues, subtareas, worklogs).

---

## 🚀 Instalación y Configuración Rápida

### Requisitos Previos
* **Python 3.10+** instalado.
* **Node.js 18+** y **npm** instalados.

### 1. Clonar el repositorio
```bash
git clone https://github.com/rbenavir77/JiraFlow.git
cd JiraFlow
```

### 2. Configurar el Backend (FastAPI)
1. Navega al directorio del backend:
   ```bash
   cd backend
   ```
2. Crea y activa un entorno virtual de Python:
   ```bash
   python -m venv venv
   # En Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # En macOS/Linux:
   source venv/bin/activate
   ```
3. Instala las dependencias necesarias:
   ```bash
   pip install -r requirements.txt
   ```
4. Crea un archivo `.env` en la raíz de la carpeta `backend` basándote en `.env.example` y completa tus credenciales reales:
   ```env
   # Configuración de Jira
   JIRA_URL=https://tu-dominio.atlassian.net
   JIRA_EMAIL=tu-email@empresa.com
   JIRA_API_TOKEN=tu-api-token-jira
   JIRA_PROJECT_KEY=TDECOM

   # Configuración de IA (OpenAI)
   OPENAI_API_KEY=tu-api-key-openai
   OPENAI_MODEL=gpt-4o-mini

   # Configuración de Calendario
   CALENDAR_URL=http://enlace-a-tu-calendario.ics (Opcional - Si no se define, el backend leerá el archivo 'calendar.ics' local)
   GOOGLE_CALENDAR_CREDENTIALS=credentials.json (Opcional)

   # Configuración de Correo (Notificaciones)
   GMAIL_USER=tu-email@empresa.com (Opcional)
   GMAIL_PASSWORD=tu-contraseña-aplicacion-gmail (Opcional)
   ```
5. Inicia el servidor de desarrollo:
   ```bash
   python main.py
   ```
   El backend se ejecutará en: `http://127.0.0.1:8000`

### 3. Configurar el Frontend (React)
1. Abre una nueva terminal y navega al directorio del frontend:
   ```bash
   cd frontend
   ```
2. Instala las dependencias de Node:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo Vite:
   ```bash
   npm run dev
   ```
   La aplicación web estará disponible en tu navegador en: `http://localhost:5173`

---

## 📡 Endpoints del Backend (Referencia rápida)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/jira/tasks` | Tareas activas asignadas al usuario |
| `GET` | `/jira/tasks/done` | Historial de tareas finalizadas |
| `GET` | `/jira/defects` | Defectos/errores del usuario en Team QA |
| `GET` | `/jira/task/{key}/subtasks-time` | Suma estimaciones de subtareas de una iniciativa |
| `POST` | `/jira/subtasks` | Crea el flujo estándar de 7 subtareas QA |
| `POST` | `/jira/meetings-subtask` | Registra horas de reunión en Jira |
| `POST` | `/ai/refine` | Refina historia de usuario con AI |
| `POST` | `/ai/test-cases` | Genera casos de prueba con AI |
| `POST` | `/ai/daily-status` | Genera reporte daily con AI |
| `POST` | `/evidence/generate` | Genera reporte de evidencias (DOCX/HTML) |
| `POST` | `/evidence/create-structure` | Crea estructura de carpetas de evidencias |
| `GET` | `/calendar/events` | Lista eventos del calendario |

---

## 🛡️ Seguridad y Privacidad

El módulo **Comparador de BD** ha sido diseñado bajo la filosofía **Local-First / Memory-Only**:
* No requiere credenciales ni conexiones directas a las bases de datos de producción de la empresa.
* Toda la comparación de datos sensibles de auditorías se procesa estrictamente en la memoria RAM del servidor local FastAPI.
* Ningún dato contable subido es guardado en disco duro ni se comparte fuera de tu máquina de trabajo local, garantizando cumplimiento absoluto de las políticas corporativas de seguridad de la información.

---

## 📝 Changelog

### v2.1.0 — Mayo 2026
* ✅ **Calculadora de Tiempos:** Suma automática de estimaciones originales de subtareas con desglose en horas y días.
* ✅ **Fechas en tarjetas:** Fecha de asignación (`created`) y fecha de término (`resolutiondate`) visibles en Asignaciones e Historial.
* ✅ **Paginación en Historial:** Selector de ítems por página y paginador numérico dinámico.
* ✅ **Buscador en tiempo real:** Filtrado instantáneo por clave o resumen en el módulo Historial.
* ✅ **Módulo Mis Defectos:** Nueva sub-pestaña en Historial que consulta errores del usuario en Jira via JQL.
* ✅ **Badges semánticos:** Colores Verde/Rojo/Amarillo para estados de defectos según su ciclo de vida.
* ✅ **Exportación a Excel:** Descarga de iniciativas finalizadas y defectos en `.xlsx` ordenado con SheetJS.

---

Desarrollado por **Ricardo Benavides** | [JiraFlow QA Assistant](https://github.com/rbenavir77/JiraFlow) ⚡
