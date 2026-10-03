FROM python:3.12-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app/backend
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
RUN useradd --uid 10001 --create-home noema
COPY --chown=noema:noema backend ./
RUN mkdir -p /app/backend/staticfiles /data/media && chown -R noema:noema /app/backend/staticfiles /data/media
USER noema
EXPOSE 8000
CMD ["gunicorn", "noema_project.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "2", "--timeout", "45", "--max-requests", "1000", "--max-requests-jitter", "100", "--error-logfile", "-", "--control-socket", "/tmp/gunicorn.ctl"]
