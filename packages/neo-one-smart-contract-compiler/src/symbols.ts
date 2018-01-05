// tslint:disable ban-types no-bitwise
import AST, { SourceFile, Symbol, Type, ts } from 'ts-simple-ast';

import * as utils from './utils';

export interface Globals {
  readonly array: {
    readonly symbol: Symbol;
    readonly concat: Symbol;
  };
  readonly buffer: {
    readonly symbol: Symbol;
    readonly static: {
      readonly symbol: Symbol,
      readonly concat: Symbol;
    },
  };
}

const findBufferFile = (ast: AST): SourceFile | undefined => {
  const files = ast.getSourceFiles();
  return files.find((file) => {
    if (!file.isDeclarationFile()) {
      return false;
    }

    const bufferInterface = file.getInterface('Buffer');
    if (bufferInterface == null) {
      return false;
    }

    return (bufferInterface.compilerNode.flags & ts.NodeFlags.GlobalAugmentation) !== 0;
  });
};

export const getGlobals = (ast: AST): Globals => {
  let bufferFile = findBufferFile(ast);
  if (bufferFile == null) {
    bufferFile = ast.addExistingSourceFileIfExists(require.resolve('@types/node/index.d.ts'));
  }

  if (bufferFile == null) {
    throw new Error('Could not find Buffer');
  }

  const buffer = bufferFile.getInterfaceOrThrow('Buffer');
  const bufferStatic = bufferFile.getVariableDeclarationOrThrow('Buffer');

  const typeChecker = ast.getTypeChecker().compilerObject as any;
  // @ts-ignore
  const array = new Symbol(
    // @ts-ignore
    ast.global,
    typeChecker.createArrayType(typeChecker.getAnyType()).symbol as ts.Symbol,
  ).getDeclaredType();
  // const arrayStatic = array.getSymbolOrThrow().getTypeAtLocation(location)

  function getProperty(type: Type, name: string): Symbol {
    const symbol = type.getProperty(name);
    if (symbol == null) {
      throw new Error(`Could not find property ${name}`);
    }
    return symbol;
  }

  return {
    array: {
      symbol: array.getSymbolOrThrow(),
      concat: getProperty(array, 'concat'),
    },
    buffer: {
      symbol: buffer.getSymbolOrThrow(),
      static: {
        symbol: bufferStatic.getSymbolOrThrow(),
        concat: getProperty(bufferStatic.getType(), 'concat'),
      },
    },
  };
};

export interface NEONamespace {
  readonly symbol: Symbol;
  readonly equatable: {
    readonly equals: Symbol;
  };
  readonly address: {
    readonly symbol: Symbol,
    readonly votes: Symbol;
    readonly getBalance: Symbol;
  };
  readonly contract: {
    readonly symbol: Symbol;
    readonly script: Symbol;
  };
  readonly hash256: {
    readonly symbol: Symbol;
  };
  readonly publicKey: {
    readonly symbol: Symbol;
    readonly registerValidator: Symbol;
  };
  readonly signature: {
    readonly symbol: Symbol;
  };
  readonly smartContract: {
    readonly symbol: Symbol;
    readonly getOwner: Symbol;
    readonly getContract: Symbol;
  };
  readonly event: {
    readonly symbol: Symbol;
  };
  readonly fixed: {
    readonly symbol: Symbol;
  };
  readonly transaction: {
    readonly symbol: Symbol;
    readonly hash: Symbol;
    readonly type: Symbol;
    readonly attributes: Symbol;
    readonly inputs: Symbol;
    readonly references: Symbol;
    readonly outputs: Symbol;
    readonly unspent: Symbol;
  };
  readonly header: {
    readonly symbol: Symbol;
    readonly version: Symbol;
    readonly hash: Symbol;
    readonly previousHash: Symbol;
    readonly index: Symbol;
    readonly merkleRoot: Symbol;
    readonly timestamp: Symbol;
    readonly consensusData: Symbol;
    readonly nextConsensus: Symbol;
  };
  readonly block: {
    readonly symbol: Symbol;
    readonly transactions: Symbol;
  };
  readonly asset: {
    readonly symbol: Symbol;
    readonly hash: Symbol;
    readonly type: Symbol;
    readonly amount: Symbol;
    readonly available: Symbol;
    readonly precision: Symbol;
    readonly owner: Symbol;
    readonly admin: Symbol;
    readonly issuer: Symbol;
    readonly renew: Symbol;
  };
  readonly mapStorage: {
    readonly symbol: Symbol;
    readonly delete: Symbol;
    readonly get: Symbol;
    readonly has: Symbol;
    readonly set: Symbol;
  };
  readonly setStorage: {
    readonly symbol: Symbol;
    readonly add: Symbol;
    readonly delete: Symbol;
    readonly has: Symbol;
  };
  readonly arrayStorage: {
    readonly symbol: Symbol;
  };
  readonly verify: Symbol;
  readonly constructors: {
    readonly address: Symbol;
    readonly hash256: Symbol;
    readonly publicKey: Symbol;
    readonly map: Symbol;
    readonly set: Symbol;
    readonly array: Symbol;
  };
  readonly getCurrentTime: Symbol;
  readonly getCurrentHeight: Symbol;
  readonly getCurrentValidators: Symbol;
  readonly getCurrentTransaction: Symbol;
  readonly notify: Symbol;
  readonly verifySender: Symbol;
  readonly getHeader: Symbol;
  readonly getBlock: Symbol;
  readonly getTransaction: Symbol;
  readonly getAsset: Symbol;
}

export const getNEONamespace = async (ast: AST): Promise<NEONamespace> => {
  const files = await utils.filterSmartContractFiles(ast);
  let neoNamespaceFile = files.find((file) => file.getNamespace('neo') != null);
  if (neoNamespaceFile == null) {
    neoNamespaceFile = ast.addExistingSourceFileIfExists(require.resolve('@neo-one/smart-contract'));
  }

  const neo = neoNamespaceFile == null ? null : neoNamespaceFile.getNamespace('neo');
  if (neo == null) {
    throw new Error('Could not find NEO namespace');
  }

  return {
    symbol: neo.getSymbolOrThrow(),
    equatable: {
      equals: neo.getInterfaceOrThrow('Equatable').getMethodOrThrow('equals').getSymbolOrThrow(),
    },
    address: {
      symbol: neo.getInterfaceOrThrow('Address').getSymbolOrThrow(),
      votes: neo.getInterfaceOrThrow('Address').getPropertyOrThrow('votes').getSymbolOrThrow(),
      getBalance: neo.getInterfaceOrThrow('Address').getMethodOrThrow('getBalance').getSymbolOrThrow(),
    },
    contract: {
      symbol: neo.getInterfaceOrThrow('Contract').getSymbolOrThrow(),
      script: neo.getInterfaceOrThrow('Contract').getPropertyOrThrow('script').getSymbolOrThrow(),
    },
    hash256: {
      symbol: neo.getInterfaceOrThrow('Hash256').getSymbolOrThrow(),
    },
    publicKey: {
      symbol: neo.getInterfaceOrThrow('PublicKey').getSymbolOrThrow(),
      registerValidator: neo.getInterfaceOrThrow('PublicKey').getMethodOrThrow('registerValidator').getSymbolOrThrow(),
    },
    signature: {
      symbol: neo.getInterfaceOrThrow('Signature').getSymbolOrThrow(),
    },
    smartContract: {
      symbol: neo.getClassOrThrow('SmartContract').getSymbolOrThrow(),
      getOwner: neo.getClassOrThrow('SmartContract').getInstanceMethodOrThrow('getOwner').getSymbolOrThrow(),
      getContract: neo.getClassOrThrow('SmartContract').getInstanceMethodOrThrow('getContract').getSymbolOrThrow(),
    },
    event: {
      symbol: neo.getClassOrThrow('Event').getSymbolOrThrow(),
    },
    fixed: {
      symbol: neo.getTypeAliasOrThrow('Fixed').getSymbolOrThrow(),
    },
    transaction: {
      symbol: neo.getInterfaceOrThrow('Transaction').getSymbolOrThrow(),
      hash: neo.getInterfaceOrThrow('Transaction').getPropertyOrThrow('hash').getSymbolOrThrow(),
      type: neo.getInterfaceOrThrow('Transaction').getPropertyOrThrow('type').getSymbolOrThrow(),
      attributes: neo.getInterfaceOrThrow('Transaction').getPropertyOrThrow('attributes').getSymbolOrThrow(),
      inputs: neo.getInterfaceOrThrow('Transaction').getPropertyOrThrow('inputs').getSymbolOrThrow(),
      references: neo.getInterfaceOrThrow('Transaction').getPropertyOrThrow('references').getSymbolOrThrow(),
      outputs: neo.getInterfaceOrThrow('Transaction').getPropertyOrThrow('outputs').getSymbolOrThrow(),
      unspent: neo.getInterfaceOrThrow('Transaction').getPropertyOrThrow('unspent').getSymbolOrThrow(),
    },
    header: {
      symbol: neo.getInterfaceOrThrow('Header').getSymbolOrThrow(),
      version: neo.getInterfaceOrThrow('Header').getPropertyOrThrow('version').getSymbolOrThrow(),
      hash: neo.getInterfaceOrThrow('Header').getPropertyOrThrow('hash').getSymbolOrThrow(),
      previousHash: neo.getInterfaceOrThrow('Header').getPropertyOrThrow('previousHash').getSymbolOrThrow(),
      index: neo.getInterfaceOrThrow('Header').getPropertyOrThrow('index').getSymbolOrThrow(),
      merkleRoot: neo.getInterfaceOrThrow('Header').getPropertyOrThrow('merkleRoot').getSymbolOrThrow(),
      timestamp: neo.getInterfaceOrThrow('Header').getPropertyOrThrow('timestamp').getSymbolOrThrow(),
      consensusData: neo.getInterfaceOrThrow('Header').getPropertyOrThrow('consensusData').getSymbolOrThrow(),
      nextConsensus: neo.getInterfaceOrThrow('Header').getPropertyOrThrow('nextConsensus').getSymbolOrThrow(),
    },
    block: {
      symbol: neo.getInterfaceOrThrow('Block').getSymbolOrThrow(),
      transactions: neo.getInterfaceOrThrow('Block').getPropertyOrThrow('transactions').getSymbolOrThrow(),
    },
    asset: {
      symbol: neo.getClassOrThrow('Asset').getSymbolOrThrow(),
      hash: neo.getClassOrThrow('Asset').getInstancePropertyOrThrow('hash').getSymbolOrThrow(),
      type: neo.getClassOrThrow('Asset').getInstancePropertyOrThrow('type').getSymbolOrThrow(),
      amount: neo.getClassOrThrow('Asset').getInstancePropertyOrThrow('amount').getSymbolOrThrow(),
      available: neo.getClassOrThrow('Asset').getInstancePropertyOrThrow('available').getSymbolOrThrow(),
      precision: neo.getClassOrThrow('Asset').getInstancePropertyOrThrow('precision').getSymbolOrThrow(),
      owner: neo.getClassOrThrow('Asset').getInstancePropertyOrThrow('owner').getSymbolOrThrow(),
      admin: neo.getClassOrThrow('Asset').getInstancePropertyOrThrow('admin').getSymbolOrThrow(),
      issuer: neo.getClassOrThrow('Asset').getInstancePropertyOrThrow('issuer').getSymbolOrThrow(),
      renew: neo.getClassOrThrow('Asset').getInstanceMethodOrThrow('renew').getSymbolOrThrow(),
    },
    mapStorage: {
      symbol: neo.getInterfaceOrThrow('MapStorage').getSymbolOrThrow(),
      delete: neo.getInterfaceOrThrow('MapStorage').getMethodOrThrow('delete').getSymbolOrThrow(),
      get: neo.getInterfaceOrThrow('MapStorage').getMethodOrThrow('get').getSymbolOrThrow(),
      has: neo.getInterfaceOrThrow('MapStorage').getMethodOrThrow('has').getSymbolOrThrow(),
      set: neo.getInterfaceOrThrow('MapStorage').getMethodOrThrow('set').getSymbolOrThrow(),
    },
    setStorage: {
      symbol: neo.getInterfaceOrThrow('SetStorage').getSymbolOrThrow(),
      add: neo.getInterfaceOrThrow('SetStorage').getMethodOrThrow('add').getSymbolOrThrow(),
      delete: neo.getInterfaceOrThrow('SetStorage').getMethodOrThrow('delete').getSymbolOrThrow(),
      has: neo.getInterfaceOrThrow('SetStorage').getMethodOrThrow('has').getSymbolOrThrow(),
    },
    arrayStorage: {
      symbol: neo.getInterfaceOrThrow('ArrayStorage').getSymbolOrThrow(),
    },
    verify: neo.getFunctionOrThrow('verify').getSymbolOrThrow(),
    constructors: {
      address: neo.getFunctionOrThrow('address').getSymbolOrThrow(),
      hash256: neo.getFunctionOrThrow('hash256').getSymbolOrThrow(),
      publicKey: neo.getFunctionOrThrow('publicKey').getSymbolOrThrow(),
      map: neo.getFunctionOrThrow('map').getSymbolOrThrow(),
      set: neo.getFunctionOrThrow('set').getSymbolOrThrow(),
      array: neo.getFunctionOrThrow('array').getSymbolOrThrow(),
    },
    getCurrentTime: neo.getFunctionOrThrow('getCurrentTime').getSymbolOrThrow(),
    getCurrentHeight: neo.getFunctionOrThrow('getCurrentHeight').getSymbolOrThrow(),
    getCurrentValidators: neo.getFunctionOrThrow('getCurrentValidators').getSymbolOrThrow(),
    getCurrentTransaction: neo.getFunctionOrThrow('getCurrentTransaction').getSymbolOrThrow(),
    notify: neo.getFunctionOrThrow('notify').getSymbolOrThrow(),
    verifySender: neo.getFunctionOrThrow('verifySender').getSymbolOrThrow(),
    getHeader: neo.getFunctionOrThrow('getHeader').getSymbolOrThrow(),
    getBlock: neo.getFunctionOrThrow('getBlock').getSymbolOrThrow(),
    getTransaction: neo.getFunctionOrThrow('getTransaction').getSymbolOrThrow(),
    getAsset: neo.getFunctionOrThrow('getAsset').getSymbolOrThrow(),
  };
};

export interface InternalNEONamespace {
  readonly symbol: Symbol;
  readonly getStorage: Symbol;
  readonly putStorage: Symbol;
  readonly deleteStorage: Symbol;
  readonly cast: Symbol;
  readonly castBuffer: Symbol;
  readonly castBufferArray: Symbol;
  readonly checkWitness: Symbol;
  readonly isVerification: Symbol;
  readonly isApplication: Symbol;
  readonly notify: Symbol;
  readonly getCurrentTransaction: Symbol;
  readonly getCurrentTime: Symbol;
  readonly getCurrentContract: Symbol;
}

export const getInternalNEONamespace = async (ast: AST): Promise<InternalNEONamespace> => {
  const files = await utils.filterSmartContractFiles(ast);
  let neoNamespaceFile = files.find((file) => file.getNamespace('neo') != null);
  if (neoNamespaceFile == null) {
    neoNamespaceFile = ast.addExistingSourceFileIfExists(require.resolve('@neo-one/smart-contract-internal'));
  }
  const internalNEO = neoNamespaceFile == null ? null : neoNamespaceFile.getNamespace('neo');
  if (internalNEO == null) {
    throw new Error('Could not find internal NEO namespace');
  }

  return {
    symbol: internalNEO.getSymbolOrThrow(),
    getStorage: internalNEO.getFunctionOrThrow('getStorage').getSymbolOrThrow(),
    putStorage: internalNEO.getFunctionOrThrow('putStorage').getSymbolOrThrow(),
    deleteStorage: internalNEO.getFunctionOrThrow('deleteStorage').getSymbolOrThrow(),
    cast: internalNEO.getFunctionOrThrow('cast').getSymbolOrThrow(),
    castBuffer: internalNEO.getFunctionOrThrow('castBuffer').getSymbolOrThrow(),
    castBufferArray: internalNEO.getFunctionOrThrow('castBufferArray').getSymbolOrThrow(),
    checkWitness: internalNEO.getFunctionOrThrow('checkWitness').getSymbolOrThrow(),
    isVerification: internalNEO.getFunctionOrThrow('isVerification').getSymbolOrThrow(),
    isApplication: internalNEO.getFunctionOrThrow('isApplication').getSymbolOrThrow(),
    notify: internalNEO.getFunctionOrThrow('notify').getSymbolOrThrow(),
    getCurrentTransaction: internalNEO.getFunctionOrThrow('getCurrentTransaction').getSymbolOrThrow(),
    getCurrentTime: internalNEO.getFunctionOrThrow('getCurrentTime').getSymbolOrThrow(),
    getCurrentContract: internalNEO.getFunctionOrThrow('getCurrentContract').getSymbolOrThrow(),
  };
};
