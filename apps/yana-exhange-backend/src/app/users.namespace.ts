import { SocketioSocket, UserData } from '@yana-exhchange/interface';
import { Server } from 'socket.io';
import { v4 as uuid } from 'uuid';
import { DbPrisma } from './Database';
import { SignData, VerifyData } from './Genralunctions';
export function AddUserNameSpace(server: Server) {
  server.of('users').use(async (socket: SocketioSocket, next) => {
    if (typeof socket.handshake.auth.token === 'undefined') {
      const user = await CreateNewUser(socket.handshake.auth.name);
      socket.user_data = user.user as any;
      socket.user_data.type = 'anno';
      socket.emit('auth_change', user);
    } else {
      const u = VerifyData(socket.handshake.auth.token);
      console.log(u);
      socket.user_data = u.user as any;
      socket.user_data.type = u.type;
    }
    if (socket.user_data.ChatUsersRoomID === null) {
      const UserData = await DbPrisma.chatUsers.findUnique({
        where: {
          UniqueID: socket.user_data.UniqueID,
        },
        select: {
          Room: true,
        },
      });
      
    }
    next();
  });
}
async function CreateNewUser(name: string) {
  const uid = uuid();

  // const user = await DbPrisma.$executeRawUnsafe(`INSERT INTO \`ChatUsers\` (\`UniqueID\`,\`ChatUsersAttributes\`) VALUES ('${uid}', '{}');`)
  const user: UserData = {
    ChatUsersRoomID: null,
    UniqueID: uid,
    ChatUsersAttributes: { name },
  };
  await DbPrisma.chatUsers
    .createMany({
      data: [user as any],
    })
    .catch((e) => {
      console.log(e);
      return {};
    });
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
