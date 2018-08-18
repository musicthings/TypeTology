# TypeTology

Typescript binding script for Ontology smart contracts. Typetology is motivated and referred 
from [TypeChain](https://github.com/krzkaczor/TypeChain), a good script that binds typescript 
for Ethereum smart contract.


## Install

Typetology is available through npm.

```
npm install --save-dev typetology
```

## Usage

You need Ontology smart contract ABI files for generating smart contract class. Also, the
generated contract class name is the same with the file name (without file extension), so
you should name the ABI file with the class name you want. (such as `DomainContract.json`)

```
typetology [--force | -f] [--out | -o (directory)] [abi files(glob pattern)]
```

|      Option      | Required | Description |
|------------------|:--------:|-------------|
|   --force, -f    | false |overwrite if file already exists|
|   --out, -o      | true | output directory for generated typescript codes|



Followings are example for `DomainContract.json` ABI file generated from the 
[Ontology SmartX IDE example](https://ontio.github.io/documentation/SmartX_Tutorial_en.html).

```json
{
  "hash":"0xfd2dc90d8bdc551798c268291c81333ae7905eed",
  "entrypoint":"Main",
  "functions":[
    {"name":"Main","parameters":[{"name":"operation","type":"String"},{"name":"args","type":"Array"}],"returntype":"Any"},
    {"name":"Query","parameters":[{"name":"domain","type":"String"}],"returntype":"ByteArray"},
    {"name":"Register","parameters":[{"name":"domain","type":"String"},{"name":"owner","type":"ByteArray"}],"returntype":"Boolean"},
    {"name":"Transfer","parameters":[{"name":"domain","type":"String"},{"name":"to","type":"ByteArray"}],"returntype":"Boolean"},
    {"name":"Delete","parameters":[{"name":"domain","type":"String"}],"returntype":"Boolean"}
  ],
  "events":[]
}
```

```typescript
/* tslint:disable */

import { AbiInfo, RestClient, RpcClient, WebsocketClient } from 'ontology-ts-sdk';
import { TypetologyContract, DeferredTransactionWrapper } from './typetology.runtime';

const abi = {
  ... // ABI
}; 

export class DomainContract extends TypetologyContract {
  public readonly abiInfo: AbiInfo = AbiInfo.parseJson(JSON.stringify(abi));
  
  constructor(client: RestClient | RpcClient | WebsocketClient) {
    super(client);
  }

  public MainTx(
    operation: string,      // String,
    args: any,      // Array
  ): DeferredTransactionWrapper {
    return new DeferredTransactionWrapper(
      this,
      'Main',
      [operation, args]
    );
  }

  public QueryTx(
    domain: string,      // String
  ): DeferredTransactionWrapper {
    return new DeferredTransactionWrapper(
      this,
      'Query',
      [domain]
    );
  }

  public RegisterTx(
    domain: string,      // String,
    owner: string | Buffer,      // ByteArray
  ): DeferredTransactionWrapper {
    return new DeferredTransactionWrapper(
      this,
      'Register',
      [domain, owner]
    );
  }

  public TransferTx(
    domain: string,      // String,
    to: string | Buffer,      // ByteArray
  ): DeferredTransactionWrapper {
    return new DeferredTransactionWrapper(
      this,
      'Transfer',
      [domain, to]
    );
  }

  public DeleteTx(
    domain: string,      // String
  ): DeferredTransactionWrapper {
    return new DeferredTransactionWrapper(
      this,
      'Delete',
      [domain]
    );
  }

}
```

You can send a transaction by this way.

```typescript
import { RestClient, Crypto } from 'ontology-ts-sdk';
import { DomainContract } from './contract/DomainContract';

const client = new RestClient();
const contract = new DomainContract(client);

// wallet address and private key for payer
const privateKey = new Crypto.PrivateKey('75de8489fcb2dcaf2ef3cd607feffde18789de7da129b5e97c81e001793cb7cf');
const walletAddress = new Crypto.Address('AazEvfQPcQ2GEFFPLF1ZLwQ7K5jDn81hve');

// register a domain "typetology" as the address "AazEvfQPcQ2GEFFPLF1ZLwQ7K5jDn81hve"
contract.RegisterTx('typetology', Buffer.from('AazEvfQPcQ2GEFFPLF1ZLwQ7K5jDn81hve')).send({
  payer: walletAddress,
  privateKey: privateKey
}).then(console.log);
```

You can receive the result like below. 

```
{ Action: 'sendrawtransaction',
  Desc: 'SUCCESS',
  Error: 0,
  Result: 'd6a605c1f03839807af80ea67f0140410c320ed848a241b4b28ce87b77ac7eab',
  Version: '1.0.0' }
```

You can also get a storage data by calling `getStorage(key: string)`. It doesn't need any wallet.
Also, be careful that the result data is hex string, so if the data is string (not blob), you
need to convert it by using `hexstr2str` method in `utils` library in `ontology-ts-sdk`.

```typescript
import { RestClient, utils } from 'ontology-ts-sdk';
import { DomainContract } from './DomainContract';

const client = new RestClient();
const contract = new DomainContract(client);

contract.getStorage('typetology').then((data) => console.log('owner :', utils.hexstr2str(data)));
```

The result is like below.

```
owner : AazEvfQPcQ2GEFFPLF1ZLwQ7K5jDn81hve
```

## License
GNU Lesser General Public License v3.0
