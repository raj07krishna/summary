import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LivePriceService {

  constructor(private http: HttpClient) { }

  getCryptoLivePrice(){
   return this.http.get('https://api.coindcx.com/exchange/ticker', {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Origin, Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token, locale',
      'Access-Control-Allow-Methods': 'GET, POST',
    }
   })
  }
}
