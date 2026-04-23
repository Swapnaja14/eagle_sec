# 🚀 Production Deployment Guide

## Overview

This guide covers deploying the Django backend to production for serving both web and mobile applications.

---

## 📋 Pre-Deployment Checklist

### Security
- [ ] Set `DEBUG=False`
- [ ] Generate strong `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Set up HTTPS/SSL
- [ ] Configure proper CORS origins
- [ ] Enable token blacklisting
- [ ] Set up rate limiting
- [ ] Review security settings

### Database
- [ ] Use PostgreSQL (not SQLite)
- [ ] Set up database backups
- [ ] Configure connection pooling
- [ ] Set up database monitoring

### Infrastructure
- [ ] Choose hosting provider
- [ ] Set up domain name
- [ ] Configure DNS
- [ ] Set up CDN for static files
- [ ] Configure email service
- [ ] Set up monitoring/logging

---

## 🔧 Production Settings

### Update settings.py

```python
# Production settings
DEBUG = False
ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com', 'api.yourdomain.com']

# Security
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# CORS (specific origins only)
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
]

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT', default='5432'),
        'CONN_MAX_AGE': 600,  # Connection pooling
    }
}

# Static files
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATIC_URL = '/static/'

# Media files
MEDIA_ROOT = BASE_DIR / 'media'
MEDIA_URL = '/media/'

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs/django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': True,
        },
    },
}
```

---

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project
COPY . /app/

# Collect static files
RUN python manage.py collectstatic --noinput

# Create certificates directory
RUN mkdir -p /app/certificates

# Run migrations
RUN python manage.py migrate

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "learnsphere.wsgi:application"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=learnsphere_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=your_secure_password
    ports:
      - "5432:5432"

  web:
    build: .
    command: gunicorn learnsphere.wsgi:application --bind 0.0.0.0:8000
    volumes:
      - .:/app
      - static_volume:/app/staticfiles
      - media_volume:/app/media
      - certificates_volume:/app/certificates
    ports:
      - "8000:8000"
    env_file:
      - .env
    depends_on:
      - db

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - web

volumes:
  postgres_data:
  static_volume:
  media_volume:
  certificates_volume:
```

### nginx.conf

```nginx
upstream django {
    server web:8000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /app/staticfiles/;
    }

    location /media/ {
        alias /app/media/;
    }

    client_max_body_size 100M;
}
```

---

## ☁️ Cloud Deployment Options

### Option 1: AWS (Elastic Beanstalk)

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p python-3.11 learnsphere-backend

# Create environment
eb create learnsphere-prod

# Deploy
eb deploy

# Set environment variables
eb setenv DEBUG=False SECRET_KEY=your-secret-key
```

### Option 2: Heroku

```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create learnsphere-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set DEBUG=False
heroku config:set SECRET_KEY=your-secret-key

# Deploy
git push heroku main

# Run migrations
heroku run python manage.py migrate

# Seed data
heroku run python manage.py seed_sample_data
```

### Option 3: DigitalOcean App Platform

```yaml
# app.yaml
name: learnsphere-backend
services:
- name: web
  github:
    repo: your-username/learnsphere
    branch: main
    deploy_on_push: true
  build_command: pip install -r requirements.txt
  run_command: gunicorn learnsphere.wsgi:application
  envs:
  - key: DEBUG
    value: "False"
  - key: SECRET_KEY
    value: ${SECRET_KEY}
  http_port: 8000
databases:
- name: db
  engine: PG
  version: "15"
```

---

## 🔐 SSL/HTTPS Setup

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Update nginx.conf for HTTPS

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /app/staticfiles/;
    }

    location /media/ {
        alias /app/media/;
    }
}
```

---

## 📊 Monitoring & Logging

### Sentry (Error Tracking)

```bash
pip install sentry-sdk
```

```python
# settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[DjangoIntegration()],
    traces_sample_rate=1.0,
    send_default_pii=True
)
```

### CloudWatch (AWS)

```python
# Install
pip install watchtower

# settings.py
LOGGING = {
    'handlers': {
        'watchtower': {
            'level': 'ERROR',
            'class': 'watchtower.CloudWatchLogHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['watchtower'],
            'level': 'ERROR',
        },
    },
}
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: 3.11
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
    
    - name: Run tests
      run: |
        python manage.py test
    
    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /app
          git pull
          source env/bin/activate
          pip install -r requirements.txt
          python manage.py migrate
          python manage.py collectstatic --noinput
          sudo systemctl restart gunicorn
```

---

## 📱 Mobile App Configuration

### Update API Base URL

```javascript
// config.js
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000/api'
  : 'https://api.yourdomain.com/api';

export default {
  API_BASE_URL
};
```

### Handle HTTPS

```javascript
// Ensure all API calls use HTTPS in production
const api = axios.create({
  baseURL: 'https://api.yourdomain.com/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

---

## 🧪 Post-Deployment Testing

```bash
# Test API endpoints
curl https://api.yourdomain.com/api/courses/

# Test authentication
curl -X POST https://api.yourdomain.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Test certificate download
curl -X GET https://api.yourdomain.com/api/certificates/1/download/ \
  -H "Authorization: Bearer TOKEN" \
  --output certificate.pdf
```

---

## 🔧 Maintenance

### Database Backups

```bash
# PostgreSQL backup
pg_dump -U postgres learnsphere_db > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres learnsphere_db < backup_20240115.sql
```

### Update Dependencies

```bash
# Check for updates
pip list --outdated

# Update specific package
pip install --upgrade django

# Update requirements.txt
pip freeze > requirements.txt
```

### Monitor Performance

```bash
# Check server resources
htop

# Check database connections
psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Check logs
tail -f /var/log/nginx/error.log
tail -f /app/logs/django.log
```

---

## 🚨 Troubleshooting

### Issue: 502 Bad Gateway
**Solution:** Check if Gunicorn is running
```bash
sudo systemctl status gunicorn
sudo systemctl restart gunicorn
```

### Issue: Static files not loading
**Solution:** Collect static files
```bash
python manage.py collectstatic --noinput
```

### Issue: Database connection errors
**Solution:** Check database credentials and connectivity
```bash
psql -U postgres -h localhost -d learnsphere_db
```

### Issue: CORS errors
**Solution:** Update CORS settings in production
```python
CORS_ALLOWED_ORIGINS = [
    'https://yourdomain.com',
]
```

---

## 📞 Support

For production issues:
1. Check application logs
2. Check server logs
3. Check database logs
4. Monitor error tracking (Sentry)
5. Review recent deployments

---

**Production Deployment Complete! 🎉**
