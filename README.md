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
* **Historial Integrado:** Módulo para revisar tareas completadas y archivar flujos finalizados.

### 2. 🧠 Copiloto AI Integrado
* **Refinamiento de Historias:** Estructura historias de usuario bajo el estándar ágil óptimo.
* **Generador de Casos de Prueba:** Diseña suites de pruebas detalladas a partir del análisis de historias de usuario.
* **Reporte Diario (Daily Status):** Compila reportes clasificados entre tareas completadas y planificación futura de forma profesional.

### 3. ⚖️ Comparador de BD (Auditoría Contable Local)
* **Compatibilidad Multi-formato:** Soporta la carga cruzada de archivos `CSV`, `Excel (XLSX)` y `JSON`.
* **Motor Contable Robusto:** Valida la regla contable central de Salcobrand: `Total Bruto - Descuentos = Pago Real`.
* **Tolerancia de Redondeo:** Maneja diferencias de hasta `$1` para mitigar desfases menores de redondeo.
* **Auto-Aplanado de JSON:** Capacidad inteligente para extraer datos de estructuras de JSON anidadas o complejas de forma automatizada.
* **100% Seguro y Privado:** Procesamiento local en memoria; no requiere conexión externa a bases de datos ni guarda información confidencial fuera de tu entorno.

### 4. 📅 Sincronizador de Calendario & Horas
* **Cálculo Automático:** Extrae tus reuniones de hoy y calcula el total de horas automáticamente.
* **Formato Humano Legible:** Convierte horas decimales (ej. `1.67h`) a formatos claros e intuitivos (ej. `1h 40m`) tanto en reportes como en listados.
* **Envío a Jira:** Registra tus horas calculadas directamente como estimación original en tus tareas activas de Jira.

### 5. 📱 Interfaz Premium y Responsiva
* **Navegación Segmentada:** Barra superior unificada con efectos visuales *glassmorphism* y transiciones sutiles.
* **Menú Hamburguesa Móvil:** Menú dinámico que se oculta en pantallas de escritorio y se activa con animaciones fluidas (`fadeIn`) en dispositivos móviles.
* **Layout Fluido:** Soporte completo de auto-ajuste para pantallas intermedias (tablets y laptops pequeñas) mediante grids dinámicos.

---

## 🛠️ Stack Tecnológico

* **Frontend:** React (TypeScript), Lucide Icons, Vanilla CSS con variables de diseño personalizadas.
* **Backend:** FastAPI (Python), Uvicorn.
* **Procesamiento de Datos:** Pandas, OpenPyXL, Decimal Engine (para precisión contable absoluta).
* **AI:** Google Gemini API Integration.

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
4. Crea un archivo `.env` en la raíz de la carpeta `backend` basándote en `.env.example` y completa tus credenciales:
   ```env
   JIRA_URL=https://tu-dominio.atlassian.net
   JIRA_USER=tu-email@empresa.com
   JIRA_TOKEN=tu-api-token-jira
   GEMINI_API_KEY=tu-api-key-gemini
   CALENDAR_URL=http://enlace-a-tu-calendario.ics (Opcional)
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

## 🛡️ Seguridad y Privacidad

El módulo **Comparador de BD** ha sido diseñado bajo la filosofía **Local-First / Memory-Only**:
* No requiere credenciales ni conexiones directas a las bases de datos de producción de la empresa.
* Toda la comparación de datos sensibles de auditorías se procesa estrictamente en la memoria RAM del servidor local FastAPI.
* Ningún dato contable subido es guardado en disco duro ni se comparte fuera de tu máquina de trabajo local, garantizando cumplimiento absoluto de las políticas corporativas de seguridad de la información.

---

Desarrollado por **Ricardo Benavides** | [JiraFlow QA Assistant](https://github.com/rbenavir77/JiraFlow) ⚡
