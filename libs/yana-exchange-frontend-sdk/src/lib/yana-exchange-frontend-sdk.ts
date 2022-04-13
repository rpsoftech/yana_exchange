import { YanaSdkInitOptions } from '@yana-exhchange/interface';

/**
 * 
 * @param ApiUrl Connection Url to Connect to Yana Exchange
 * @param options 
 * @returns 
 */

export function InitSdk(ApiUrl: string, options: YanaSdkInitOptions):YanaExchange {
  return new YanaExchange(ApiUrl, options);
}

export class YanaExchange {

  constructor(private ApiUrl: string, private options: YanaSdkInitOptions) {}
  private init() {}
}
