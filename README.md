## Структура проекту

```
skylink/
├── frontend/   — Next.js додаток
├── backend/    — Python 
├── docs/       — Діаграми архітектури та БД
├── ai-service/ — Python 
├── .env        — секретики
├── gitignore  
└── docker-compose.yml
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

