FROM ghcr.io/abetlen/llama-cpp-python:latest

WORKDIR /app

# Copy the startup script
COPY api/run.sh /api/run.sh
RUN chmod +x /api/run.sh

# Create directory for models
RUN mkdir -p /models

EXPOSE 8000

CMD ["/bin/sh", "/api/run.sh"]
