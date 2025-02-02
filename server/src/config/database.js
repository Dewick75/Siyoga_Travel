// Database configuration and connection
const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'siyoga_travel_booking',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        console.log(`📊 Connected to database: ${dbConfig.database}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

// Execute query function
const executeQuery = async (query, params = []) => {
    try {
        const [rows] = await pool.execute(query, params);
        return rows;
    } catch (error) {
        console.error('Database query error:', error.message);
        throw error;
    }
};

// Get single record
const getOne = async (query, params = []) => {
    try {
        const [rows] = await pool.execute(query, params);
        return rows[0] || null;
    } catch (error) {
        console.error('Database query error:', error.message);
        throw error;
    }
};

// Insert record and return inserted ID
const insertRecord = async (query, params = []) => {
    try {
        const [result] = await pool.execute(query, params);
        return result.insertId;
    } catch (error) {
        console.error('Database insert error:', error.message);
        throw error;
    }
};

// Update record and return affected rows
const updateRecord = async (query, params = []) => {
    try {
        const [result] = await pool.execute(query, params);
        return result.affectedRows;
    } catch (error) {
        console.error('Database update error:', error.message);
        throw error;
    }
};

// Delete record and return affected rows
const deleteRecord = async (query, params = []) => {
    try {
        const [result] = await pool.execute(query, params);
        return result.affectedRows;
    } catch (error) {
        console.error('Database delete error:', error.message);
        throw error;
    }
};

module.exports = {
    pool,
    execute: pool.execute.bind(pool), // Add execute method for direct use
    testConnection,
    executeQuery,
    getOne,
    insertRecord,
    updateRecord,
    deleteRecord
};
