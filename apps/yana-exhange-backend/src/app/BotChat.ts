/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BotApiReq,
  BotAPIResponse,
  BotLikeDislikeReq,
  LikeDisLikeRespo,
  SupportedLanguage,
} from '@yana-exhchange/interface';
import * as ax from 'axios';
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
  return ax.default
    .post<BotAPIResponse, {data:BotAPIResponse}, BotApiReq>(
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
