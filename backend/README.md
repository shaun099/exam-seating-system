# Exam Seating Allocation System - Backend

A FastAPI-based backend service for managing exam seating arrangements.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)

---

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Python** 3.8 or higher
- **pip** (Python package manager)

---

## 📦 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd exam_seating_system/backend
```

### 2. Create a Virtual Environment (Recommended)

**Windows:**

```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 🚀 Running the Application

### Development Server

Run the following command to start the development server with hot-reload:

```bash
uvicorn app.main:app --reload
```

The server will start at: **http://127.0.0.1:8000**

### Production Server

For production deployment:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 📖 API Documentation

Once the server is running, you can access:

| Documentation    | URL                                |
| ---------------- | ---------------------------------- |
| **Swagger UI**   | http://127.0.0.1:8000/docs         |
| **ReDoc**        | http://127.0.0.1:8000/redoc        |
| **OpenAPI JSON** | http://127.0.0.1:8000/openapi.json |

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py           # FastAPI application entry point
│   ├── controllers/      # Request handlers and business logic
│   ├── core/             # Core configurations and settings
│   ├── db/               # Database models and connections
│   ├── routes/           # API route definitions
│   ├── services/         # Business services layer
│   └── utils/            # Utility functions and helpers
├── requirements.txt      # Python dependencies
└── README.md             # Project documentation
```

---

## 🛠️ Tech Stack

- **FastAPI** - Modern, fast web framework for building APIs
- **Uvicorn** - ASGI server for running the application
- **Pydantic** - Data validation using Python type annotations

---

## 📝 API Endpoints

| Method | Endpoint  | Description                             |
| ------ | --------- | --------------------------------------- |
| GET    | `/`       | Root endpoint - Check if API is running |
| GET    | `/health` | Health check endpoint                   |

---

## 📄 License

This project is licensed under the MIT License.

---


