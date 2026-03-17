# Event Management System

A Django REST Framework-based event management system with OTP-based authentication, JWT authorization, role-based access control, and a React frontend served by the same Django server.

## Project Structure

```
/backend        Django REST API (backend)
/front          React frontend (served as static files by Django)
.env.example    Environment variable template
README.md
```

## Tech Stack

- **Backend:** Django 6.0, Django REST Framework, SimpleJWT
- **Database:** SQLite (development)
- **Authentication:** JWT (access: 60 min, refresh: 1 day)
- **OTP:** Custom 6-digit OTP with 5-minute expiry
- **Email:** SMTP (configured via environment variables)
- **API Docs:** Swagger / OpenAPI (drf-yasg)
- **Frontend:** React 18 (CDN), Babel Standalone, plain CSS

## Frontend ↔ Backend Integration

The Django server serves the React frontend at `http://127.0.0.1:8000/`.
All API calls from the browser go to the same origin (no CORS issues in production).

- Frontend static assets (`App.jsx`, `styles.css`) are served at `/static/`.
- The Django root URL (`/`) returns `front/index.html`.
- API endpoints are all under `/api/`.

## How to Run

### Prerequisites

- Python 3.12+

### Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp ../.env.example .env
# Edit .env and fill in SECRET_KEY and email settings

# Apply database migrations
python manage.py migrate

# Create a superuser (optional – for admin panel access)
python manage.py createsuperuser

# Start the development server
python manage.py runserver
```

The full application (frontend + API) is now available at **http://127.0.0.1:8000/**

Additional URLs:
- **Swagger UI:** http://127.0.0.1:8000/swagger/
- **ReDoc:** http://127.0.0.1:8000/redoc/
- **Admin Panel:** http://127.0.0.1:8000/admin/

> **Note:** For email OTP delivery, configure `EMAIL_*` settings in `backend/.env`.
> If email is not configured, retrieve the OTP from the Django Admin panel
> (http://127.0.0.1:8000/admin/ → Users → select user → OTP Info section).

## Tested End-to-End Scenario

### Flow: Register → Verify OTP → Login → Browse Events → Create Event

1. **Register:** Enter a username, university email (`@beu.edu.az` or `@std.beu.edu.az`), phone number, and password. The API creates an inactive user and sends a 6-digit OTP to the provided email.

2. **Verify OTP:** Enter the OTP received by email. On success, the account is activated and JWT tokens are issued. The browser stores the tokens in `localStorage`.

3. **Login:** Enter username and password to receive fresh JWT tokens.

4. **Browse Events:** The events page fetches live data from `/api/events/` using the stored Bearer token.

5. **Create Event** *(admin only)*: Fill in the event form. The form sends an authenticated `POST` to `/api/events/`.

## API Endpoints

### Authentication (public)

| Method | Endpoint               | Description                             |
|--------|------------------------|-----------------------------------------|
| POST   | `/api/register/`       | Register a new user                     |
| POST   | `/api/verify-otp/`     | Verify email with 6-digit OTP           |
| POST   | `/api/login/`          | Login and receive JWT tokens            |
| POST   | `/api/logout/`         | Blacklist refresh token (requires auth) |
| POST   | `/api/forgot-password/`| Send password-reset OTP to email        |
| POST   | `/api/reset-password/` | Reset password with OTP                 |

### Roles (requires authentication)

| Method | Endpoint            | Description    |
|--------|---------------------|----------------|
| GET    | `/api/roles/`       | List roles     |
| POST   | `/api/roles/`       | Create a role  |
| GET    | `/api/roles/{id}/`  | Retrieve role  |
| PUT    | `/api/roles/{id}/`  | Update role    |
| DELETE | `/api/roles/{id}/`  | Delete role    |

### Events (requires authentication)

| Method | Endpoint             | Description       |
|--------|----------------------|-------------------|
| GET    | `/api/events/`       | List events       |
| POST   | `/api/events/`       | Create an event   |
| GET    | `/api/events/{id}/`  | Retrieve an event |
| PUT    | `/api/events/{id}/`  | Update an event   |
| DELETE | `/api/events/{id}/`  | Delete an event   |

### Event Images (requires authentication)

| Method | Endpoint                  | Description        |
|--------|---------------------------|--------------------|
| GET    | `/api/event-images/`      | List event images  |
| POST   | `/api/event-images/`      | Upload an image    |
| GET    | `/api/event-images/{id}/` | Retrieve an image  |
| DELETE | `/api/event-images/{id}/` | Delete an image    |

### Allowed Participants (requires authentication)

| Method | Endpoint                         | Description           |
|--------|----------------------------------|-----------------------|
| GET    | `/api/allowed-participants/`     | List participants     |
| POST   | `/api/allowed-participants/`     | Add participant       |
| DELETE | `/api/allowed-participants/{id}/`| Remove participant    |

## Data Models

- **CustomUser** – Extended Django user with phone, email, OTP fields, and role assignments.
- **Role** – Named roles for access control.
- **Event** – Events with title, description, type (online/offline/hybrid), visibility (public/private), agenda, dates, location, and role-based access.
- **EventImage** – Images attached to events.
- **AllowedParticipant** – Per-event participant list (email + optional group).

## Security

- All protected endpoints require a valid JWT Bearer token.
- Unauthenticated requests return `401 Unauthorized`.
- Inactive users (email not verified) receive `403 Forbidden`.
- Role-based filtering is enforced on events via `allowed_roles`.
- CORS is open in development (`CORS_ALLOW_ALL_ORIGINS = True`); restrict in production.
