import { SocketioSocket, UserData } from '@yana-exhchange/interface';
import { Server } from 'socket.io';
import { v4 as uuid } from 'uuid';
import { DbPool, GetUsers } from './Database';
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
    console.log(socket.user_data.user);
    if (socket.user_data.user.ChatUsersRoomID === null) {
      console.log(socket.user_data.user.UniqueID);
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
        
      } else {
        socket.user_data.room = {
          RoomID: user.RoomID,
          RoomChannelID: user.RoomChannelID,
          RoomStatus: user.RoomStatus,
          RoomAttributes: user.RoomAttributes,
          RoomCreatedOn: user.RoomCreatedOn,
        };
      }
    }
    next();
  });
}
async function CreateNewUser(name: string) {
  const uid = uuid();
  const user: UserData = {
    ChatUsersRoomID: null,
    UniqueID: uid,
    ChatUsersAttributes: { name },
  };
  const db = await DbPool.get_connection();
  try {
    await db.insert('ChatUsers', user);
  } catch (error) {
    db.release();
    throw error;
  }
  db.release();
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
