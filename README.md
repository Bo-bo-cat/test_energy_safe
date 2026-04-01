## Структура проекту

```
test_energy_save/
├── backend/                # Серверна частина (Python/Flask)
│   ├── app.py              # Основна логіка API та робота з БД
│   ├── Dockerfile          # Інструкція для збірки бекенд-контейнера
│   └── requirements.txt    # Залежності (Flask, PyMongo, Requests)
├── frontend/               # Клієнтська частина (Next.js/React)
│   ├── src/                # Вихідний код інтерфейсу
│   ├── package.json        # Налаштування JS-проєкту та бібліотек
│   ├── Dockerfile          # Інструкція для збірки фронтенд-контейнера
│   └── .env.local          # Локальні змінні для фронтенду
├── docker-compose.yml      # Файл для одночасного запуску обох сервісів
├── .env                    # Глобальні секретні ключі (MONGO_URI)
└── .gitignore              # Список файлів, що ігноруються Git (напр. .env)
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

