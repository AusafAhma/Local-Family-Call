// Custom server for Socket.IO integration (Development)
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Room state - stores all connected users
const room = {
    users: new Map(), // socketId -> { username, isHost }
    maxUsers: 10
};

app.prepare().then(() => {
    const httpServer = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    // Initialize Socket.IO
    const io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Handle join-room event
        socket.on('join-room', (username) => {
            // Check if room is full
            if (room.users.size >= room.maxUsers) {
                socket.emit('room-full');
                return;
            }

            // Determine if this user is the host (first to join)
            const isHost = room.users.size === 0;

            // Add user to room
            room.users.set(socket.id, { username, isHost });

            console.log(`${username} joined. Total users: ${room.users.size}`);

            // Get all existing users (excluding the new user)
            const existingUsers = Array.from(room.users.entries())
                .filter(([id]) => id !== socket.id)
                .map(([id, data]) => ({ socketId: id, username: data.username, isHost: data.isHost }));

            // Send existing users to the new user
            socket.emit('all-users', { users: existingUsers, isHost });

            // Notify all existing users about the new user
            socket.broadcast.emit('user-joined', {
                socketId: socket.id,
                username: username,
                isHost: false
            });
        });

        // Handle WebRTC offer
        socket.on('offer', ({ offer, to }) => {
            console.log(`Sending offer from ${socket.id} to ${to}`);
            io.to(to).emit('offer', {
                offer,
                from: socket.id
            });
        });

        // Handle WebRTC answer
        socket.on('answer', ({ answer, to }) => {
            console.log(`Sending answer from ${socket.id} to ${to}`);
            io.to(to).emit('answer', {
                answer,
                from: socket.id
            });
        });

        // Handle ICE candidates
        socket.on('ice-candidate', ({ candidate, to }) => {
            io.to(to).emit('ice-candidate', {
                candidate,
                from: socket.id
            });
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            const user = room.users.get(socket.id);

            if (user) {
                room.users.delete(socket.id);
                console.log(`${user.username} left. Remaining users: ${room.users.size}`);

                // Notify all users about disconnection
                socket.broadcast.emit('user-disconnected', socket.id);
            }
        });
    });

    httpServer
        .once('error', (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
});
