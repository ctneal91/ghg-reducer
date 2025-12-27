# GHG Reducer

A full-stack web application for tracking and reducing greenhouse gas emissions, built with Rails 8 API backend and React 19 frontend.

## Live Demo

**[https://ghg-reducer-4776ed9b5556.herokuapp.com/](https://ghg-reducer-4776ed9b5556.herokuapp.com/)**

## Status

**In Progress** - This application is currently under active development.

## Features (Planned)

- **Activity Logging** - Track travel, purchases, and daily activities that contribute to your carbon footprint
- **Emission Calculations** - Integration with Climatiq API for accurate emission factors
- **Data Visualization** - Interactive charts and graphs using Recharts to visualize your carbon impact over time
- **Personalized Recommendations** - Get actionable suggestions to reduce your environmental footprint
- **Carbon Offsets** - Purchase carbon offsets through Stripe integration

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Rails 8 (API mode) |
| Frontend | React 19, TypeScript, Recharts |
| Database | PostgreSQL |
| APIs | Climatiq (emission factors), Stripe (payments) |
| Testing | RSpec, Jest |
| Deployment | Heroku |

## Prerequisites

Before you start, make sure you have:

- **Ruby 3.3+** - `ruby --version`
- **PostgreSQL** - `psql --version`
- **Node.js** - `node --version` (recommend using nvm)
- **Heroku CLI** - `heroku --version` (for deployment)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ghg-reducer.git
cd ghg-reducer
```

### 2. Install Dependencies

```bash
# Ruby gems
bundle install

# Node packages
cd frontend && npm install && cd ..
```

### 3. Setup Database

```bash
rails db:create db:migrate
```

### 4. Configure API Keys (Optional)

The app works without API keys using local emission factors. For real-time emission data from [Climatiq](https://www.climatiq.io/), set the API key:

**Option A: Environment variable (recommended for development)**
```bash
export CLIMATIQ_API_KEY=your_climatiq_api_key
```

**Option B: Rails credentials (recommended for production)**
```bash
EDITOR="code --wait" rails credentials:edit
```

```yaml
climatiq:
  api_key: your_climatiq_api_key

stripe:
  secret_key: your_stripe_secret_key
  publishable_key: your_stripe_publishable_key
```

> **Note**: Without CLIMATIQ_API_KEY, the app uses built-in emission factors. With it, you get real-time factors from EPA, DEFRA, and other authoritative sources.

### 5. Install Git Hooks

```bash
bin/setup-hooks
```

This installs pre-commit hooks that run automatically based on what files you change:

**When Ruby files (.rb) are staged:**
- **RuboCop** - Ruby linting on staged files
- **RSpec** - Full Rails test suite (96 tests) with 100% line coverage enforcement

**When TypeScript/JavaScript files (.ts, .tsx, .js, .jsx) are staged:**
- **TypeScript** - Type checking via `tsc --noEmit`
- **ESLint** - TypeScript/React linting on staged files
- **Jest** - Full React test suite with coverage enforcement:
  - Branches: 85% minimum
  - Functions: 95% minimum
  - Lines: 96% minimum
  - Statements: 96% minimum

Tests only run for the relevant file types, so commits that only change Ruby files won't run Jest, and vice versa.

### 6. Verify Setup

```bash
# Run tests
bundle exec rspec
cd frontend && CI=true npm test && cd ..

# Run linters
bundle exec rubocop
cd frontend && npm run lint && cd ..
```

## Local Development

Run both servers:

```bash
# Terminal 1 - Rails API (port 3000)
rails server -p 3000

# Terminal 2 - React dev server (port 3001)
cd frontend && npm start
```

Visit http://localhost:3001

The React dev server proxies API requests to Rails automatically.

## Deploying to Heroku

### First-Time Setup

```bash
# 1. Create Heroku app
heroku create your-app-name

# 2. Add PostgreSQL
heroku addons:create heroku-postgresql:essential-0

# 3. Set your master key (from config/master.key)
heroku config:set RAILS_MASTER_KEY=$(cat config/master.key)

# 4. Build React for production
cd frontend && npm run build && cp -r build/* ../public/ && cd ..

# 5. Commit the build
git add .
git commit -m "Build frontend for production"

# 6. Deploy
git push heroku master

# 7. Run migrations (if you have any)
heroku run rails db:migrate
```

### Subsequent Deploys

```bash
# If frontend changed, rebuild it
cd frontend && npm run build && cp -r build/* ../public/ && cd ..

# Commit and push
git add .
git commit -m "Your commit message"
git push heroku master
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Heroku                        │
│  ┌───────────────────────────────────────────┐  │
│  │              Rails Server                 │  │
│  │  ┌─────────────────┐  ┌────────────────┐  │  │
│  │  │  API Routes     │  │  Static Files  │  │  │
│  │  │  /api/v1/*      │  │  public/*      │  │  │
│  │  │  (JSON)         │  │  (React build) │  │  │
│  │  └─────────────────┘  └────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
│                      │                          │
│              ┌───────┴───────┐                  │
│              │   PostgreSQL  │                  │
│              └───────────────┘                  │
└─────────────────────────────────────────────────┘
```

- **API routes** (`/api/v1/*`) return JSON
- **All other routes** serve the React SPA from `public/index.html`
- **React** handles client-side routing

## Project Structure

```
/
├── app/
│   └── controllers/
│       ├── application_controller.rb
│       └── frontend_controller.rb  # Serves React app
├── config/
│   ├── database.yml               # Database config
│   ├── routes.rb                  # API and catch-all routes
│   └── initializers/
│       └── cors.rb                # CORS for local dev
├── frontend/                      # React application
│   ├── src/
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── public/
│   └── package.json
├── spec/                          # RSpec tests
├── public/                        # Built React app (production)
├── Procfile                       # Heroku process config
└── Gemfile                        # Ruby dependencies
```

## Common Issues

### CORS Errors in Development

The React dev server runs on port 3001 and proxies to Rails on 3000. CORS is configured in `config/initializers/cors.rb` to allow this.

### Database Connection Errors on Heroku

Make sure you've added the Postgres addon:
```bash
heroku addons:create heroku-postgresql:essential-0
```

### Missing Master Key

If you see credential errors, make sure `RAILS_MASTER_KEY` is set:
```bash
heroku config:set RAILS_MASTER_KEY=$(cat config/master.key)
```

### React Build Not Showing

Make sure you've built React and copied to public:
```bash
cd frontend && npm run build && cp -r build/* ../public/ && cd ..
git add public/
git commit -m "Update frontend build"
git push heroku master
```

---

*Forked from [heroku-deployable-rails-app-template](https://github.com/ctneal91/heroku-deployable-rails-app-template) at commit `743fafb`*
