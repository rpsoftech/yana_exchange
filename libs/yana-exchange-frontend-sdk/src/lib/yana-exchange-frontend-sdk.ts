import {
  ChatHistoruReq,
  ChatHistoryUncheckedCreateInput,
  ClientToServerReq,
  ClientToServerReqData,
  ExtraDataForSendingRequestToSever,
  LikeDisLikeOfMessageToServer,
  SendMessageToServerReq,
  SendTextMessageAdditionalInput,
  ServerRespoEvents,
  ServerResponseData,
  SupportedLanguage,
  TypesForSendingRequestToSever,
  YanaSdkInitOptions,
} from '@yana-exhchange/interface';
import { Socket, io as ConnectToRemoteSocket } from 'socket.io-client';
import { filter, firstValueFrom, map, Observable, Subject } from 'rxjs';
/**
 *
 * @param ApiUrl Connection Url to Connect to Yana Exchange
 * @param options YanaSdkInitOptions for connection options
 * @returns YanaExchange Class Object
 */

export function InitSdk(
  ApiUrl: string,
  options: YanaSdkInitOptions
): YanaExchange {
  return new YanaExchange(ApiUrl, options);
}

export class YanaExchange {
  io!: Socket;
  /**
   * Connection Status to Server
   */
  public get ConnectionStatus(): boolean {
    return this.io ? this.io.connected : false;
  }
  /**
   * Current Chatting Language
   */
  private ResponseSubject = new Subject<{
    event: ServerRespoEvents;
    data?: any;
  }>();
  public get CurrentLanguage(): SupportedLanguage {
    return this.options.language as any;
  }
  public set CurrentLanguage(lang: SupportedLanguage) {
    this.options.language = lang;
    this.ChangeLang(lang);
  }
  constructor(private ApiUrl: string, private options: YanaSdkInitOptions) {
    options.language = options.language || 'EN';
    this.init();
  }
  private async init() {
    this.io = ConnectToRemoteSocket(this.ApiUrl, {
      auth: Object.assign(
        {
          applicationId: this.options.applicationId,
          lang: this.CurrentLanguage,
          source: this.options.source,
        },
        this.GetAuthentication()
      ),
      transports: ['websocket'],
    });
    this.io
      .on('connect', () => {
        this.ResponseSubject.next({ event: 'connect' });
        // this.ChangeLang(this.options.language as any);
      })
      .on('auth_change', (a) => {
        localStorage.setItem('yana_exchange_auth', JSON.stringify(a));
      })
      .on('disconnect', () => {
        this.ResponseSubject.next({ event: 'disconnect' });
        this.io.close();
        this.io.disconnect();
        this.init();
      });
    this.io.onAny((event, data) => {
      this.ResponseSubject.next({ event, data });
    });
  }
  private ChangeLang(lang: SupportedLanguage) {
    this.SendMessagesServer('lang-change', {
      'lang-change': {
        lang,
      },
    });
  }
  private SendMessagesServer(
    type: TypesForSendingRequestToSever,
    data: ExtraDataForSendingRequestToSever
  ) {
    this.io.send({ type, data });
  }
  private GetAuthentication() {
    const a = localStorage.getItem('yana_exchange_auth');
    return a === null ? {} : JSON.parse(a);
  }

  /**
   *
   * @param follow_up_key Selected Followup Key From result
   * @param follow_up_value Selected Followup Value From Result
   */
  MakeFollowupReq(follow_up_key: string, follow_up_value: string) {
    this.SendMessagesServer('follow-up', {
      'follow-up': {
        follow_up_key,
        follow_up_value,
      },
    });
  }
  /**
   * API ID 9 Calling Device Sync
   */
  CallDeviceSync(): Promise<ServerResponseData<'device-sync'>> {
    this.SendMessagesServer('device-sync', {});
    return firstValueFrom(
      this.ResponseSubject.pipe(
        filter((a) => a.event === 'device-sync'),
        map((a) => a.data)
      )
    );
  }
  /**
   * Get Option To show to user whem they dislike any messages
   */
  GetDisLikeOptions(): Promise<ServerResponseData<'get-dislike-options'>> {
    this.SendMessagesServer('get-dislike-options', {});
    return firstValueFrom(
      this.ResponseSubject.pipe(
        filter((a) => a.event === 'get-dislike-options'),
        map((a) => a.data)
      )
    );
  }
  /**
   *
   * @param reqData ClientToServerReqData Params Require To Like Or Dislike Any Messages
   * @returns void
   */
  SendLikeDislikeForMessage(
    reqData: ClientToServerReqData<'like-dislike'>
  ): Promise<ServerResponseData<'like-dislike'>> {
    this.SendMessagesServer('like-dislike', {
      'like-dislike': {
        likeOrDislike: reqData.likeOrDislike === true ? '1' : '2',
        messageId: reqData.messageId,
        reasonsSelected: reqData.reasonsSelected,
      },
    });
    return firstValueFrom(
      this.ResponseSubject.pipe(
        filter((a) => a.event === 'like-dislike'),
        map((a) => a.data)
      )
    );
  }
  /**
   *
   * @param message string Text Message To Send To Server
   */
  SendTextMessage(
    message: string,
    additionalInputs: SendTextMessageAdditionalInput = {}
  ) {
    this.SendMessagesServer('send-message', {
      'send-message': {
        message,
        extra: additionalInputs,
      },
    });
  }
  /**
   * @param reqType
   * @param reqData
   */

  SendMessage<T extends ClientToServerReq>(
    reqType: ClientToServerReq,
    reqData: ClientToServerReqData<T>
  ) {
    if (reqType === 'like-dislike') {
      const d = reqData as LikeDisLikeOfMessageToServer;
      this.SendMessagesServer('like-dislike', {
        'like-dislike': {
          likeOrDislike: d.likeOrDislike === true ? '1' : '2',
          messageId: d.messageId,
          reasonsSelected: d.reasonsSelected,
        },
      });
    } else if (reqType === 'send-message') {
      const d = reqData as SendMessageToServerReq;
      this.SendMessagesServer('send-message', {
        'send-message': d,
      });
    }
  }
  GetChatHistory(
    req: ChatHistoruReq
  ): Promise<ChatHistoryUncheckedCreateInput[]> {
    if (req.get_all === false && (!req.limit || !req.stream)) {
      throw new Error('Please Pass Stream with Limit OR Get ALL True');
    }
    this.SendMessagesServer('chat-history', {
      'chat-history': req,
    });
    return firstValueFrom(
      this.ResponseSubject.pipe(
        filter((a) => a.event === 'chat-history'),
        map((a) => a.data)
      )
    );
  }
  /**
   * @param event_name :'lang-chang' | 'connect'|'disconnect'
   * @returns Observable And Can Call Subscribe method to add listener
   */
  on<T extends ServerRespoEvents>(
    event_name: ServerRespoEvents
  ): Observable<ServerResponseData<T>> {
    return this.ResponseSubject.pipe(
      filter((a) => a.event === event_name),
      map((a) => a.data)
    );
  }
}
