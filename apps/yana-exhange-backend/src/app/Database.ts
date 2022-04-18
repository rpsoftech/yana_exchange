/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChatUsers, Room } from 'prisma_database';
import { Server } from 'socket.io';
import { Pool } from 'query-builder-mysql';
import { environment } from '../environments/environment';

export const DbPool = new Pool({
  host: process.env.DBHOST,
  connectionLimit: environment.production ? 10 : 3,
  password: process.env.DBPASSWORD,
  user: process.env.DBUSER,
  database: process.env.DATABASE,
});
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

export async function GetUsers(where?: {
  uid?: string | string[];
  join_room?: boolean;
}): Promise<(ChatUsers & Room)[]> {
  const db = await DbPool.get_connection();
  try {
    if (where) {
      if (where.uid) {
        if (Array.isArray(where.uid)) {
          db.where_in('cu.UniqueID', where.uid);
        } else {
          db.where('cu.UniqueID', where.uid);
        }
        if (where.join_room) {
          db.join('Room as r', 'cu.ChatUsersRoomID = r.RoomID','left');
        }
      }
    }
    return db.get('ChatUsers as cu').finally(() => {
      db.release();
    });
  } catch (error) {
    console.log(error);

    db.release();
    return [];
  }
}
