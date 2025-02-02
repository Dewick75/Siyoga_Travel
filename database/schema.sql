-- =====================================================
-- Siyoga Travel Booking System Database Schema
-- =====================================================

-- Create database (run this first in phpMyAdmin)
CREATE DATABASE IF NOT EXISTS siyoga_travel_booking;
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
    travel_preferences TEXT, -- JSON string for preferences like adventure, beach, culture
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
    profile_picture VARCHAR(255), -- File path for profile picture
    nic_front_image VARCHAR(255), -- File path for NIC front image
    nic_back_image VARCHAR(255), -- File path for NIC back image
    license_image VARCHAR(255), -- File path for license image
    status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
    admin_notes TEXT, -- Admin notes for approval/rejection
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_nic (nic_number),
    INDEX idx_license (license_number)
);

-- =====================================================
-- 5. VEHICLE CATEGORIES TABLE (Predefined vehicle categories)
-- =====================================================
CREATE TABLE vehicle_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    vehicle_type ENUM('car', 'van', 'mini_bus') NOT NULL,
    passenger_capacity_min INT NOT NULL,
    passenger_capacity_max INT NOT NULL,
    has_ac BOOLEAN DEFAULT TRUE,
    driver_rate_per_km DECIMAL(8,2) NOT NULL, -- Driver side rate per km
    system_rate_per_km DECIMAL(8,2) NOT NULL, -- Total rate per km (driver + system)
    description TEXT,
    features TEXT, -- JSON string for features
    example_models TEXT, -- Example vehicle models
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_vehicle_type (vehicle_type),
    INDEX idx_active (is_active),
    INDEX idx_capacity (passenger_capacity_min, passenger_capacity_max)
);

-- =====================================================
-- 6. VEHICLES TABLE (Driver vehicle information)
-- =====================================================
CREATE TABLE vehicles (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT NOT NULL,
    category_id INT NOT NULL,
    make_model VARCHAR(100) NOT NULL,
    registration_number VARCHAR(20) NOT NULL UNIQUE,
    year_manufactured YEAR,
    color VARCHAR(50),
    seating_capacity INT NOT NULL,
    has_ac BOOLEAN DEFAULT TRUE,
    vehicle_image VARCHAR(255), -- File path for vehicle image
    insurance_expiry DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES vehicle_categories(category_id),
    INDEX idx_driver_id (driver_id),
    INDEX idx_category_id (category_id),
    INDEX idx_registration (registration_number),
    INDEX idx_active (is_active)
);

-- =====================================================
-- 7. BOOKINGS TABLE (Trip booking information)
-- =====================================================
CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    tourist_id INT NOT NULL,
    pickup_location VARCHAR(255) NOT NULL,
    destinations TEXT NOT NULL, -- JSON array of destinations
    trip_type ENUM('one-way', 'round-trip') NOT NULL,
    start_date DATE NOT NULL,
    start_time TIME NOT NULL,
    travelers_count INT NOT NULL,
    selected_category_id INT NOT NULL,
    total_distance_km INT NOT NULL,
    calculated_distance_km INT NOT NULL, -- Original map distance
    trip_cost DECIMAL(10,2) NOT NULL,
    accommodation_cost DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) NOT NULL,
    driver_accommodation_provided BOOLEAN DEFAULT FALSE,
    trip_duration_days INT DEFAULT 1,
    status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    driver_id INT NULL, -- Assigned driver
    special_requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tourist_id) REFERENCES tourists(tourist_id) ON DELETE CASCADE,
    FOREIGN KEY (selected_category_id) REFERENCES vehicle_categories(category_id),
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE SET NULL,
    INDEX idx_tourist_id (tourist_id),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    INDEX idx_driver_id (driver_id)
);

-- =====================================================
-- Insert Vehicle Categories Data
-- =====================================================
INSERT INTO vehicle_categories (category_name, vehicle_type, passenger_capacity_min, passenger_capacity_max, has_ac, driver_rate_per_km, system_rate_per_km, description, features, example_models) VALUES

-- Cars
('Cars', 'car', 1, 4, TRUE, 110.00, 130.00, 'Comfortable sedans suitable for small groups',
'["Fuel efficient", "Comfortable for small groups", "Suitable for city travel", "Air Conditioning"]',
'Toyota Corolla, Axio, Prius, Aqua, Vitz; Suzuki Alto, Wagon R, Swift; Honda Fit, Grace; Nissan Leaf, March'),

-- KDH Flat Roof
('KDH Flat Roof', 'van', 6, 10, TRUE, 125.00, 145.00, 'Spacious vans ideal for medium-sized groups',
'["Spacious interior", "Comfortable for long journeys", "Ample luggage space", "Air Conditioning"]',
'Toyota HiAce KDH, Hyundai H1'),

-- KDH High Roof
('KDH High Roof', 'van', 6, 12, TRUE, 135.00, 160.00, 'Spacious vans ideal for medium-sized groups',
'["Spacious interior", "Comfortable for long journeys", "Ample luggage space", "Air Conditioning"]',
'Toyota HiAce KDH, Hyundai H1'),

-- Other Vans
('Other Vans', 'van', 6, 10, TRUE, 120.00, 145.00, 'Spacious vans ideal for medium-sized groups',
'["Spacious interior", "Comfortable for long journeys", "Ample luggage space", "Air Conditioning"]',
'Toyota Noah, Vellfire, Alphard; Suzuki Every; Mercedes V-Class; Nissan Caravan'),

-- Mini Buses
('Mini Buses', 'mini_bus', 12, 25, TRUE, 180.00, 210.00, 'Large buses perfect for big groups and long trips',
'["Large seating capacity", "Comfortable for group travel", "Spacious luggage area", "Air Conditioning"]',
'Mitsubishi Rosa, Toyota Coaster, Nissan Civilian, Hyundai County');

-- =====================================================
-- Insert sample admin user (password: admin123)
-- =====================================================
INSERT INTO users (email, password, role, is_verified) VALUES
('admin@siyoga.com', '$2b$10$rQZ8kHWKQVXGXqVXGXqVXOeKkKkKkKkKkKkKkKkKkKkKkKkKkKkKk', 'admin', TRUE);

-- =====================================================
-- Create indexes for better performance
-- =====================================================
-- Additional composite indexes for common queries
CREATE INDEX idx_users_role_verified ON users(role, is_verified);
CREATE INDEX idx_drivers_status_active ON drivers(status) WHERE status = 'approved';
CREATE INDEX idx_vehicles_type_active ON vehicles(vehicle_type, is_active);
