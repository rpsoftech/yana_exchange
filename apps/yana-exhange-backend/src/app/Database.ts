/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChatUsers, Room } from 'prisma_database';
import { Server } from 'socket.io';
import { Pool, QueryExec } from 'query-builder-mysql';
import { environment } from '../environments/environment';
import { RequestToBot } from './BotChat';
import { v4 as uuid } from 'uuid';
import { GetTimeStamp } from './Genralunctions';
import {
  ChatHistory,
  ChatHistoryUncheckedCreateInput,
} from '@yana-exhchange/interface';

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
          db.join('Room as r', 'cu.ChatUsersRoomID = r.RoomID', 'left');
        }
      }
    }
    return db.get('ChatUsers as cu').finally(() => {
      // console.log(db.last_query_string);
      db.release();
    });
  } catch (error) {
    console.log(error);

    db.release();
    return [];
  }
}

export async function InsertUpdateChatHistory(
  data: ChatHistoryUncheckedCreateInput,
  where?: ChatHistory,
  dbRef?: QueryExec
) {
  const db = dbRef || (await DbPool.get_connection());
  try {
    let p: Promise<any>;
    if (where && where !== null) {
      p = db.update('ChatHistory', data, where);
    } else {
      p = db.insert('ChatHistory', data);
    }
    return p.finally(() => {
      if (typeof dbRef === 'undefined') {
        db.release();
      }
    });
  } catch (error) {
    if (typeof dbRef === 'undefined') {
      db.release();
    }
  }
}
export async function CreateNewChatRecord(
  data: ChatHistoryUncheckedCreateInput,
  roomid: string,
  emitToRoom: boolean,
  dbRef: QueryExec
) {
  return InsertUpdateChatHistory(data, null, dbRef).finally(() => {
    if (emitToRoom === true) {
      server.of('users').to(roomid).emit('new_chat_record', data);
      server.of('agent').to(roomid).emit('new_chat_record', data);
    }
  });
}
export async function CreateNewBotSession(uname: string, roomid: string) {
  const BotRespo = await RequestToBot('Hello', {
    roomid,
  });
  const db = await DbPool.get_connection();
  try {
    const p = CreateNewChatRecord(
      {
        CHAttributes: {
          reason: 'Chat ses init',
          msg_from_name: uname,
        },
        CHCreatedOn: GetTimeStamp(),
        CHRoomID: roomid,
        Message: 'Hello',
        MessageFrom: 'USER',
      },
      roomid,
      true,
      db
    );
    const p1 = CreateNewChatRecord(
      {
        CHAttributes: {
          msg_from_name: 'BOT',
          bot: {
            output: BotRespo.response,
            results1: BotRespo.extra.results,
            results: BotRespo.extra.results,
          },
        },
        CHCreatedOn: GetTimeStamp(),
        CHRoomID: roomid,
        Message: BotRespo.response.EN.text[0],
        MessageFrom: 'BOT',
      },
      roomid,
      true,
      db
    );
    await Promise.all([p, p1]);
    db.release();
  } catch (error) {
    db.release();
  }
}
