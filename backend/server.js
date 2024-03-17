import express from "express";
const app = express(); 
import http from "http";
import { Server } from "socket.io";
import cors from "cors"; // Import the 'cors' module

app.use(cors());
const server = http.createServer(app);

const port = process.env.PORT || 5000; //Line 3
const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
})


server.listen(8080, () => {
    console.log('listening on http://localhost:8080')
});




//app.use(express.json());




  

// io.on("connection", (socket) => {
    
//     socket.on("join-room", (roomId, userId) => {
//         console.log("Joined to room", roomId, "with userId", userId);
//         io.emit('join-room', `${socket.id} joined room ${roomId}`);
//     });

//     socket.on("create-lobby", ({ username, channelKey }) => {
//         console.log(`Lobby created by ${username} with channel key ${channelKey}`);
//         io.emit('alert', 'Hello there!');
//     });
//     io.emit("hello");
// });




// app.use((err, req, res, next) => {
//   const errorStatus = err.status || 500;
//   const errorMessage = err.message || "Something went wrong!";

//   return res.status(errorStatus).send(errorMessage);
// });

