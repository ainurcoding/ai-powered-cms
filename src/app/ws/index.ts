import { logger } from '@/libs/core';
import { IncomingMessage, ServerResponse, Server } from 'http';
import { DefaultEventsMap, Socket, Server as SocketServer } from 'socket.io';

export const initSocketIO = (
	httpServer: Server<typeof IncomingMessage, typeof ServerResponse>
) => {
	const io = new SocketServer(httpServer, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST', 'PUT', 'DELETE']
		},
		path: '/socket'
	});

	io.on('connection', handlingOnConnection);
};

export const handlingOnConnection = (
	socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
	// handling connection socket io here
	logger.info(`New connection: ${socket.id}`);

	socket.on('disconnect', () => {
		logger.info(`Disconnected: ${socket.id}`);
	});
};
