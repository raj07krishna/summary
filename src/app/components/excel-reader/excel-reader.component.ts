import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { LivePriceService } from '../../services/live-price.service';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

type AOA = any[][];
@Component({
  selector: 'app-excel-reader',
  templateUrl: './excel-reader.component.html',
  styleUrls: ['./excel-reader.component.scss'],
})
export class ExcelReaderComponent implements OnInit, AfterViewInit {
  data: AOA = [[], []];
  wopts: XLSX.WritingOptions = { bookType: 'xlsx', type: 'array' };
  fileName: string = 'SheetJS.xlsx';
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
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  formattedCurrentValue = '';
  formattedInvestedvalue = '';
  unavailableCurrentValue: number = 0;
  unavailableInvestedvalue: number = 0;
  unavailableFormattedCurrentValue = '';
  unavailableFormattedInvestedvalue = '';

  constructor(private livePrice: LivePriceService) {}

  ngOnInit(): void {
    // this.getLatestLiveData()
  }

  ngAfterViewInit() {
    this.dataSourceForAvaialble.paginator = this.paginator;
    this.dataSourceForAvaialble.sort = this.sort;
  }

  async getLatestLiveData() {
    let livePriceData = await this.livePrice.getCryptoLivePrice().toPromise();
    console.log(livePriceData);
    this.liveData = livePriceData;
    this.isLiveDataAvailable = true;
  }

  onFileChange(evt: any) {
    this.dataSourceForAvaialble = new MatTableDataSource<any>();
    this.displayedColumns = [];
    /* wire up file reader */
    const target: DataTransfer = <DataTransfer>evt.target;
    if (target.files.length !== 1) throw new Error('Cannot use multiple files');
    const reader: FileReader = new FileReader();
    reader.readAsArrayBuffer(target.files[0]);
    reader.onload = (e: any) => {
      /* read workbook */
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

      /* grab first sheet */
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      /* save data */
      this.data = <AOA>XLSX.utils.sheet_to_json(ws, { header: 1 });
      console.log(this.data);
      // this.withDrawlData = <AOA>(XLSX.utils.sheet_to_json(wsWithdrawl, { header: 1 }));
      this.isDataAvailable = true;
      let key = '';
      for (let i = 0; i < this.data.length; i++) {
        let obj = Object.create({});
        if (i === 0) {
          this.displayedColumns = [];
          this.displayedColumns.push('coin');
          this.displayedColumns.push('volume');
          this.displayedColumns.push('averagePrice');
          this.displayedColumns.push('totalPrice');
          this.displayedColumns.push('currentPrice');
          this.displayedColumns.push('currentValue');
          this.displayedColumns.push('profitOrLossValue');
          this.displayedColumns.push('profitPercentage');
        } else {
          this.data[i];
          if (this.data[i][0] && this.data[i][0].length) {
            key = `${this.data[i][0]}INR`;
            obj['coin'] = key;
          }
          if (this.data[i][1] === 'All' && this.data[i][2] === 'All' && key && this.data[i][3] > 0) {
            obj['volume'] = this.data[i][3];
            obj['averagePrice'] = this.data[i][4];
            obj['totalPrice'] = this.data[i][5];
            obj['coin'] = key;
            key = '';
            obj['currentPrice'] = 0;
            obj['currentValue'] = 0;
            obj['profitOrLossValue'] = 0;
            obj['isProfitable'] = false;
            obj['profitPercentage'] = 0;
            this.cryptoMap.set(obj['coin'], obj);
            this.dataSourceArray.push(obj);
          }
        }
      }
      console.log(Object.fromEntries(this.cryptoMap));
      this.refresh();
    };
  }

  async refresh() {
    this.currentValue = 0;
    this.investedvalue = 0;
    await this.getLatestLiveData();
    this.dataSourceArray.forEach((row: any) => {
      let symbol = row.coin.toLowerCase();
      if (this.liveData[symbol]) {
        let currentPrice = Number(
          parseFloat(this.liveData[symbol]?.last).toFixed(8)
        );
        let currentValue = currentPrice * row.volume;
        row.currentPrice = currentPrice;
        row.currentValue = currentValue;
        row.profitOrLossValue = currentValue - row.totalPrice;
        if (row.profitOrLossValue > 0) row.isProfitable = true;
        row.profitPercentage = (row.profitOrLossValue / row.totalPrice) * 100;
        this.currentValue += row.currentValue;
        this.investedvalue += row.totalPrice;
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
  }
}
