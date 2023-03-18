import { SnapsGlobalObject } from '@metamask/snaps-types';
import { MetamaskState, SnapConfig, DataStorage } from '@astrox/ord-snap-types';

export abstract class BaseStorage {
  public nameSpace: string;
  public abstract getNameSpace(): string;
  public abstract getData<T>(): Promise<T>;
  public abstract setData<T>(data: T): Promise<boolean>;
}

export class StorageService implements BaseStorage {
  constructor(private snap: SnapsGlobalObject, public nameSpace: string) {}
  public getNameSpace(): string {
    return this.nameSpace;
  }

  private async _getState(): Promise<MetamaskState> {
    try {
      const persistedData = (await this.snap.request({
        method: 'snap_manageState',
        params: { operation: 'get' },
      })) as MetamaskState;
      return persistedData;
    } catch (error) {
      const err = {
        message: (error as Error).message,
        code: 5,
        stack: 'StorageService::_getState',
      };
      console.error(err);
      throw err;
    }
  }
  private async _getStorage(): Promise<DataStorage<any>> {
    try {
      const persistedData = await this._getState();
      return persistedData.storage;
    } catch (error) {
      const err = {
        message: (error as Error).message,
        code: 5,
        stack: 'StorageService::_getStorage',
      };
      console.error(err);
      throw err;
    }
  }

  public async setData<T>(data: T): Promise<boolean> {
    const state = await this._getState();
    const storage = state.storage as DataStorage<T>;
    storage[this.nameSpace] = { data, updateTime: Date.now() };
    try {
      await this.snap.request({
        method: 'snap_manageState',
        params: { operation: 'update', newState: { ...state, ...storage } },
      });
      return true;
    } catch (error) {
      const err = {
        message: (error as Error).message,
        code: 5,
        stack: 'StorageService::setDate',
      };
      console.error(err);
      throw err;
    }
  }

  public async getData<T>(): Promise<T> {
    // const payload: { [key: string]: { data: T; updateTime: number } } = {};
    // payload[this.nameSpace] = { data, updateTime: Date.now() };
    try {
      const storage = await this._getStorage();
      if (storage[this.nameSpace] !== undefined) {
        return storage[this.nameSpace].data as T;
      } else {
        return [] as T;
      }
    } catch (error) {
      const err = {
        message: (error as Error).message,
        code: 5,
        stack: 'StorageService::getData',
      };
      console.error(err);
      throw err;
    }
  }
}
