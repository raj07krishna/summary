import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { LivePriceService } from '../../services/live-price.service';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';

type AOA = any[][];

@Component({
  selector: 'app-crypto-summary',
  templateUrl: './crypto-summary.component.html',
  styleUrls: ['./crypto-summary.component.scss'],
})
export class CryptoSummaryComponent implements OnInit, AfterViewInit {
  data: AOA = [[], []];
  liveData: any;
  isLiveDataAvailable = false;
  dataSourceForAvaialble: MatTableDataSource<any> =
    new MatTableDataSource<any>();
  dataSourceForUnavaialble: MatTableDataSource<any> =
    new MatTableDataSource<any>();
  dataSourceArray: any = [];
  displayedColumns: string[] = [];
  isDataAvailable = false;
  cryptoMap = new Map();
  currentValue: number = 0;
  investedvalue: number = 0;
  @ViewChild(MatSort) sort!: MatSort;
  formattedCurrentValue = '';
  formattedInvestedvalue = '';
  unavailableCurrentValue: number = 0;
  unavailableInvestedvalue: number = 0;
  unavailableFormattedCurrentValue = '';
  unavailableFormattedInvestedvalue = '';
  url = 'assets/json/data.json';
  alltimehighUrl = 'assets/json/alltimehigh.json'
  allTimeHighMap=new Map();
  TotalProfitPossible = 0;
  formattedTotalProfitPossible = ''

  constructor(private livePrice: LivePriceService, private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get(this.alltimehighUrl).subscribe((jsonData) => {
      this.allTimeHighMap = new Map(Object.entries(jsonData));
      this.processJsonData();
    })
  }

  ngAfterViewInit() {
    this.dataSourceForAvaialble.sort = this.sort;
  }

  async getLatestLiveData() {
    let livePriceData = await this.livePrice.getCryptoLivePrice().toPromise();
    livePriceData = this.processLivePriceData(livePriceData);
    console.log(livePriceData);
    this.liveData = livePriceData;
    this.isLiveDataAvailable = true;
  }

  processLivePriceData(livePriceData:any) {
    let liveData:any = {};
    livePriceData.forEach((item:any) => {
      let key = item.market.toLowerCase();
      liveData[key]=item;
    })
    return liveData;
  }

  processJsonData() {
    this.dataSourceForAvaialble = new MatTableDataSource<any>();
    this.displayedColumns = [];
    this.http.get(this.url).subscribe((jsonData: any) => {
      this.data = jsonData;
      console.log(this.data);
      // this.withDrawlData = <AOA>(XLSX.utils.sheet_to_json(wsWithdrawl, { header: 1 }));
      this.isDataAvailable = true;
      this.displayedColumns = [];
      this.displayedColumns.push('coin');
      this.displayedColumns.push('averagePrice');
      this.displayedColumns.push('totalPrice');
      this.displayedColumns.push('allTimeHighPrice');
      this.displayedColumns.push('currentPrice');
      this.displayedColumns.push('currentValue');
      this.displayedColumns.push('profitOrLossValue');
      this.displayedColumns.push('profitPercentage');
      this.displayedColumns.push('maxProfitPossible');
      this.displayedColumns.push('maxProfitPossiblePercentage');

      Object.values(this.data).forEach((value: any) => {
        let obj = Object.create({});
        console.log(Array.isArray(value));
        if (value['volume'] > 0) {
          obj['coin'] = value['coin'];
          obj['volume'] = value['volume'];
          obj['averagePrice'] = value['averagePrice'];
          obj['totalPrice'] = value['totalPrice'];
          obj['currentPrice'] = 0;
          obj['currentValue'] = 0;
          obj['profitOrLossValue'] = 0;
          obj['isProfitable'] = false;
          obj['profitPercentage'] = 0;
          this.cryptoMap.set(obj['coin'], obj);
          if(this.allTimeHighMap.has(value['coin'])) {
            obj['allTimeHighPrice'] = this.allTimeHighMap.get(value['coin']).allTimeHigh;
            obj['maxProfitPossible'] = obj['allTimeHighPrice'] * value['volume'] - value['totalPrice'];
            obj['maxProfitPossiblePercentage'] =  Math.floor(((obj['maxProfitPossible'])/value['totalPrice']) * 100)
          }
          this.dataSourceArray.push(obj);
        }
      });
      console.log(Object.fromEntries(this.cryptoMap));
      this.refresh();
    });
  }

  async refresh() {
    this.currentValue = 0;
    this.investedvalue = 0;
    await this.getLatestLiveData();
    this.dataSourceArray.forEach((row: any) => {
      let symbol = row.coin.toLowerCase();
      if (this.liveData[symbol]) {
        let currentPrice = Number(
          parseFloat(this.liveData[symbol]?.last_price).toFixed(8)
        );
        let currentValue = currentPrice * row.volume;
        row.currentPrice = currentPrice;
        if(currentPrice > row['allTimeHighPrice'] ) {
          row['allTimeHighPrice'] = currentPrice;
          row['maxProfitPossible'] = (row['allTimeHighPrice'] * row['volume']) - row['totalPrice'];
          row['maxProfitPossiblePercentage'] =  Math.floor((row['maxProfitPossible']/row['totalPrice']) * 100)
        }
        row.currentValue = currentValue;
        row.profitOrLossValue = currentValue - row.totalPrice;
        if (row.profitOrLossValue > 0) row.isProfitable = true;
        row.profitPercentage = (row.profitOrLossValue / row.totalPrice) * 100;
        this.currentValue += row.currentValue;
        this.investedvalue += row.totalPrice;
        this.TotalProfitPossible +=row.maxProfitPossible;
        this.dataSourceForAvaialble.data.push(row);
        this.applyIndianCurrencyFormatter(row);
      } else {
        this.unavailableCurrentValue += row.currentValue;
        this.unavailableInvestedvalue += row.totalPrice;
        this.applyIndianCurrencyFormatter(row);
        this.dataSourceForUnavaialble.data.push(row);
      }
      this.dataSourceForAvaialble.sort = this.sort;
      this.dataSourceForUnavaialble.sort = this.sort;
    });
    this.formattedCurrentValue = Number(this.currentValue).toLocaleString(
      'en-IN',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        style: 'currency',
        currency: 'INR',
      }
    );
    this.formattedInvestedvalue = Number(this.investedvalue).toLocaleString(
      'en-IN',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        style: 'currency',
        currency: 'INR',
      }
    );
    this.unavailableFormattedCurrentValue = Number(
      this.unavailableCurrentValue
    ).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      style: 'currency',
      currency: 'INR',
    });
    this.unavailableFormattedInvestedvalue = Number(
      this.unavailableInvestedvalue
    ).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      style: 'currency',
      currency: 'INR',
    });
    this.formattedTotalProfitPossible = Number(
      this.TotalProfitPossible
    ).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      style: 'currency',
      currency: 'INR',
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceForAvaialble.filter = filterValue.trim().toLowerCase();

    if (this.dataSourceForAvaialble.paginator) {
      this.dataSourceForAvaialble.paginator.firstPage();
    }
  }

  applyIndianCurrencyFormatter(obj: any) {
    obj['formattedVolume'] = Number(obj['volume']).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
      style: 'currency',
      currency: 'INR',
    });
    obj['formattedAveragePrice'] = Number(obj['averagePrice']).toLocaleString(
      'en-IN',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
        style: 'currency',
        currency: 'INR',
      }
    );
    obj['formattedTotalPrice'] = Number(obj['totalPrice']).toLocaleString(
      'en-IN',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
        style: 'currency',
        currency: 'INR',
      }
    );
    obj['formattedCurrentPrice'] = Number(obj['currentPrice']).toLocaleString(
      'en-IN',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
        style: 'currency',
        currency: 'INR',
      }
    );
    obj['formattedCurrentValue'] = Number(obj['currentValue']).toLocaleString(
      'en-IN',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
        style: 'currency',
        currency: 'INR',
      }
    );
    obj['formattedProfitOrLossValue'] = Number(
      obj['profitOrLossValue']
    ).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
      style: 'currency',
      currency: 'INR',
    });
    obj['maxProfitPossible'] = Number(
      obj['maxProfitPossible']
    ).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
      style: 'currency',
      currency: 'INR',
    });
  }
}
