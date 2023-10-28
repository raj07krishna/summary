import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LivePriceService {

  constructor(private http: HttpClient) { }

  getCryptoLivePrice(){
   return this.http.get('https://api.wazirx.com/api/v2/tickers')
  }
}
