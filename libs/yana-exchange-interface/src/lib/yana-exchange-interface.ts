import { Socket } from 'socket.io';
import { Handshake } from 'socket.io/dist/socket';
export interface YanaSdkInitOptions {
  name?: string;
  language?: SupportedLanguage;
}

export type SupportedLanguage = 'EN' | 'DE' | 'AR' | 'ES' | 'IT';
export type TypesForSendingRequestToSever = 'lang-change' | 'send-message';
export interface ExtraDataForSendingRequestToSever {
  'lang-change'?: {
    lang: SupportedLanguage;
  };
  'send-message'?: {
    message: string;
  };
}

export interface UserData {
  UniqueID: string;
  ChatUsersRoomID: string;
  ChatUsersAttributes?: {
    name: string;
  };
}

export interface SocketioSocket extends Socket {
  user_data: UserData & {
    type?: 'anno';
  };
  handshake: Handshake & {
    auth: {
      type?: 'anno';
      name?: string;
      token?: string;
    };
  };
}
