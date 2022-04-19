import {
  ChatHistoruReq,
  ChatHistoryUncheckedCreateInput,
  ClientToServerReq,
  ClientToServerReqData,
  ExtraDataForSendingRequestToSever,
  LikeDisLikeOfMessageToServer,
  SendMessageToServerReq,
  ServerRespoEvents,
  ServerResponseData,
  SupportedLanguage,
  TypesForSendingRequestToSever,
  YanaSdkInitOptions,
} from '@yana-exhchange/interface';
import { Socket, io as ConnectToRemoteSocket } from 'socket.io-client';
import {
  filter,
  firstValueFrom,
  map,
  Observable,
  raceWith,
  Subject,
} from 'rxjs';
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
          lang: this.CurrentLanguage,
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
