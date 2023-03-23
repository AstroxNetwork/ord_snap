/* eslint-disable indent */
import * as bitcoin from 'bitcoinjs-lib';
import { address as PsbtAddress } from 'bitcoinjs-lib';
import { HttpService } from '../api/service';
import { Accounts, OrdKeyring, toXOnly } from '../keyRing/keyring';

import { AddressType, BitcoinBalance, Inscription, NetworkType, ToSignInput, TxHistoryItem, UTXO, TXSendBTC } from '@astrox/ord-snap-types';
import { COIN_NAME, COIN_SYMBOL, KEYRING_TYPE, NETWORK_TYPES, TxType } from '@astrox/ord-snap-types';
import { toPsbtNetwork, validator } from '../snap/util';
import { createSendBTC, createSendOrd } from '../ord/ord';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { HttpAgentOptions } from '../api/http';
import { OrdTransaction } from '../ord/OrdTransaction';
import { showConfirmationDialog, showConfirmationDialogV2 } from '../snap/confirmation';
import { throwError } from '../snap/errors';

export type AccountAsset = {
  name: string;
  symbol: string;
  amount: string;
  value: string;
};

export class OrdWallet {
  constructor(private snap: SnapsGlobalObject, public keyRing: OrdKeyring, public httpService: HttpService) {}

  static async fromStorage(snap: SnapsGlobalObject) {
    const http = await HttpService.fromStorage(snap);
    const kr = await OrdKeyring.fromStorage(snap);
    const wallet = new OrdWallet(snap, kr, http);
    return wallet;
  }

  async saveWallet() {
    await this.httpService.saveHttpService();
    await this.keyRing.saveWallets();
  }

  getAddressBalance = async (address: string): Promise<BitcoinBalance> => {
    try {
      const data = await this.httpService.getAddressBalance(address);
      return data;
    } catch (error) {
      throwError({
        message: (error as Error).message,
        stack: 'Ord_getAddressBalance',
        code: 400,
      });
    }
  };

  getMultiAddressBalance = async (addresses: string): Promise<BitcoinBalance[]> => {
    try {
      return this.httpService.getMultiAddressBalance(addresses);
    } catch (error) {
      throwError({
        message: (error as Error).message,
        stack: 'Ord_getMultiAddressBalance',
        code: 400,
      });
    }
  };

  getAddressInscriptions = async (address: string): Promise<Inscription[]> => {
    try {
      const data = await this.httpService.getAddressInscriptions(address);
      return data;
    } catch (error) {
      throwError({
        message: (error as Error).message,
        stack: 'Ord_getAddressInscriptions',
        code: 400,
      });
    }
  };

  getAccountsCount = (): number => {
    try {
      const accounts = this.keyRing.getAccounts();
      return accounts.filter(x => x).length;
    } catch (error) {
      throwError({
        message: (error as Error).message,
        stack: 'Ord_getAccountsCount',
        code: 400,
      });
    }
  };

  getAccounts = (): Accounts[] => {
    try {
      return this.keyRing.getAccounts();
    } catch (error) {
      throwError({
        message: (error as Error).message,
        stack: 'Ord_getAccounts',
        code: 400,
      });
    }
  };

  signTransaction = async (type: string, from: string, psbt: bitcoin.Psbt, inputs: ToSignInput[]): Promise<bitcoin.Psbt> => {
    try {
      return this.keyRing.signTransaction(psbt, inputs);
    } catch (error) {
      throwError({
        message: (error as Error).message,
        stack: 'Ord_signTransaction',
        code: 400,
      });
    }
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

    let psbt2 = this.keyRing.signTransaction(psbt, toSignInputs);
    toSignInputs.forEach(v => {
      psbt2.validateSignaturesOfInput(v.index, validator);
      psbt2.finalizeInput(v.index);
    });

    return psbt2;
  };

  signMessage = (text: string): string => {
    try {
      const account = this.keyRing.getCurrentAccount();
      return this.keyRing.signMessage(account.pair.publicKey.toString('hex'), text);
    } catch (error) {
      throwError({
        message: (error as Error).message,
        stack: 'Ord_signMessage',
        code: 400,
      });
    }
  };

  getTransactionHistory = async (address: string): Promise<TxHistoryItem[]> => {
    try {
      const result = await this.httpService.getAddressRecentHistory(address);
      return result;
    } catch (error) {
      throwError({
        message: (error as Error).message,
        stack: 'Ord_getTransactionHistory',
        code: 400,
      });
    }
  };

  listChainAssets = async (pubkeyAddress: string): Promise<AccountAsset[]> => {
    try {
      const balance = await this.httpService.getAddressBalance(pubkeyAddress);
      const assets: AccountAsset[] = [{ name: COIN_NAME, symbol: COIN_SYMBOL, amount: balance.amount, value: balance.usd_value }];
      return assets;
    } catch (error) {
      throwError({
        message: (error as Error).message,
        stack: 'Ord_listChainAssets',
        code: 400,
      });
    }
  };

  reportErrors = (error: string) => {
    console.error('report not implemented');
  };

  getNetworkType = (): NetworkType => {
    try {
      const networkType = this.keyRing.getNetworkType();
      return networkType;
    } catch (error) {
      throwError({
        message: (error as Error).message,
        stack: 'Ord_getNetworkType',
        code: 400,
      });
    }
  };

  getNetworkName = () => {
    try {
      const networkType = this.keyRing.getNetworkType();
      return NETWORK_TYPES[networkType].name;
    } catch (error) {
      throwError({
        message: (error as Error).message,
        stack: 'Ord_getNetworkName',
        code: 400,
      });
    }
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
  }): Promise<TXSendBTC> => {
    const account = this.keyRing.getCurrentAccount();
    if (!account) throw new Error('no current account');

    const networkType = this.getNetworkType();
    const psbtNetwork = toPsbtNetwork(networkType);

    const dialog = await showConfirmationDialogV2(this.snap, {
      prompt: 'Confirm sending BTC',
      description: 'Confirm to sign transaction and send',
      texts: [`**to**:`, `copy:${to}`, `**amount**:`, `${amount}`, `**fee rate**:`, `${feeRate}`],
    });

    if (dialog) {
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
      const rawTx = psbt.extractTransaction().toHex();
      const txId = await this.pushTx(rawTx);
      return {
        txId,
        psbtHex: psbt.toHex(),
        rawTx,
        txType: TxType.SEND_BITCOIN,
      };
    } else {
      throwError({
        message: 'User Reject',
        stack: 'Ord_sendBTC',
        code: 401,
      });
    }
  };

  sendInscription = async ({
    to,
    inscriptionId,
    utxos,
    feeRate,
    outputValue,
  }: {
    to: string;
    inscriptionId: string;
    utxos: UTXO[];
    feeRate: number;
    outputValue: number;
  }): Promise<TXSendBTC> => {
    const account = this.keyRing.getCurrentAccount();
    if (!account) throw new Error('no current account');

    const networkType = this.getNetworkType();
    const psbtNetwork = toPsbtNetwork(networkType);

    const dialog = await showConfirmationDialogV2(this.snap, {
      prompt: 'Confirm sending BTC',
      description: 'Confirm to sign transaction and send',
      texts: [`**to**:`, `copy:${to}`, `**inscriptionId**:`, `${inscriptionId}`, `**fee rate**:`, `${feeRate}`],
    });
    if (dialog) {
      const psbt = await createSendOrd({
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
        toOrdId: inscriptionId,
        wallet: this,
        network: psbtNetwork,
        changeAddress: account.address,
        pubkey: account.pair.publicKey.toString('hex'),
        feeRate,
        outputValue,
      });
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      psbt.__CACHE.__UNSAFE_SIGN_NONSEGWIT = false;
      const rawTx = psbt.extractTransaction().toHex();
      const txId = await this.pushTx(rawTx);
      return {
        txId,
        psbtHex: psbt.toHex(),
        rawTx,
        txType: TxType.SEND_INSCRIPTION,
      };
    } else {
      throwError({
        message: 'User Reject',
        stack: 'Ord_sendInscription',
        code: 401,
      });
    }
  };

  pushTx = async (rawtx: string): Promise<string> => {
    try {
      const txid = await this.httpService.pushTx(rawtx);
      return txid as string;
    } catch (error) {
      throwError({
        message: (error as Error).message,
        stack: 'Ord_pushTx',
        code: 400,
      });
    }
  };

  queryDomainInfo = async (domain: string) => {
    try {
      const data = await this.httpService.getDomainInfo(domain);
      return data;
    } catch (error) {
      throwError({
        message: (error as Error).message,
        stack: 'Ord_queryDomainInfo',
        code: 400,
      });
    }
  };

  getInscriptionSummary = async () => {
    try {
      const data = await this.httpService.getInscriptionSummary();
      return data;
    } catch (error) {
      throwError({
        message: (error as Error).message,
        stack: 'Ord_getInscriptionSummary',
        code: 400,
      });
    }
  };

  getAppSummary = async () => {
    try {
      const data = await this.httpService.getAppSummary();
      return data;
    } catch (error) {
      throwError({
        message: (error as Error).message,
        stack: 'Ord_getAppSummary',
        code: 400,
      });
    }
  };

  getAddressUtxo = async (address: string) => {
    try {
      const data = await this.httpService.getAddressUtxo(address);
      return data;
    } catch (error) {
      throwError({
        message: (error as Error).message,
        stack: 'Ord_getAddressUtxo',
        code: 400,
      });
    }
  };

  getFeeSummary = async () => {
    try {
      const result = await this.httpService.getFeeSummary();
      return result;
    } catch (error) {
      throwError({
        message: (error as Error).message,
        stack: 'Ord_getFeeSummary',
        code: 400,
      });
    }
  };
}
