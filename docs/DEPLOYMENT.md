# Deployment Guide

## 🚀 Déploiement Local avec Docker

### Prérequis

- Docker
- Docker Compose
- Variables d'environnement configurées

### Démarrer avec Docker Compose

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f api

# Arrêter les services
docker-compose down

# Supprimer les données
docker-compose down -v
```

### Vérifier le Statut

```bash
# Voir les conteneurs
docker-compose ps

# Health check
curl http://localhost:5000/health

# Response:
# {
#   "status": "ok",
#   "timestamp": "2024-01-15T10:30:00.000Z",
#   "uptime": 1234.567,
#   "connectedUsers": 5
# }
```

## 🌐 Déploiement en Production

### Plateforme: Heroku

#### 1. Setup Heroku CLI

```bash
npm install -g heroku
heroku login
```

#### 2. Créer l'application

```bash
heroku create your-app-name
```

#### 3. Configurer les variables d'environnement

```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-production-secret-key
heroku config:set OPENAI_API_KEY=sk-your-key-here
heroku config:set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/backend-api
```

#### 4. Déployer

```bash
git push heroku main
```

#### 5. Voir les logs

```bash
heroku logs --tail
```

### Plateforme: AWS EC2

#### 1. Créer une instance EC2

```bash
# AMI: Ubuntu 20.04 LTS
# Instance Type: t3.small (minimum)
# Storage: 30GB
# Security Group: Allow ports 22, 80, 443, 5000
```

#### 2. SSH dans l'instance

```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

#### 3. Installer les dépendances

```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# MongoDB (ou utiliser Atlas)
sudo apt-get install -y mongodb-org

# Nginx (reverse proxy)
sudo apt-get install -y nginx

# Git
sudo apt-get install -y git
```

#### 4. Cloner et configurer le projet

```bash
cd /home/ubuntu
git clone your-repo-url backend
cd backend
npm install
npm run build
```

#### 5. Configurer PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Créer ecosystem.config.js
pm2 start dist/index.js --name "backend-api" --instances 2

# Démarrer au boot
pm2 startup
pm2 save
```

#### 6. Configurer Nginx

```nginx
# /etc/nginx/sites-available/backend

upstream backend {
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activer:

```bash
sudo ln -s /etc/nginx/sites-available/backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 7. SSL avec Let's Encrypt

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Plateforme: Railway

#### 1. Créer un compte et un projet

```bash
npm install -g railway
railway login
```

#### 2. Initialiser

```bash
railway init
```

#### 3. Déployer

```bash
railway up
```

#### 4. Configurer les variables

```bash
railway variables set NODE_ENV production
railway variables set JWT_SECRET your-key
railway variables set OPENAI_API_KEY your-api-key
```

### Plateforme: Fly.io

#### 1. Setup

```bash
# Installer Fly CLI
# https://fly.io/docs/hands-on/install-flyctl/

fly auth login
```

#### 2. Créer l'app

```bash
fly launch
```

#### 3. Configurer

```bash
fly secrets set NODE_ENV=production
fly secrets set JWT_SECRET=your-key
fly secrets set OPENAI_API_KEY=your-key
```

#### 4. Déployer

```bash
fly deploy
```

## 📊 Monitoring & Logging

### Logs avec Datadog

```typescript
// Dans logger.ts
import { StatsD } from 'node-dogstatsd';

const dogstatsd = new StatsD();

export const logger = {
  error: (message: string, error?: unknown) => {
    console.error(message, error);
    dogstatsd.increment('api.errors');
    dogstatsd.gauge('api.error_rate', errorCount);
  },
};
```

### Monitoring avec New Relic

```bash
npm install newrelic
```

```javascript
// Top of index.ts
require('newrelic');
```

### Health Checks

```bash
# Check endpoint
curl http://your-api.com/health

# Monitoring service
# Utiliser services comme:
# - Uptime Robot
# - Pingdom
# - Synthetics par New Relic
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Créer `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: npm install
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: your-app-name
          heroku_email: your-email@example.com
```

## 📈 Scaling

### Horizontal Scaling

```typescript
// Utiliser cluster module
import cluster from 'cluster';
import os from 'os';

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  app.start();
}
```

### Load Balancing

```nginx
upstream backend {
    server instance1:5000 weight=2;
    server instance2:5000 weight=1;
    server instance3:5000 weight=1;
}
```

### Caching Strategy

```typescript
// Redis cache
const cache = {
  users: 3600, // 1 hour
  matches: 1800, // 30 minutes
  messages: 300, // 5 minutes
  ai_responses: 3600, // 1 hour
};
```

## 🚨 Disaster Recovery

### Backup MongoDB

```bash
# Manual backup
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/backend-api" \
  --out /backups/backup-$(date +%Y%m%d)

# Automated daily backup
0 2 * * * /usr/local/bin/backup.sh
```

### Database Replication

MongoDB Atlas automatiquement replique les données sur 3 nœuds.

### Restore from Backup

```bash
mongorestore --uri="mongodb+srv://..." /backups/backup-20240115
```

## 🔒 Security Checklist

- ✅ HTTPS/TLS activé
- ✅ Secrets en variables d'environnement
- ✅ CORS configuré correctement
- ✅ Rate limiting activé
- ✅ Input validation avec Zod
- ✅ CSRF protection si nécessaire
- ✅ SQL injection prévenue (MongoDB)
- ✅ XSS protection headers
- ✅ Helmet activé
- ✅ JWT refresh token rotation
- ✅ Logs de sécurité activés
- ✅ Monitoring des erreurs

## 📞 Troubleshooting

### Service ne démarre pas

```bash
# Vérifier les logs
docker-compose logs api

# Vérifier les variables d'env
docker-compose exec api env | grep MONGODB

# Redémarrer
docker-compose restart api
```

### MongoDB connection timeout

```bash
# Vérifier la connexion
mongo "mongodb://root:password@localhost:27017"

# Augmenter le timeout dans la config
```

### High memory usage

```bash
# Profiler
node --prof dist/index.js
node --prof-process isolate-*.log > report.txt

# Memory leak check
npm install clinic
clinic doctor -- node dist/index.js
```
