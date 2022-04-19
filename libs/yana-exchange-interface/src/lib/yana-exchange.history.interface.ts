import { Output, Results } from './yana-exchange.bot.interface';

export type ChatHistory = {
  ChatHistoryId: number;
  CHRoomID: string;
  Message: string;
  MessageFrom: ChatHistory_MessageFrom;
  CHAttributes: CHAttributes;
  CHCreatedOn: number;
};
export interface CHAttributes {
  reason?: string;
  msg_from_name?: string;
  bot?: {
    output: Output;
    results: Results;
    results1: Results;
  };
}

export type ChatHistoryUncheckedCreateInput = {
  ChatHistoryId?: number;
  CHRoomID: string;
  Message: string;
  MessageFrom: ChatHistory_MessageFrom;
  CHAttributes: CHAttributes;
  CHCreatedOn: number;
};

export type ChatHistory_MessageFrom = 'AGENT' | 'USER' | 'BOT';
