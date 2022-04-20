/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component } from '@angular/core';
import { InitSdk } from '@yana-exchange/frontend-sdk';
declare const window: any;
@Component({
  selector: 'yana-exchange-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor() {
    const yanaexchangeObj = InitSdk('http://localhost:3101/users', {
      name: 'Keyur shah',
      language: 'EN',
      applicationId: '83',
      source: 'webapp',
    });
    window.yanaexchangeObj = yanaexchangeObj;
    yanaexchangeObj.on('connect').subscribe(() => {
      console.log('asihdiasodhoihasdho');
    });
    yanaexchangeObj
      .GetChatHistory({
        order_by_time: 'desc',
        get_all: true,
      })
      .then(console.log);
    yanaexchangeObj.on('NewMessage').subscribe(console.log);
  }
}
