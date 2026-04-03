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

<<<<<<< Updated upstream

=======
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
>>>>>>> Stashed changes
