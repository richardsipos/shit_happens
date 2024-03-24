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

// Key, users, sockets
let lobbies = [];
let playerToDelete = {};

io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    lobbies.forEach((lobby) => {
      lobby.players.forEach((player) => {
        if (player.socket.id === socket.id) {
          console.log(`Player ${player.username} disconnected from ${lobby.key}`);
          playerToDelete = player;
          // Emit updateUserCount to all players in the lobby
          lobby.players.forEach((lobbyPlayer) => {
            lobbyPlayer.socket.emit("updateUserCount", {
              channelKey: lobby.key,
              count: lobby.players.length - 1, // -1 because the disconnected player is removed
            });
          });
        }
      });
    });

    // Remove the disconnected player from the lobby
    if (playerToDelete) {
      lobbies.forEach((lobby) => {
        lobby.players = lobby.players.filter((player) => player !== playerToDelete);
      });
    }
  });

  socket.on("createLobby", ({ username, channelKey  }) => {
    // Check if the channel key already exists
    if (lobbies.some((lobby) => lobby.key === channelKey)) {
      console.log("Channel key already exists");
      return;
    }
    console.log("Channel key:"  ,channelKey);
    console.log("username :"  ,username);
    //console.log("scoket :"  ,socket);
    const lobbyToAdd = { key: channelKey, players: [{ username: username, socket: socket }] };
    lobbies.push(lobbyToAdd);
    console.log("Lobbies after create:", lobbies);
  });

  socket.on("joinLobby", ({ username, channelKey }) => {
    
    const lobby = lobbies.find((lobby) => lobby.key === channelKey.toString());
    if (lobby !== undefined) {
      
      let player = { username: username, socket: socket }
      lobby.players.push(player);
      lobby.players.forEach((player) => {
        player.socket.emit("updateUserCount", {
          channelKey: lobby.key,
          count: lobby.players.length,
        });
      });
    }
    console.log("Lobbies after join:", lobbies);
  });
});

server.listen(8080, () => {
  console.log("listening on http://localhost:8080");
});
