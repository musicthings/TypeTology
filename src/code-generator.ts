/* tslint:disable */

import { AbiFunction, AbiInfo, ParameterType } from 'ontology-ts-sdk';

export class CodeGenerator {
  abiInfo: AbiInfo;

  /**
   * Constructs a typescript binding code generator for an ontology
   * smart contract abi.
   * @param contractName contract name for class name.
   * @param abi abi json string.
   */
  public constructor(
    private readonly contractName: string,
    abi: string) {
    this.abiInfo = AbiInfo.parseJson(abi);
  }

  public generate() {
    const functionCodes = this.abiInfo.functions.map(func => this.functionCode(func));

    return `/* tslint:disable */

import { AbiInfo, RestClient, RpcClient, WebsocketClient } from 'ontology-ts-sdk';
import { TypetologyContract, DeferredTransactionWrapper } from './typetology.runtime';

const abi = ${JSON.stringify(this.abiInfo, null, 2)}; 

export class ${this.className} extends TypetologyContract {
  public readonly abiInfo: AbiInfo = AbiInfo.parseJson(JSON.stringify(abi));
  
  constructor(client: RestClient | RpcClient | WebsocketClient) {
    super(client);
  }
${functionCodes.join('')}
}
`
  }

  public functionCode(abiFunction: AbiFunction) {
    const params = abiFunction.parameters.map((p) => p.name);
    const paramsWithType = abiFunction.parameters.map((p) =>
      `${p.name}: ${CodeGenerator.bindParameter(p.type)},      // ${p.type}`
    );

    return `
  public ${abiFunction.name}Tx(
    ${paramsWithType.join(',\n    ')}
  ): DeferredTransactionWrapper {
    return new DeferredTransactionWrapper(
      this,
      '${abiFunction.name}',
      [${params.join(', ')}]
    );
  }
`
  }

  public static bindParameter(paramType: ParameterType) {
    switch (paramType) {
      case ParameterType.Boolean:
        return 'boolean';
      case ParameterType.Integer:
      case ParameterType.Int:
      case ParameterType.Long:
        return 'number';
      case ParameterType.IntArray:
      case ParameterType.LongArray:
        return 'number[]';
      case ParameterType.ByteArray:
        return 'string | Buffer';
      case ParameterType.String:
        return 'string';
      default:
        return 'any';
    }
  }

  public get className() {
    return this.contractName;
  }
}