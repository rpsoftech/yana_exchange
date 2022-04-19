/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChatUsers } from 'prisma_database';
import { Server } from 'socket.io';
import { Pool, QueryExec } from 'query-builder-mysql';
import { environment } from '../environments/environment';
import { RequestToBot } from './BotChat';
import { v4 as uuid } from 'uuid';
import { GetTimeStamp } from './Genralunctions';
import {
  ChatHistory,
  Room,
  RoomUncheckedUpdateInput,
  ChatHistoryUncheckedCreateInput,
  ChanneIDS,
  RoomStatus,
  UserData,
  SupportedLanguage,
  ChatHistoruReqServer,
} from '@yana-exhchange/interface';

export const DbPool = new Pool({
  host: process.env.DBHOST,
  connectionLimit: environment.production ? 10 : 3,
  password: process.env.DBPASSWORD,
  user: process.env.DBUSER,
  database: process.env.DATABASE,
});
// DbPrisma.room.findMany().then(console.log);
export const ActiveRoomStatus: {
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

export async function InsertUpdateRoom(
  data: RoomUncheckedUpdateInput,
  where?: RoomUncheckedUpdateInput,
  dbRef?: QueryExec
) {
  const db = dbRef || (await DbPool.get_connection());
  try {
    let p: Promise<any>;
    if (where && where !== null) {
      p = db.update('Room', data, where);
    } else {
      p = db.insert('Room', data);
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
export async function InsertChatUsers(
  data: UserData,
  where?: UserData,
  dbRef?: QueryExec
) {
  const db = dbRef || (await DbPool.get_connection());
  try {
    let p: Promise<any>;
    if (where && where !== null) {
      p = db.update('ChatUsers', data, where);
    } else {
      p = db.insert('ChatUsers', data);
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
  emit_delay = 0,
  dbRef?: QueryExec
) {
  return InsertUpdateChatHistory(data, null, dbRef).finally(() => {
    if (emitToRoom === true) {
      setTimeout(() => {
        server.of('users').to(roomid).emit('NewMessage', data);
        server.of('agent').to(roomid).emit('NewMessage', data);
      }, emit_delay);
    }
  });
}
export async function SendMessageToBot(
  message: string,
  roomid: string,
  uname: string
) {
  CreateNewChatRecord(
    {
      ChatHistoryId: uuid(),
      CHAttributes: {
        msg_from_name: uname,
      },
      CHCreatedOn: GetTimeStamp(),
      CHRoomID: roomid,
      Message: message,
      MessageFrom: 'USER',
    },
    roomid,
    true,
    0
  );
  const BotRespo = await RequestToBot(message, {
    roomid,
  });
  const lang = BotRespo.extra.languageCode.toUpperCase();
  CreateNewChatRecord(
    {
      ChatHistoryId: BotRespo.extra.MessageId,
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
      Message: BotRespo.response[lang]
        ? BotRespo.response[lang].text[0]
        : BotRespo.response.EN.text[0],
      MessageFrom: 'BOT',
    },
    roomid,
    true,
    0
  );
}
export async function CreateNewBotSession(
  uname: string,
  roomid: string,
  UniqueID: string,
  lang?: SupportedLanguage
) {
  const BotRespo = await RequestToBot('Hello', {
    roomid,
    lang,
  });
  const RoomEntry = {
    RoomAttributes: {
      created_by_unique_id: UniqueID,
    },
    RoomChannelID: ChanneIDS.CHAT,
    RoomCreatedOn: GetTimeStamp(),
    RoomStatus: RoomStatus.ACTIVE,
    RoomID: roomid,
  };
  const db = await DbPool.get_connection();
  try {
    await InsertUpdateRoom(RoomEntry);
    const p = CreateNewChatRecord(
      {
        ChatHistoryId: uuid(),
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
      100,
      db
    );
    const p1 = CreateNewChatRecord(
      {
        ChatHistoryId: BotRespo.extra.MessageId,
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
        Message: BotRespo.response[lang]
          ? BotRespo.response[lang].text[0]
          : BotRespo.response.EN.text[0],
        MessageFrom: 'BOT',
      },
      roomid,
      true,
      100,
      db
    );
    const p2 = InsertChatUsers(
      {
        ChatUsersRoomID: roomid,
      },
      {
        UniqueID: UniqueID,
      },
      db
    );
    await Promise.all([p, p1, p2]);
    db.release();
  } catch (error) {
    db.release();
  }
  return {
    room: RoomEntry,
  };
}

export async function GetChatHistory(req?: ChatHistoruReqServer) {
  const db = await DbPool.get_connection();
  try {
    if (req) {
      if (req.CHRoomID) {
        if (Array.isArray(req.CHRoomID)) {
          db.where_in('ch.CHRoomID', req.CHRoomID);
        } else {
          db.where('ch.CHRoomID', req.CHRoomID);
        }
      }
      if (req.ChatHistoryId) {
        if (Array.isArray(req.ChatHistoryId)) {
          db.where_in('ch.ChatHistoryId', req.ChatHistoryId);
        } else {
          db.where('ch.ChatHistoryId', req.ChatHistoryId);
        }
      }
      if (
        req.get_all === false &&
        typeof req.limit === 'number' &&
        typeof req.stream === 'number'
      ) {
        db.limit(req.limit, (req.stream - 1) * req.limit);
      }
    }
    return db.get('ChatHistory as ch').finally(() => {
      db.release();
    });
  } catch (error) {
    db.release();
    return [];
  }
}
