import mongoose, { mongo } from "mongoose";
import dotenv from "dotenv";
import { json } from "express";
dotenv.config();

async function dbConnect()
{
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database Connected");
    }
    catch(err){
        console.error('MongoDB connection failed:', err.message);
        process.exit(1);
    }
}

const userSchema = new mongoose.Schema({
    email: {type: String, required: true, trim: true, unique: true},
    username: { type: String, required: true },
    password: { type: String, required: true }
})

const sensorDataSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bpm: { type: Number, required: true },
    ecg: {
        ecg1: { type: Number, default: 0 },
        ecg2: { type: Number, default: 0 },
        ecg3: { type: Number, default: 0 }
    },
    timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const sensorData = mongoose.model('sensorData', sensorDataSchema);

export default {dbConnect, User, sensorData};