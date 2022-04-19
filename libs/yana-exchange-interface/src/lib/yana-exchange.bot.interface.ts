/* eslint-disable @typescript-eslint/no-explicit-any */
export interface BotReq {
    text: string;
    context: BotContext;
    userId: string;
    personID: string;
    addtnlInputParams: AddtnlInputParams;
    userDisplayName: string;
    messageId: string;
    languageCode: string;
    source: string;
    applicationId: string;
    testMode: string;
    inputmode: string;
    sourceVersion: string;
  }
  
  export interface AddtnlInputParams {
    latitude: string;
    longitude: string;
  }
  export interface Entity {
    entity: string;
    value: string;
  }
  
  export interface Intent {
    intent: string;
  }
  
  export interface IntentsIdentified {
    primary: Primary;
  }
  
  export interface Primary {
    intent: string;
    handler: string;
    objectType: string;
    type: string;
  }
  
  export interface Metadata {
    user_id: string;
  }
  
  export interface System {
    initialized: boolean;
    dialog_stack: DialogStack[];
    dialog_turn_counter: number;
    dialog_request_counter: number;
    _node_output_map: NodeOutputMap;
    branch_exited: boolean;
    branch_exited_reason: string;
  }
  
  export interface NodeOutputMap {
    'Anything else': AnythingElse;
  }
  
  export interface AnythingElse {
    '0': number[];
  }
  
  export interface DialogStack {
    dialog_node: string;
  }
  
  export interface BotAPIResponse {
    output: Output;
    additionalPersistentInformation: any;
    userDisplayName: string;
    version: string;
    input: Input;
    userId: string;
    languageCode: string;
    applicationId: string;
    source: string;
    intents: BotAPIResponseIntent[];
    entities: any[];
    action: string;
    entity: string;
    sensitive: boolean;
    responseStatus: number;
    applicationStatus: string;
    decisionStatus: number;
    processAgent: ProcessAgent;
    results: Results;
    context: BotContext;
    responseCategory: string;
    statusCode: string;
    MessageId: string;
    servedBy: string;
    RELAVANCE: number;
    microbotRequest: string;
    personID: string;
  }
  
  export interface BotContext {
    bot_conversation_id: string;
    index: number;
    conversation_id: string;
    system: System;
    metadata: Metadata;
    intentsIdentified: IntentsIdentified;
    entities: Entity[];
    intents: ContextIntent[];
  }
  
  export interface Entity {
    entity: string;
    value: string;
  }
  
  export interface ContextIntent {
    intent: string;
  }
  
  export interface IntentsIdentified {
    primary: Primary;
  }
  
  export interface Primary {
    intent: string;
    handler: string;
    objectType: string;
    type: string;
  }
  
  export interface Metadata {
    user_id: string;
  }
  
  export interface System {
    initialized: boolean;
    dialog_stack: DialogStack[];
    dialog_turn_counter: number;
    dialog_request_counter: number;
    _node_output_map: NodeOutputMap;
    branch_exited: boolean;
    branch_exited_reason: string;
  }
  
  export interface NodeOutputMap {
    'Anything else': AnythingElse;
  }
  
  export interface AnythingElse {
    '0': number[];
  }
  
  export interface DialogStack {
    dialog_node: string;
  }
  
  export interface Input {
    text: string;
  }
  
  export interface BotAPIResponseIntent {
    intent: string;
    confidence: number;
  }
  
  export interface Output {
    EN: En;
    CTX_RES_COUNT: number;
  }
  
  export interface En {
    text: string[];
    voice: string;
    voiceonly: string;
  }
  
  export interface ProcessAgent {
    processAgentTxnId: string;
  }
  
  export interface Results {
    objType: string;
    objects: ResultObject[];
  }
  
  export interface ResultObject {
    CTX_RES_ENTITY_NAME: string;
    CTX_RES_KEYWORD: string;
    CTX_RES_INTENT: string;
    CTX_RES_TEXT: string;
    CTX_RES_VOICE: string;
    CTX_RES_VOICE_ONLY: string;
  }
  

  