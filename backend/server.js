import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import DefaultCardContent from './assets/DefaultCardContent.js';


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const minPlayers = 2;

function getRandomItemAndRemove(array) {
  const index = Math.floor(Math.random() * array.length);
  const removedItem = array.splice(index, 1)[0];
  return removedItem;
}

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
    const lobbyToAdd = { key: channelKey, players: [{ username: username, socket: socket, cards: [] }], cardsAvailable: DefaultCardContent };
    lobbies.push(lobbyToAdd);
    socket.emit("addUsername", {
      channelKey: channelKey,
      username: username,
    });

    socket.emit("updateUserCount", {
      channelKey: channelKey,
      count: "1",
    });

  });

  socket.on("joinLobby", ({ username, channelKey }) => {
    
    const lobby = lobbies.find((lobby) => lobby.key === channelKey.toString());
    if (lobby !== undefined) {
      
      let player = { username: username, socket: socket, cards: [] }

      lobby.players.push(player);
      socket.emit("addUsername", {
        channelKey: channelKey,
        username: username,
      });

      lobby.players.forEach((player) => {
        player.socket.emit("updateUserCount", {
          channelKey: lobby.key,
          count: lobby.players.length,
        });
      });

      


      if(minPlayers === lobby.players.length){
        console.log("Game can start");
        const randomItem = getRandomItemAndRemove(DefaultCardContent);
        lobby.players[0].socket.emit("turnToGuess", { randomItem:randomItem });
      }


    }
    //console.log("Lobbies after join:", lobbies);
  });

  socket.on("guessMade", ({ username, guessCard, channelKey, guess }) => {
    const lobby = lobbies.find((lobby) => lobby.key === channelKey.toString());
    lobby.players.forEach((player,index) => {
      if(player.username === username){

        let randomItem = null;
        if(guess){
          player.cards.push(guessCard);
          randomItem = getRandomItemAndRemove(lobby.cardsAvailable);
        }else{
          randomItem = guessCard;
        }

        let newUsername = "";
        if( index === lobby.players.length-1){
          newUsername = lobby.players[0].username;
          lobby.players[0].socket.emit("turnToGuess", { randomItem:randomItem  });
        }else{
          newUsername = lobby.players[index+1].username;
          lobby.players[index+1].socket.emit("turnToGuess", { randomItem:randomItem  });
        }

    
      }});
    });
  });



server.listen(8080, () => {
  console.log("listening on http://localhost:8080");
});
