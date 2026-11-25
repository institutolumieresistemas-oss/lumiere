# Lumiere — Monorepo Unificado

Monorepo para gestionar las 4 aplicaciones de **Lumiere** en un solo repositorio.

## Estructura del monorepo
- `api/` — API REST PHP Lumen (`https://api.lumieresiga.com/`) → despliega a `/home/u740702945/domains/lumieresiga.com/public_html/api`.
- `admin/` — Panel Admin SIGA (Angular 17) (`https://nueva.lumieresiga.com/`) → despliega al subdominio nueva `/home/u740702945/domains/lumieresiga.com/public_html/nueva`.
- `web/` — Web Cursos Lumiere (Angular 20) (`https://cursoslumiere.com/`) → despliega a la raíz `/home/u740702945/domains/cursoslumiere.com/public_html`, **protegiendo y preservando** la subcarpeta `dashboard/`, `quizes/`, `app/`, `licencias/`, etc.
- `dashboard/` — Dashboard Builder (Angular 20) (`https://cursoslumiere.com/dashboard/`) → despliega exclusivamente a `/home/u740702945/domains/cursoslumiere.com/public_html/dashboard` sin tocar la web raíz.
- `.github/workflows/` — Workflows individuales con filtro `paths:` (`deploy-api.yml`, `deploy-admin.yml`, `deploy-web.yml`, `deploy-dashboard.yml`).
- `iniciar-backend.bat`, `iniciar-admin.bat`, `iniciar-web.bat`, `iniciar-dashboard.bat` — Scripts para arranque local en Windows.

## Despliegue automático a Hostinger
En GitHub (**Settings → Secrets and variables → Actions**), agrega:
- `HOSTINGER_SSH_PASSWORD` *(contraseña SSH de la cuenta `u740702945` en `31.170.166.250`)*.

Al hacer `git push` a `main`, únicamente se compila y despliega la aplicación modificada.

## Ejecución local
- **API (`api/`):** `iniciar-backend.bat` (`http://127.0.0.1:8000`)
- **Admin (`admin/`):** `iniciar-admin.bat` (`http://localhost:4200`)
- **Web (`web/`):** `iniciar-web.bat` (`http://localhost:4200`)
- **Dashboard (`dashboard/`):** `iniciar-dashboard.bat` (`http://localhost:4201`)
