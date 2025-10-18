# Recommended Project Structure

```
noob-blog/
├── frontend/                    # Next.js application
│   ├── src/
│   │   ├── app/                # App Router (Next.js 13+)
│   │   ├── components/         # React components
│   │   └── lib/               # Utilities and API clients
│   ├── public/                # Static assets
│   ├── package.json
│   ├── next.config.js
│   └── tsconfig.json
│
├── backend/                     # FastAPI application
│   ├── src/
│   │   ├── api/               # API routes
│   │   ├── models/            # Data models
│   │   ├── services/          # Business logic
│   │   └── main.py            # FastAPI app entry
│   ├── requirements.txt
│   └── Dockerfile
│
├── infrastructure/              # AWS CDK code
│   ├── lib/
│   │   ├── frontend-stack.ts   # Amplify/CloudFront stack
│   │   ├── backend-stack.ts    # Lambda/API Gateway stack
│   │   └── database-stack.ts   # DynamoDB stack
│   ├── bin/
│   │   └── app.ts             # CDK app entry
│   ├── package.json
│   └── cdk.json
│
├── docker/                      # Local development
│   ├── docker-compose.yml      # DynamoDB Local + services
│   └── dynamodb/              # DynamoDB Local data
│
├── scripts/                     # Deployment and utility scripts
│   ├── deploy.sh              # Full deployment script
│   ├── local-setup.sh         # Local environment setup
│   └── seed-data.py           # Sample data for development
│
├── .env.example                # Environment variables template
├── .gitignore
├── README.md
└── PROJECT_PLAN.md
```

## Key Design Decisions

### 1. Monorepo Structure
- All components in one repository for easier development
- Clear separation between frontend, backend, and infrastructure
- Shared configuration and deployment scripts

### 2. Local Development with Docker
- DynamoDB Local for database
- Hot reload for both frontend and backend
- Environment parity with production

### 3. AWS CDK for Infrastructure
- TypeScript CDK for type safety
- Separate stacks for modularity
- Environment-specific configurations

### 4. Deployment Strategy
- Frontend: AWS Amplify with Next.js ISR
- Backend: Lambda with API Gateway
- Database: DynamoDB with proper indexing
- CDN: CloudFront for global delivery