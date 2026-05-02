# NJE Eseménykezelő Platform

Neumann János Egyetem eseménykezelő webalkalmazás.

## Technológiák

- **Backend**: ASP.NET Core .NET 10 Web API (`backend/`)
- **Frontend**: React + Vite + TypeScript + Tailwind CSS (`frontend/`)
- **E2E tesztek**: Playwright (`e2e/`)
- **Adatbázis**: SQL Server Express (`.\SQLEXPRESS`, adatbázis: `NJEDb`)

## Gyors indítás

### Előfeltételek

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 18+](https://nodejs.org/)
- SQL Server Express (`.\SQLEXPRESS`)

### Telepítés

```bash
# 1. Repo root függőségek (concurrently)
npm install

# 2. Frontend függőségek
cd frontend && npm install && cd ..

# 3. Adatbázis migrálás
dotnet ef database update --project backend
```

### Fejlesztői szerver indítása

```bash
# Backend + Frontend egyszerre
npm run dev
```

Ez elindítja:
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

### Csak backend

```bash
npm run dev:backend
# vagy
dotnet run --project backend
```

### Csak frontend

```bash
npm run dev:frontend
# vagy
cd frontend && npm run dev
```

### E2E tesztek futtatása

```bash
# Mindkét szerver legyen futó, majd:
npm run test:e2e
# vagy
cd e2e && npx playwright test
```

## Admin fiók létrehozása

1. Regisztrálj egy felhasználót a `/register` oldalon
2. Futtasd az alábbi SQL parancsot az adatbázison:

```sql
UPDATE Users SET Role='Admin' WHERE Email='admin@nje.hu';
```

## API dokumentáció

Swagger UI elérhető fejlesztői módban: `http://localhost:5000/swagger`

## Projekt struktúra

```
/
├── backend/          # ASP.NET Core Web API
├── frontend/         # React PWA
├── e2e/              # Playwright E2E tesztek
├── .kiro/            # Spec és steering fájlok
├── package.json      # Root dev launcher
└── NJE.slnx          # .NET solution fájl
```
