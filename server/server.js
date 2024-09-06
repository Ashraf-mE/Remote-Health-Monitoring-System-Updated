import express from "express";
import bcrypt from "bcryptjs";
import dbModule from "./dbConnect.js";
import jwt from 'jsonwebtoken';
import cookieParser from "cookie-parser";
const {dbConnect, User} = dbModule;
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors({
    origin: `http://${process.env.HOST}:${process.env.PORT}`,
    credentials: true
}));

app.use(cookieParser());

dbConnect();

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/signup', async (req, res) => {
    try{
        const existingUser = await User.findOne({email: req.body.email});

        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const user = new User({
            email: req.body.email,
            username: req.body.username,
            password: hashedPassword
        });

        const savedUser = await user.save();
        res.status(201).json(savedUser);
    }
    catch(err){
        res.status(500).json({ error: err.message });
    }
})

app.post('/login', async (req, res) => {
    try{
        const dbDetails = await User.findOne({email: req.body.email});

        if (!dbDetails) {
            return res.status(404).send({error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(req.body.password, dbDetails.password);

        if (isMatch) {
            const payload = {username: dbDetails.username, userId: dbDetails._id };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.cookie('token', token, {
                maxAge: 3600000,
                httpOnly: true,
                sameSite: 'lax',
            });

            res.status(200).send({ message: 'Login successful' });

          } else {
            res.status(400).send({ error: 'Invalid password' });
        }
    }
    catch(err)
    {
        res.status(500).send({ error: 'server login error' });
    }
});

function auth(req, res, next) {
    console.log('Auth middleware hit');
    const token = req.cookies.token;
    if (!token) {
        console.log('No token found');
        return res.status(401).send('Access Denied');
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.log('Token verification failed:', err.message);
        res.status(401).send('Invalid Token');
    }
}

app.get('/welcome', auth, async (req, res) => {
    res.status(200).send('Welcome!');
});

const IP_ADDRESS = '192.168.188.77';
const PORT = 3005;

app.listen(PORT, IP_ADDRESS, () => {
    console.log(`Server is running on http://${IP_ADDRESS}:${PORT}`);
});
