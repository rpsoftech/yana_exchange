import {
  ExtraDataForSendingRequestToSever,
  SocketioSocket,
  TypesForSendingRequestToSever,
  UserData,
} from '@yana-exhchange/interface';
import { Server } from 'socket.io';
import { v4 as uuid } from 'uuid';
import {
  ChangeLang,
  DeviceSyncCallForBot,
  GetDisLikeOptions,
  LikeDisLikeMessage,
  ProcessAgentBotAPi,
  SetBotContext,
} from './BotChat';
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
      const extraBotSessionInputs = {
        applicationId: socket.handshake.auth.applicationId,
        source: socket.handshake.auth.source,
      };
      if (user.RoomStatus === null) {
        //TODO: Create New Seesion
        const roomid = uuid();
        socket.join(roomid);
        const a = await CreateNewBotSession(
          roomid,
          user.UniqueID,
          socket.handshake.auth.lang,
          extraBotSessionInputs
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
        SetBotContext(user.RoomID, extraBotSessionInputs);
        socket.join(user.RoomID);
      }
    }
    next();
  });
  server.of('users').on('connection', (s: SocketioSocket) => {
    let Userlang = s.handshake.auth.lang;
    const UserSource = s.handshake.auth.source;
    const UserApplicationID = s.handshake.auth.applicationId;
    s.on(
      'message',
      async (a: {
        type: TypesForSendingRequestToSever;
        data: ExtraDataForSendingRequestToSever;
      }) => {
        try {
          if (a.type === 'lang-change') {
            const roomid = s.user_data.room.RoomID;
            const lang = a.data['lang-change'].lang;
            await ChangeLang(roomid, lang);
            Userlang = lang;
            s.emit('lang-chang', {
              success: true,
            });
          } else if (a.type === 'like-dislike') {
            const b = await LikeDisLikeMessage(
              a.data['like-dislike'].likeOrDislike,
              a.data['like-dislike'].reasonsSelected,
              a.data['like-dislike'].messageId,
              {
                lang: Userlang,
                source: UserSource,
                applicationId: UserApplicationID,
              }
            );
            s.emit(
              'like-dislike',
              Object.assign(b,a.data['like-dislike'])
            );
          } else if (a.type === 'follow-up') {
            SendMessageToBot(
              {
                message: a.data['follow-up'].follow_up_value,
                roomid: s.user_data.room.RoomID,
                uname: s.user_data.user.ChatUsersAttributes.name,
                followup_key: a.data['follow-up'].follow_up_key,
              },
              a.data['follow-up'].extra
            );
          } else if (a.type === 'send-message') {
            //TODO: Check Room Status Here Then Send To Bot
            SendMessageToBot(
              {
                message: a.data['send-message'].message,
                roomid: s.user_data.room.RoomID,
                uname: s.user_data.user.ChatUsersAttributes.name,
              },
              a.data['send-message'].extra
            );
          } else if (a.type === 'chat-history') {
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
          } else if (a.type === 'device-sync') {
            const roomid = s.user_data.room.RoomID;
            const BotRespo = await DeviceSyncCallForBot(
              {
                roomid,
                lang: Userlang,
              },
              true
            );
            s.emit('device-sync', BotRespo);
          } else if (a.type === 'get-dislike-options') {
            const roomid = s.user_data.room.RoomID;
            s.emit(
              'get-dislike-options',
              await GetDisLikeOptions({
                roomid,
                lang: Userlang,
              })
            );
          } else if (a.type === 'process-agent') {
            const roomid = s.user_data.room.RoomID;
            s.emit(
              'process-agent',
              await ProcessAgentBotAPi(a.data['process-agent'], roomid)
            );
          }
        } catch (error) {
          s.emit('error', error);
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
