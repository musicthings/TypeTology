
import { Crypto, RestClient } from 'ontology-ts-sdk';
import * as fs from 'fs';
import { spawn } from 'child_process';
const assert = require('chai').assert;

describe('typetology CLI for domain contract', () => {

  let privateKey: Crypto.PrivateKey;
  let walletAddress: Crypto.Address;

  before(() => {
    // if test output directory does not exist, create the directory
    if (!fs.existsSync('test-out')) {
      fs.mkdirSync('test-out');
    }

    privateKey = new Crypto.PrivateKey('75de8489fcb2dcaf2ef3cd607feffde18789de7da129b5e97c81e001793cb7cf');
    walletAddress = new Crypto.Address('AazEvfQPcQ2GEFFPLF1ZLwQ7K5jDn81hve');
  });

  it('should generate code from domain contract abi', async () => {
    // run typetology CLI for generating domain contract binding class
    const cli = spawn('node',
      ['./dist/typetology-cli.js', '-o', './test-out/domain', './test/abi/DomainContract.json']);

    // wait for cli until exit
    await new Promise((resolve) => cli.on('exit', resolve));

    // check domain contract binding codes generated.
    assert(fs.existsSync('./test-out/domain/typetology.runtime.ts'));
    assert(fs.existsSync('./test-out/domain/DomainContract.ts'));
  });

  it('should get address from storage', async () => {
    const { DomainContract } = require('../test-out/domain/DomainContract');
    const client = new RestClient();
    const contract = new DomainContract(client);

    contract.getStorage('hello').then((address: string) => {
      assert(typeof address === 'string' && address.length > 0);
    });
  });

  it('should send transaction', async () => {
    const { DomainContract } = require('../test-out/domain/DomainContract');
    const client = new RestClient();
    const contract = new DomainContract(client);

    // wait for sending transaction to network
    const tx = await contract.QueryTx('hello').send({
      payer: walletAddress,
      privateKey: privateKey
    });

    // check action equals to `sendrawtransaction`
    assert(tx.Action === 'sendrawtransaction');
  });
});