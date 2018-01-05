import Blockchain from '@neo-one/node-blockchain';
import { DiagnosticCategory } from 'ts-simple-ast';
import { InvocationResult } from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';

import levelup from 'levelup';
import levelUpStorage from '@neo-one/node-storage-levelup';
import memdown from 'memdown';
import { test as testNet } from '@neo-one/node-neo-settings';
import vm from '@neo-one/node-vm';

import { compileScript } from './compile';

export const executeScript = async (
  monitor: Monitor,
  code: string,
): Promise<InvocationResult> => {
  const blockchain = await Blockchain.create({
    log: () => {
      // tslint:disable-next-line
    },
    settings: testNet,
    storage: levelUpStorage({
      context: { messageMagic: testNet.messageMagic },
      db: levelup(
        // @ts-ignore
        memdown(),
      ),
    }),
    vm,
    monitor,
  });
  const { code: compiledCode, diagnostics } = compileScript({ code });
  const error = diagnostics.filter((diagnostic) => diagnostic.category === DiagnosticCategory.Error)[0];
  if (error != null) {
    throw new Error(`Compilation error: ${error.messageText}`);
  }

  const result = await blockchain.invokeScript(compiledCode, monitor);
  return result;
};
