import { UnspentOutput } from './OrdTransaction';
import { OrdUnspendOutput } from './OrdUnspendOutput';
import BigNumber from 'bignumber.js';

/**
 * Get non-ord balance for spending
 * @param utxos
 * @returns
 */
export function getNonOrdBalance(utxos: UnspentOutput[]) {
  return utxos.map(v => new OrdUnspendOutput(v)).reduce((pre, cur) => pre + cur.getNonOrdSatoshis(), 0);
}

export function satoshisToAmount(val: number) {
  const num = new BigNumber(val);
  return num.dividedBy(100000000).toFixed(8);
}

export function amountToSaothis(val: any) {
  const num = new BigNumber(val);
  return num.multipliedBy(100000000).toNumber();
}
