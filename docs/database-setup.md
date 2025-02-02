# Siyoga Travel Booking System - Complete Database Setup

## Step-by-Step Database Creation in phpMyAdmin

### Step 1: Create Database
1. Open phpMyAdmin in your browser (usually http://localhost/phpmyadmin)
2. Click on "SQL" tab at the top
3. Copy and paste the content from `/database/01_create_database.sql`
4. Click "Go" to execute

### Step 2: Create All Tables
1. In phpMyAdmin, select the `siyoga_travel_booking` database from the left sidebar
2. Click on "SQL" tab
3. Copy and paste the **ENTIRE CONTENT** from `/database/02_create_core_tables.sql`
4. Click "Go" to execute

### Step 3: Verify Tables Created
You should see these **14 tables** in your database:

## Complete Database Schema

### 🔐 **Authentication & User Management**
1. **`users`** - Core user authentication (email, password, role)
2. **`email_verification`** - Email verification tokens
3. **`tourists`** - Tourist profile information
4. **`drivers`** - Driver profile and documents

### 🚗 **Vehicle & Availability Management**
5. **`vehicles`** - Driver vehicle information
6. **`driver_availability`** - Driver availability calendar

### 🗺️ **Destination & Distance Management**
7. **`destinations`** - Tourist destinations database
8. **`distances`** - Pre-calculated distances between destinations

### 🧳 **Trip Planning**
9. **`trips`** - Trip planning information
10. **`trip_stops`** - Individual stops in a trip
11. **`trip_preferences`** - Trip preferences and requirements

### 📋 **Booking System**
12. **`booking_requests`** - Trip booking requests to drivers
13. **`bookings`** - Confirmed bookings
14. **`trip_reviews`** - Post-trip reviews and ratings

## Database Relationships

The ER diagram above shows the complete relationships between all tables. Key relationships:

- **Users** → **Tourists/Drivers** (One-to-One)
- **Drivers** → **Vehicles** (One-to-Many)
- **Tourists** → **Trips** → **Booking Requests** → **Bookings** (Flow)
- **Bookings** → **Trip Reviews** (One-to-One)

## Sample Data Included

The database includes sample data:
- **Admin user**: admin@siyoga.com
- **8 Sri Lankan destinations**: Colombo, Kandy, Galle, Nuwara Eliya, etc.
- **Distance data**: Pre-calculated routes between major destinations

## Connection Details for Backend

```javascript
const dbConfig = {
    host: 'localhost',
    user: 'root',        // or your MySQL username
    password: '',        // or your MySQL password
    database: 'siyoga_travel_booking'
};
```

## Business Logic Flow

1. **User Registration** → `users` + `email_verification`
2. **Profile Setup** → `tourists` or `drivers` + `vehicles`
3. **Trip Planning** → `trips` + `trip_stops` + `trip_preferences`
4. **Driver Matching** → `driver_availability` + `distances`
5. **Booking Process** → `booking_requests` → `bookings`
6. **Trip Execution** → Update `bookings.trip_status`
7. **Post-Trip** → `trip_reviews`

## Next Steps

1. ✅ Create database and all tables in phpMyAdmin
2. ⏳ Setup backend server with database connection
3. ⏳ Implement user registration API
4. ⏳ Implement user login API
5. ⏳ Create frontend registration form
6. ⏳ Create frontend login form
