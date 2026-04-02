## Структура проекту

```
test_energy_safe/
├── backend/                            # Серверна частина (Python/Flask)
│   ├── app.py                          # Основна логіка API та робота з БД
│   ├── Dockerfile                      # Інструкція для збірки бекенд-контейнера
│   └── requirements.txt               # Залежності (Flask, PyMongo, Requests)
│
├── frontend/                           # Клієнтська частина (Next.js/React)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx             ← root (БЕЗ сайдбару, тільки <html><body>)
│   │   │   ├── globals.css
│   │   │   │
│   │   │   ├── (main)/                ← групування з сайдбаром (не впливає на URL)
│   │   │   │   ├── layout.tsx         ← З сайдбаром
│   │   │   │   ├── page.tsx           ← / (Головна)
│   │   │   │   ├── devices/
│   │   │   │   │   ├── page.tsx       ← /devices (Мої прилади)
│   │   │   │   │   └── add/
│   │   │   │   │       ├── page.tsx   ← /devices/add (Вибір способу)
│   │   │   │   │       ├── scan/
│   │   │   │   │       │   └── page.tsx ← /devices/add/scan (Сканування)
│   │   │   │   │       └── manual/
│   │   │   │   │           └── page.tsx ← /devices/add/manual (Вручну)
│   │   │   │   ├── calculator/
│   │   │   │   │   └── page.tsx       ← /calculator (Розрахунок)
│   │   │   │   ├── scenarios/
│   │   │   │   │   └── page.tsx       ← /scenarios (Сценарії)
│   │   │   │   └── profile/
│   │   │   │       └── page.tsx       ← /profile (Профіль)
│   │   │   │
│   │   │   ├── auth/                  ← БЕЗ сайдбару
│   │   │   │   └── page.tsx           ← /auth (Вхід)
│   │   │   │
│   │   │   └── onboarding/            ← БЕЗ сайдбару
│   │   │       └── page.tsx           ← /onboarding (Чи є ДБЖ?)
│   │   │
│   │   └── components/
│   │       ├── Sidebar.tsx            ← навігація зліва
│   │       ├── Modal.tsx              ← базова модалка
│   │       ├── DeviceCard.tsx         ← рядок приладу в списку
│   │       ├── ScenarioCard.tsx       ← картка сценарію
│   │       └── StatusGauge.tsx        ← кругова діаграма на головній
│   │
│   ├── package.json
│   ├── Dockerfile
│   └── .env.local
│
├── docker-compose.yml
├── .env
└── .gitignore
```

## Запуск локально

### 1. Клонуй репо
```bash
git clone <repo-url>
cd skylink
```

### 2. Налаштуй змінні середовища
```bash
cp .env.example .env
# відредагуй .env під свої налаштування
```

### 3. Запусти базу даних
```bash
docker-compose up db
```

### 4. Запусти бекенд
```bash
cd backend
npm install
npm run dev
```

### 5. Запусти фронтенд
```bash
cd frontend
npm install
npm run dev
```

