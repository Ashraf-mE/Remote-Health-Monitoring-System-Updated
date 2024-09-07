import mongoose, { mongo } from "mongoose";
import dotenv from "dotenv";
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

const bpmSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    value: {type: Number, required: true},
    timestamp: {type: Date, default: Date.now}
});

const User = mongoose.model('User', userSchema);
const Bpm = mongoose.model('Bpm', bpmSchema);

export default {dbConnect, User, Bpm};