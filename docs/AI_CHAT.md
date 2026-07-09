# AI Chat Documentation

## Système de Mémoire

Le chat IA maintient une **mémoire persistante** pour chaque utilisateur.

## Architecture

```
User → Message → AI Service
                    ↓
              Build History
              + Memory Context
                    ↓
              OpenAI API Call
                    ↓
              Response + Extract Facts
                    ↓
              Save Message + Update Memory
```

## Endpoints

### 1. Envoyer un Message

```http
POST /api/ai/message
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Je m'appelle Jean et j'aime la musique",
  "conversationId": "optional-id"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "userMessage": {
      "_id": "msg-1",
      "userId": "user-1",
      "role": "user",
      "content": "Je m'appelle Jean et j'aime la musique",
      "tokens": 15,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "assistantMessage": {
      "_id": "msg-2",
      "userId": "user-1",
      "role": "assistant",
      "content": "Enchanté Jean! La musique est passionnante. Quel genre préfères-tu?",
      "tokens": 22,
      "createdAt": "2024-01-15T10:30:05Z"
    }
  },
  "message": "Message traité par l'IA"
}
```

### 2. Récupérer l'Historique

```http
GET /api/ai/history?conversationId=id&page=1&limit=50
Authorization: Bearer {token}
```

### 3. Récupérer Toutes les Conversations

```http
GET /api/ai/conversations?page=1&limit=20
Authorization: Bearer {token}
```

## Système de Mémoire

### Structure

```typescript
interface IAIMemory {
  key: string; // "nom", "compétence", "intérêt"
  value: string; // "Jean", "développeur", "musique"
  importance: number; // 0-100
  updatedAt: Date;
}
```

### Exemple de Mémoire

```json
{
  "conversationId": "conv-123",
  "memory": [
    {
      "key": "name",
      "value": "Jean",
      "importance": 100,
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    {
      "key": "interests",
      "value": "musique, voyage",
      "importance": 85,
      "updatedAt": "2024-01-15T10:35:00Z"
    },
    {
      "key": "job",
      "value": "développeur backend",
      "importance": 80,
      "updatedAt": "2024-01-15T10:40:00Z"
    }
  ]
}
```

### Extraction de Faits

```typescript
// Quand l'utilisateur dit "Je m'appelle Jean"
// L'IA extrait automatiquement : { key: "name", value: "Jean" }

// Mécanisme :
1. Parse le message utilisateur
2. Identifie les paires clé-valeur
3. Stocke ou met à jour dans la mémoire
4. Limite à MAX_MEMORY_SIZE (10 par défaut)
5. Trie par importance
```

## Prompt System

### System Message

```
Tu es un assistant IA utile et bienveillant.
Important: nom: Jean, interests: musique, voyage, job: développeur backend.
```

### Context Window

```
[System] Tu es un assistant...
[User] Bonjour
[Assistant] Bonjour! Comment ça va?
[User] Je vais bien, parle-moi de la musique
[Assistant] ...
```

## Intégration OpenAI

### Configuration

```typescript
{
  model: "gpt-4-turbo-preview",  // ou "gpt-3.5-turbo"
  temperature: 0.7,               // Créativité
  max_tokens: 1000,               // Limite réponse
}
```

### Cost Calculation

```
Token Usage = (Prompt Tokens + Completion Tokens)

Coût GPT-4:
- Input: $0.03 / 1K tokens
- Output: $0.06 / 1K tokens

Coût GPT-3.5:
- Input: $0.0005 / 1K tokens
- Output: $0.0015 / 1K tokens
```

## Exemples d'Utilisation

### Frontend (JavaScript/React)

```javascript
import axios from 'axios';

class AIChat {
  constructor(token) {
    this.token = token;
    this.api = axios.create({
      baseURL: 'http://localhost:5000/api/ai',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async sendMessage(content, conversationId) {
    const response = await this.api.post('/message', {
      content,
      conversationId,
    });
    return response.data.data;
  }

  async getHistory(conversationId, page = 1) {
    const response = await this.api.get('/history', {
      params: { conversationId, page, limit: 50 },
    });
    return response.data.data;
  }

  async getConversations(page = 1) {
    const response = await this.api.get('/conversations', {
      params: { page, limit: 20 },
    });
    return response.data.data;
  }
}

// Utilisation
const chat = new AIChat('jwt-token');
const response = await chat.sendMessage('Bonjour!');
console.log(response.assistantMessage.content);
```

## Améliorations Futures

### 1. Traitement du Langage Naturel (NLP)

```python
# Utiliser spaCy ou NLTK pour extraction de faits
import spacy

nlp = spacy.load("fr_core_news_sm")
doc = nlp("Je m'appelle Jean et je travaille comme développeur")

for ent in doc.ents:
    print(f"{ent.text}: {ent.label_}")
    # Output:
    # Jean: PERSON
    # développeur: JOB
```

### 2. Vector Search (Embeddings)

```typescript
// Utiliser des embeddings pour recherche sémantique
const embedding = await openai.createEmbedding({
  model: "text-embedding-3-small",
  input: "Je suis développeur"
});

// Chercher des souvenirs similaires dans la mémoire
const similar = await memory.similaritySearch(embedding, k: 3);
```

### 3. Personnalité Adaptée

```typescript
// Adapter la personnalité selon l'utilisateur
const personality = `Tu es un ami bienveillant de ${user.name}. 
Tu connais ses intérêts: ${user.interests.join(', ')}.
Tu as une tonalité ${user.preferredTone || 'amicale'}.`;
```

### 4. Intégration Multimodal

```typescript
// Supporter images, vidéos, audio
POST /api/ai/message
{
  "content": "text",
  "attachments": [
    {
      "type": "image",
      "url": "https://..."
    }
  ]
}
```

### 5. Streaming des Réponses

```typescript
// Stream les réponses au lieu d'attendre
GET /api/ai/message?stream=true

// Utiliser EventSource côté client
const eventSource = new EventSource(url);
eventSource.onmessage = (event) => {
  console.log(event.data); // Chunk de réponse
};
```

## Sécurité & Coûts

### Rate Limiting

```typescript
// Limiter les requêtes par utilisateur
const limit = {
  messages_per_hour: 100,
  max_tokens_per_day: 100000,
};
```

### Contentu Moderation

```typescript
// Utiliser OpenAI Moderation API
const moderation = await openai.createModeration({
  input: userMessage,
});

if (moderation.results[0].flagged) {
  // Rejeter le message
}
```

### Budget Control

```typescript
// Tracker les coûts
function estimateCost(inputTokens, outputTokens, model) {
  const rates = {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5': { input: 0.0005, output: 0.0015 },
  };

  const rate = rates[model];
  return (inputTokens * rate.input + outputTokens * rate.output) / 1000;
}
```
