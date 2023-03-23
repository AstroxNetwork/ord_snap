import { OrdWallet } from '../wallet';
import { OrdTransaction, UnspentOutput } from './OrdTransaction';
import { OrdUnspendOutput, UTXO_DUST } from './OrdUnspendOutput';
import * as bitcoin from 'bitcoinjs-lib';
import ecc from '@bitcoinerlab/secp256k1';
import { satoshisToAmount } from './helpers';
bitcoin.initEccLib(ecc);

export async function createSendBTC({
  utxos,
  toAddress,
  toAmount,
  wallet,
  network,
  changeAddress,
  force,
  feeRate,
  pubkey,
}: {
  utxos: UnspentOutput[];
  toAddress: string;
  toAmount: number;
  wallet: OrdWallet;
  network: bitcoin.Network;
  changeAddress: string;
  force?: boolean;
  feeRate?: number;
  pubkey: string;
}) {
  const tx = new OrdTransaction(wallet, network, pubkey, feeRate);
  tx.setChangeAddress(changeAddress);

  const nonOrdUtxos: UnspentOutput[] = [];
  const ordUtxos: UnspentOutput[] = [];
  utxos.forEach(v => {
    if (v.ords.length > 0) {
      ordUtxos.push(v);
    } else {
      nonOrdUtxos.push(v);
    }
  });

  nonOrdUtxos.forEach(v => {
    tx.addInput(v);
  });

  tx.addOutput(toAddress, toAmount);

  if (nonOrdUtxos.length === 0) {
    throw new Error('Balance not enough');
  }

  if (force) {
    const unspent = tx.getUnspent();
    if (unspent >= UTXO_DUST) {
      tx.addChangeOutput(unspent);
    }

    const networkFee = await tx.calNetworkFee();
    const output = tx.outputs.find(v => v.address === toAddress);
    if (output.value < networkFee) {
      throw new Error(`Balance not enough. Need ${satoshisToAmount(networkFee)} BTC as network fee`);
    }
    output.value -= networkFee;
  } else {
    const unspent = tx.getUnspent();
    if (unspent === 0) {
      throw new Error('Balance not enough to pay network fee.');
    }

    // add dummy output
    tx.addChangeOutput(1);

    const networkFee = await tx.calNetworkFee();
    if (unspent < networkFee) {
      throw new Error(`Balance not enough. Need ${satoshisToAmount(networkFee)} BTC as network fee, but only ${satoshisToAmount(unspent)} BTC.`);
    }

    const leftAmount = unspent - networkFee;
    if (leftAmount >= UTXO_DUST) {
      // change dummy output to true output
      tx.getChangeOutput().value = leftAmount;
    } else {
      // remove dummy output
      tx.removeChangeOutput();
    }
  }

  const psbt = await tx.createSignedPsbt();
  // tx.dumpTx(psbt);

  return psbt;
}

export async function createSendOrd({
  utxos,
  toAddress,
  toOrdId,
  wallet,
  network,
  changeAddress,
  pubkey,
  feeRate,
  outputValue,
}: {
  utxos: UnspentOutput[];
  toAddress: string;
  toOrdId: string;
  wallet: OrdWallet;
  network: bitcoin.Network;
  changeAddress: string;
  pubkey: string;
  feeRate?: number;
  outputValue: number;
}) {
  const tx = new OrdTransaction(wallet, network, pubkey, feeRate);
  tx.setChangeAddress(changeAddress);

  const nonOrdUtxos: UnspentOutput[] = [];
  const ordUtxos: UnspentOutput[] = [];
  utxos.forEach(v => {
    if (v.ords.length > 0) {
      ordUtxos.push(v);
    } else {
      nonOrdUtxos.push(v);
    }
  });

  // find NFT
  let found = false;

  for (let i = 0; i < ordUtxos.length; i++) {
    const ordUtxo = ordUtxos[i];
    if (ordUtxo.ords.find(v => v.id == toOrdId)) {
      if (ordUtxo.ords.length > 1) {
        throw new Error('Multiple inscriptions! Please split them first.');
      }
      tx.addInput(ordUtxo);
      tx.addOutput(toAddress, ordUtxo.satoshis);
      found = true;
      break;
    }
  }

  if (!found) {
    throw new Error('inscription not found.');
  }

  // format NFT

  tx.outputs[0].value = outputValue;

  nonOrdUtxos.forEach(v => {
    tx.addInput(v);
  });

  const unspent = tx.getUnspent();
  if (unspent == 0) {
    throw new Error('Balance not enough to pay network fee.');
  }

  // add dummy output
  tx.addChangeOutput(1);

  const networkFee = await tx.calNetworkFee();
  if (unspent < networkFee) {
    throw new Error(`Balance not enough. Need ${satoshisToAmount(networkFee)} BTC as network fee, but only ${satoshisToAmount(unspent)} BTC.`);
  }

  const leftAmount = unspent - networkFee;
  if (leftAmount >= UTXO_DUST) {
    // change dummy output to true output
    tx.getChangeOutput().value = leftAmount;
  } else {
    // remove dummy output
    tx.removeChangeOutput();
  }

  const psbt = await tx.createSignedPsbt();
  // tx.dumpTx(psbt);

  return psbt;
}
