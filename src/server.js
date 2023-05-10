require("dotenv").config();
const path = require("path");

const jwt = require("jsonwebtoken");

const express = require("express");
const cors = require("cors");
const compression = require("compression");

const { createServer } = require("http");
const { Server } = require("socket.io");

const globalError = require("./middlewares/errorMiddleware");
const authRoute = require("./routes/authRoute");
const webRoute = require("./routes/webRoute");
const User = require("./models/userModel");

const dbConnection = require("./config/database");

dbConnection();

const app = express();
app.use(compression());
app.use(cors());
app.options("*", cors());

app.use(express.static(path.join(__dirname, "./public")));

app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer);

app.use("/api/auth", authRoute);
app.use("/", webRoute);

io.use((socket, next) => {
  if (socket.handshake.query && socket.handshake.query.token) {
    jwt.verify(
      socket.handshake.query.token,
      process.env.JWT_SECRET_KEY,
      async (err, decoded) => {
        if (err) return next(new Error("Authentication error"));
        socket.decoded = decoded;
        const user = await User.findById(socket.decoded.userId);
        if (!user || !user.active) {
          return;
        }
        next();
      }
    );
  } else {
    next(new Error("Authentication error"));
  }
});

io.on("connection", async (socket) => {
  // Connection now authenticated to receive further events
  const id = socket.decoded.userId;
  socket.join(id);
  let count = io._nsps.get("/").adapter.rooms.get(id).size;

  console.info(
    `Client connected id=${socket.id}\nto ${id}\ntotal Client in room ${count}`
  );

  //On Disconnect
  socket.on("disconnect", async () => {
    if (!io._nsps.get("/").adapter.rooms.get(id)) {
      count = 0;
    } else {
      count = io._nsps.get("/").adapter.rooms.get(id).size;
    }
    await User.findByIdAndUpdate(
      id,
      {
        socketClientsCount: count,
      },
      {
        new: true,
      }
    );
    console.info(
      `Client disconnect id=${socket.id}\nto ${id}\ntotal Client in room ${count}`
    );
  });

  app.get(`/${id}/imgdata`, (req, res) => {
    //const password = req.query.pass;
    //const id = req.query.id;
    let count = 0;
    if (!io._nsps.get("/").adapter.rooms.get(id)) {
      count = 0;
    } else {
      count = io._nsps.get("/").adapter.rooms.get(id).size;
    }

    let MyData = Buffer.from(req.query.data, "base64").toString();
    MyData = JSON.parse(MyData);

    io.to(id).emit("data", MyData, count);
    res.send();
  });
  await User.findByIdAndUpdate(
    id,
    {
      socketClientsCount: count,
    },
    {
      new: true,
    }
  );
});

app.use(globalError);

httpServer.listen(process.env.PORT);
