import { FeeSummary, InscriptionSummary, Inscription, UTXO, TxHistoryItem, AppSummary, BitcoinBalance } from '../constant/types';

import { HttpClient } from './http';

enum API_STATUS {
  FAILED = 0,
  SUCCESS = 1,
}

export class ApiService {
  private httpClient: HttpClient;
  constructor() {
    this.httpClient = new HttpClient();
  }

  async getWalletConfig(): Promise<any> {
    const data = await this.httpClient.httpGet('/v1/wallet/config', {});
    if (data.status == API_STATUS.FAILED) {
      throw new Error(await data.json());
    }
    return await data.json();
  }

  async getAddressBalance(address: string): Promise<BitcoinBalance> {
    const data = await this.httpClient.httpGet('/v2/address/balance', {
      address,
    });
    if (data.status == API_STATUS.FAILED) {
      throw new Error(await data.json());
    }
    return (await data.json()) as BitcoinBalance;
  }

  async getMultiAddressBalance(addresses: string): Promise<BitcoinBalance> {
    const data = await this.httpClient.httpGet('/v2/address/multi-balance', {
      addresses,
    });
    if (data.status == API_STATUS.FAILED) {
      throw new Error(await data.json());
    }
    return (await data.json()) as BitcoinBalance;
  }

  async getAddressUtxo(address: string): Promise<UTXO[]> {
    const data = await this.httpClient.httpGet('/v2/address/utxo', {
      address,
    });
    if (data.status == API_STATUS.FAILED) {
      throw new Error(await data.json());
    }
    return (await data.json()) as UTXO[];
  }

  async getAddressInscriptions(address: string): Promise<Inscription[]> {
    const data = await this.httpClient.httpGet('/v2/address/inscriptions', {
      address,
    });
    if (data.status == API_STATUS.FAILED) {
      throw new Error(await data.json());
    }
    return (await data.json()) as Inscription[];
  }

  async getAddressRecentHistory(address: string): Promise<TxHistoryItem[]> {
    const data = await this.httpClient.httpGet('/v1/address/recent-history', {
      address,
    });
    if (data.status == API_STATUS.FAILED) {
      throw new Error(await data.json());
    }
    return (await data.json()) as TxHistoryItem[];
  }

  async getInscriptionSummary(): Promise<InscriptionSummary> {
    const data = await this.httpClient.httpGet('/v1/inscription-summary', {});
    if (data.status == API_STATUS.FAILED) {
      throw new Error(await data.json());
    }
    return (await data.json()) as InscriptionSummary;
  }

  async getAppSummary(): Promise<AppSummary> {
    const data = await this.httpClient.httpGet('/v1/app-summary', {});
    if (data.status == API_STATUS.FAILED) {
      throw new Error(await data.json());
    }
    return (await data.json()) as AppSummary;
  }

  async pushTx(rawtx: string): Promise<string> {
    const data = await this.httpClient.httpPost('/v1/tx/broadcast', {
      rawtx,
    });
    if (data.status == API_STATUS.FAILED) {
      throw new Error(await data.json());
    }
    return JSON.stringify(await data.json()) as string;
  }

  async getFeeSummary(): Promise<FeeSummary> {
    const data = await this.httpClient.httpGet('/v1/fee-summary', {});
    if (data.status == API_STATUS.FAILED) {
      throw new Error(await data.json());
    }
    return (await data.json()) as FeeSummary;
  }

  async getDomainInfo(domain: string) {
    const data = await this.httpClient.httpGet('/v1/address/search', { domain });
    if (data.status == API_STATUS.FAILED) {
      throw new Error(await data.json());
    }
    return await data.json();
  }
}
