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

    // Track participants and roles
    if (!roomParticipants.has(roomId)) {
      roomParticipants.set(roomId, new Set());
      roomRoles.set(roomId, new Map());
    }

    const participants = roomParticipants.get(roomId);
    const roles = roomRoles.get(roomId);

    participants.add(socket.id);

    // Assign role: Persistent based on userName within the room
    let role = roles.get(userName);
    if (!role) {
      // If no role assigned yet for this user
      const interviewerExists = Array.from(roles.values()).includes('interviewer');
      role = interviewerExists ? 'candidate' : 'interviewer';
      roles.set(userName, role);
    }

    // Broadcast updated participant list and specific role back to the joiner
    const participantsList = Array.from(participants);
    io.to(roomId).emit("room-participants", {
      participants: participantsList,
      joinedUserId: socket.id
    });

    socket.emit("role-assigned", { role });

    console.log(`🏠 ${userName} (${socket.id}) joined as ${role} in room: ${roomId}. Total: ${participantsList.length}`);
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
          roomRoles.delete(roomId);
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
