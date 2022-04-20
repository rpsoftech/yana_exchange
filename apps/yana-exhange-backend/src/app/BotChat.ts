/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BotApiReq,
  BotAPIResponse,
  BotDislikeOptionsReq,
  BotLikeDislikeReq,
  LikeDisLikeReasonRespo,
  LikeDisLikeRespo,
  SupportedLanguage,
} from '@yana-exhchange/interface';
import * as ax from 'axios';
import { CreateNewChatRecord } from './Database';
import { GetTimeStamp } from './Genralunctions';
export const BotIdWithContext: {
  [key: string]: BotApiReq;
} = {};

export async function RequestToBot(
  text: string,
  options: {
    lang?: SupportedLanguage;
    roomid: string;
    user_id?: string;
  }
) {
  const APIREQ: BotApiReq =
    (await GetBotContext(options.roomid)) ||
    ({
      text: text,
      apiId: '1',
      context: await GetBotContext(options.roomid),
      userId: options.user_id ? options.user_id : '0000',
      personID: '',
      addtnlInputParams: {
        latitude: '',
        longitude: '',
      },
      userAcadPlan: {},
      additionalPersistentInformation: {},
      userDisplayName: '',
      languageCode: options.lang ? options.lang.toLowerCase() : 'en',
      source: 'webapp',
      applicationId: '83',
    } as any);
  APIREQ.text = text;
  APIREQ.apiId = '1';
  return ax.default
    .post<BotAPIResponse, { data: BotAPIResponse }, BotApiReq>(
      'https://yanademo-orchestrator.yanaimpl.com/',
      APIREQ
    )
    .then((a) => {
      SetBotContext(options.roomid, a.data);
      return {
        bot_id: a.data.context.bot_conversation_id,
        response: a.data.output,
        extra: a.data,
      };
    });
}
export async function DeviceSyncCallForBot(
  options: {
    lang: SupportedLanguage;
    roomid: string;
  },
  AddToDatabase = false
) {
  const cont: any = (await GetBotContext(options.roomid)) || {};
  const APIREQ: BotApiReq = Object.assign(cont, {
    languageCode: options.lang,
    apiId: '9',
  });
  return ax.default
    .post<BotAPIResponse, { data: BotAPIResponse }, BotApiReq>(
      'https://yanademo-orchestrator.yanaimpl.com/',
      APIREQ
    )
    .then((a) => {
      SetBotContext(options.roomid, a.data);
      const BotRespo = {
        bot_id: a.data.context.bot_conversation_id,
        response: a.data.output,
        extra: a.data,
      };
      if (AddToDatabase) {
        CreateNewChatRecord(
          {
            ChatHistoryId: BotRespo.extra.MessageId,
            CHAttributes: {
              msg_from_name: 'BOT',
              bot: {
                output: BotRespo.response,
                results: BotRespo.extra.results,
              },
            },
            CHCreatedOn: GetTimeStamp(),
            CHRoomID: options.roomid,
            Message: BotRespo.response[options.lang]
              ? BotRespo.response[options.lang].text[0]
              : BotRespo.response.EN.text[0],
            MessageFrom: 'BOT',
          },
          options.roomid,
          true,
          0
        );
      }
      return BotRespo;
    });
}
export async function GetDisLikeOptions(options: {
  lang: SupportedLanguage;
  roomid: string;
}) {
  const cont: any = (await GetBotContext(options.roomid)) || {};
  const APIREQ: BotDislikeOptionsReq = Object.assign({}, cont, {
    languageCode: options.lang,
    apiId: '6',
  });
  APIREQ.getLikeOrDislikeReasons = {
    likeOrDislike: '2',
  };
  return ax.default
    .post<LikeDisLikeReasonRespo, { data: LikeDisLikeReasonRespo }, BotApiReq>(
      'https://yanademo-orchestrator.yanaimpl.com/',
      APIREQ
    )
    .then((a) => {
      return a.data.getLikeOrDislikeReasonsResponse;
    });
}
export async function LikeDisLikeMessage(
  like_dislike: string,
  reasonsSelected: string[] = [],
  messageId: string
) {
  const a: BotLikeDislikeReq = {
    apiId: '7',
    personID: '',
    languageCode: 'en',
    source: 'webapp',
    applicationId: '83',
    updateLikeOrDislike: {
      likeOrDislike: like_dislike.toString() as any,
      reasonsSelected: reasonsSelected,
      messageId: messageId,
    },
  };
  return ax.default
    .post<LikeDisLikeRespo, { data: LikeDisLikeRespo }, BotLikeDislikeReq>(
      'https://yanademo-orchestrator.yanaimpl.com/',
      a
    )
    .then((a) => {
      if (typeof a.data.Status === 'undefined') {
        return {
          success: true,
        };
      } else {
        return {
          success: false,
        };
      }
    });
}
export async function ChangeLang(roomid: string, lang: SupportedLanguage) {
  await SetBotContext(roomid, {
    languageCode: lang.toLowerCase(),
  });
}
export async function GetBotContext(roomid: string) {
  // TODO: Get Data from redis database
  return BotIdWithContext[roomid];
}
export async function SetBotContext(roomid: string, con: BotAPIResponse) {
  // TODO: Get Data from redis database
  BotIdWithContext[roomid] = Object.assign(
    (await GetBotContext(roomid)) || {},
    con
  ) as any;
}
