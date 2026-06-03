import { Server as SocketIOServer } from 'socket.io';
import logger from '../utils/logger.js';

let io = null;

/**
 * Initializes the Socket.io server.
 * @param {import('http').Server} server 
 * @returns {SocketIOServer}
 */
export function initSocket(server) {
    io = new SocketIOServer(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {
        logger.info(`🔌 Mobile/Web client connected via Socket.io [id=${socket.id}]`);

        socket.on('disconnect', () => {
            logger.info(`🔌 Client disconnected from Socket.io [id=${socket.id}]`);
        });
    });

    return io;
}

/**
 * Returns the active Socket.io server instance.
 * @returns {SocketIOServer|null}
 */
export function getIO() {
    return io;
}

/**
 * Broadcasts a new leopard detection event to all connected clients.
 * @param {object} detection 
 */
export function broadcastDetection(detection) {
    if (io) {
        logger.info(`📤 Broadcasting detection alert [id=${detection.detectionId || detection._id}]`);
        io.emit('new-detection', detection);
    } else {
        logger.warn('⚠️ Sockets not initialized. Skip broadcast.');
    }
}
