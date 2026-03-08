FROM python:3.12-slim

WORKDIR /app

# uv インストール
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# 依存関係をキャッシュレイヤーとして先にコピー
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# アプリケーションコードをコピー
COPY app/ ./app/

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
