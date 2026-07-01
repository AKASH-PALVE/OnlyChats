import { WebSocketServer , WebSocket } from "ws";
import express from "express";
import cors from "cors";
import http from "http";
import crypto from "crypto";

const app = express();
app.use(cors());

const server = http.createServer(app);
const ws = new WebSocketServer({server});

app.get("/ping" ,( req , res) =>{
  res.status(200).send("Server has started");
})

interface User{
  socket : WebSocket;
  roomId : string;
  userId : string;
}

let userCount : number = 0;
let allSockets : User[] = [];

ws.on("connection" , function connection(socket : WebSocket){
  console.log("user connection done");

  userCount = userCount +1 ;
  console.log(userCount);

  const userId = crypto.randomUUID();

  socket.send(
    JSON.stringify({
      type: "connected",
      userId: userId,
    })
  );

  console.log("user connection done");

  socket.on("message" , (message) =>{
    const parsedMessage = JSON.parse(message.toString());

    if(parsedMessage.type === "join"){
      allSockets.push({socket , roomId : parsedMessage.payload.roomId,userId});
    }

    if(parsedMessage.type === "chat"){
      const currentUserRoom = allSockets.find(
        (x) => x.socket == socket
      )?.roomId;

      allSockets.forEach((user) =>{
        if(user.roomId === currentUserRoom){
          user.socket.send(
            JSON.stringify({
              message: parsedMessage.payload.message,
              senderId : userId
            })
          );
        }
      });
    }
    
  });
  socket.on("close" , ()=>{
    console.log("user disconnected");
    userCount = userCount-1;
    console.log(userCount);
  });
  
});

const PORT = process.env.PORT|| 3001;
server.listen(PORT , ()=>{
  console.log(`Server is active on port : ${PORT}`);
});

