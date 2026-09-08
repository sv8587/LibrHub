# LibrHub — Smart Library Management System

LibrHub is a full-stack library management system built with React, TypeScript, Vite, Express, and MongoDB/Mongoose. It provides librarians with a clean dashboard for managing books, users, circulation, QR codes, reports, and an intelligent library assistant.

## Catalogue
- Curated Indian and renowned Western classics with local book-cover artwork and external cover fallback.

## Features

- 🔐 JWT-based librarian authentication with bcrypt password hashing
- 📚 Book catalog management with availability tracking
- 🔄 Issue and return workflows with overdue tracking
- 📷 QR code generation and camera-based scanning
- 📊 Dashboard analytics and circulation statistics
- ⚙️ Library settings for loan rules, fines, reminders, appearance, and administrator preferences
- 🌗 Light/dark mode with a polished indigo, cream, and terracotta visual theme
- 🔄 Working refresh controls across dashboard modules and live status cards
- 📈 Reports and CSV/Excel data export
- 🤖 LibrHub Assistant that answers common library queries from live database records
- 🗄️ MongoDB/Mongoose support with an in-memory fallback for easy local evaluation
- 🛡️ Helmet and CORS configuration for the Express server
- ⚡ React + Vite frontend with TypeScript

## Technology Stack

**Frontend**
- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Lucide React
- html5-qrcode

**Backend**
- Node.js
- Express
- TypeScript
- Mongoose
- JWT
- bcryptjs
- QRCode
- XLSX

**Database**
- MongoDB / MongoDB Atlas
- Automatic in-memory fallback with seed data when MongoDB is unavailable

## Project Structure

```text
LibrHub/
├── client/
│   └── src/                 # Main React application
├── server/
│   └── src/
│       ├── config/          # Database configuration
│       ├── controllers/     # API controllers
│       ├── middleware/      # Authentication/error middleware
│       ├── models/          # Mongoose models
│       ├── routes/          # API routes
│       ├── services/        # Business logic and assistant
│       ├── types/           # Shared server types
│       └── utils/           # Seed utilities
├── src/                     # Vite entry-point bridge
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

## Getting Started

### 1. Install dependencies

Use Node.js and npm:

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and update the values as required.

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

For a quick local evaluation, MongoDB can be left unavailable; the application will use its in-memory fallback.

### 3. Start the application

```bash
npm run dev
```

The application runs through the Express server and Vite development middleware.

### 4. Production build

```bash
npm run build
npm start
```

### 5. Type checking

```bash
npm run lint
```

### 6. Seed data

If you want to explicitly run the seed utility:

```bash
npm run seed
```

## LibrHub Assistant

The built-in assistant is designed around the library's live application data. It uses a rule-based query engine to answer supported questions such as:

- Which books are overdue?
- How many books are currently issued?
- Who currently has book `LIB-102`?
- Which books have low availability?
- What is the most borrowed category?

Because the assistant operates from the application's own database/services, it does not require an external AI provider or AI API key.

## Deployment

For Vercel or another Node-compatible deployment platform:

1. Push the project to GitHub.
2. Import the repository into the deployment platform.
3. Use the project root as the application root.
4. Install dependencies with `npm install`.
5. Use `npm run build` as the build command.
6. Use `npm start` as the production start command when a persistent Node server is supported.
7. Configure the required environment variables in the deployment dashboard.

For server deployments that require a long-running Express process, use a Node-compatible hosting platform rather than a static-only deployment.

## Environment Variables

The example configuration contains:

```text
MONGODB_URI
JWT_SECRET
CLIENT_URL
PORT
NODE_ENV
```

Never commit a real `.env` file or production secrets to GitHub.

## UI & Administration

The Settings area is designed as a real library administration screen rather than a technical diagnostics page. It includes:

- Library name and librarian defaults
- Default loan duration and maximum books per member
- Overdue fine and grace-period policies
- Due-date, overdue, and email reminder preferences
- Light/dark appearance controls
- Compact table and automatic-refresh preferences
- A compact System Health panel for administrators

The appearance preference is stored locally in the browser so it remains available after a refresh. The portal also exposes a refresh control in the main header and on data-heavy modules so catalog, transaction, report, and circulation views can be reloaded on demand.

## Notes

- The repository is configured to use **npm**.
- The project does not require an external AI API or provider-specific configuration.
- The assistant remains available through the application UI using the live database/rule engine.
- `bun.lock` is intentionally not included; `package-lock.json` can be generated with `npm install`.

## License

This project is intended for educational, portfolio, and library-management project use.

## Catalogue Covers
The catalogue includes local SVG book covers for the seeded collection, so cover images work without depending on an external cover service. If a newly added book has no local cover, the UI attempts an external ISBN cover and then falls back to a generated LibrHub placeholder.

## Demo Librarian
- Head Librarian: Neha Sharma
- Assistant Librarian: Rohan Mehta
- Username: `admin`
- Email: `admin@librhub.library`
- Password: `Admin@12345`


## Book Cover Sources

LibrHub displays real book-edition cover images using the Open Library Covers API, keyed by ISBN. Open Library recommends using `covers.openlibrary.org` URLs for public-facing cover display. A courtesy link back to Open Library is appreciated. See the official documentation: https://openlibrary.org/dev/docs/api/covers
