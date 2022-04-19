/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BotAPIResponse,
  BotContext,
  SupportedLanguage,
} from '@yana-exhchange/interface';
import * as ax from 'axios';
export const BotIdWithContext: {
  [key: string]: BotContext;
} = {};

export async function RequestToBot(
  text: string,
  options: {
    lang?: SupportedLanguage;
    roomid: string;
    user_id?: string;
  }
) {
  return ax.default
    .post<BotAPIResponse>('https://yanademo-orchestrator.yanaimpl.com/', {
      text: text,
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
      messageId: '',
      languageCode: options.lang ? options.lang.toLowerCase() : 'en',
      source: 'webapp',
      applicationId: '83',
      testMode: 'N',
      inputmode: 'text',
      sourceVersion: ' 2.10.0.1',
    })
    .then((a) => {
      SetBotContext(options.roomid, a.data.context);
      return {
        bot_id: a.data.context.bot_conversation_id,
        response: a.data.output,
        extra: a.data,
      };
    });
}

export async function GetBotContext(roomid: string) {
  // TODO: Get Data from redis database
  return BotIdWithContext[roomid] || {};
}
export async function SetBotContext(roomid: string, con: BotContext) {
  // TODO: Get Data from redis database
  BotIdWithContext[roomid] = con;
}
