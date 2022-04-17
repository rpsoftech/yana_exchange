/* eslint-disable @typescript-eslint/no-explicit-any */
import { BotAPIResponse, BotContext } from '@yana-exhchange/interface';
import * as ax from 'axios';
export const BotIdWithContext: {
  [key: string]: BotContext;
} = {};

export async function RequestToBot(
  text: string,
  options: {
    botid?: string;
    user_id?: string;
  }
) {
  return ax.default
    .post<BotAPIResponse>('https://yanademo-orchestrator.yanaimpl.com/', {
      text: text,
      context:
        options.botid && BotIdWithContext[options.botid]
          ? BotIdWithContext[options.botid]
          : {},
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
      languageCode: 'en',
      source: 'webapp',
      applicationId: '83',
      testMode: 'N',
      inputmode: 'text',
      sourceVersion: ' 2.10.0.1',
    })
    .then((a) => {
      BotIdWithContext[a.data.context.bot_conversation_id] = a.data.context;
      return {
        bot_id: a.data.context.bot_conversation_id,
        response: a.data.output,
        extra: a.data,
      };
    });
}

export async function GetBotContext(context_id: string) {
  // TODO: Get Data from redis database
  return BotIdWithContext[context_id];
}
export async function SetBotContext(context_id: string, con: BotContext) {
  // TODO: Get Data from redis database
  BotIdWithContext[context_id] = con;
}
