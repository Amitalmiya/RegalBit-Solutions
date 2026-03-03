require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session')
const {pool, poolPhone, poolEmail} = require('./config/db')

const usersRoutes = require('./routes/userRoutes');
const otpRoutes = require('./routes/authRouter');
const createDefaultSuperAdmin = require('./utils/createDefaultSuperAdmin');
const path = require('path')


const app = express();

const PORT = process.env.PORT || 5000;
const secret = process.env.SESSION_SECRET || 'default_secret'


app.use(express.json());
app.use(cors());

app.use(
    session({
        secret: secret,
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 1000 * 60 * 60, secure: false },
    })
);

app.get('/', (req, res) => {
    res.send('Server is Live')
})

app.use('/api/users', usersRoutes);

app.use('/api/auth', otpRoutes);

// app.use((req, res) => {
//     res.status(404).sendFile(__dirname, 'view', 'page-not-found.html')
// })


async function initDB() {
    try {
        await createDefaultSuperAdmin();
        console.log('Superadmin intialization complete');

        const dbs = [
            { pool: pool, name: "Main"},
            { pool: poolPhone, name : "Phone"},
            { pool: poolEmail, name: "Email" },
        ];

        for(const{pool, name} of dbs) {
            await pool.query('SELECT 1 AS result');
            console.log(`Mysql connected Successfully (${name}) DB`);
        }

        // await pool.query('SELECT 1 AS result');
        // console.log('Mysql connected Successfully');

        // await poolPhone.query('SELECT 1 result');
        // console.log('MySql connected Successfully');

        // await poolEmail.query('SELECT 1 result');
        // console.log('MySql connected Successfully');

        app.listen(PORT, ()=> {
            console.log(`Server runnning at http://localhost:${PORT}`);
        })
    } catch (err) {
        console.error('MYSQL connection error', err);
        process.exit(1);
    }
}
initDB();

