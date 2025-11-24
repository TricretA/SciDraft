# SciDraft - AI-Powered Lab Report Generator

SciDraft is an advanced web application that transforms manual lab data into professional, publication-ready reports using AI technology. Built with modern web technologies, it provides a seamless experience for researchers, students, and professionals to generate high-quality scientific reports.

## 🚀 Features

### Core Functionality
- **AI-Powered Report Generation**: Transform manual lab data into professional reports
- **Multiple Export Formats**: Support for PDF, DOCX, and other formats
- **Responsive Design**: Works seamlessly across all devices

### User Features
- **New Report**: Default entry point to create a new lab report
- **Report Editor**: Interactive editor for refining generated content
- **Payment Integration**: Secure payment processing for premium features
- **Template Management**: Pre-built and custom templates
- **Collaboration Tools**: Share and collaborate on reports

### Admin Features
- **User Management**: Comprehensive user administration
- **Content Moderation**: Review and manage generated content
- **System Monitoring**: Track system health and performance
- **Configuration Management**: Dynamic system settings

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Zustand** for state management

### Backend
- **Node.js** with Express
- **TypeScript** throughout
- **Supabase** for database (authentication removed)
- **PostgreSQL** for data storage
- **Zod** for validation

### AI Integration
- **OpenAI GPT** for content generation
- **Structured prompting** with version control
- **JSON schema validation** for AI outputs
- **Hallucination prevention** mechanisms

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Git

### Setup
1. Clone the repository:
```bash
git clone https://github.com/your-username/scidraft.git
cd scidraft
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations:
```bash
npm run db:migrate
```

5. Start development server:
```bash
npm run dev
```

## 🔧 Configuration

### Environment Variables
Required environment variables:

```env
# Database (authentication removed; keep service role for backend)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# AI Integration
OPENAI_API_KEY=your_openai_api_key

# Payment Processing
# M-Pesa STK Push configuration (fixed amount: KSh 50)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_short_code
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-secure-callback-url
MPESA_ENVIRONMENT=sandbox
MPESA_TRANSACTION_TYPE=CustomerPayBillOnline
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# Application
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001
```

### Payment & Pricing
All draft unlock payments use a fixed amount of KSh 50 across frontend and backend. The `mpesa/initiate` endpoint returns `{ success, checkoutRequestID, amount: 50 }`, and payment records store `amount = 50`.

### Database Setup
The application uses Supabase with the following main tables:
- `users` - User accounts and profiles
- `reports` - Generated reports and drafts
- `payments` - Payment transactions
- `admins` - Admin user management
- `prompts` - AI prompt versioning

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy with automatic CI/CD

### Manual Deployment
1. Build the application:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

## 🔒 Security Features

### Authentication & Authorization
- Authentication removed; all pages are publicly accessible

### Data Protection
- Input sanitization and validation
- SQL injection prevention
- XSS protection
- Secure cookie handling

### AI Safety
- Prompt injection prevention
- Output validation with JSON schemas
- Hallucination detection and handling
- Content filtering

## 📁 Project Structure

```
scidraft/
├── src/                    # Frontend source code
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Utility functions
│   └── lib/              # Library configurations
├── api/                   # Backend API
│   ├── routes/           # API routes
│   ├── lib/              # Backend utilities
│   └── server.ts         # Express server
├── supabase/             # Database migrations
├── public/               # Static assets
└── gallery/              # Brand assets
```

## 🔄 Routing Changes

- The default route `/` redirects to `/new-report`.
- Landing, Dashboard, Login, Signup, and Reset Password pages have been removed.
- All navigation links now point to `/new-report`.

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Commit with conventional commits: `git commit -m 'feat: add new feature'`
5. Push to your fork: `git push origin feature-name`
6. Create a Pull Request

### Commit Conventions
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions or changes
- `chore:` - Build process or auxiliary tool changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Contact the development team

## 🏗️ Architecture

SciDraft follows a modern microservices-inspired architecture:

### Frontend Architecture
- **Component-based**: Modular React components
- **Context-driven**: Centralized state management
- **Hook-centric**: Reusable custom hooks
- **Type-safe**: Full TypeScript coverage

### Backend Architecture
- **API-first**: RESTful API design
- **Service-oriented**: Separated business logic
- **Database-driven**: Supabase integration
- **Security-focused**: Multi-layer security

### AI Pipeline
- **Prompt versioning**: Trackable AI prompt changes
- **Output validation**: JSON schema enforcement
- **Error handling**: Graceful failure management
- **Performance optimized**: Efficient processing

## 🔧 Development Guidelines

### Code Standards
- Follow TypeScript best practices
- Use consistent naming conventions
- Write comprehensive comments
- Maintain test coverage above 80%

### Performance Guidelines
- Implement lazy loading for components
- Optimize bundle size with code splitting
- Use efficient database queries
- Implement proper caching strategies

### Security Guidelines
- Never commit sensitive data
- Validate all user inputs
- Use parameterized queries
- Implement rate limiting

---

**Built with ❤️ by the SciDraft Team**
