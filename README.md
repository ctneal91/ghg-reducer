# Heroku Deployable Rails App Template

A production-ready full-stack boilerplate with a Rails 8 API backend and React 19 frontend, configured for single-app deployment on Heroku. Use this template to quickly start new web applications without the usual setup hassle.

## What's Included

- **Rails 8 API** - Backend configured for API-only mode
- **React 19 + TypeScript** - Modern frontend with type safety
- **PostgreSQL** - Production-ready database
- **Single-App Deployment** - Rails serves the React build from `public/`
- **Testing** - RSpec (Rails) and Jest (React) pre-configured
- **Linting** - RuboCop (Ruby) and ESLint (TypeScript) ready to go
- **Heroku-Ready** - Procfile, production config, and Postgres addon support

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Rails 8 (API mode) |
| Frontend | React 19, TypeScript |
| Database | PostgreSQL |
| Testing | RSpec, Jest |
| Linting | RuboCop, ESLint |
| Deployment | Heroku |

## Prerequisites

Before you start, make sure you have:

- **Ruby 3.3+** - `ruby --version`
- **PostgreSQL** - `psql --version`
- **Node.js** - `node --version` (recommend using nvm)
- **Heroku CLI** - `heroku --version` (for deployment)

## Getting Started

### 1. Use This Template

Click "Use this template" on GitHub, or clone manually:

```bash
git clone https://github.com/YOUR_USERNAME/heroku-deployable-rails-app-template.git my-new-app
cd my-new-app
rm -rf .git
git init
git add .
git commit -m "Initial commit from template"
```

### 2. Rename Your App

Update these files with your app name (replace `myapp` with your app name):

```bash
# config/database.yml - Change database names
sed -i '' 's/myapp/yourappname/g' config/database.yml

# frontend/package.json - Change the name field (optional)
```

### 3. Generate New Credentials

The template doesn't include credentials (for security). Generate your own:

```bash
# This creates config/master.key and config/credentials.yml.enc
EDITOR="code --wait" rails credentials:edit
```

**Important:** Save `config/master.key` somewhere safe - you'll need it for Heroku.

### 4. Install Dependencies

```bash
# Ruby gems
bundle install

# Node packages
cd frontend && npm install && cd ..
```

### 5. Create Databases

```bash
rails db:create db:migrate
```

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

*Forked from [login](https://github.com/YOUR_USERNAME/login) at commit `396be90`*
