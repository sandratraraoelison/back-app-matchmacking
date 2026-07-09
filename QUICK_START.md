# 🚀 Quick Start Guide

## Installation Rapide

### 1. Installer les dépendances

```bash
cd backend
npm install
```

### 2. Configuration

Créer `.env` :

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/backend-api
JWT_SECRET=super-secret-key-min-32-characters-long-xxxx
OPENAI_API_KEY=sk-your-api-key-here

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
SOCKET_CORS=http://localhost:3000

LOG_LEVEL=debug
AI_MEMORY_SIZE=10
AI_MODEL=gpt-3.5-turbo
```

### 3. Lancer MongoDB (local)

```bash
# Avec Docker Compose (recommandé)
docker-compose up -d mongodb redis

# Ou avec MongoDB directement
mongod --dbpath ./data
```

### 4. Démarrer le serveur

```bash
# Mode développement (rechargement auto)
npm run dev

# Mode production
npm run build
npm start
```

✅ Serveur accessible sur `http://localhost:5000`

## Test Rapide

### Inscription

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPassword123",
    "firstName": "Test",
    "lastName": "User",
    "interests": ["music", "travel"]
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": { ... }
  }
}
```

### Copier le token et l'utiliser

```bash
export TOKEN="eyJhbGciOiJIUzI1NiIs..."

# Récupérer le profil
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

## Architecture Vue d'Ensemble

```
┌─────────────┐
│  Frontend   │ (React, Vue, etc.)
└──────┬──────┘
       │
  ┌────▼─────────┐
  │  HTTP/REST   │
  │  Socket.io   │
  └────┬─────────┘
       │
┌──────▼───────────────┐
│   Express Server     │
├──────────────────────┤
│  Routes              │
│  Middlewares         │
│  Controllers         │
│  Services            │
└──────┬───────────────┘
       │
   ┌───┴────────────┬──────────────┐
   │                │              │
┌──▼───┐        ┌───▼────┐   ┌────▼──┐
│MongoDB│        │Redis   │   │OpenAI│
│(Data) │        │(Cache) │   │(IA)  │
└───────┘        └────────┘   └───────┘
```

## Fichiers Importants

| Fichier              | Rôle                                |
| -------------------- | ----------------------------------- |
| `src/index.ts`       | Point d'entrée, Express + Socket.io |
| `src/types/index.ts` | Interfaces TypeScript               |
| `src/services/`      | Logique métier                      |
| `src/controllers/`   | Gestion des requêtes HTTP           |
| `src/models/`        | Schémas MongoDB                     |
| `src/middlewares/`   | Auth, validation, erreurs           |
| `README.md`          | Documentation complète              |
| `docs/API_USAGE.md`  | Exemples d'API                      |

## Commandes Disponibles

```bash
npm run dev          # Développement (hot reload)
npm run build        # Build TypeScript
npm start            # Lancer le serveur compilé
npm run lint         # Linter le code
npm run format       # Formater le code (Prettier)
npm run typecheck    # Vérifier les types
npm run test         # Lancer les tests
```

## API Endpoints

### Public (pas besoin d'authentification)

```
POST   /api/auth/register        - Créer un compte
POST   /api/auth/login           - Se connecter
POST   /api/auth/refresh         - Renouveler le token
GET    /health                   - Vérifier le statut
```

### Protégés (besoin d'un token)

```
# Utilisateurs
GET    /api/users/profile        - Mon profil
PUT    /api/users/profile        - Modifier mon profil
GET    /api/users/search?q=x     - Chercher des utilisateurs
DELETE /api/users/account        - Supprimer mon compte

# Matchmaking
GET    /api/matches/potential    - Matchs suggérés
GET    /api/matches/list         - Mes matchs
POST   /api/matches/create       - Créer un match
POST   /api/matches/reject       - Rejeter un match

# Messagerie
POST   /api/messages/send        - Envoyer un message
GET    /api/messages             - Récupérer les messages
GET    /api/messages/conversations - Mes conversations
POST   /api/messages/mark-read   - Marquer comme lu

# AI Chat
POST   /api/ai/message           - Message à l'IA
GET    /api/ai/history           - Historique IA
GET    /api/ai/conversations     - Conversations IA
```

## WebSocket Events (Socket.io)

### Connexion

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: accessToken },
});
```

### Events

```javascript
// Envoyer un message
socket.emit('message:send', {
  receiverId: 'user-id',
  content: 'Hello!',
});

// Recevoir
socket.on('message:receive', (data) => {
  console.log('Message:', data.message);
});

// Typing indicator
socket.emit('typing:start', { receiverId: 'user-id' });
socket.on('typing:indicator', (data) => {
  console.log(data.isTyping ? 'Typing...' : 'Stopped');
});

// Statut utilisateur
socket.on('user:online', (data) => {
  console.log(`${data.username} is online`);
});
```

## Erreurs Courantes & Solutions

### ❌ `MONGODB_URI not set`

**Solution**: Ajouter `MONGODB_URI` dans `.env`

### ❌ `JWT_SECRET is required`

**Solution**: Ajouter `JWT_SECRET` dans `.env` (min 32 caractères)

### ❌ `Port 5000 already in use`

**Solution**: Changer le port dans `.env` ou `PORT=5001 npm run dev`

### ❌ `Token expired or invalid`

**Solution**: Utiliser le refresh endpoint pour renouveler

### ❌ `CORS error`

**Solution**: Vérifier `ALLOWED_ORIGINS` dans `.env`

## Database Schemas

### User

```typescript
{
  _id: ObjectId
  email: string (unique)
  username: string (unique)
  password: string (hashed)
  firstName: string
  lastName: string
  bio?: string
  avatar?: string
  interests: [string]
  location?: string
  isOnline: boolean
  lastSeen?: Date
  createdAt: Date
  updatedAt: Date
}
```

### Match

```typescript
{
  _id: ObjectId
  user1Id: ObjectId (ref User)
  user2Id: ObjectId (ref User)
  compatibility: number (0-100)
  commonInterests: [string]
  status: 'matched' | 'rejected' | 'pending'
  matchedAt: Date
  expiresAt: Date (TTL)
}
```

### Message

```typescript
{
  _id: ObjectId
  senderId: ObjectId (ref User)
  receiverId: ObjectId (ref User)
  conversationId: ObjectId (ref Conversation)
  content: string
  messageType: 'text' | 'image' | 'file'
  isRead: boolean
  createdAt: Date
}
```

### AIConversation

```typescript
{
  _id: ObjectId
  userId: ObjectId (ref User)
  title: string
  messages: [IAIMessage]
  memory: [IAIMemory]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

## Prochaines Étapes

### À faire en priorité

1. ✅ **Tester l'API** avec Postman/Insomnia
2. ✅ **Frontend** - Créer une interface React/Vue
3. ✅ **Tests** - Écrire les tests unitaires
4. ✅ **Database** - Ajouter les indexes MongoDB

### Améliorations futures

- [ ] Rate limiting
- [ ] Email verification
- [ ] Password reset
- [ ] Image upload
- [ ] Notifications push
- [ ] Analytics
- [ ] Admin dashboard
- [ ] Modération du contenu

## Resources

- [Express.js Docs](https://expressjs.com/)
- [Socket.io Docs](https://socket.io/docs/v4/)
- [Mongoose Docs](https://mongoosejs.com/)
- [OpenAI API](https://openai.com/api/)
- [JWT.io](https://jwt.io/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Support

- 📧 Email: support@example.com
- 💬 Discord: [Link]
- 🐛 Issues: GitHub Issues
- 📖 Wiki: GitHub Wiki

---

**Prêt à commencer?** → `npm install && npm run dev` 🚀
