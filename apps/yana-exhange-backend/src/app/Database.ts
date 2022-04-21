/* eslint-disable @typescript-eslint/no-explicit-any */
export type ChatUsers = {
  UniqueID: string
  ChatUsersRoomID: string | null
  ChatUsersAttributes: any
}
import { Server } from 'socket.io';
import { Pool, QueryExec } from 'query-builder-mysql';
import { environment } from '../environments/environment';
import { DeviceSyncCallForBot, RequestToBot } from './BotChat';
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
  AddtionalInputsFromUserInSession,
} from '@yana-exhchange/interface';
console.log(environment);

const DatabaseOptions ={
  host: process.env.DBHOST,
  connectionLimit:10,
  password: process.env.DBPASSWORD,
  user: process.env.DBUSER,
  database: process.env.DATABASE,
}
console.log('Database Otions Are');
console.log(DatabaseOptions);
export const DbPool = new Pool(DatabaseOptions);
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
  options: {
    message: string;
    roomid: string;
    uname: string;
    followup_key?: string;
  },
  extra: AddtionalInputsFromUserInSession = {}
) {
  CreateNewChatRecord(
    {
      ChatHistoryId: uuid(),
      CHAttributes: {
        msg_from_name: options.uname,
      },
      CHCreatedOn: GetTimeStamp(),
      CHRoomID: options.roomid,
      Message: options.message,
      MessageFrom: 'USER',
    },
    options.roomid,
    true,
    0
  );
  const BotRespo = await RequestToBot(
    options.followup_key || options.message,
    {
      roomid: options.roomid,
      isFollow_up: typeof options.followup_key !== 'undefined',
    },
    extra
  );
  const lang = BotRespo.extra.languageCode.toUpperCase();
  CreateNewChatRecord(
    {
      ChatHistoryId: BotRespo.extra.MessageId,
      CHAttributes: {
        msg_from_name: 'BOT',
        bot: {
          processAgent: BotRespo.extra.processAgent,
          output: BotRespo.response,
          results: BotRespo.extra.results,
          nudgeOptions: BotRespo.extra.nudgeOptions,
        },
      },
      CHCreatedOn: GetTimeStamp(),
      CHRoomID: options.roomid,
      Message: BotRespo.response[lang]
        ? BotRespo.response[lang].text[0]
        : BotRespo.response.EN.text[0],
      MessageFrom: 'BOT',
    },
    options.roomid,
    true,
    0
  );
}
export async function CreateNewBotSession(
  roomid: string,
  UniqueID: string,
  lang: SupportedLanguage,
  additionalInputs: AddtionalInputsFromUserInSession
) {
  const BotRespo = await DeviceSyncCallForBot(
    {
      roomid,
      lang,
    },
    false,
    additionalInputs
  );
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
    const p1 = CreateNewChatRecord(
      {
        ChatHistoryId: BotRespo.extra.MessageId,
        CHAttributes: {
          msg_from_name: 'BOT',
          bot: {
            processAgent: BotRespo.extra.processAgent,
            output: BotRespo.response,
            results: BotRespo.extra.results,
            nudgeOptions: BotRespo.extra.nudgeOptions,
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
    await Promise.all([p1, p2]);
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
      if (req.order_by_time) {
        db.order_by('ch.CHCreatedOn', req.order_by_time);
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
