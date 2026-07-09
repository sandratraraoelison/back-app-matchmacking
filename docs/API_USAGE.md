# API Usage Guide

## 🔐 Authentication Flow

### 1. Register (Inscription)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "john_doe",
    "password": "SecurePassword123",
    "firstName": "John",
    "lastName": "Doe",
    "interests": ["music", "travel", "technology"]
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": "user-id",
      "email": "user@example.com",
      "username": "john_doe",
      "firstName": "John",
      "lastName": "Doe",
      "interests": ["music", "travel", "technology"],
      "isOnline": false
    }
  },
  "message": "Utilisateur créé avec succès"
}
```

### 2. Login (Connexion)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

### 3. Refresh Token

```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }'
```

## 👤 User Management

### Get Profile

```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer {accessToken}"
```

### Update Profile

```bash
curl -X PUT http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jean",
    "lastName": "Dupont",
    "bio": "Developer & traveler",
    "interests": ["music", "coding", "adventure"],
    "location": "Paris, France",
    "avatar": "https://..."
  }'
```

### Search Users

```bash
curl -X GET "http://localhost:5000/api/users/search?q=john&limit=20" \
  -H "Authorization: Bearer {accessToken}"
```

### Delete Account

```bash
curl -X DELETE http://localhost:5000/api/users/account \
  -H "Authorization: Bearer {accessToken}"
```

## ❤️ Matchmaking

### Get Potential Matches

```bash
curl -X GET "http://localhost:5000/api/matches/potential?limit=10" \
  -H "Authorization: Bearer {accessToken}"
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "_id": "other-user-id",
      "username": "alice",
      "firstName": "Alice",
      "lastName": "Smith",
      "bio": "Love music and travel",
      "interests": ["music", "travel", "cooking"],
      "matchingScore": 85,
      "isOnline": true
    }
  ]
}
```

### Create Match

```bash
curl -X POST http://localhost:5000/api/matches/create \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "toUserId": "other-user-id",
    "message": "I love your interests!"
  }'
```

### Reject Match

```bash
curl -X POST http://localhost:5000/api/matches/reject \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "toUserId": "other-user-id"
  }'
```

### Get All Matches

```bash
curl -X GET "http://localhost:5000/api/matches/list?page=1&limit=20" \
  -H "Authorization: Bearer {accessToken}"
```

## 💬 Messaging

### Send Message

```bash
curl -X POST http://localhost:5000/api/messages/send \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "receiverId": "recipient-id",
    "content": "Hello! How are you?",
    "messageType": "text"
  }'
```

### Get Messages

```bash
curl -X GET "http://localhost:5000/api/messages?conversationId=conv-id&page=1&limit=50" \
  -H "Authorization: Bearer {accessToken}"
```

### Get Conversations

```bash
curl -X GET "http://localhost:5000/api/messages/conversations?page=1&limit=20" \
  -H "Authorization: Bearer {accessToken}"
```

### Mark as Read

```bash
curl -X POST http://localhost:5000/api/messages/mark-read \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv-id"
  }'
```

## 🤖 AI Chat

### Send Message to AI

```bash
curl -X POST http://localhost:5000/api/ai/message \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Tell me about machine learning",
    "conversationId": "optional-conv-id"
  }'
```

Response:

```json
{
  "success": true,
  "data": {
    "userMessage": {
      "_id": "msg-1",
      "role": "user",
      "content": "Tell me about machine learning",
      "tokens": 8
    },
    "assistantMessage": {
      "_id": "msg-2",
      "role": "assistant",
      "content": "Machine learning is a subset of AI that...",
      "tokens": 45
    }
  }
}
```

### Get AI Conversation History

```bash
curl -X GET "http://localhost:5000/api/ai/history?conversationId=conv-id&page=1&limit=50" \
  -H "Authorization: Bearer {accessToken}"
```

### Get All AI Conversations

```bash
curl -X GET "http://localhost:5000/api/ai/conversations?page=1&limit=20" \
  -H "Authorization: Bearer {accessToken}"
```

## 🔌 Real-Time Messaging (Socket.io)

### Connect

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: accessToken,
  },
});

socket.on('connect', () => {
  console.log('Connected');
});
```

### Send Message via Socket

```javascript
socket.emit('message:send', {
  receiverId: 'user-id',
  content: 'Hello!',
});

socket.on('message:sent', (data) => {
  console.log('Message confirmed:', data.message);
});

socket.on('message:receive', (data) => {
  console.log('New message:', data.message);
});
```

### Typing Indicators

```javascript
// Start typing
socket.emit('typing:start', { receiverId: 'user-id' });

// Listen for typing
socket.on('typing:indicator', (data) => {
  console.log(`User ${data.senderId} is ${data.isTyping ? 'typing' : 'stopped'}`);
});

// Stop typing
socket.emit('typing:stop', { receiverId: 'user-id' });
```

### Join/Leave Conversation

```javascript
// Join conversation room
socket.emit('conversation:join', { conversationId: 'conv-id' });

// Leave conversation room
socket.emit('conversation:leave', { conversationId: 'conv-id' });
```

### User Status

```javascript
// Get online users
socket.emit('users:online', {});

socket.on('users:online:list', (users) => {
  console.log('Online users:', users);
});

// Listen for user online/offline
socket.on('user:online', (data) => {
  console.log(`${data.username} is online`);
});

socket.on('user:offline', (data) => {
  console.log(`${data.username} is offline`);
});
```

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | OK                    |
| 201  | Created               |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 409  | Conflict              |
| 422  | Validation Error      |
| 500  | Internal Server Error |

### Common Error Codes

| Code                    | Description                          |
| ----------------------- | ------------------------------------ |
| `UNAUTHORIZED`          | Missing or invalid token             |
| `USER_EXISTS`           | Email or username already registered |
| `INVALID_CREDENTIALS`   | Wrong email or password              |
| `USER_NOT_FOUND`        | User doesn't exist                   |
| `MATCH_EXISTS`          | Match already created                |
| `VALIDATION_ERROR`      | Invalid input data                   |
| `INTERNAL_SERVER_ERROR` | Server error                         |

## Rate Limiting (Future)

Currently unlimited, but planned to implement:

```
- 100 requests per 15 minutes per IP
- 1000 messages per day per user
- 100 AI messages per day per user
```

## Pagination

All list endpoints support pagination:

```
GET /api/endpoint?page=1&limit=20

page: number (default: 1)
limit: number (default: 20, max: 100)
```

Response includes:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```
