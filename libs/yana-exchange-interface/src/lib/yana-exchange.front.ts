import { SupportedLanguage } from './yana-exchange-interface';
import {
  AddtionalInputsFromUserInSession,
  BotAPIResponse,
  BotApiRespoNudgeOptions,
  DisLikeOptionsRespo,
  LikeDisLikeReqObject,
  Output,
} from './yana-exchange.bot.interface';
import { ChatHistoryUncheckedCreateInput } from './yana-exchange.history.interface';

export type ServerRespoEvents =
  | 'lang-chang'
  | 'connect'
  | 'disconnect'
  | 'chat-history'
  | 'user-login'
  | 'device-sync'
  | 'get-dislike-options'
  | 'like-dislike'
  | 'NewMessage';
export interface LangChangedRespo {
  success: true;
}
export interface LikeDisLikeOfResponseFromServer {
  messageId: string;
  success: boolean;
}
export type ServerResponseData<T> = T extends 'lang-chang'
  ? LangChangedRespo
  : T extends 'connect'
  ? void
  : T extends 'disconnect'
  ? void
  : T extends 'like-dislike'
  ? void
  : T extends 'get-dislike-options'
  ? DisLikeOptionsRespo
  : T extends 'device-sync'
  ? {
      nudgeOptions: BotApiRespoNudgeOptions[];
      bot_id: string;
      response: Output;
      extra: BotAPIResponse;
    }
  : T extends 'chat-history'
  ? ChatHistoryUncheckedCreateInput[]
  : T extends 'NewMessage'
  ? ChatHistoryUncheckedCreateInput
  : never;

export interface SendMessageToServerReq {
  message: string;
}
export interface LikeDisLikeOfMessageToServer {
  // 1 For Like 2 For DisLike
  likeOrDislike: boolean;
  reasonsSelected: string[];
  messageId: string;
}
export type ClientToServerReq = 'send-message' | 'like-dislike';
export type ClientToServerReqData<T> = T extends 'send-message'
  ? SendMessageToServerReq
  : T extends 'like-dislike'
  ? LikeDisLikeOfMessageToServer
  : never;

export interface ChatHistoruReqServer extends ChatHistoruReq {
  CHRoomID?: string | string[];
  ChatHistoryId?: string | string[];
}
export interface ChatHistoruReq {
  get_all: boolean;
  stream?: number;
  limit?: number;
  order_by_time?: 'asc' | 'desc';
}
export type TypesForSendingRequestToSever =
  | 'lang-change'
  | 'follow-up'
  | 'device-sync'
  | 'get-dislike-options'
  | 'chat-history'
  | 'send-message'
  | 'like-dislike';
export interface ExtraDataForSendingRequestToSever {
  'lang-change'?: {
    lang: SupportedLanguage;
  };
  'follow-up'?: {
    follow_up_key: string;
    follow_up_value: string;
    extra?: AddtionalInputsFromUserInSession;
  };
  'chat-history'?: ChatHistoruReq;
  'like-dislike'?: LikeDisLikeReqObject;
  'send-message'?: {
    message: string;
    extra?: AddtionalInputsFromUserInSession;
  };
}