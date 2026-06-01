FROM python:3.13-slim

# Dependencias del sistema:
# - python3-tk: requerido porque evidence_service.py importa tkinter al cargar.
#   (El selector gráfico de carpetas no abrirá en un contenedor headless, pero
#    el import no debe fallar para que main.py arranque).
# - libglib2.0-0: runtime mínimo para OpenCV.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3-tk libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# main.py ya levanta uvicorn en 0.0.0.0:8000
CMD ["python", "main.py"]
