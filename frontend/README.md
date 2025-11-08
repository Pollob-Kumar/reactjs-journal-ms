# Pundra University Journal Management System (PUJMS)

A comprehensive web-based journal management system built with the MERN stack (MongoDB, Express.js, React, Node.js) for managing the complete academic publishing workflow.

## Features

### For Authors
- Submit manuscripts with multiple files
- Track submission status in real-time
- Receive automated email notifications
- Submit revisions based on reviewer feedback
- View detailed manuscript timeline

### For Reviewers
- Accept or decline review invitations
- Access manuscripts securely
- Submit confidential and author-facing reviews
- Track review deadlines
- Manage review history

### For Editors
- Assign reviewers to submissions
- Track review progress
- Make editorial decisions
- Manage journal issues
- Publish accepted manuscripts

### For Administrators
- Complete user management
- System-wide analytics
- Manage all submissions
- Configure system settings
- Monitor system health

### Public Portal
- Search published articles
- Browse current and archived issues
- Download full-text PDFs
- Access articles via DOI

## Technology Stack

### Backend
- **Runtime:** Node.js v20+
- **Framework:** Express.js
- **Database:** MongoDB 7.0+
- **File Storage:** MongoDB GridFS (for local homelab deployment)
- **Authentication:** JWT (JSON Web Tokens)
- **Email:** Nodemailer with SMTP
- **Validation:** Express Validator, Yup

### Frontend
- **Framework:** React 18+
- **Routing:** React Router v6
- **State Management:** React Context API + React Query
- **Forms:** Formik + Yup
- **Styling:** Custom CSS with CSS Variables
- **Icons:** React Icons
- **Notifications:** React Toastify
- **File Upload:** React Dropzone

### DevOps
- **Containerization:** Docker & Docker Compose
- **Reverse Proxy:** (Optional) Nginx
- **SSL:** (Production) Let's Encrypt

## Prerequisites

- Docker & Docker Compose (v2.0+)
- Git
- (Optional) Node.js v20+ for local development

## Quick Start with Docker

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/pujms.git
cd pujms
```

### 2. Configure Environment Variables

**Backend Environment (.env):**

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
NODE_ENV=development
PORT=5000

# MongoDB Configuration
MONGODB_URI=mongodb://admin:adminpassword@mongodb:27017/pujms?authSource=admin

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRE=7d

# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=noreply@pundra.edu

# Client URL
CLIENT_URL=http://localhost:3000

# CrossRef API (for DOI generation)
CROSSREF_API_URL=https://api.crossref.org
CROSSREF_API_KEY=your-crossref-api-key-optional
```

**Frontend Environment (.env):**

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=PUJMS
REACT_APP_FULL_NAME=Pundra University Journal Management System
```

### 3. Start the Application

From the project root directory:

```bash
docker-compose up -d
```

This will start:
- MongoDB on port 27017
- Backend API on port 5000
- Frontend on port 3000

### 4. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/health

### 5. Create Initial Admin User

You have two options:

**Option A: Register via UI and promote to admin via MongoDB**

1. Go to http://localhost:3000/register
2. Create an account with author role
3. Connect to MongoDB:
   ```bash
   docker exec -it pujms-mongodb mongosh -u admin -p adminpassword --authenticationDatabase admin
   ```
4. Promote user to admin:
   ```javascript
   use pujms
   db.users.updateOne(
     { email: "your-email@example.com" },
     { $set: { roles: ["author", "editor", "admin"] } }
   )
   ```

**Option B: Use backend API directly**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@pundra.edu",
    "password": "SecurePass123!",
    "affiliation": "Pundra University",
    "roles": ["admin", "editor", "author"]
  }'
```

Then update roles in MongoDB as shown above.

## Local Development (Without Docker)

### Backend Setup

```bash
cd backend
npm install
```

Create `.env` file as described above, but use:
```env
MONGODB_URI=mongodb://localhost:27017/pujms
```

Start MongoDB locally:
```bash
mongod --dbpath /path/to/data/db
```

Start backend:
```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

## Project Structure

```
pujms/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, GridFS, email config
│   │   ├── models/          # Mongoose models
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, RBAC, upload, error handlers
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic (email, file, DOI)
│   │   ├── utils/           # Validators, helpers
│   │   └── server.js        # Express app entry point
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React Context (Auth)
│   │   ├── services/        # API services
│   │   ├── utils/           # Utility functions
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
└── README.md
```

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | User login | Public |
| GET | `/api/auth/me` | Get current user | Private |
| PUT | `/api/auth/profile` | Update profile | Private |
| PUT | `/api/auth/change-password` | Change password | Private |
| POST | `/api/auth/forgot-password` | Request password reset | Public |
| PUT | `/api/auth/reset-password/:token` | Reset password | Public |

### Manuscript Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/manuscripts` | Submit manuscript | Author |
| GET | `/api/manuscripts` | Get manuscripts | Private |
| GET | `/api/manuscripts/:id` | Get manuscript details | Private |
| PUT | `/api/manuscripts/:id/revise` | Submit revision | Author |
| PUT | `/api/manuscripts/:id/assign-editor` | Assign editor | Editor/Admin |
| PUT | `/api/manuscripts/:id/decision` | Make decision | Editor/Admin |
| DELETE | `/api/manuscripts/:id` | Delete manuscript | Author/Admin |

### Review Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/reviews/manuscripts/:id/assign` | Assign reviewers | Editor/Admin |
| GET | `/api/reviews/my-reviews` | Get my reviews | Reviewer |
| GET | `/api/reviews/:id` | Get review details | Private |
| PUT | `/api/reviews/:id/accept` | Accept invitation | Reviewer |
| PUT | `/api/reviews/:id/decline` | Decline invitation | Reviewer |
| PUT | `/api/reviews/:id/submit` | Submit review | Reviewer |

### Public Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/public/search` | Search articles | Public |
| GET | `/api/public/current-issue` | Get current issue | Public |
| GET | `/api/public/archives` | Get archived issues | Public |
| GET | `/api/public/articles/:id` | Get article details | Public |

## Email Configuration

### Gmail Setup

1. Enable 2-Factor Authentication on your Google Account
2. Generate App Password:
   - Go to Google Account Settings
   - Security → App passwords
   - Select "Mail" and your device
   - Copy the 16-character password

3. Update `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

### Other SMTP Providers

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

## File Storage (GridFS)

This implementation uses MongoDB GridFS for local file storage, which is ideal for homelab deployments.

### Features:
- Stores files up to 50MB (configurable)
- Automatic file chunking for large files
- Metadata storage with each file
- Secure file access with authentication

### File Types Supported:
- Manuscripts: PDF, DOCX, DOC
- Supplementary files: Images (JPG, PNG, GIF), ZIP, TXT

### Configuration:

Files are automatically stored in MongoDB with the following structure:
- **Collection:** `uploads.files` (metadata)
- **Collection:** `uploads.chunks` (file data)

## Security Best Practices

### Production Deployment Checklist

- [ ] Change all default passwords
- [ ] Use strong, random JWT_SECRET (min 32 characters)
- [ ] Enable HTTPS/SSL
- [ ] Set NODE_ENV=production
- [ ] Use environment-specific email credentials
- [ ] Enable MongoDB authentication
- [ ] Configure firewall rules
- [ ] Set up regular database backups
- [ ] Implement rate limiting (included)
- [ ] Enable CORS for specific domains only
- [ ] Review and update all .env variables

### Security Features Included

- Password hashing with bcrypt (salt rounds: 12)
- JWT token-based authentication
- Role-based access control (RBAC)
- Request rate limiting
- NoSQL injection prevention
- XSS protection via Helmet
- CORS configuration
- File type validation
- File size limits
- Secure file URLs with authentication

## Database Backup & Restore

### Backup MongoDB

```bash
# Backup entire database
docker exec pujms-mongodb mongodump \
  --uri="mongodb://admin:adminpassword@localhost:27017/pujms?authSource=admin" \
  --out=/backup

# Copy backup from container
docker cp pujms-mongodb:/backup ./mongodb-backup-$(date +%Y%m%d)
```

### Restore MongoDB

```bash
# Copy backup to container
docker cp ./mongodb-backup-20250101 pujms-mongodb:/backup

# Restore database
docker exec pujms-mongodb mongorestore \
  --uri="mongodb://admin:adminpassword@localhost:27017/pujms?authSource=admin" \
  /backup/pujms
```

### Automated Backups

Add to crontab for daily backups:

```bash
0 2 * * * /path/to/backup-script.sh
```

## Monitoring & Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Application Logs

Backend logs include:
- API requests (Morgan middleware)
- Database connections
- Email sending status
- File upload/download operations
- Error stack traces (development mode)

## Troubleshooting

### Common Issues

**1. MongoDB Connection Failed**
```bash
# Check if MongoDB is running
docker ps | grep mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

**2. Frontend Can't Connect to Backend**
- Verify REACT_APP_API_URL in frontend/.env
- Check if backend is running on port 5000
- Clear browser cache and cookies

**3. Email Not Sending**
- Verify SMTP credentials
- Check spam/junk folder
- Review backend logs for email errors
- Test with a simple SMTP tester

**4. File Upload Issues**
- Check file size (max 50MB)
- Verify file type is allowed
- Check MongoDB storage space
- Review GridFS configuration

**5. Permission Denied Errors**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod -R 755 .
```

## Performance Optimization

### Database Indexes

Indexes are automatically created by Mongoose for:
- User email (unique)
- Manuscript status
- Review status
- Full-text search on manuscripts

### Caching Strategies

- React Query caching (5-minute stale time)
- Browser caching for static assets
- (Optional) Redis for session storage

### Scaling Recommendations

For high-traffic deployments:
1. Use MongoDB replica set
2. Implement Redis caching
3. Use CDN for static assets
4. Deploy multiple backend instances with load balancer
5. Use external file storage (S3/MinIO)

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### E2E Tests

```bash
# Coming soon
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/pujms/issues
- Email: support@pundra.edu

## Roadmap

- [ ] Advanced analytics dashboard
- [ ] Plagiarism detection integration
- [ ] Multi-language support
- [ ] Mobile applications (iOS/Android)
- [ ] AI-powered reviewer matching
- [ ] Integration with reference managers
- [ ] OAI-PMH support for indexing
- [ ] Article-level metrics

## Acknowledgments

- Pundra University of Science & Technology
- Open source community
- All contributors

---

**Version:** 1.0.0  
**Last Updated:** 2025-11-08  
**Status:** Production Ready