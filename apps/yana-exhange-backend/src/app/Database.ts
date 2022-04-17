/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from 'database';
import { Server } from 'socket.io';

export const DbPrisma = new PrismaClient();
// DbPrisma.room.findMany().then(console.log);
export const RoomStatus: {
  [room_id: string]: number;
} = {};

export const BotIds: {
  [session_id: string]: string;
} = {};

export const server = new Server({
  cors: '*',
  // transports: ['websocket'],
} as any);
