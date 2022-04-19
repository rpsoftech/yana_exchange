import { Component } from '@angular/core';
import { InitSdk } from '@yana-exchange/frontend-sdk';

@Component({
  selector: 'yana-exchange-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor() {
    const b = InitSdk('http://localhost:3101/users', {
      name: 'Keyur shah',
      language: 'EN',
    });
    b.on('connect').subscribe(() => {
      console.log('asihdiasodhoihasdho');
    });
    b.GetChatHistory({
      get_all:true
    }).then(console.log);
    b.on('NewMessage').subscribe(console.log);
    setTimeout(() => {
      b.CurrentLanguage = 'EN';
      b.SendMessage('send-message', {
        message: 'HEEEEELLLOOOO',
      });
    }, 5000);
  }
}
