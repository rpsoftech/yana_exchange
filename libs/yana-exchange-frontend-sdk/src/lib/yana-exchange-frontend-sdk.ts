import {
  ExtraDataForSendingRequestToSever,
  SupportedLanguage,
  TypesForSendingRequestToSever,
  YanaSdkInitOptions,
} from '@yana-exhchange/interface';
import { Socket, io as ConnectToRemoteSocket } from 'socket.io-client';

/**
 *
 * @param ApiUrl Connection Url to Connect to Yana Exchange
 * @param options
 * @returns
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
      auth: this.GetAuthentication(),
    });
    this.io
      .on('connect', () => {
        this.ChangeLang(this.options.language as any);
      })
      .on('auth_change', (a) =>
        localStorage.setItem('yana_exchange_auth', JSON.stringify(a))
      );
  }
  private ChangeLang(lang: SupportedLanguage) {
    this.SendMessages('lang-change', {
      'lang-change': {
        lang,
      },
    });
  }
  private SendMessages(
    type: TypesForSendingRequestToSever,
    data: ExtraDataForSendingRequestToSever
  ) {
    this.io.send({ type, data });
  }
  private GetAuthentication() {
    console.log('oahsdoaisjdo');
    
    const a = localStorage.getItem('yana_exchange_auth');
    return a === null ? {} : JSON.parse(a);
  }
}
