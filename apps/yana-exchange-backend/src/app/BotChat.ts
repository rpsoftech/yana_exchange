/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AddtionalInputsFromUserInSession,
  BotApiReq,
  BotAPIResponse,
  BotDislikeOptionsReq,
  BotLikeDislikeReq,
  LikeDisLikeReasonRespo,
  LikeDisLikeRespo,
  ProcessAgentInterface,
  ProcessAgentResponse,
  ProcessParams,
  SupportedLanguage,
  SupportedSources,
} from '@yana-exhchange/interface';
import * as ax from 'axios';
import { CreateNewChatRecord, RedisConnection } from './Database';
import { GetTimeStamp } from './Genralunctions';
export const BotIdWithContext: {
  [key: string]: BotApiReq;
} = {};

export async function RequestToBot(
  text: string,
  options: {
    lang?: SupportedLanguage;
    roomid: string;
    isFollow_up?: boolean;
  },
  extra: AddtionalInputsFromUserInSession
) {
  const APIREQ: BotApiReq = Object.assign(
    await GetBotContext(options.roomid),
    extra
  );
  APIREQ.text = text;
  APIREQ.languageCode = options.lang || APIREQ.languageCode;
  APIREQ.apiId = options.isFollow_up ? '8' : '1';
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
export async function ProcessAgentBotAPi(
  options: {
    processParams?: ProcessParams;
    processAgent: ProcessAgentInterface;
  },
  roomid: string
): Promise<ProcessAgentResponse> {
  const APIREQ: BotApiReq = Object.assign(await GetBotContext(roomid), options);
  APIREQ.apiId = '5';
  return ax.default
    .post<LikeDisLikeReasonRespo, { data: LikeDisLikeReasonRespo }, BotApiReq>(
      'https://yanademo-orchestrator.yanaimpl.com/',
      APIREQ
    )
    .then((a) => {
      return {
        MessageId: a.data.MessageId,
        processAgent: a.data.processAgent,
        processParams: a.data.processParams,
      };
    });
}
export async function DeviceSyncCallForBot(
  options: {
    lang: SupportedLanguage;
    roomid: string;
  },
  AddToDatabase = false,
  extra: AddtionalInputsFromUserInSession = {}
) {
  const cont: any = (await GetBotContext(options.roomid)) || {};
  const APIREQ: BotApiReq = Object.assign(cont, extra, {
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
                processAgent: BotRespo.extra.processAgent,
                output: BotRespo.response,
                results: BotRespo.extra.results,
                nudgeOptions: a.data.nudgeOptions,
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
  messageId: string,
  options: {
    lang: SupportedLanguage;
    source: SupportedSources;
    applicationId: string;
  }
) {
  const a: BotLikeDislikeReq = {
    apiId: '7',
    personID: '',
    languageCode: options.lang.toLowerCase(),
    source: options.source,
    applicationId: options.applicationId,
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
  if (RedisConnection !== null) {
    const val = await RedisConnection.get(`botcon${roomid}`);
    if (typeof val !== 'undefined' && val !== null) {
      return typeof val === 'object' ? val : JSON.parse(val);
    }
  }
  return BotIdWithContext[roomid];
}
export async function SetBotContext(roomid: string, con: BotAPIResponse) {
  const val = Object.assign((await GetBotContext(roomid)) || {}, con);
  if (RedisConnection !== null) {
    await RedisConnection.set(`botcon${roomid}`, JSON.stringify(val));
  } else {
    BotIdWithContext[roomid] = val;
  }
}
