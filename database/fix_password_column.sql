-- Fix password column to ensure it can store full bcrypt hashes
USE siyoga_travel_booking;

-- Update password column to TEXT to ensure full hash storage
ALTER TABLE users MODIFY COLUMN password TEXT NOT NULL;

-- Clear existing test users to start fresh
DELETE FROM email_verification WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%test.com');
DELETE FROM tourists WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%test.com');
DELETE FROM drivers WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%test.com');
DELETE FROM users WHERE email LIKE '%test.com';
