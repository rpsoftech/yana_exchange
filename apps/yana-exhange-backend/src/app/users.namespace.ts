import {
  ExtraDataForSendingRequestToSever,
  SocketioSocket,
  TypesForSendingRequestToSever,
  UserData,
} from '@yana-exhchange/interface';
import { Server } from 'socket.io';
import { v4 as uuid } from 'uuid';
import { ChangeLang, LikeDisLikeMessage } from './BotChat';
import {
  CreateNewBotSession,
  GetChatHistory,
  GetUsers,
  InsertChatUsers,
  SendMessageToBot,
} from './Database';
import { SignData, VerifyData } from './Genralunctions';
export function AddUserNameSpace(server: Server) {
  server.of('users').use(async (socket: SocketioSocket, next) => {
    socket.user_data = {};
    if (typeof socket.handshake.auth.token === 'undefined') {
      //TODO: Make Configurable Users Default Name
      const user = await CreateNewUser(socket.handshake.auth.name || 'Anno');
      socket.user_data = {
        user: user.user as any,
        type: 'anno',
      };
      socket.emit('auth_change', user);
    } else {
      const u = VerifyData(socket.handshake.auth.token);
      socket.user_data = {
        user: u.user as any,
        type: u.type,
      };
    }
    if (socket.user_data.user.ChatUsersRoomID === null) {
      const UsersDataArray = await GetUsers({
        uid: socket.user_data.user.UniqueID,
        join_room: true,
      });
      if (UsersDataArray.length === 0) {
        next(new Error('User Not Found'));
        return;
      }
      const user = UsersDataArray[0];
      if (user.RoomStatus === null) {
        //TODO: Create New Seesion
        const roomid = uuid();
        socket.join(roomid);
        const a = await CreateNewBotSession(
          socket.user_data.user.ChatUsersAttributes.name,
          roomid,
          user.UniqueID,
          socket.handshake.auth.lang
        );
        socket.user_data.room = a.room;
      } else {
        socket.user_data.room = {
          RoomID: user.RoomID,
          RoomChannelID: user.RoomChannelID,
          RoomStatus: user.RoomStatus,
          RoomAttributes: user.RoomAttributes,
          RoomCreatedOn: user.RoomCreatedOn,
        };
        socket.join(user.RoomID);
      }
    }
    next();
  });
  server.of('users').on('connection', (s: SocketioSocket) => {
    s.on(
      'message',
      async (a: {
        type: TypesForSendingRequestToSever;
        data: ExtraDataForSendingRequestToSever;
      }) => {
        if (a.type === 'lang-change') {
          const roomid = s.user_data.room.RoomID;
          const lang = a.data['lang-change'].lang;
          await ChangeLang(roomid, lang);
          s.emit('lang-chang', {
            success: true,
          });
        } else if (
          a.type === 'like-dislike' &&
          typeof a.data['like-dislike'] !== 'undefined'
        ) {
          const b = await LikeDisLikeMessage(
            a.data['like-dislike'].likeOrDislike,
            a.data['like-dislike'].reasonsSelected,
            a.data['like-dislike'].messageId
          );
          s.emit(
            'like-dislike',
            Object.assign(b, {
              messageId: a.data['like-dislike'].messageId,
            })
          );
        } else if (
          a.type === 'send-message' &&
          typeof a.data['send-message'] !== 'undefined'
        ) {
          //TODO: Check Room Status Here Then Send To Bot
          SendMessageToBot(
            a.data['send-message'].message,
            s.user_data.room.RoomID,
            s.user_data.user.ChatUsersAttributes.name
          );
        } else if (
          a.type === 'chat-history' &&
          typeof a.data['chat-history'] !== 'undefined'
        ) {
          //TODO: Check Room Status Here Then Send To Bot
          const roomid = s.user_data.room.RoomID;
          s.emit(
            'chat-history',
            await GetChatHistory(
              Object.assign(
                {
                  CHRoomID: roomid,
                },
                a.data['chat-history']
              )
            )
          );
        }
      }
    );
  });
}
async function CreateNewUser(name: string) {
  const uid = uuid();
  const user: UserData = {
    ChatUsersRoomID: null,
    UniqueID: uid,
    ChatUsersAttributes: { name },
  };
  await InsertChatUsers(user);
  const token = SignData({
    user,
    type: 'anno',
  });
  return {
    token,
    uid,
    user,
  };
}
