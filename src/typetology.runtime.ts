/* tslint:disable */

import {
  AbiFunction, AbiInfo,
  Crypto,
  Parameter, ParameterType,
  RestClient, RpcClient, WebsocketClient,
  TransactionBuilder,
  utils
} from "ontology-ts-sdk";

export const MIN_GAS_LIMIT = '20000';
export const MIN_GAS_PRICE = '500';

export interface TxParams {
  payer?: string | Crypto.Address;
  privateKey: string | Crypto.PrivateKey;
  gasPrice?: string | number;
  gasLimit?: string | number;
}

export class DeferredTransactionWrapper {
  private abiFunction: AbiFunction;

  constructor(
    private readonly contract: TypetologyContract,
    // @ts-ignore
    private readonly methodName: string,
    private readonly methodArgs: any[]
  ) {
    this.abiFunction = contract.abiInfo.getFunction(methodName);
  }

  async send(txParams: TxParams, client?: any) {
    const _client = (client !== undefined) ? client : this.contract.client;

    const funcParams: Parameter[] = [];
    this.abiFunction.parameters.forEach((funcParam, index) => {
      const paramName = funcParam.getName();
      const paramType = funcParam.getType();
      let paramValue = this.methodArgs[index];

      // if the parameter type is byte array and the value is buffer,
      // it needs to convert into hex string
      if (paramType === ParameterType.ByteArray && Buffer.isBuffer(paramValue)) {
        paramValue = (paramValue as Buffer).toString('hex');
      }

      funcParams.push(new Parameter(paramName, paramType, paramValue));
    });

    const tx = TransactionBuilder.makeInvokeTransaction(
      this.abiFunction.name,
      funcParams,
      this.contract.address,
      (txParams.gasPrice) ? txParams.gasPrice.toString() : MIN_GAS_PRICE,
      (txParams.gasLimit) ? txParams.gasLimit.toString() : MIN_GAS_LIMIT,
      (typeof txParams.payer === 'string') ? new Crypto.Address(txParams.payer) : txParams.payer
    );

    const privateKey = (typeof txParams.privateKey === 'string') ?
      new Crypto.PrivateKey(txParams.privateKey) : txParams.privateKey;
    TransactionBuilder.signTransaction(tx, privateKey);
    return await _client.sendRawTransaction(tx.serialize());
  }
}

export class TypetologyContract {
  public readonly client: any;
  // @ts-ignore
  public readonly abiInfo: AbiInfo;

  public constructor(client: RestClient | RpcClient | WebsocketClient) {
    this.client = client;
  }

  public async getStorage(key: string): Promise<any> {
    const codeHash = this.abiInfo.getHash().replace('0x', '');
    const hexKey = utils.str2hexstr(key);
    const value = await this.client.getStorage(codeHash, hexKey);

    if (value.Error !== 0) {
      throw new Error(`failed to get storage (Error Code: ${value.Error}, Msg: ${value.Desc}`);
    }

    return value.Result;
  }

  public async getContract(): Promise<any> {
    return this.client.getContract(this.codeHash);
  }

  public async getContractJson(): Promise<any> {
    return this.client.getContractJson(this.codeHash);
  }

  public get address(): Crypto.Address {
    return new Crypto.Address(utils.reverseHex(this.codeHash));
  }

  public get codeHash(): string {
    return this.abiInfo.getHash().replace('0x', '');
  }
}