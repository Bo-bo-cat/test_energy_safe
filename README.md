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

Застосунок для підрахунку споживання електроенергії через інвертор/зарядну станцію.

---

## Структура проекту

```
test_energy_safe/
├── backend/
│   ├── app/
│   │   ├── main.py                 ← FastAPI, CORS, JWT, lifespan
│   │   ├── database.py             ← підключення до MongoDB (Motor)
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── device.py           ← VALID_CATEGORIES список
│   │   │   └── scenario.py
│   │   ├── routes/
│   │   │   ├── users.py
│   │   │   ├── devices.py          ← POST /devices/classify, POST /devices
│   │   │   └── scenarios.py
│   │   └── services/
│   │       └── ai_service.py       ← класифікація через Groq AI (llama-3.3-70b)
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── auth/
│   │   │   └── page.tsx            ← /auth — реєстрація/вхід, JWT в localStorage
│   │   ├── onboarding/
│   │   │   └── page.tsx            ← /onboarding — чи є ДБЖ
│   │   └── (main)/
│   │       ├── layout.tsx          ← сайдбар навігація
│   │       ├── page.tsx            ← / — головна, fetch devices + scenarios
│   │       ├── devices/
│   │       │   ├── page.tsx        ← /devices — список приладів
│   │       │   └── add/
│   │       │       ├── page.tsx        ← /devices/add — вибір способу
│   │       │       ├── manual/
│   │       │       │   └── page.tsx    ← /devices/add/manual — форма + AI пошук
│   │       │       └── scan/
│   │       │           └── page.tsx    ← /devices/add/scan — скоро буде
│   │       ├── calculator/
│   │       │   └── page.tsx        ← /calculator — розрахунок споживання
│   │       ├── scenarios/
│   │       │   └── page.tsx        ← /scenarios — список сценаріїв
│   │       ├── picker/
│   │       │   └── page.tsx        ← /picker — підбір системи
│   │       └── profile/
│   │           └── page.tsx        ← /profile — профіль користувача
│   ├── src/components/icons/       ← SVG іконки як React компоненти
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml
├── .env                            ← НЕ комітити (є в .gitignore)
├── .env.example                    ← шаблон змінних (безпечно комітити)
└── .gitignore
```

---

## Швидкий старт (Docker)

### 1. Налаштуй змінні середовища

Створи `.env` в корені проекту (скопіюй з `.env.example`):

```env
MONGODB_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/EnergySafeDB?retryWrites=true&w=majority
DATABASE_NAME=EnergySafeDB
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET_KEY=your-super-secret-key-change-this
ALLOWED_ORIGINS=http://localhost:5000
```

> Отримати безкоштовний Groq API ключ: https://console.groq.com

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
| Frontend | http://localhost:3000 |
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

## Флоу користувача

1. Відкрий `http://localhost:5000/auth`
2. Введи ім'я та email → натисни **Увійти**
3. `access_token` (JWT) зберігається в `localStorage` браузера
4. Всі запити до API автоматично надсилають токен в заголовку `Authorization: Bearer <token>`

---

## Додавання приладу

На сторінці `/devices/add` доступні два способи:

### Ввести вручну (`/devices/add/manual`)

1. Введи назву моделі (наприклад: `Gorenje RK4182PW4`)
2. Натисни **Знайти** — Groq AI автоматично визначить:
   - Категорію
   - Потужність (Вт)
   - Пусковий струм (для пристроїв з двигуном)
3. Перевір/відкоригуй поля
4. Натисни **Зберегти**

### Фото етикетки (`/devices/add/scan`)

Поки в розробці — буде доступно найближчим часом.

---

## API Endpoints

### Health
| Method | Path | Опис |
|--------|------|------|
| GET | `/health` | Стан сервера та з'єднання з БД |

### Users
| Method | Path | Опис |
|--------|------|------|
| POST | `/users` | Реєстрація / вхід (повертає JWT токен) |
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

**Відповідь:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user_id": "64f1a2b3c4d5e6f7a8b9c0d1"
}
```

### Devices
| Method | Path | Опис |
|--------|------|------|
| POST | `/devices/classify` | AI класифікація без збереження |
| POST | `/devices` | Додати пристрій |
| GET | `/devices?user_id={id}` | Список пристроїв користувача |
| GET | `/devices/{device_id}` | Один пристрій |
| PUT | `/devices/{device_id}` | Оновити пристрій |
| DELETE | `/devices/{device_id}` | Видалити пристрій |

**POST /devices/classify** — тільки визначає категорію та потужність, нічого не зберігає:
```json
{ "model_name": "Gorenje RK4182PW4" }
```
Відповідь:
```json
{
  "is_valid": true,
  "category": "Холодильник",
  "power_watts": 150,
  "startup_current_watts": 525,
  "brand": "Gorenje"
}
```

**POST /devices** — зберігає пристрій (потрібен JWT токен):
```json
{
  "model_name": "Gorenje RK4182PW4",
  "category": "Холодильник",
  "power_watts": 150,
  "startup_current_watts": 525,
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

## Категорії пристроїв

`Холодильник`, `Телевізор`, `Пральна машина`, `Мікрохвильовка`, `Кондиціонер`,
`Ноутбук`, `Роутер`, `Освітлення`, `Зарядний пристрій`, `Посудомийна машина`,
`Електрочайник`, `Кавоварка`, `Інше`

---

## Коди помилок AI класифікації

| Код | Причина |
|-----|---------|
| 400 | Порожня або занадто коротка назва |
| 422 | Пристрій не розпізнано як побутовий електроприлад |
| 502 | Помилка з'єднання з Groq API |
| 503 | `GROQ_API_KEY` не налаштовано або недійсний |

---

## Зміни які були зроблені

### Backend
- `ai_service.py` — новий сервіс класифікації через **Groq API** (модель `llama-3.3-70b-versatile`), замінив попередній `gemini_service.py`
- `devices.py` — додано ендпоінт `POST /devices/classify` для пошуку без збереження; авторизація через JWT
- `device.py` — оновлено модель, додано `VALID_CATEGORIES`
- `requirements.txt` — оновлено залежності (додано `httpx`, `python-jose`)
- `.env.example` — додано `JWT_SECRET_KEY`

### Frontend — нові сторінки
- `/devices/add` — вибір способу додавання (вручну або фото)
- `/devices/add/manual` — форма з кнопкою **Знайти**: AI автоматично заповнює категорію та потужність
- `/devices/add/scan` — заглушка "Скоро буде!"

### Frontend — оновлені сторінки
- `auth/page.tsx` — збереження `access_token` (JWT) замість `user_id`
- `devices/page.tsx` — повний UI зі списком приладів та кнопкою додавання
- `onboarding/page.tsx` — оновлений UI

### Frontend — іконки
Додано SVG іконки як React компоненти: `AirFryer`, `Alert`, `Calc`, `Camera`, `Charger`, `Check`, `Checkbox`, `Coffee_Machine`, `Conditioner`, `Device`, `Fridge`, `Home`, `Laptop`, `Light`, `Pen`, `Profile`, `Router`, `Scenario`, `System`, `Tv`

### Docker
- `frontend/Dockerfile` — оновлено з `node:18` до `node:20`, додано `ARG`/`ENV NEXT_PUBLIC_API_URL`
- `docker-compose.yml` — налаштовано сервіс `frontend` з портом 5000 та передачею env vars при білді

### Git
- `.gitignore` — захищено `.env` файли, `node_modules/`, `.next/`, IDE файли
