import { Socket } from 'socket.io';
import { Handshake } from 'socket.io/dist/socket';
import { Room } from './yana-exchange.history.interface';
export interface YanaSdkInitOptions {
  name?: string;
  language?: SupportedLanguage;
}

export type SupportedLanguage = 'EN' | 'DE' | 'AR' | 'ES' | 'IT';

export interface UserData {
  UniqueID?: string;
  ChatUsersRoomID?: string;
  ChatUsersAttributes?: {
    name: string;
  };
}

export interface SocketioSocket extends Socket {
  user_data: {
    user?: UserData;
    room?: Room;
    type?: 'anno' | 'auth';
  };
  handshake: Handshake & {
    auth: {
      lang: SupportedLanguage;
      type?: 'anno';
      name?: string;
      token?: string;
    };
  };
}

export const ChanneIDS = {
  CHAT: 1,
};
export const RoomStatus = {
  ACTIVE: 1,
  FINISHED: 2,
};
