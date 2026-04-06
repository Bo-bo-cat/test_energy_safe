# Energy Safe

Застосунок для підрахунку споживання електроенергії через інвертор/зарядну станцію.

---

## Структура проекту

```
test_energy_safe/
├── backend/
│   ├── app/
│   │   ├── main.py                 ← FastAPI, CORS, lifespan
│   │   ├── database.py             ← підключення до MongoDB (Motor)
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── device.py
│   │   │   └── scenario.py
│   │   ├── routes/
│   │   │   ├── users.py
│   │   │   ├── devices.py
│   │   │   └── scenarios.py
│   │   └── services/
│   │       └── gemini_service.py   ← класифікація пристроїв через Gemini AI
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── auth/
│   │   │   └── page.tsx            ← /auth — реєстрація, POST /users
│   │   ├── onboarding/
│   │   │   └── page.tsx            ← /onboarding — чи є ДБЖ
│   │   └── (main)/
│   │       ├── layout.tsx          ← сайдбар навігація
│   │       ├── page.tsx            ← / — головна, fetch devices + scenarios
│   │       ├── devices/
│   │       │   └── page.tsx        ← /devices — список приладів
│   │       ├── calculator/
│   │       │   └── page.tsx        ← /calculator — розрахунок споживання
│   │       ├── scenarios/
│   │       │   └── page.tsx        ← /scenarios — список сценаріїв
│   │       ├── picker/
│   │       │   └── page.tsx        ← /picker — підбір системи
│   │       └── profile/
│   │           └── page.tsx        ← /profile — профіль користувача
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml
├── .env                            ← НЕ комітити (є в .gitignore)
└── .gitignore
```

---

## Швидкий старт (Docker)

### 1. Налаштуй змінні середовища

Створи `.env` в корені проекту:

```env
MONGODB_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/EnergySafeDB?retryWrites=true&w=majority
DATABASE_NAME=EnergySafeDB
GEMINI_API_KEY=your_gemini_api_key_here
ALLOWED_ORIGINS=http://localhost:5000
```

### 2. Збілдуй і запусти

```bash
docker-compose up --build
```

Або у фоні:

```bash
docker-compose up --build -d
```

### 3. Відкрий в браузері

| Сервіс | URL |
|--------|-----|
| Frontend | http://localhost:5000 |
| Backend API | http://localhost:8080 |
| Swagger docs | http://localhost:8080/docs |

### 4. Зупинити

```bash
docker-compose down
```

Зупинити і видалити образи:

```bash
docker-compose down --rmi all
```

---

## Флоу користувача

1. Відкрий `http://localhost:5000/auth`
2. Введи ім'я та email → натисни **Увійти** (POST `/users`)
3. `user_id` зберігається в `localStorage` браузера
4. Всі сторінки автоматично тягнуть дані для цього користувача

---

## Запуск локально (без Docker)

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend запускається на порту **5000** (налаштовано в `package.json`).

Створи `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## API Endpoints

### Health
| Method | Path | Опис |
|--------|------|------|
| GET | `/health` | Стан сервера та з'єднання з БД |

### Users
| Method | Path | Опис |
|--------|------|------|
| POST | `/users` | Створити користувача |
| GET | `/users/{user_id}` | Отримати профіль |

**POST /users:**
```json
{
  "email": "user@example.com",
  "name": "Іван Іваненко",
  "has_inverter": true,
  "inverter_capacity_wh": 1200
}
```

### Devices
| Method | Path | Опис |
|--------|------|------|
| POST | `/devices` | Додати пристрій (автокласифікація Gemini) |
| GET | `/devices?user_id={id}` | Список пристроїв |
| GET | `/devices/{device_id}` | Один пристрій |
| PUT | `/devices/{device_id}` | Оновити пристрій |
| DELETE | `/devices/{device_id}` | Видалити пристрій |
| POST | `/devices/classify` | Класифікація без збереження |

**POST /devices:**
```json
{
  "user_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "model_name": "Samsung RB34",
  "power_watts": 150,
  "brand": "Samsung",
  "daily_usage_hours": 24,
  "is_critical": true
}
```

### Scenarios
| Method | Path | Опис |
|--------|------|------|
| POST | `/scenarios` | Створити сценарій |
| GET | `/scenarios?user_id={id}` | Список сценаріїв |
| GET | `/scenarios/{scenario_id}` | Деталі сценарію |
| DELETE | `/scenarios/{scenario_id}` | Видалити сценарій |

**POST /scenarios:**
```json
{
  "user_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "name": "Відключення 4 години",
  "duration_hours": 4,
  "devices_included": [
    "64f1a2b3c4d5e6f7a8b9c0d2",
    "64f1a2b3c4d5e6f7a8b9c0d3"
  ]
}
```

Відповідь включає:
- `total_consumption_wh` — автоматично підраховане споживання (Вт·год)
- `battery_sufficient` — чи вистачить батареї інвертора (якщо є)

---

## Категорії пристроїв (Gemini)

`Холодильник`, `Телевізор`, `Пральна машина`, `Мікрохвильовка`, `Кондиціонер`,
`Ноутбук`, `Роутер`, `Освітлення`, `Зарядний пристрій`, `Посудомийна машина`,
`Електрочайник`, `Кавоварка`, `Інше`

## Коди помилок Gemini

| Код | Причина |
|-----|---------|
| 400 | Порожня або занадто коротка назва |
| 422 | Gemini не розпізнав як реальний пристрій |
| 502 | Помилка з'єднання з Gemini API |
| 503 | GEMINI_API_KEY не налаштовано |

---

## Зміни які були зроблені

### Docker
- `frontend/Dockerfile` — оновлено з `node:18` до `node:20` (Next.js 16+ вимагає Node >= 20)
- `frontend/Dockerfile` — додано `ARG`/`ENV NEXT_PUBLIC_API_URL` для передачі змінної при білді
- `frontend/Dockerfile` — виправлено `EXPOSE` з 3000 на 5000 (відповідає `package.json`)
- `docker-compose.yml` — додано сервіс `frontend` з портом 5000, env var та volume
- `docker-compose.yml` — `build.args` для `NEXT_PUBLIC_API_URL`

### Backend
- `.env` — виправлено баг `ALLOWED_ORIGINS=ALLOWED_ORIGINS=...` (дубльований ключ)
- `.env` — виправлено `ALLOWED_ORIGINS` на порт 5000 (порт фронтенду)

### Frontend — підключення до API
- `auth/page.tsx` — додано форму реєстрації, `POST /users`, збереження `user_id` в `localStorage`
- `(main)/page.tsx` — `GET /devices` + `GET /scenarios`, реальні дані замість hardcode
- `devices/page.tsx` — `GET /devices?user_id=...`
- `calculator/page.tsx` — `GET /devices`, підрахунок `power_watts × daily_usage_hours`
- `scenarios/page.tsx` — `GET /scenarios?user_id=...`
- `profile/page.tsx` — `GET /users/{id}`

### Git
- `.gitignore` — додано `node_modules/`, `.next/`, `.env.example`, `.env.exemple`, IDE файли, системні файли
