## Структура проекту

```
test_energy_safe/
├── backend/                        # Серверна частина (Python/Flask)
│   ├── app.py                      # Основна логіка API та робота з БД
│   ├── Dockerfile                  # Інструкція для збірки бекенд-контейнера
│   └── requirements.txt            # Залежності (Flask, PyMongo, Requests)
│
├── frontend/                       # Клієнтська частина (Next.js/React)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          ← сайдбар (для всіх крім auth/onboarding)
│   │   │   ├── globals.css
│   │   │   ├── page.tsx            ← / (Головна)
│   │   │   ├── auth/
│   │   │   │   ├── layout.tsx      ← без сайдбару
│   │   │   │   └── page.tsx        ← /auth (Вхід)
│   │   │   ├── onboarding/
│   │   │   │   ├── layout.tsx      ← без сайдбару
│   │   │   │   └── page.tsx        ← /onboarding (Чи є ДБЖ?)
│   │   │   ├── devices/
│   │   │   │   ├── page.tsx        ← /devices (Мої прилади)
│   │   │   │   └── add/
│   │   │   │       ├── page.tsx    ← /devices/add (Вибір способу)
│   │   │   │       ├── scan/
│   │   │   │       │   └── page.tsx ← /devices/add/scan (Сканування)
│   │   │   │       └── manual/
│   │   │   │           └── page.tsx ← /devices/add/manual (Вручну)
│   │   │   ├── calculator/
│   │   │   │   └── page.tsx        ← /calculator (Розрахунок)
│   │   │   ├── scenarios/
│   │   │   │   └── page.tsx        ← /scenarios (Сценарії)
│   │   │   └── profile/
│   │   │       └── page.tsx        ← /profile (Профіль)
│   │   │
│   │   └── components/
│   │       ├── Sidebar.tsx         ← навігація зліва
│   │       ├── Modal.tsx           ← базова модалка
│   │       ├── DeviceCard.tsx      ← рядок приладу в списку
│   │       ├── ScenarioCard.tsx    ← картка сценарію
│   │       └── StatusGauge.tsx     ← кругова діаграма на головній
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

# Energy Safe — Backend

## Вимоги

- Docker & Docker Compose
- MongoDB Atlas акаунт
- Google Gemini API ключ

## Швидкий старт

### 1. Налаштуй змінні середовища

```bash
cp backend/.env.example .env
```

Відредагуй `.env`:

```env
MONGODB_URL=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=energy_safe
GEMINI_API_KEY=your_gemini_api_key_here
ALLOWED_ORIGINS=http://localhost:3000,http://frontend:3000
```

### 2. Запуск через Docker

```bash
docker-compose up --build
```

API доступне за адресою: `http://localhost:8080`

Інтерактивна документація: `http://localhost:8080/docs`

### 3. Запуск локально (без Docker)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## API Endpoints

### Health
| Method | Path | Опис |
|--------|------|------|
| GET | `/health` | Перевірка стану сервера та БД |

### Users
| Method | Path | Опис |
|--------|------|------|
| POST | `/users` | Створити користувача |
| GET | `/users/{user_id}` | Отримати профіль |

**POST /users — приклад:**
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
| POST | `/devices` | Додати пристрій (автокласифікація через Gemini) |
| GET | `/devices?user_id={id}` | Список пристроїв користувача |
| GET | `/devices/{device_id}` | Один пристрій |
| PUT | `/devices/{device_id}` | Оновити пристрій |
| DELETE | `/devices/{device_id}` | Видалити пристрій |
| POST | `/devices/classify` | Тільки класифікація без збереження |

**POST /devices — приклад:**
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

**POST /devices/classify — приклад:**
```json
{ "model_name": "Samsung RB34" }
```
Відповідь:
```json
{ "category": "Холодильник", "is_valid": true }
```

### Scenarios
| Method | Path | Опис |
|--------|------|------|
| POST | `/scenarios` | Створити сценарій (автопідрахунок споживання) |
| GET | `/scenarios?user_id={id}` | Список сценаріїв |
| GET | `/scenarios/{scenario_id}` | Деталі сценарію |
| DELETE | `/scenarios/{scenario_id}` | Видалити сценарій |

**POST /scenarios — приклад:**
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
- `total_consumption_wh` — автоматично підраховане споживання
- `battery_sufficient` — чи вистачить батареї інвертора (якщо є)

---

## Допустимі категорії пристроїв

`Холодильник`, `Телевізор`, `Пральна машина`, `Мікрохвильовка`, `Кондиціонер`,
`Ноутбук`, `Роутер`, `Освітлення`, `Зарядний пристрій`, `Посудомийна машина`,
`Електрочайник`, `Кавоварка`, `Інше`

## Коди помилок Gemini класифікації

| Код | Причина |
|-----|---------|
| 400 | Порожня або занадто коротка назва |
| 422 | Gemini не розпізнав як реальний пристрій |
| 502 | Помилка з'єднання з Gemini API |
| 503 | GEMINI_API_KEY не налаштовано |
