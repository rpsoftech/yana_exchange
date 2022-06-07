import {
  BotApiRespoNudgeOptions,
  Output,
  ProcessAgentInterface,
  Results,
} from './yana-exchange.bot.interface';
import { ProcessParams } from './yana-exchange.front';

export interface ChatHistory {
  ChatHistoryId: number;
  CHRoomID: string;
  Message: string;
  MessageFrom: ChatHistory_MessageFrom;
  CHAttributes: CHAttributes;
  CHCreatedOn: number;
}
export interface ChatHistoryAttributesBotObject {
  MessageId?: string;
  processParams?: ProcessParams;
  processAgent: ProcessAgentInterface;
  output: Output;
  nudgeOptions?: BotApiRespoNudgeOptions[];
  results: Results;
}
export interface CHAttributes {
  reason?: string;
  msg_from_name?: string;
  bot?: ChatHistoryAttributesBotObject;
}
export interface ChatHistoryUncheckedCreateInput {
  ChatHistoryId: string;
  CHRoomID: string;
  Message: string;
  MessageFrom: ChatHistory_MessageFrom;
  CHAttributes: CHAttributes;
  CHCreatedOn: number;
}

export type ChatHistory_MessageFrom = 'AGENT' | 'USER' | 'BOT';

export interface Room {
  RoomID: string;
  RoomStatus: number;
  RoomChannelID: number;
  RoomAttributes: RoomAttributesinterface;
  RoomCreatedOn: number;
}
export interface RoomAttributesinterface {
  created_by_unique_id: string;
}
export interface RoomUncheckedUpdateInput {
  RoomID?: string;
  RoomStatus?: number;
  RoomLikeCount?: number;
  RoomChannelID?: number;
  RoomCreatedOn?: number;
  RoomAttributes: RoomAttributesinterface;
}
