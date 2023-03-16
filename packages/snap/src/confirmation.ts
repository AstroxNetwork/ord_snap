import { SnapMethods, Wallet } from '@astrox/ord-snap-types';

type ConfirmationDialogContent = {
  prompt: string;
  description?: string;
  textAreaContent?: string;
};

export async function showConfirmationDialog(wallet: Wallet, message: ConfirmationDialogContent): Promise<boolean> {
  return (await wallet.request({
    method: SnapMethods.confirm,
    params: [message],
  })) as boolean;
}
