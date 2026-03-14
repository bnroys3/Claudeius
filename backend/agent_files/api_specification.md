# Neon Runner - API Specification

## API Overview

### Base Configuration
- **Base URL**: `https://api.neonrunner.game/v1`
- **Protocol**: HTTPS only
- **Content-Type**: `application/json`
- **Rate Limiting**: 100 requests per minute per IP
- **Authentication**: Optional JWT tokens for registered users

### Response Format
All API responses follow a consistent structure:
```json
{
  "success": boolean,
  "data": object | array | null,
  "error": {
    "code": string,
    "message": string,
    "details": object
  } | null,
  "meta": {
    "timestamp": "ISO 8601 string",
    "version": "string",
    "request_id": "string"
  }
}
```

### Error Codes
- `VALIDATION_ERROR`: Invalid input data
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SCORE_INVALID`: Score failed validation
- `PLAYER_NOT_FOUND`: Player ID not found
- `INTERNAL_ERROR`: Server-side error

## Endpoints Specification

### Score Management

#### Submit Score
**POST** `/scores/submit`

Submit a new player score with validation data.

**Request Body:**
```json
{
  "player_id": "uuid",
  "score": 15750,
  "duration": 180,
  "level_reached": 8,
  "powerups_collected": 12,
  "game_events": [
    {
      "timestamp": 1000,
      "type": "POWERUP_COLLECTED",
      "data": {"type": "SPEED_BOOST", "position": {"x": 100, "y": 200}}
    },
    {
      "timestamp": 2000,
      "type": "OBSTACLE_HIT",
      "data": {"obstacle_type": "WALL", "player_position": {"x": 150, "y": 300}}
    }
  ],
  "validation_hash": "sha256_hash_string"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "score_id": "uuid",
    "rank": 42,
    "is_personal_best": true,
    "percentile": 85.5
  },
  "error": null,
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0",
    "request_id": "req_123456"
  }
}
```

**Validation Rules:**
- Score must be >= 0 and <= theoretical maximum
- Duration must match expected time based on game events
- Game events must follow logical progression
- Validation hash must match server-side calculation

#### Validate Score
**GET** `/scores/{score_id}/validate`

Retrieve validation status and details for a submitted score.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "score_id": "uuid",
    "is_valid": true,
    "validation_details": {
      "score_check": "PASSED",
      "timing_check": "PASSED",
      "event_sequence_check": "PASSED",
      "statistical_analysis": "PASSED"
    },
    "confidence_score": 0.95
  }
}
```

### Leaderboard System

#### Global Leaderboard
**GET** `/leaderboard/global`

Retrieve global high scores with pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)
- `timeframe`: `all_time` | `monthly` | `weekly` | `daily`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "scores": [
      {
        "rank": 1,
        "player_id": "uuid",
        "username": "CyberNinja",
        "score": 28750,
        "duration": 420,
        "level_reached": 15,
        "submitted_at": "2024-01-15T09:15:00Z",
        "is_verified": true
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 150,
      "total_results": 3000,
      "has_next": true,
      "has_previous": false
    }
  }
}
```

#### Player Ranking
**GET** `/leaderboard/player/{player_id}/rank`

Get a specific player's current ranking and nearby competitors.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "player": {
      "rank": 42,
      "score": 15750,
      "percentile": 85.5
    },
    "nearby_players": [
      {"rank": 40, "username": "SpeedDemon", "score": 16100},
      {"rank": 41, "username": "NeonGhost", "score": 15900},
      {"rank": 43, "username": "PixelMaster", "score": 15600},
      {"rank": 44, "username": "GlowRunner", "score": 15400}
    ]
  }
}
```

### Player Management

#### Register Player
**POST** `/players/register`

Register a new player account.

**Request Body:**
```json
{
  "username": "CyberRunner123",
  "email": "player@email.com"  // optional
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "player_id": "uuid",
    "username": "CyberRunner123",
    "created_at": "2024-01-15T10:00:00Z",
    "stats": {
      "total_games": 0,
      "best_score": 0,
      "total_playtime": 0
    }
  }
}
```

**Validation Rules:**
- Username: 3-20 characters, alphanumeric and underscores only
- Email: Valid email format (if provided)
- Username must be unique

#### Player Statistics
**GET** `/players/{player_id}/stats`

Retrieve detailed player statistics and achievements.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "player_id": "uuid",
    "username": "CyberRunner123",
    "stats": {
      "total_games": 157,
      "best_score": 15750,
      "average_score": 8420.5,
      "total_playtime": 18960,
      "powerups_collected": 1240,
      "total_distance": 89500,
      "games_this_week": 23,
      "improvement_rate": 12.5
    },
    "achievements": [
      {
        "id": "first_thousand",
        "name": "Breaking Barriers",
        "description": "Score over 1000 points",
        "unlocked_at": "2024-01-10T15:30:00Z"
      }
    ],
    "recent_scores": [
      {"score": 15750, "date": "2024-01-15T09:00:00Z"},
      {"score": 12300, "date": "2024-01-14T20:15:00Z"}
    ]
  }
}
```

### Game Configuration

#### Game Settings
**GET** `/game/config`

Retrieve current game configuration and constants.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "game_version": "1.0.0",
    "physics": {
      "player_speed": 200,
      "acceleration": 800,
      "max_speed": 400,
      "friction": 0.8
    },
    "scoring": {
      "distance_multiplier": 1,
      "time_multiplier": 10,
      "powerup_bonus": 50,
      "perfect_section_bonus": 200
    },
    "powerups": {
      "speed_boost": {"duration": 10, "multiplier": 1.5},
      "invincibility": {"duration": 8},
      "score_multiplier": {"duration": 20, "multiplier": 2.0}
    },
    "difficulty": {
      "base_speed": 100,
      "speed_increase_rate": 0.02,
      "obstacle_density_base": 0.3,
      "obstacle_density_increase": 0.01
    }
  }
}
```

#### Submit Analytics
**POST** `/game/analytics`

Submit gameplay analytics data for performance monitoring.

**Request Body:**
```json
{
  "session_id": "uuid",
  "events": [
    {
      "timestamp": 1000,
      "type": "GAME_START",
      "data": {"platform": "desktop", "browser": "chrome"}
    },
    {
      "timestamp": 180000,
      "type": "GAME_END",
      "data": {"reason": "collision", "final_score": 15750}
    },
    {
      "timestamp": 90000,
      "type": "PERFORMANCE",
      "data": {"fps": 58.5, "memory_usage": 45.2}
    }
  ]
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "events_processed": 3,
    "session_id": "uuid"
  }
}
```

## Authentication (Optional)

### JWT Token Structure
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "player_id": "uuid",
    "username": "CyberRunner123",
    "iat": 1642248000,
    "exp": 1642334400
  }
}
```

### Protected Endpoints
When authentication is required, include JWT token in header:
```
Authorization: Bearer <jwt_token>
```

## Rate Limiting

### Limits by Endpoint
- **Score Submission**: 10 requests per minute per IP
- **Leaderboard Queries**: 60 requests per minute per IP
- **Player Registration**: 5 requests per minute per IP
- **Analytics Submission**: 30 requests per minute per IP

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```

## Data Validation

### Score Validation Algorithm
```python
def validate_score(score_data):
    # 1. Basic range validation
    if score_data.score < 0 or score_data.score > MAX_THEORETICAL_SCORE:
        return False
    
    # 2. Time consistency check
    calculated_duration = calculate_duration_from_events(score_data.game_events)
    if abs(calculated_duration - score_data.duration) > DURATION_TOLERANCE:
        return False
    
    # 3. Event sequence validation
    if not validate_event_sequence(score_data.game_events):
        return False
    
    # 4. Statistical analysis
    player_stats = get_player_statistics(score_data.player_id)
    if is_statistical_outlier(score_data.score, player_stats):
        return False  # Flag for manual review
    
    return True
```

### Anti-Cheat Measures
- Server-side replay validation
- Statistical analysis of player performance curves
- Temporal analysis of input patterns
- Cross-validation of multiple data points
- Machine learning anomaly detection (future enhancement)

## Monitoring & Analytics

### Health Check Endpoint
**GET** `/health`

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "version": "1.0.0",
  "dependencies": {
    "database": "healthy",
    "cache": "healthy"
  }
}
```

### Metrics Collected
- Request latency percentiles (p50, p95, p99)
- Error rates by endpoint
- Database query performance
- Score submission validation rates
- Player engagement metrics

This API specification ensures robust, secure, and performant backend services for the Neon Runner game while maintaining strict validation standards and comprehensive monitoring capabilities.