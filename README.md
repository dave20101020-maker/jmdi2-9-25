# Development Workspace

This repository is used for internal testing and development.

## Environment

Create a `.env` file (or update your existing one) that points the Vite frontend at the backend API. By default the app uses `/api`, which is proxied to the backend during `npm run dev`.

```
VITE_API_URL="/api"              # default; proxied to backend in dev
# VITE_API_URL="https://api.example.com"  # override for staging/prod
```

Ask your platform admin for the correct values before running the app locally.
