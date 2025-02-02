-- =====================================================
-- Insert Vehicle Categories Data for Siyoga Travel
-- Run this script in phpMyAdmin after creating the schema
-- =====================================================

USE siyoga_travel_booking;

-- Clear existing data (if any)
DELETE FROM vehicle_categories;

-- Insert Vehicle Categories
INSERT INTO vehicle_categories (
    category_id, category_name, vehicle_type, passenger_capacity_min, passenger_capacity_max, 
    has_ac, driver_rate_per_km, system_rate_per_km, description, features, example_models
) VALUES 

-- Cars (ID: 1)
(1, 'Cars', 'car', 1, 4, TRUE, 110.00, 130.00, 
'Comfortable sedans suitable for small groups', 
'["Fuel efficient", "Comfortable for small groups", "Suitable for city travel", "Air Conditioning"]', 
'Toyota Corolla, Axio, Prius, Aqua, Vitz; Suzuki Alto, Wagon R, Swift; Honda Fit, Grace; Nissan Leaf, March'),

-- KDH Flat Roof (ID: 2)
(2, 'KDH Flat Roof', 'van', 6, 10, TRUE, 125.00, 145.00, 
'Spacious vans ideal for medium-sized groups', 
'["Spacious interior", "Comfortable for long journeys", "Ample luggage space", "Air Conditioning"]', 
'Toyota HiAce KDH, Hyundai H1'),

-- KDH High Roof (ID: 3)
(3, 'KDH High Roof', 'van', 6, 12, TRUE, 135.00, 160.00, 
'Spacious vans ideal for medium-sized groups', 
'["Spacious interior", "Comfortable for long journeys", "Ample luggage space", "Air Conditioning"]', 
'Toyota HiAce KDH, Hyundai H1'),

-- Other Vans (ID: 4)
(4, 'Other Vans', 'van', 6, 10, TRUE, 120.00, 145.00, 
'Spacious vans ideal for medium-sized groups', 
'["Spacious interior", "Comfortable for long journeys", "Ample luggage space", "Air Conditioning"]', 
'Toyota Noah, Vellfire, Alphard; Suzuki Every; Mercedes V-Class; Nissan Caravan'),

-- Mini Buses (ID: 5)
(5, 'Mini Buses', 'mini_bus', 12, 25, TRUE, 180.00, 210.00, 
'Large buses perfect for big groups and long trips', 
'["Large seating capacity", "Comfortable for group travel", "Spacious luggage area", "Air Conditioning"]', 
'Mitsubishi Rosa, Toyota Coaster, Nissan Civilian, Hyundai County');

-- Verify the data
SELECT * FROM vehicle_categories ORDER BY category_id;
