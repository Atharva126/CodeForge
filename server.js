import { Server } from "socket.io";
import { YSocketIO } from "y-socket.io/dist/server";
import http from "http";

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Collaboration Server Running\n");
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Initialize y-socket.io
const ysocketio = new YSocketIO(io);
ysocketio.initialize();

const roomParticipants = new Map(); // roomId -> Set of socketIds
const roomRoles = new Map(); // roomId -> Map<userName, role>

io.on("connection", (socket) => {
  console.log(`📡 New connection: ${socket.id}`);

  socket.on("join-room", ({ roomId, userName }) => {
    socket.join(roomId);

    // Simplified participant tracking
    if (!roomParticipants.has(roomId)) {
      roomParticipants.set(roomId, new Set());
    }
    const participants = roomParticipants.get(roomId);
    participants.add(socket.id);

    // Broadcast updated participant list to everyone in the room
    const participantsList = Array.from(participants);
    io.to(roomId).emit("room-participants", {
      participants: participantsList,
      joinedUserId: socket.id
    });

    console.log(`🏠 ${userName} (${socket.id}) joined room: ${roomId}. Total: ${participantsList.length}`);
  });

  socket.on("push-problem", ({ roomId, problem }) => {
    console.log(`🚀 Pushing problem to room ${roomId}`);
    io.to(roomId).emit("problem-pushed", problem);
  });

  socket.on("code-execution", ({ roomId, userName, result }) => {
    io.to(roomId).emit("execution-result", { userName, result });
  });

  socket.on("ping", () => {
    socket.emit("pong");
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", candidate);
  });

  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", offer);
  });

  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", answer);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Disconnected: ${socket.id}`);

    // Robust cleanup: Iterate all rooms and remove the socket
    for (const [roomId, participants] of roomParticipants.entries()) {
      if (participants.has(socket.id)) {
        participants.delete(socket.id);

        // Broadcast updated list immediately
        io.to(roomId).emit("room-participants", {
          participants: Array.from(participants),
          leftUserId: socket.id
        });

        console.log(`Trash: Removed ${socket.id} from ${roomId}. Remaining: ${participants.size}`);

        if (participants.size === 0) {
          roomParticipants.delete(roomId);
          console.log(`Trash: Room ${roomId} is empty and deleted.`);
        }
      }
    }
  });
});

const PORT = process.env.COLLAB_PORT || 1234;

server.listen(PORT, () => {
  console.log(`🚀 Collaboration server listening on port ${PORT}`);
});
