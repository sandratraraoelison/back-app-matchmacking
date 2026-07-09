# Matchmaking Algorithm Documentation

## Vue d'ensemble

Le moteur de matchmaking calcule la compatibilité entre utilisateurs basée sur leurs **intérêts communs**.

## Algorithm

### Calcul de Compatibilité

```typescript
Score = (Intérêts Communs / Intérêts Total Unique) * 100
```

**Exemple:**

- User A intérêts: [sport, musique, voyage, cuisine]
- User B intérêts: [sport, voyage, technologie, jeux]

Intérêts Communs: [sport, voyage] = 2
Intérêts Total Unique: {sport, musique, voyage, cuisine, technologie, jeux} = 6
**Score = (2 / 6) \* 100 = 33%**

## Endpoints

### 1. Obtenir les Matchs Potentiels

```http
GET /api/matches/potential?limit=10
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "user-id-2",
      "username": "alice",
      "firstName": "Alice",
      "lastName": "Dupont",
      "bio": "Aime le voyage et la musique",
      "interests": ["voyage", "musique", "photographie"],
      "location": "Paris",
      "avatar": "https://...",
      "matchingScore": 75,
      "isOnline": true
    }
  ],
  "message": "Matchs potentiels récupérés"
}
```

### 2. Créer un Match

```http
POST /api/matches/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "toUserId": "user-id-2",
  "message": "Je suis intéressé!"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "match-id-123",
    "user1Id": "current-user-id",
    "user2Id": "user-id-2",
    "compatibility": 75,
    "commonInterests": ["voyage", "musique"],
    "status": "matched",
    "matchedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Match créé avec succès"
}
```

### 3. Rejeter un Match

```http
POST /api/matches/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "toUserId": "user-id-2"
}
```

### 4. Récupérer Tous les Matchs

```http
GET /api/matches/list?page=1&limit=20
Authorization: Bearer {token}
```

## Optimisation & Scalabilité

### Indexes MongoDB

```javascript
// Compound index pour recherche rapide
db.matches.createIndex({ user1Id: 1, user2Id: 1 }, { unique: true });

// Index pour le statut
db.matches.createIndex({ status: 1 });

// Index TTL pour expiration automatique
db.matches.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

### Caching (À Implémenter)

```typescript
// Redis caching pour les suggestions
const cacheKey = `matches:${userId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

// Sinon, calculer et cacher
const matches = await calculateMatches(userId);
await redis.setex(cacheKey, 3600, JSON.stringify(matches)); // Cache 1 heure
```

## Améliorations Futures

### 1. Machine Learning

```python
# Prédire la compatibilité avec ML
# Utiliser les conversations passées, comportements, etc.
compatibility = model.predict([user1_profile, user2_profile])
```

### 2. Filtres Avancés

```typescript
interface MatchFilters {
  minAge?: number;
  maxAge?: number;
  distance?: number;
  interests?: string[];
  location?: string;
}

async getPotentialMatches(userId: string, filters: MatchFilters) {
  // Filtrer avant calcul de compatibilité
}
```

### 3. Notification Temps Réel

```typescript
// Quand un match est créé, notifier les deux utilisateurs
io.to(`user:${user1Id}`).emit('match:created', {
  matchId,
  user: matchedUser,
  compatibility,
});
```

### 4. Recommandations Personnalisées

```typescript
// Basé sur :
// - Historique de matchs
// - Messages échangés
// - Interactions
// - Préférences implicites
```

## Performance

### Requête Optimisée

```typescript
// Avant: O(n²)
const allUsers = await User.find();
const matches = allUsers.map((user) => calculateCompatibility(currentUser, user));

// Après: O(n) avec indexing
const matches = await User.find({
  interests: { $in: currentUser.interests },
  _id: { $ne: currentUserId },
}).limit(10);
```

### Pagination

```javascript
GET /api/matches/list?page=2&limit=20
// Skip: (2-1) * 20 = 20
// Limit: 20
```
