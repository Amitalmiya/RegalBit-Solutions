const bcrypt = require("bcrypt");
const { pool, poolPhone, poolEmail } = require("../config/db");

const usersToSeed = [
    {
        userName: "superadmin",
        email: "superadmin@gmail.com",
        phone: 7535851403,
        // password_hash: await bcrypt.hash("Super@2003", 10),
        role: "superadmin",
        password: "Super@2003" ,  
    },

    {
        userName: "admin",
        email: "admin@gmail.com",
        phone: 7500895450,
        // password_hash: await bcrypt.hash("Admin@2003", 10),
        role: "admin",
        password: "Admin@2003",
    },

    {
        userName: "admin2",
        email: "admin2@gmail.com",
        phone: 9568068299,
        // password_hash: await bcrypt.hash("Admin@2004", 10),
        role: "admin",
        password: "Admin@2004",
    },
]

async function createDefaultSuperAdmin() {
  const dbs = [
    { db: pool, name: "Main" },
    { db: poolPhone, name: "Phone" },
    { db: poolEmail, name: "Email" },
  ];

  for (const { db, name } of dbs) {

    const [columns] = await db.query("SHOW COLUMNS FROM users");
    const columnNames = columns.map((col) => col.Field);

    for (const user of usersToSeed) {
      try {
        
        const whereClauses = [];
        const values = [];
        if (columnNames.includes("email") && user.email) {
          whereClauses.push("email = ?");
          values.push(user.email);
        }
        if (columnNames.includes("userName")) {
          whereClauses.push("userName = ?");
          values.push(user.userName);
        }

        const query = `SELECT id FROM users WHERE ${whereClauses.join(" OR ")} LIMIT 1`;
        const [existing] = await db.query(query, values);

        if (existing.length === 0) {
          const password_hash = await bcrypt.hash(user.password, 10);

          const validColumns = ["userName", "email", "phone", "password_hash", "role"].filter((col) =>
            columnNames.includes(col)
          );
          const placeholders = validColumns.map(() => "?").join(", ");
          const insertValues = validColumns.map((col) =>
            col === "password_hash" ? password_hash : user[col]
          );

          await db.query(
            `INSERT INTO users (${validColumns.join(", ")}) VALUES (${placeholders})`,
            insertValues
          );

          console.log(`${user.role} '${user.userName}' created in ${name} DB`);
        } else {
          console.log(`${user.role} '${user.userName}' already exists in ${name} DB`);
        }
      } catch (err) {
        console.error(`Error creating ${user.role} '${user.userName}' in ${name} DB:`, err.message);
      }
    }
  }
}

module.exports = createDefaultSuperAdmin;
