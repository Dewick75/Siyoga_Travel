# Siyoga Travel Booking - Backend Server

## Setup Instructions

### 1. Install Dependencies
```bash
cd Siyoga/server
npm install
```

### 2. Environment Configuration
- Copy `.env.example` to `.env`
- Update database credentials if needed
- The default configuration should work with your phpMyAdmin setup

### 3. Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### 4. Test the Server
- Open: http://localhost:5000/health
- API Info: http://localhost:5000/api

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── database.js          # Database connection
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── routes/                  # API routes (to be created)
│   ├── models/                  # Database models (to be created)
│   ├── utils/
│   │   └── helpers.js           # Utility functions
│   └── server.js                # Main server file
├── uploads/                     # File uploads directory
├── .env                         # Environment variables
├── .env.example                 # Environment template
└── package.json                 # Dependencies
```

## API Endpoints (Planned)

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Password reset

### Tourists
- `GET /api/tourists/profile` - Get tourist profile
- `PUT /api/tourists/profile` - Update tourist profile

### Drivers
- `POST /api/drivers/register` - Driver registration
- `GET /api/drivers/profile` - Get driver profile
- `PUT /api/drivers/profile` - Update driver profile

### Trips & Bookings
- `POST /api/trips` - Create trip
- `GET /api/trips` - Get user trips
- `POST /api/bookings/request` - Create booking request
- `GET /api/bookings` - Get user bookings

## Database Connection

The server connects to your `siyoga_travel_booking` database in phpMyAdmin using these default settings:

- Host: localhost
- User: root
- Password: (empty)
- Database: siyoga_travel_booking
- Port: 3306

## Next Steps

1. ✅ Install dependencies
2. ✅ Start the server
3. ⏳ Create authentication routes
4. ⏳ Create user registration API
5. ⏳ Create user login API
