# Backend API - Système Complet

Architecture backend professionnelle et maintenable pour une plateforme multi-utilisateurs avec :

## 🎯 Fonctionnalités

### 1. **Authentification & Sécurité**

- ✅ Authentification JWT (Access Token + Refresh Token)
- ✅ Hash sécurisé des passwords (bcryptjs)
- ✅ Validation des données (Zod)
- ✅ CORS & Helmet pour la sécurité HTTP
- ✅ Middleware d'authentification réutilisable

### 2. **Gestion des Utilisateurs**

- ✅ Profil utilisateur avec avatar, bio, intérêts
- ✅ Mise à jour de profil
- ✅ Recherche d'utilisateurs
- ✅ Statut en ligne/offline
- ✅ Suppression de compte

### 3. **Moteur de Matchmaking**

- ✅ Calcul de compatibilité basé sur les intérêts
- ✅ Suggestions de matchs potentiels
- ✅ Gestion des matches (accepté, rejeté, en attente)
- ✅ Historique des interactions
- ✅ TTL automatique sur les suggestions

### 4. **Messagerie Temps Réel**

- ✅ Communication bidirectionnelle avec Socket.io
- ✅ Conversations multi-utilisateurs
- ✅ Historique des messages paginé
- ✅ Indicateur de frappe en temps réel
- ✅ Marquer les messages comme lus
- ✅ Support des différents types de messages (text, image, file)

### 5. **Chat IA avec Mémoire**

- ✅ Intégration OpenAI / API IA
- ✅ Système de mémoire persistant
- ✅ Conversations contextuelles
- ✅ Historique et gestion des conversations
- ✅ Extraction automatique de faits importants

## 📁 Structure du Projet

```
src/
├── config/          # Configuration (env, db, etc.)
├── controllers/     # Contrôleurs (logique HTTP)
├── middlewares/     # Middlewares (auth, validation, erreurs)
├── models/          # Schémas MongoDB
├── routes/          # Définition des routes
├── services/        # Logique métier
├── types/           # Interfaces TypeScript
├── utils/           # Utilitaires (jwt, crypto, etc.)
└── index.ts         # Point d'entrée
```

## 🚀 Installation & Démarrage

### Prérequis

- Node.js >= 18
- MongoDB (local ou Atlas)
- Clé API OpenAI (pour le chat IA)

### Installation

```bash
cd backend
npm install
```

### Configuration

Créer un fichier `.env` basé sur `.env.example` :

```bash
cp .env.example .env
```

Remplir les variables :

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/backend-api
JWT_SECRET=votre-cle-secrete-min-32-chars
OPENAI_API_KEY=sk-your-api-key

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Démarrage

**Développement (avec rechargement automatique) :**

```bash
npm run dev
```

**Production :**

```bash
npm run build
npm start
```

## 📡 API Endpoints

### **Authentication**

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Renouveler le token

### **Utilisateurs**

- `GET /api/users/profile` - Récupérer le profil
- `PUT /api/users/profile` - Mettre à jour le profil
- `GET /api/users/search?q=query` - Chercher des utilisateurs
- `DELETE /api/users/account` - Supprimer le compte

### **Matchmaking**

- `GET /api/matches/potential?limit=10` - Matchs potentiels
- `GET /api/matches/list?page=1&limit=20` - Tous les matchs
- `POST /api/matches/create` - Créer un match
- `POST /api/matches/reject` - Rejeter un match

### **Messagerie**

- `POST /api/messages/send` - Envoyer un message
- `GET /api/messages?conversationId=id` - Récupérer les messages
- `GET /api/messages/conversations` - Toutes les conversations
- `POST /api/messages/mark-read` - Marquer comme lu

### **Chat IA**

- `POST /api/ai/message` - Envoyer un message à l'IA
- `GET /api/ai/history?conversationId=id` - Historique
- `GET /api/ai/conversations` - Toutes les conversations

## 🔌 Socket.IO Events

### **Client → Serveur**

```javascript
socket.emit('message:send', { receiverId, content });
socket.emit('typing:start', { receiverId });
socket.emit('typing:stop', { receiverId });
socket.emit('message:read', { conversationId });
socket.emit('conversation:join', { conversationId });
socket.emit('conversation:leave', { conversationId });
socket.emit('users:online', {});
```

### **Serveur → Client**

```javascript
socket.on('message:receive', { message, conversationId, senderId });
socket.on('message:sent', { message, conversationId });
socket.on('typing:indicator', { senderId, isTyping });
socket.on('message:read', { userId });
socket.on('user:online', { userId, username });
socket.on('user:offline', { userId, username });
socket.on('users:online:list', [{ userId, socketId, connectedAt }]);
```

## 📊 Modèles de Données

### User

```typescript
{
  email: string
  username: string
  password: string (hashé)
  firstName: string
  lastName: string
  avatar?: string
  bio?: string
  interests: string[]
  location?: string
  isOnline: boolean
  lastSeen?: Date
}
```

### Match

```typescript
{
  user1Id: string
  user2Id: string
  compatibility: number (0-100)
  commonInterests: string[]
  status: 'matched' | 'rejected' | 'pending'
  matchedAt: Date
  expiresAt: Date
}
```

### Message

```typescript
{
  senderId: string;
  receiverId: string;
  conversationId: string;
  content: string;
  messageType: 'text' | 'image' | 'file';
  isRead: boolean;
  createdAt: Date;
}
```

### AIConversation

```typescript
{
  userId: string
  title: string
  messages: AIMessage[]
  memory: AIMemory[]
  isActive: boolean
  createdAt: Date
}
```

## 🔐 Sécurité

- ✅ Passwords hashés avec bcryptjs (10 rounds)
- ✅ JWT pour l'authentification stateless
- ✅ Validation des données avec Zod
- ✅ CORS configuré
- ✅ Helmet pour les headers HTTP sécurisés
- ✅ Gestion des erreurs centralisée
- ✅ Rate limiting (à implémenter)
- ✅ Validation des emails (à implémenter)

## 🏗️ Patterns & Bonnes Pratiques

### Architecture en Couches

- **Routes** : Définissent les endpoints
- **Middlewares** : Authentification, validation
- **Controllers** : Gèrent les requêtes HTTP
- **Services** : Logique métier réutilisable
- **Models** : Schémas MongoDB

### Gestion des Erreurs

- Classe `AppError` centralisée
- Middleware d'erreur global
- Codes d'erreur cohérents

### Type Safety

- TypeScript strict mode activé
- Interfaces pour tous les types
- Zod pour la validation runtime

### Logging

- Logger structuré avec niveaux
- Contexte inclus dans les logs

## 📈 Scalabilité

### À venir

- [ ] Redis pour le cache
- [ ] Rate limiting
- [ ] Pagination optimisée
- [ ] Indexing MongoDB avancé
- [ ] Compression des images
- [ ] CDN pour les assets
- [ ] Load balancing
- [ ] Microservices
- [ ] Message queue (Bull/RabbitMQ)

## 🧪 Tests

```bash
npm run test
npm run test:watch
npm run test:coverage
```

## 📝 Commandes Disponibles

```bash
npm run dev           # Dev avec hot reload
npm run build         # Build TypeScript
npm start             # Lancer le serveur compilé
npm run lint          # Lint le code
npm run format        # Formater le code
npm run typecheck     # Vérifier les types
npm run test          # Lancer les tests
```

## 🐛 Debugging

Utiliser VS Code avec la configuration suivante :

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "program": "${workspaceFolder}/node_modules/tsx/esm/index.mjs",
      "args": ["src/index.ts"],
      "restart": true,
      "console": "integratedTerminal"
    }
  ]
}
```

## 📞 Support & Contact

Pour toute question ou problème, veuillez ouvrir une issue.

---

**Créé avec ❤️ pour la scalabilité**
