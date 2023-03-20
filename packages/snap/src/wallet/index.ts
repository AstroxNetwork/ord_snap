/* eslint-disable indent */
import * as bitcoin from 'bitcoinjs-lib';
import { address as PsbtAddress } from 'bitcoinjs-lib';
import { HttpService } from '../api/service';
import { Accounts, OrdKeyring, toXOnly } from '../keyRing/keyring';

import { AddressType, BitcoinBalance, Inscription, NetworkType, ToSignInput, TxHistoryItem, UTXO } from '../constant/types';
import { COIN_NAME, COIN_SYMBOL, KEYRING_TYPE, NETWORK_TYPES } from '../constant/constant';
import { toPsbtNetwork, validator } from '../snap/util';
import { createSendBTC } from '../ord/ord';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { HttpAgentOptions } from '../api/http';
import { OrdTransaction } from '../ord/OrdTransaction';

export type AccountAsset = {
  name: string;
  symbol: string;
  amount: string;
  value: string;
};

export class OrdWallet {
  constructor(public keyRing: OrdKeyring, public httpService: HttpService) {}

  static async fromStorage(snap: SnapsGlobalObject) {
    const http = await HttpService.fromStorage(snap);
    const kr = await OrdKeyring.fromStorage(snap);
    const wallet = new OrdWallet(kr, http);
    return wallet;
  }

  async saveWallet() {
    await this.httpService.saveHttpService();
    await this.keyRing.saveWallets();
  }

  getAddressBalance = async (address: string): Promise<BitcoinBalance> => {
    const data = await this.httpService.getAddressBalance(address);
    return data;
  };

  getMultiAddressBalance = async (addresses: string): Promise<BitcoinBalance[]> => {
    return this.httpService.getMultiAddressBalance(addresses);
  };

  getAddressInscriptions = async (address: string): Promise<Inscription[]> => {
    const data = await this.httpService.getAddressInscriptions(address);
    return data;
  };

  getAccountsCount = (): number => {
    const accounts = this.keyRing.getAccounts();
    return accounts.filter(x => x).length;
  };

  getAccounts = (): Accounts[] => {
    return this.keyRing.getAccounts();
  };

  signTransaction = async (type: string, from: string, psbt: bitcoin.Psbt, inputs: ToSignInput[]): Promise<bitcoin.Psbt> => {
    return this.keyRing.signTransaction(psbt, inputs);
  };

  signPsbt = (psbt: bitcoin.Psbt): bitcoin.Psbt => {
    const account = this.keyRing.getCurrentAccount();
    if (!account) throw new Error('no current account');

    const networkType = this.getNetworkType();
    const psbtNetwork = toPsbtNetwork(networkType);

    const toSignInputs: ToSignInput[] = [];
    psbt.data.inputs.forEach((v, index) => {
      let script: any = null;
      let value = 0;
      if (v.witnessUtxo) {
        script = v.witnessUtxo.script;
        value = v.witnessUtxo.value;
      } else if (v.nonWitnessUtxo) {
        const tx = bitcoin.Transaction.fromBuffer(v.nonWitnessUtxo);
        const output = tx.outs[psbt.txInputs[index].index];
        script = output.script;
        value = output.value;
      }
      const isSigned = v.finalScriptSig || v.finalScriptWitness;
      if (script && !isSigned) {
        const address = PsbtAddress.fromOutputScript(script, psbtNetwork);
        if (account.address === address) {
          toSignInputs.push({
            index,
            publicKey: account.pair.publicKey.toString('hex'),
            sighashTypes: v.sighashType ? [v.sighashType] : undefined,
          });
          if (account.addressType === AddressType.P2TR && !v.tapInternalKey) {
            v.tapInternalKey = toXOnly(account.pair.publicKey);
          }
        }
      }
    });

    psbt = this.keyRing.signTransaction(psbt, toSignInputs);
    toSignInputs.forEach(v => {
      psbt.validateSignaturesOfInput(v.index, validator);
      psbt.finalizeInput(v.index);
    });
    return psbt;
  };

  signMessage = (text: string): string => {
    const account = this.keyRing.getCurrentAccount();
    return this.keyRing.signMessage(account.pair.publicKey.toString('hex'), text);
  };

  getTransactionHistory = async (address: string): Promise<TxHistoryItem[]> => {
    const result = await this.httpService.getAddressRecentHistory(address);
    return result;
  };

  listChainAssets = async (pubkeyAddress: string): Promise<AccountAsset[]> => {
    const balance = await this.httpService.getAddressBalance(pubkeyAddress);
    const assets: AccountAsset[] = [{ name: COIN_NAME, symbol: COIN_SYMBOL, amount: balance.amount, value: balance.usd_value }];
    return assets;
  };

  reportErrors = (error: string) => {
    console.error('report not implemented');
  };

  getNetworkType = (): NetworkType => {
    const networkType = this.keyRing.getNetworkType();
    return networkType;
  };

  getNetworkName = () => {
    const networkType = this.keyRing.getNetworkType();
    return NETWORK_TYPES[networkType].name;
  };

  sendBTC = async ({
    to,
    amount,
    utxos,
    autoAdjust,
    feeRate,
  }: {
    to: string;
    amount: number;
    utxos: UTXO[];
    autoAdjust: boolean;
    feeRate: number;
  }) => {
    const account = this.keyRing.getCurrentAccount();
    if (!account) throw new Error('no current account');

    const networkType = this.getNetworkType();
    const psbtNetwork = toPsbtNetwork(networkType);

    const psbt = await createSendBTC({
      utxos: utxos.map(v => {
        return {
          txId: v.txId,
          outputIndex: v.outputIndex,
          satoshis: v.satoshis,
          scriptPk: v.scriptPk,
          addressType: v.addressType,
          address: account.address,
          ords: v.inscriptions,
        };
      }),
      toAddress: to,
      toAmount: amount,
      wallet: this,
      network: psbtNetwork,
      changeAddress: account.address,
      force: autoAdjust,
      pubkey: account.pair.publicKey.toString('hex'),
      feeRate,
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    psbt.__CACHE.__UNSAFE_SIGN_NONSEGWIT = false;
    return psbt.toHex();
  };

  pushTx = async (rawtx: string) => {
    const txid = await this.httpService.pushTx(rawtx);
    return txid;
  };

  queryDomainInfo = async (domain: string) => {
    const data = await this.httpService.getDomainInfo(domain);
    return data;
  };

  getInscriptionSummary = async () => {
    const data = await this.httpService.getInscriptionSummary();
    return data;
  };

  getAppSummary = async () => {
    const data = await this.httpService.getAppSummary();
    return data;
  };

  getAddressUtxo = async (address: string) => {
    const data = await this.httpService.getAddressUtxo(address);
    return data;
  };

  getFeeSummary = async () => {
    const result = await this.httpService.getFeeSummary();
    return result;
  };
}
