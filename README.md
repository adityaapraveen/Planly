# Planly

![JavaScript](https://img.shields.io/badge/JavaScript-73.2%25-yellow?style=flat-square)
![CSS](https://img.shields.io/badge/CSS-26.2%25-blue?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-Backend-green?style=flat-square)
![React](https://img.shields.io/badge/React-Frontend-blue?style=flat-square)

**Planly** is an AI-powered platform for analyzing construction and architectural drawings. It helps professionals review technical drawings with comprehensive analysis across multiple review modes, leveraging AI to identify issues, provide scores, and generate detailed reports.

---

## 🎯 Features

- **User Authentication**: Secure sign-up and login with JWT-based authentication
- **Project Management**: Organize drawings into projects with descriptions
- **Drawing Upload**: Upload PDF and image files for analysis
- **Multi-Mode Analysis**: Review drawings across 5 specialized review modes:
  - Submission Readiness
  - Documentation Review
  - Constructability Review
  - Coordination Review
  - Compliance Risk Review
- **AI-Powered Insights**: Automatic analysis with scoring and issue detection
- **Page Extraction**: Convert multi-page PDFs into individual images for detailed analysis
- **Report Generation**: Generate comprehensive analysis reports with summaries and actionable issues
- **Job Queue**: Background processing with BullMQ for handling large files efficiently

---

## 📋 Tech Stack

### Frontend
- **Framework**: React 19 with Vite
- **Routing**: React Router DOM v7
- **Icons**: Lucide React
- **Build Tool**: Vite for fast development and optimized builds

### Backend
- **Runtime**: Node.js with Express.js v5
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (jsonwebtoken) & Bcrypt
- **Job Queue**: BullMQ with Redis for background processing
- **File Processing**:
  - PDF handling with `pdf-parse` and `pdf2pic`
  - Multer for file uploads
- **AI Integration**: OpenAI API for drawing analysis
- **Security**: Helmet for HTTP headers, CORS enabled
- **Validation**: Zod for schema validation

### Infrastructure
- Database: PostgreSQL
- Cache/Queue: Redis via IORedis
- ORM: Prisma Client v7 with PostgreSQL Adapter

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- Redis 6+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/adityaapraveen/Planly.git
   cd Planly
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```
   
   Create a `.env` file with your configuration:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/planly
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your_jwt_secret
   OPENAI_API_KEY=your_openai_key
   ```

3. **Setup Database**
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

4. **Setup Frontend**
   ```bash
   cd ../client
   npm install
   ```

### Development

**Backend**
```bash
cd backend
npm run dev           # Start development server
npm run dev:worker   # Start background worker in another terminal
```

**Frontend**
```bash
cd client
npm run dev
```

The frontend will be available at `http://localhost:5173`
The backend API will be available at `http://localhost:3000`

### Production Build

**Backend**
```bash
npm start
npm run worker
```

**Frontend**
```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
Planly/
├── backend/
│   ├── src/
│   │   ├── server.js          # Express server setup
│   │   └── worker.js          # Background job processor
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   └── package.json
├── client/
│   ├── src/
│   │   ├── App.jsx            # Main React component
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   └── styles/            # CSS styling
│   └── package.json
└── README.md
```

---

## 🔐 Authentication & Security

- **Password Security**: Passwords are hashed using Bcrypt before storage
- **JWT Tokens**: Secure token-based authentication
- **HTTP Security**: Helmet middleware for secure HTTP headers
- **CORS**: Cross-Origin Resource Sharing configured for safe cross-domain requests
- **Input Validation**: Zod schema validation for all API requests

---

## 📊 Database Schema

### Users
- Store user profiles with encrypted passwords
- Track creation and update timestamps

### Projects
- Organize drawings by user
- Support multiple drawings per project

### Drawings
- Track uploaded files with metadata
- Support multiple pages/images per drawing
- Track processing status

### Drawing Pages
- Store individual page images from PDFs
- Maintain page numbering

### Analysis
- Store AI-generated analysis results
- Support multiple review modes per drawing
- Track scores, summaries, and identified issues

---

## 🔄 Processing Flow

1. **Upload**: User uploads a PDF or image file
2. **Page Extraction**: Multi-page PDFs are converted to individual images
3. **Queue**: File processing job is added to BullMQ queue
4. **Analysis**: OpenAI API analyzes the drawing across requested review modes
5. **Storage**: Results (score, issues, report) are stored in database
6. **Report**: User receives comprehensive analysis report

---

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Projects
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Drawings
- `POST /api/drawings/upload` - Upload drawing file
- `GET /api/drawings/:id` - Get drawing details
- `GET /api/drawings/:id/analysis` - Get analysis results
- `POST /api/drawings/:id/analyze` - Trigger analysis

---

## 🛠️ Available Scripts

### Backend
```bash
npm run dev              # Development server with nodemon
npm run start            # Production server
npm run dev:worker       # Development worker with nodemon
npm run worker           # Production worker
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio
```

### Frontend
```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

---

## 📄 License

ISC License - See LICENSE file for details

---

## 👤 Author

[Aditya Praveen](https://github.com/adityaapraveen)

---

## 📞 Support

For issues, questions, or suggestions, please open an [GitHub Issue](https://github.com/adityaapraveen/Planly/issues).

---

## 🎓 Demo

Check out the [project demo](https://drive.google.com/file/d/13KberZGKsvIXNRiGXV3PCmi2XIN1O88H/view?usp=sharing) to see Planly in action.
