# Configuración de Inteligencia Artificial

## Estado Actual

La aplicación ha sido reconfigurada para reemplazar **Google Gemini** por una solución más robusta y flexible.

### Opciones Disponibles

#### 1. **Ollama (Recomendado - Local, Gratuito)**
- **Ventajas**: Sin costo, funciona offline, rápido para desarrollo
- **Desventajas**: Requiere recursos locales, menos potente que soluciones cloud
- **Estado**: ✅ **Activo por defecto**

**Instalación de Ollama:**
```bash
# Windows
# Descargar desde: https://ollama.ai
# O con Winget:
winget install ollama

# Después de instalar, descarga el modelo:
ollama pull llama3.2
# O un modelo más potente:
ollama pull mistral
ollama pull neural-chat
```

**Verificar que está funcionando:**
```bash
ollama list
# Debe mostrar los modelos descargados
```

---

#### 2. **OpenAI (GPT-3.5-turbo / GPT-4) - Alternativa Cloud**
- **Ventajas**: Más potente, mejor calidad de respuestas
- **Desventajas**: Requiere API key y pago por uso

**Para usar OpenAI:**

1. Obtén tu API key en https://platform.openai.com/api-keys
2. En `backend/.env`, descomenta y configura:
```env
OPENAI_API_KEY=sk-...tu-clave-aqui...
OPENAI_MODEL=gpt-3.5-turbo
# O usa GPT-4 si tienes acceso:
# OPENAI_MODEL=gpt-4
```

3. La aplicación automáticamente usará OpenAI si `OPENAI_API_KEY` está configurada.

---

## Cambios Realizados

### ✅ Eliminado
- `google-generativeai` de `requirements.txt`
- `GEMINI_API_KEY` de `.env` y `.env.example`
- Código heredado de Gemini

### ✅ Agregado
- `ollama` para modelos locales
- `openai` para soporte de GPT
- Lógica dual en `AIService` para elegir entre Ollama y OpenAI automáticamente

### ✅ Archivo Actualizado
- `backend/requirements.txt` - Dependencias actualizadas
- `backend/services/ai_service.py` - Nueva lógica flexible
- `backend/.env` - Configuración actualizada
- `backend/.env.example` - Ejemplo actualizado

---

## Cómo Instalar Dependencias

```bash
cd backend
pip install -r requirements.txt
```

---

## Flujo de Selección de Modelo

```
¿OPENAI_API_KEY está configurada?
├─ SÍ → Usar OpenAI (GPT-3.5-turbo o modelo configurado)
└─ NO → Usar Ollama local (llama3.2 por defecto)
```

---

## Testing

Para probar que todo funciona:

```bash
python -c "from services.ai_service import AIService; svc = AIService(); print(svc._generate_content('Dime hola'))"
```

---

## Recomendaciones

- **Para desarrollo local**: Usa Ollama (gratuito y simple)
- **Para producción**: Considera OpenAI (más confiable y potente)
- **Para máxima calidad**: Usa `gpt-4` con OpenAI (requiere créditos)

---

## Solución de Problemas

### Error: "Model 'llama3.2' not found"
```bash
ollama pull llama3.2
ollama run llama3.2
```

### Error: "OpenAI API error"
- Verifica que tu API key sea válida
- Verifica que tengas créditos en tu cuenta OpenAI
- Comprueba la URL de la API: https://api.openai.com/v1

### Error de conexión a Ollama
- Verifica que Ollama esté corriendo: `ollama serve`
- Ollama escucha en `http://localhost:11434` por defecto
