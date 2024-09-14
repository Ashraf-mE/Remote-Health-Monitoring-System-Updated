const express = require("express");
const bcrypt = require("bcryptjs");
const dbModule = require("./dbConnect.js");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
const WebSocket = require("ws");
const mongoose = require("mongoose");
const http = require("http");
const url = require("url");
const { stringify } = require("querystring");

const { dbConnect, User, sensorData } = dbModule;

const app = express();

function origins(url, callback) {
  if (!url || url.startsWith("http://192.168.188.")) {
    callback(null, true); // Allow the request
  } else {
    callback(new Error("Not allowed by CORS")); // Block the request
  }
}

const obj = {};
obj.origin = origins;
obj.credentials = true;
app.use(cors(obj));

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/mcuData" });

dbConnect();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/signup", async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const user = new User({
      email: req.body.email,
      username: req.body.username,
      password: hashedPassword,
    });

    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const dbDetails = await User.findOne({ email: req.body.email });

    if (!dbDetails) {
      return res.status(404).send({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(req.body.password, dbDetails.password);

    if (isMatch) {
      const payload = { username: dbDetails.username, userId: dbDetails._id };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.cookie("token", token, {
        maxAge: 3600000,
        sameSite: "lax",
      });

      res.status(200).send({ message: "Login successful" });
    } else {
      res.status(400).send({ error: "Invalid password" });
    }
  } catch (err) {
    res.status(500).send({ error: "server login error" });
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.send("Logged out");
});

function auth(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    console.log("No token found");
    return res.status(401).send("Access Denied");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded.userId);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("Token verification failed:", err.message);
    res.status(401).send("Invalid Token");
  }
}

app.post("/welcome", auth, async (req, res) => {
  if (req.user && req.user.username) {
    res.status(200).send({ username: req.user.username });
  } else {
    res.status(400).send("User information not available");
  }
});

const clients = {};
let from_query_id = null;

wss.on("connection", async (ws, req) => {
  console.log("New WebSocket connection established.");

  try {
    const parsedUrl = url.parse(req.url, true);
    console.log(parsedUrl.query.token);

    if (parsedUrl.query.token) {
      const cookie_token = parsedUrl.query.token.slice(1, -1);
      console.log("Extracted token:", cookie_token);

      const verifiedToken = jwt.verify(cookie_token, process.env.JWT_SECRET);
      console.log("Token verified successfully:", verifiedToken);

      from_query_id = verifiedToken.userId;
      if (verifiedToken.userId) {
        clients[from_query_id] = ws; // userId got from the query parameter
        console.log(`Client "${verifiedToken.username}" connected`);
      }
    }

    ws.on("message", async (msg) => {
      try {
        console.log(
          ">>>>>> All clients connected >>>>>>",
          Object.keys(clients)
        );
        const data = JSON.parse(msg);
        console.log("data: ", data);

        if (!data) {
          console.log("No data arrived from device");
          return;
        }

        const userDetails = await User.findOne({ email: data.email });
        const user_id = userDetails._id.toString();
        console.log("User ID:", user_id);

        const newsensorData = new sensorData({
          user: user_id,
          bpm: data.bpm,
          ecg: {
            ecg1: data.ecg["ecg1"] || 0,
            ecg2: data.ecg["ecg2"] || 0,
            ecg3: data.ecg["ecg3"] || 0,
          },
        });

        try {
          await newsensorData.save();
          console.log("Data saved successfully:");
        } catch (error) {
          console.error("Error saving data:", error);
        }

        const sensorDataCount = await sensorData.countDocuments({
          user: user_id,
        });

        console.log(`Number of records in the DB: ${sensorDataCount}`);
        if (sensorDataCount > 1000) {
          const excess = sensorDataCount - 1000;

          const oldestRecords = await sensorData
            .find({ user: user_id })
            .sort({ timestamp: 1 })
            .limit(excess);

          // Extract the IDs of the records to be deleted
          const idsToDelete = oldestRecords.map((record) => record._id);

          await sensorData.deleteMany({ _id: { $in: idsToDelete } });

          console.log(`${excess} oldest records deleted for user: ${user_id}`);
        }

        try {
          const recentSensorData = await sensorData
            .find({ user: user_id })
            .sort({ timestamp: -1 }) // -1 for descending order (newest first)
            .limit(150);

          /// sending the data to the client
          if (clients[user_id]) {
            clients[user_id].send(
              JSON.stringify({
                recentSensorData: recentSensorData.reverse(),
                recentValue: {
                  bpm: data.bpm,
                  ecg: {
                    ecg1: data.ecg.ecg1,
                    ecg2: data.ecg.ecg2,
                    ecg3: data.ecg.ecg3,
                  },
                },
              })
            );
            console.log("Data sent to the client. 👍");
          }
        } catch (err) {
          console.log("No data available in the DB", err);
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });

    ws.on("close", () => {
      //   if (from_query_id) {
      //     delete clients[from_query_id];
      console.log(`Client ws closed.`);
      //   }
    });

    ws.on("error", (err) => {
      console.error("Error processing message:", err);
    });
  } catch (error) {
    console.error("Token verification failed:", error.message);
    ws.close();
  }
});

const IP_ADDRESS = "192.168.188.77";
const PORT = 3005;

server.listen(PORT, IP_ADDRESS, () => {
  console.log(`Server is running on http://${IP_ADDRESS}:${PORT}`);
});
