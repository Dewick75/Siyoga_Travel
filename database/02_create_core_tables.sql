-- =====================================================
-- SIYOGA TRAVEL BOOKING SYSTEM - COMPLETE DATABASE
-- =====================================================

USE siyoga_travel_booking;

-- =====================================================
-- 1. USERS TABLE (Core authentication table)
-- =====================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('tourist', 'driver', 'admin') NOT NULL DEFAULT 'tourist',
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_verified (is_verified) 

);

-- =====================================================
-- 2. EMAIL VERIFICATION TABLE
-- =====================================================
CREATE TABLE email_verification (
    token_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    verification_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_token (verification_token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires (expires_at)
);

-- =====================================================
-- 3. TOURISTS TABLE (Tourist profile information)
-- =====================================================
CREATE TABLE tourists (
    tourist_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    country VARCHAR(100),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    travel_preferences TEXT, -- JSON string for preferences
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_phone (phone)
);

-- =====================================================
-- 4. DRIVERS TABLE (Driver profile information)
-- =====================================================
CREATE TABLE drivers (
    driver_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    nic_number VARCHAR(20) NOT NULL UNIQUE,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    license_expiry DATE NOT NULL,
    profile_picture VARCHAR(255),
    nic_front_image VARCHAR(255),
    nic_back_image VARCHAR(255),
    license_image VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_nic (nic_number),
    INDEX idx_license (license_number)
);

-- =====================================================
-- 5. VEHICLES TABLE (Driver vehicle information)
-- =====================================================
CREATE TABLE vehicles (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT NOT NULL,
    vehicle_type ENUM('car', 'van', 'bus', 'suv') NOT NULL,
    make_model VARCHAR(100) NOT NULL,
    registration_number VARCHAR(20) NOT NULL UNIQUE,
    year_manufactured YEAR,
    color VARCHAR(50),
    seating_capacity INT NOT NULL,
    vehicle_image VARCHAR(255),
    insurance_expiry DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE CASCADE,
    INDEX idx_driver_id (driver_id),
    INDEX idx_vehicle_type (vehicle_type),
    INDEX idx_registration (registration_number),
    INDEX idx_active (is_active)
);

-- =====================================================
-- 6. DRIVER AVAILABILITY TABLE
-- =====================================================
CREATE TABLE driver_availability (
    availability_id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT NOT NULL,
    available_date DATE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE CASCADE,
    UNIQUE KEY unique_driver_date (driver_id, available_date),
    INDEX idx_driver_id (driver_id),
    INDEX idx_date (available_date),
    INDEX idx_available (is_available)
);

-- =====================================================
-- 7. DESTINATIONS TABLE
-- =====================================================
CREATE TABLE destinations (
    destination_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    category ENUM('beach', 'mountain', 'cultural', 'adventure', 'city', 'historical') DEFAULT 'city',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_name (name),
    INDEX idx_category (category),
    INDEX idx_active (is_active),
    INDEX idx_location (latitude, longitude)
);

-- =====================================================
-- 8. DISTANCES TABLE (Pre-calculated distances between destinations)
-- =====================================================
CREATE TABLE distances (
    distance_id INT AUTO_INCREMENT PRIMARY KEY,
    origin_id INT NOT NULL,
    destination_id INT NOT NULL,
    distance_km DECIMAL(8, 2) NOT NULL,
    duration_minutes INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (origin_id) REFERENCES destinations(destination_id) ON DELETE CASCADE,
    FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE CASCADE,
    UNIQUE KEY unique_route (origin_id, destination_id),
    INDEX idx_origin (origin_id),
    INDEX idx_destination (destination_id)
);

-- =====================================================
-- 9. TRIPS TABLE (Trip planning information)
-- =====================================================
CREATE TABLE trips (
    trip_id INT AUTO_INCREMENT PRIMARY KEY,
    tourist_id INT NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destinations TEXT NOT NULL, -- JSON array of destination names
    start_date DATE NOT NULL,
    end_date DATE,
    trip_type ENUM('drop', 'return', 'round_trip') NOT NULL DEFAULT 'drop',
    total_distance DECIMAL(8, 2),
    estimated_duration INT, -- Total duration in minutes
    status ENUM('planning', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'planning',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tourist_id) REFERENCES tourists(tourist_id) ON DELETE CASCADE,
    INDEX idx_tourist_id (tourist_id),
    INDEX idx_start_date (start_date),
    INDEX idx_status (status)
);

-- =====================================================
-- 10. TRIP STOPS TABLE (Individual stops in a trip)
-- =====================================================
CREATE TABLE trip_stops (
    stop_id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    destination_id INT,
    destination_name VARCHAR(255) NOT NULL,
    stop_order INT NOT NULL,
    overnight_stay BOOLEAN DEFAULT FALSE,
    arrival_time TIME,
    departure_time TIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
    FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE SET NULL,
    INDEX idx_trip_id (trip_id),
    INDEX idx_destination_id (destination_id),
    INDEX idx_stop_order (stop_order)
);

-- =====================================================
-- 11. TRIP PREFERENCES TABLE
-- =====================================================
CREATE TABLE trip_preferences (
    preference_id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    vehicle_type ENUM('car', 'van', 'bus', 'suv'),
    budget_range ENUM('economy', 'standard', 'premium'),
    guide_required BOOLEAN DEFAULT FALSE,
    driver_accommodation ENUM('provided', 'paid') DEFAULT 'provided',
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
    INDEX idx_trip_id (trip_id)
);

-- =====================================================
-- 12. BOOKING REQUESTS TABLE
-- =====================================================
CREATE TABLE booking_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    tourist_id INT NOT NULL,
    driver_id INT,
    vehicle_id INT,
    total_cost DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'accepted', 'rejected', 'cancelled', 'completed') DEFAULT 'pending',
    driver_response_deadline TIMESTAMP,
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
    FOREIGN KEY (tourist_id) REFERENCES tourists(tourist_id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE SET NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE SET NULL,
    INDEX idx_trip_id (trip_id),
    INDEX idx_tourist_id (tourist_id),
    INDEX idx_driver_id (driver_id),
    INDEX idx_status (status)
);

-- =====================================================
-- 13. BOOKINGS TABLE (Confirmed bookings)
-- =====================================================
CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL UNIQUE,
    trip_id INT NOT NULL,
    tourist_id INT NOT NULL,
    driver_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    fare DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    trip_status ENUM('confirmed', 'en_route', 'started', 'completed', 'cancelled') DEFAULT 'confirmed',
    start_time TIMESTAMP NULL,
    end_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (request_id) REFERENCES booking_requests(request_id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
    FOREIGN KEY (tourist_id) REFERENCES tourists(tourist_id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    INDEX idx_request_id (request_id),
    INDEX idx_trip_id (trip_id),
    INDEX idx_tourist_id (tourist_id),
    INDEX idx_driver_id (driver_id),
    INDEX idx_trip_status (trip_status),
    INDEX idx_payment_status (payment_status)
);

-- =====================================================
-- 14. TRIP REVIEWS TABLE
-- =====================================================
CREATE TABLE trip_reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE,
    tourist_id INT NOT NULL,
    driver_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    service_rating INT CHECK (service_rating >= 1 AND service_rating <= 5),
    vehicle_rating INT CHECK (vehicle_rating >= 1 AND vehicle_rating <= 5),
    punctuality_rating INT CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (tourist_id) REFERENCES tourists(tourist_id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE CASCADE,
    INDEX idx_booking_id (booking_id),
    INDEX idx_tourist_id (tourist_id),
    INDEX idx_driver_id (driver_id),
    INDEX idx_rating (rating)
);

-- =====================================================
-- 15. SAMPLE DATA INSERTION
-- =====================================================

-- Insert sample admin user (password will be hashed in backend)
INSERT INTO users (email, password, role, is_verified) VALUES
('admin@siyoga.com', 'temp_password_to_be_hashed', 'admin', TRUE);

-- Insert sample destinations
INSERT INTO destinations (name, description, latitude, longitude, category) VALUES
('Colombo', 'Commercial capital of Sri Lanka', 6.9271, 79.8612, 'city'),
('Kandy', 'Cultural capital with Temple of the Tooth', 7.2906, 80.6337, 'cultural'),
('Galle', 'Historic fort city in the south', 6.0535, 80.2210, 'historical'),
('Nuwara Eliya', 'Hill station known as Little England', 6.9497, 80.7891, 'mountain'),
('Mirissa', 'Beautiful beach town for whale watching', 5.9487, 80.4585, 'beach'),
('Sigiriya', 'Ancient rock fortress', 7.9568, 80.7603, 'historical'),
('Ella', 'Scenic hill town with Nine Arch Bridge', 6.8667, 81.0500, 'mountain'),
('Bentota', 'Popular beach resort town', 6.4260, 79.9957, 'beach');

-- Insert sample distances (some key routes)
INSERT INTO distances (origin_id, destination_id, distance_km, duration_minutes) VALUES
(1, 2, 115, 180), -- Colombo to Kandy
(1, 3, 119, 150), -- Colombo to Galle
(1, 4, 180, 240), -- Colombo to Nuwara Eliya
(2, 4, 77, 120),  -- Kandy to Nuwara Eliya
(2, 6, 68, 90),   -- Kandy to Sigiriya
(3, 5, 40, 60),   -- Galle to Mirissa
(4, 7, 60, 90),   -- Nuwara Eliya to Ella
(1, 8, 65, 90);   -- Colombo to Bentota

-- =====================================================
-- 16. CREATE ADDITIONAL INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_users_role_verified ON users(role, is_verified);
CREATE INDEX idx_trips_tourist_status ON trips(tourist_id, status);
CREATE INDEX idx_bookings_driver_status ON bookings(driver_id, trip_status);
CREATE INDEX idx_booking_requests_status_created ON booking_requests(status, created_at);

-- =====================================================
-- DATABASE SETUP COMPLETE
-- =====================================================
