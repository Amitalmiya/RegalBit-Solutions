const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_task_manager',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00',
};

const pool = mysql.createPool(dbConfig);

const initializeDatabase = async () => {
  let conn;
  try {
    // Create DB if not exists using root connection without DB specified
    const rootConn = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      charset: 'utf8mb4',
    });

    await rootConn.execute(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await rootConn.end();

    conn = await pool.getConnection();

    // Users table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin', 'superadmin') NOT NULL DEFAULT 'user',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        avatar VARCHAR(500) DEFAULT NULL,
        last_login DATETIME DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Tasks table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        status ENUM('todo', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'todo',
        priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
        due_date DATETIME DEFAULT NULL,
        completed_at DATETIME DEFAULT NULL,
        owner_id VARCHAR(36) NOT NULL,
        assigned_to VARCHAR(36) DEFAULT NULL,
        category VARCHAR(100) DEFAULT NULL,
        tags JSON DEFAULT NULL,
        attachments JSON DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_owner (owner_id),
        INDEX idx_assigned (assigned_to),
        INDEX idx_status (status),
        INDEX idx_priority (priority),
        INDEX idx_due_date (due_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Task comments table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS task_comments (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        task_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_task (task_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Audit log table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) DEFAULT NULL,
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50) NOT NULL,
        resource_id VARCHAR(36) DEFAULT NULL,
        details JSON DEFAULT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user (user_id),
        INDEX idx_action (action),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Seed superadmin if not exists
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');
    const [existing] = await conn.execute(
      'SELECT id FROM users WHERE email = ?',
      ['superadmin@taskmanager.com']
    );
    if (existing.length === 0) {
      const hashedPassword = await bcrypt.hash('SuperAdmin@123', 12);
      await conn.execute(
        `INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), 'Super Admin', 'superadmin@taskmanager.com', hashedPassword, 'superadmin']
      );
      console.log('✅ Superadmin seeded: superadmin@taskmanager.com / SuperAdmin@123');
    }

    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

const query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const queryOne = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows[0] || null;
};

module.exports = { pool, query, queryOne, initializeDatabase };