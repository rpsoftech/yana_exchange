import { Socket } from 'socket.io';
import { Handshake } from 'socket.io/dist/socket';
import { Room } from './yana-exchange.history.interface';
export interface YanaSdkInitOptions {
  name?: string;
  language?: SupportedLanguage;
  applicationId: string;
  source: SupportedSources;
}

export type SupportedLanguage = 'EN' | 'DE' | 'AR' | 'ES' | 'IT';
export type SupportedSources =
  | 'mobile'
  | 'webapp'
  | 'alexa'
  | 'facebook'
  | 'teams';

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
      applicationId: string;
      source: SupportedSources;
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
