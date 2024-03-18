import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

// Object to store lobbies


io.on("connection", (socket) => {
    const lobbies = [];
    console.log(`User connected: ${socket.id}`);

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        Object.keys(lobbies).forEach((channelKey) => {
          lobbies[channelKey] = lobbies[channelKey].filter(
            (user) => user.socketId !== socket.id
          );
          io.emit("updateUserCount", {
            channelKey,
            count: lobbies[channelKey].length,
          });
        });
      });
    


    socket.on("createLobby", async ({ username, channelKey }) => {
        try {
          const existingLobby = lobbies.find((lobby) => lobby.channelKey === channelKey);
          if (existingLobby) {
            socket.emit("lobbyCreationError", {
              message: "A lobby with that name already exists. Please choose a different name.",
            });
            return;
          }
      
            // Create the lobby logic here

            if (!lobbies[channelKey]) {
                lobbies[channelKey] = [];
            }
            
            lobbies[channelKey].push({ username, isCreator: true });
            console.log("User count in room:",lobbies[channelKey].length)
            socket.emit("updateUserCount", { channelKey, count: 1 });


        } catch (error) {
          console.error("Error creating lobby:", error);
          socket.emit("lobbyCreationError", {
            message: "An error occurred while creating the lobby. Please try again.",
          });
        }
      });
  
      socket.on("joinLobby", ({ username, channelKey }) => {
        console.log(`${username} joined the lobby with channel key ${channelKey}`);
        if (lobbies[channelKey]) {
        // Check if lobby already has a user
        if (lobbies[channelKey].length >= 1) {
            socket.emit("joinLobbyError", { message: "Lobby is full." });
            return;
        }
        lobbies[channelKey].push({ username, isCreator: false });
        console.log(lobbies[channelKey]);
        io.emit("userJoinedLobby", { channelKey, users: lobbies[channelKey] });
        io.emit("updateUserCount", {
            channelKey,
            count: lobbies[channelKey].length,
        });
        } else {
        console.log(`Lobby with channel key ${channelKey} does not exist`);
        }
    });
  });
  
server.listen(8080, () => {
  console.log('listening on http://localhost:8080');
});
