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

io.use(function (socket, next) {
  if (socket.handshake.query && socket.handshake.query.token) {
    jwt.verify(
      socket.handshake.query.token,
      process.env.JWT_SECRET_KEY,
      function (err, decoded) {
        if (err) return next(new Error("Authentication error"));
        socket.decoded = decoded;

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
  console.info(`Client connected [id=${socket.id}]`);
  //On Disconnect
  socket.on("disconnect", async () => {
    await User.findByIdAndUpdate(
      id,
      {
        socketClientsCount: io.engine.clientsCount,
      },
      {
        new: true,
      }
    );
    console.info(`Client disconnect [id=${socket.id}]`);
  });

  socket.join(id);

  // const user = await User.findById(id);
  // if (!user || !bcrypt.compare(password, user.password) || !user.active) {
  //   return;
  // }

  app.get(`/${id}/imgdata`, async (req, res) => {
    //const password = req.query.pass;
    //const id = req.query.id;

    const decodedData = base64.decode(req.query.data);
    let MyData = utf8.decode(decodedData);
    MyData = JSON.parse(MyData);

    io.to(id).emit("data", MyData);
    if (io.engine.clientsCount != 0) {
      res.send();
    }
  });
  await User.findByIdAndUpdate(
    id,
    {
      socketClientsCount: io.engine.clientsCount,
    },
    {
      new: true,
    }
  );
});

httpServer.listen(process.env.PORT);
