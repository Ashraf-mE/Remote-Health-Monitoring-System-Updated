import express from "express";
import bcrypt from "bcryptjs";
import dbModule from "./dbConnect.js";
import jwt from 'jsonwebtoken';
import cookieParser from "cookie-parser";
const {dbConnect, User, sensorData} = dbModule;
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from "mongoose";

const app = express();

const allowedOrigins = [
    `http://${process.env.HOST}:${process.env.PORT}`,
    'http://192.168.188.154:80', // NodeMCU 1.0
];

app.use(cors({
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
          callback(null, true);  // Allow the request
        } else {
          callback(new Error('Not allowed by CORS'));  // Block the request
        }
      },
    credentials: true
}));

app.use(bodyParser.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.json());

dbConnect();

let sensorData_rec;

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
            const payload = {username: dbDetails.username, userId: dbDetails._id};
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

app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.send('Logged out');
});

function auth(req, res, next) {
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

app.post('/welcome', auth, async (req, res) => {
    res.status(200).send('Welcome!');
});

app.post('/mcuData', async (req, res) => {
    sensorData_rec = req.body;

    if (!sensorData_rec) {
        return res.status(400).json({ message: 'No data received from MCU' });
    }
    res.status(200).json({ bpm: sensorData_rec.bpm, ecg: sensorData_rec.ecg });
});

app.get('/mcuData', async (req, res) => {
    const token = req.cookies.token;
    try
    {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const newsensorData = new sensorData({
            user: userId,
            bpm: sensorData_rec.bpm,  // The BPM value
            ecg: {            // The ECG values
                ecg1: sensorData_rec.ecg['ecg1'] || 0,  // Default to 0 if ecgValue1 is undefined
                ecg2: sensorData_rec.ecg['ecg2'] || 0,  // Default to 0 if ecgValue2 is undefined
                ecg3: sensorData_rec.ecg['ecg3'] || 0   // Default to 0 if ecgValue3 is undefined
            }
        });
        
        await newsensorData.save();

        const recentSensorData = await sensorData.find({ user: userId })
        .sort({ timestamp: -1 }) // -1 for descending order (newest first)
        .limit(200);

        const sensorDataCount = await sensorData.countDocuments({ user: userId });
        console.log(`-------->${sensorDataCount}`)
        if (sensorDataCount > 1000) {
            const excess = sensorDataCount - 1000;
            
            // Delete the oldest records
            const oldestRecords = await sensorData.find({ user: userId })
            .sort({ timestamp: 1 }) // Sort by the oldest first
            .limit(excess); // Limit to the number of excess records
    
            // Extract the IDs of the records to be deleted
            const idsToDelete = oldestRecords.map(record => record._id);
        
            // Delete those records
            await sensorData.deleteMany({ _id: { $in: idsToDelete } });

            console.log(`${excess} oldest records deleted for user: ${userId}`);
        }
        
        // Reverse the array to plot from oldest to newest
        res.status(200).json({recentSensorData: recentSensorData.reverse(), recentValue: sensorData_rec});
    }
    catch(err)
    {
        res.status(400).send(`${err}`);
    }
});

const IP_ADDRESS = '192.168.188.77';
const PORT = 3005;

app.listen(PORT, IP_ADDRESS, () => {
    console.log(`Server is running on http://${IP_ADDRESS}:${PORT}`);
});
