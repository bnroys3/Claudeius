# Neon Runner - Project Structure

neon-runner/
  frontend/
    index.html                 # Main game page
    css/
      main.css                # Core styles and layout
      game.css                # Game-specific styling
      neon-effects.css        # Glow effects and animations
      responsive.css          # Mobile responsiveness
    js/
      main.js                 # Application entry point
      game/
        Game.js               # Main game class
        Player.js             # Player entity
        Level.js              # Level generation and management
        Obstacle.js           # Obstacle entities
        PowerUp.js            # Power-up system
        Particle.js           # Visual effects
      engine/
        GameLoop.js           # Core game loop
        InputManager.js       # Keyboard input handling
        Renderer.js           # Canvas rendering
        CollisionDetector.js  # Collision system
        AudioManager.js       # Sound effects
      ui/
        Menu.js               # Main menu
        HUD.js                # Heads-up display
        Leaderboard.js        # Score display
        GameOver.js           # End game screen
      utils/
        Vector2D.js           # 2D vector math
        Utils.js              # Helper functions
        Constants.js          # Game constants
    assets/
      images/
        player/               # Player sprites
        obstacles/            # Obstacle graphics
        powerups/             # Power-up icons
        ui/                   # UI elements
      audio/
        sfx/                  # Sound effects
        music/                # Background music
      fonts/                  # Custom fonts
    manifest.json             # PWA manifest
  backend/
    main.py                   # FastAPI application entry
    api/
      __init__.py
      routes/
        __init__.py
        scores.py             # Score management endpoints
        leaderboard.py        # Leaderboard endpoints
        players.py            # Player management
      middleware/
        __init__.py
        cors.py               # CORS handling
        rate_limit.py         # Rate limiting
    models/
      __init__.py
      player.py               # Player data model
      score.py                # Score data model
      game_session.py         # Game session model
    services/
      __init__.py
      score_service.py        # Score business logic
      leaderboard_service.py  # Leaderboard logic
      validation_service.py   # Score validation
    database/
      __init__.py
      connection.py           # Database setup
      migrations/             # Database migrations
      seed_data.py            # Initial data
    config/
      __init__.py
      settings.py             # Application settings
      database.py             # Database configuration
    tests/
      __init__.py
      test_api.py             # API endpoint tests
      test_services.py        # Service layer tests
      test_models.py          # Model tests
  docs/
    api.md                    # API documentation
    game-design.md            # Game design document
    technical-specs.md        # Technical specifications
    deployment.md             # Deployment guide
  docker/
    Dockerfile.frontend       # Frontend container
    Dockerfile.backend        # Backend container
    docker-compose.yml        # Multi-container setup
  scripts/
    build.sh                  # Build script
    deploy.sh                 # Deployment script
    dev-setup.sh              # Development environment setup
  requirements.txt            # Python dependencies
  package.json                # Node.js dependencies (for build tools)
  .gitignore                  # Git ignore patterns
  README.md                   # Project documentation
  LICENSE                     # License file