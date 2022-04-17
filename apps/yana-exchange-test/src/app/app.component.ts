import { Component } from '@angular/core';
import { InitSdk } from '@yana-exchange/frontend-sdk';

@Component({
  selector: 'yana-exchange-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor() {
    InitSdk('http://localhost:3101/users', {
      name: 'Keyur shah',
    });
  }
}
