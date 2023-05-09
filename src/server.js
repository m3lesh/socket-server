require("dotenv").config();
const path = require("path");

const base64 = require("base-64");
const utf8 = require("utf8");
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

app.use(globalError);

io.use(async(socket, next) => {
  if (socket.handshake.query && socket.handshake.query.token) {
   await jwt.verify(
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
  let count = await io._nsps.get("/").adapter.rooms.get(id).size;

  console.info(
    `Client connected id=${socket.id}\nto ${id}\ntotal Client in room ${count}`
  );

  //On Disconnect
  socket.on("disconnect", async () => {
    if (!io._nsps.get("/").adapter.rooms.get(id)) {
      count = 0;
    } else {
      count = await io._nsps.get("/").adapter.rooms.get(id).size;
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

  app.get(`/${id}/imgdata`, async (req, res) => {
    //const password = req.query.pass;
    //const id = req.query.id;
    let count;
    if (!io._nsps.get("/").adapter.rooms.get(id)) {
      count = 0;
    } else {
      count = await io._nsps.get("/").adapter.rooms.get(id).size;
    }
    const decodedData = base64.decode(req.query.data);
    let MyData = utf8.decode(decodedData);
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

httpServer.listen(process.env.PORT);
