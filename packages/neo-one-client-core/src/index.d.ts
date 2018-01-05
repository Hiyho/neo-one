import BN from 'bn.js';

export type ECPoint = Buffer;

export declare interface DeserializeWireContext {
}

export declare interface Block {
}
export declare interface RegisterTransaction {
}

export declare interface VMState {
}

export enum ContractParameterType {
  Integer = 0x02,
}

export declare interface IntegerContractParameter {
  type: ContractParameterType.Integer;
  value: BN;
}

export declare type ContractParameter = IntegerContractParameter;

export declare interface InvocationResult {
  state: VMState;
  gasConsumed: BN;
  stack: ContractParameter[];
}

export declare interface VMSettings {
  storageContext: {
    v0: { index: number },
  };
}

export declare interface Settings {
  genesisBlock: Block;
  governingToken: RegisterTransaction;
  utilityToken: RegisterTransaction;
  decrementInterval: number;
  generationAmount: number[];
  fees: { [transactionType: number]: BN };
  messageMagic: number;
  addressVersion: number;
  privateKeyVersion: number;
  standbyValidators: ECPoint[];
  vm: VMSettings;
  secondsPerBlock: number;
  maxTransactionsPerBlock: number;
}

export type OpCode =
  | 'PUSH0'
  | 'PUSHBYTES1'
  | 'PUSHBYTES2'
  | 'PUSHBYTES3'
  | 'PUSHBYTES4'
  | 'PUSHBYTES5'
  | 'PUSHBYTES6'
  | 'PUSHBYTES7'
  | 'PUSHBYTES8'
  | 'PUSHBYTES9'
  | 'PUSHBYTES10'
  | 'PUSHBYTES11'
  | 'PUSHBYTES12'
  | 'PUSHBYTES13'
  | 'PUSHBYTES14'
  | 'PUSHBYTES15'
  | 'PUSHBYTES16'
  | 'PUSHBYTES17'
  | 'PUSHBYTES18'
  | 'PUSHBYTES19'
  | 'PUSHBYTES20'
  | 'PUSHBYTES21'
  | 'PUSHBYTES22'
  | 'PUSHBYTES23'
  | 'PUSHBYTES24'
  | 'PUSHBYTES25'
  | 'PUSHBYTES26'
  | 'PUSHBYTES27'
  | 'PUSHBYTES28'
  | 'PUSHBYTES29'
  | 'PUSHBYTES30'
  | 'PUSHBYTES31'
  | 'PUSHBYTES32'
  | 'PUSHBYTES33'
  | 'PUSHBYTES34'
  | 'PUSHBYTES35'
  | 'PUSHBYTES36'
  | 'PUSHBYTES37'
  | 'PUSHBYTES38'
  | 'PUSHBYTES39'
  | 'PUSHBYTES40'
  | 'PUSHBYTES41'
  | 'PUSHBYTES42'
  | 'PUSHBYTES43'
  | 'PUSHBYTES44'
  | 'PUSHBYTES45'
  | 'PUSHBYTES46'
  | 'PUSHBYTES47'
  | 'PUSHBYTES48'
  | 'PUSHBYTES49'
  | 'PUSHBYTES50'
  | 'PUSHBYTES51'
  | 'PUSHBYTES52'
  | 'PUSHBYTES53'
  | 'PUSHBYTES54'
  | 'PUSHBYTES55'
  | 'PUSHBYTES56'
  | 'PUSHBYTES57'
  | 'PUSHBYTES58'
  | 'PUSHBYTES59'
  | 'PUSHBYTES60'
  | 'PUSHBYTES61'
  | 'PUSHBYTES62'
  | 'PUSHBYTES63'
  | 'PUSHBYTES64'
  | 'PUSHBYTES65'
  | 'PUSHBYTES66'
  | 'PUSHBYTES67'
  | 'PUSHBYTES68'
  | 'PUSHBYTES69'
  | 'PUSHBYTES70'
  | 'PUSHBYTES71'
  | 'PUSHBYTES72'
  | 'PUSHBYTES73'
  | 'PUSHBYTES75'
  | 'PUSHDATA1'
  | 'PUSHDATA2'
  | 'PUSHDATA4'
  | 'PUSHM1'
  | 'PUSH1'
  | 'PUSH2'
  | 'PUSH3'
  | 'PUSH4'
  | 'PUSH5'
  | 'PUSH6'
  | 'PUSH7'
  | 'PUSH8'
  | 'PUSH9'
  | 'PUSH10'
  | 'PUSH11'
  | 'PUSH12'
  | 'PUSH13'
  | 'PUSH14'
  | 'PUSH15'
  | 'PUSH16'
  | 'NOP'
  | 'JMP'
  | 'JMPIF'
  | 'JMPIFNOT'
  | 'CALL'
  | 'RET'
  | 'APPCALL'
  | 'SYSCALL'
  | 'TAILCALL'
  | 'DUPFROMALTSTACK'
  | 'TOALTSTACK'
  | 'FROMALTSTACK'
  | 'XDROP'
  | 'XSWAP'
  | 'XTUCK'
  | 'DEPTH'
  | 'DROP'
  | 'DUP'
  | 'NIP'
  | 'OVER'
  | 'PICK'
  | 'ROLL'
  | 'ROT'
  | 'SWAP'
  | 'TUCK'
  | 'CAT'
  | 'SUBSTR'
  | 'LEFT'
  | 'RIGHT'
  | 'SIZE'
  | 'INVERT'
  | 'AND'
  | 'OR'
  | 'XOR'
  | 'EQUAL'
  | 'OP_EQUALVERIFY'
  | 'OP_RESERVED1'
  | 'OP_RESERVED2'
  | 'INC'
  | 'DEC'
  | 'SIGN'
  | 'NEGATE'
  | 'ABS'
  | 'NOT'
  | 'NZ'
  | 'ADD'
  | 'SUB'
  | 'MUL'
  | 'DIV'
  | 'MOD'
  | 'SHL'
  | 'SHR'
  | 'BOOLAND'
  | 'BOOLOR'
  | 'NUMEQUAL'
  | 'NUMNOTEQUAL'
  | 'LT'
  | 'GT'
  | 'LTE'
  | 'GTE'
  | 'MIN'
  | 'MAX'
  | 'WITHIN'
  | 'SHA1'
  | 'SHA256'
  | 'HASH160'
  | 'HASH256'
  | 'CHECKSIG'
  | 'CHECKMULTISIG'
  | 'ARRAYSIZE'
  | 'PACK'
  | 'UNPACK'
  | 'PICKITEM'
  | 'SETITEM'
  | 'NEWARRAY'
  | 'NEWSTRUCT'
  | 'NEWMAP'
  | 'APPEND'
  | 'REVERSE'
  | 'REMOVE'
  | 'HASKEY'
  | 'KEYS'
  | 'VALUES'
  | 'THROW'
  | 'THROWIFNOT';

export declare type ByteCode = number;
export declare const BYTECODE_TO_BYTECODE_BUFFER: { [bytecode: string]: Buffer };
export declare const OPCODE_TO_BYTECODE: { [opCode: string]: number };

export declare class UnknownOpError {
  constructor(byteCode: string);
}

declare namespace utils {
  export const ZERO: BN;
  export const NEGATIVE_ONE: BN;
  export const SIXTEEN: BN;

  export function toSignedBuffer(value: BN): Buffer;
}
