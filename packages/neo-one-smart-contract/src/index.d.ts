import { Buffer as BufferType } from 'buffer';

declare namespace neo {
  export const Buffer: typeof BufferType;

  interface Equatable<T> {
    equals(other: T): boolean;
  }
  interface Address extends Equatable<Address> {
    readonly votes: PublicKey[];
    getBalance(asset: Hash256): Fixed8;
  }
  interface Contract extends Address {
    readonly script: Buffer;
  }
  interface Hash256 extends Equatable<Hash256> { }
  interface PublicKey extends Equatable<PublicKey> {
    registerValidator(): void;
  }
  interface Signature extends Equatable<Signature> { }
  abstract class SmartContract {
    protected abstract getOwner(): Address;
    protected getContract(): Contract;
  }
  class Event {
    __eventBrand: number;
  }
  type Fixed<T extends number> = number & (number | T);
  type Integer = Fixed<0>;
  type Fixed8 = Fixed<8>;
  enum BufferAttributeUsage {
    DESCRIPTION_URL = 0x81,
    DESCRIPTION = 0x90,
    REMARK = 0xf0,
    REMARK1 = 0xf1,
    REMARK2 = 0xf2,
    REMARK3 = 0xf3,
    REMARK4 = 0xf4,
    REMARK5 = 0xf5,
    REMARK6 = 0xf6,
    REMARK7 = 0xf7,
    REMARK8 = 0xf8,
    REMARK9 = 0xf9,
    REMARK10 = 0xfa,
    REMARK11 = 0xfb,
    REMARK12 = 0xfc,
    REMARK13 = 0xfd,
    REMARK14 = 0xfe,
    REMARK15 = 0xff,
  }
  interface BufferAttribute {
    readonly usage: BufferAttributeUsage;
    readonly data: Buffer;
  }
  enum PublicKeyAttributeUsage {
    ECDH02 = 0x02,
    ECDH03 = 0x03,
  }
  interface PublicKeyAttribute {
    readonly usage: PublicKeyAttributeUsage;
    readonly data: PublicKey;
  }
  enum AddressAttributeUsage {
    SCRIPT = 0x20,
  }
  interface AddressAttribute {
    readonly usage: AddressAttributeUsage;
    readonly data: Address;
  }
  enum Hash256AttributeUsage {
    CONTRACT_HASH = 0x00,
    VOTE = 0x30,
    HASH1 = 0xa1,
    HASH2 = 0xa2,
    HASH3 = 0xa3,
    HASH4 = 0xa4,
    HASH5 = 0xa5,
    HASH6 = 0xa6,
    HASH7 = 0xa7,
    HASH8 = 0xa8,
    HASH9 = 0xa9,
    HASH10 = 0xaa,
    HASH11 = 0xab,
    HASH12 = 0xac,
    HASH13 = 0xad,
    HASH14 = 0xae,
    HASH15 = 0xaf,
  }
  interface Hash256Attribute {
    readonly usage: Hash256AttributeUsage;
    readonly data: Hash256;
  }
  type Attribute =
    | BufferAttribute
    | PublicKeyAttribute
    | AddressAttribute
    | Hash256Attribute;
  interface Input {
    hash: Hash256;
    index: Integer;
  }
  interface Output {
    asset: Asset;
    value: Fixed8;
    address: Address;
  }
  enum TransactionType {
    MINER = 0x00,
    ISSUE = 0x01,
    CLAIM = 0x02,
    ENROLLMENT = 0x20,
    REGISTER = 0x40,
    CONTRACT = 0x80,
    PUBLISH = 0xd0,
    INVOCATION = 0xd1,
  }
  interface Transaction {
    readonly hash: Hash256;
    readonly type: TransactionType;
    readonly attributes: Attribute[];
    readonly inputs: Input[];
    readonly references: Output[];
    readonly outputs: Output[];
    readonly unspent: Output[];
  }
  interface Header {
    readonly version: Integer;
    readonly hash: Hash256;
    readonly previousHash: Hash256;
    readonly index: Integer;
    readonly merkleRoot: Hash256;
    readonly timestamp: Integer;
    readonly consensusData: Integer;
    readonly nextConsensus: Address;
  }
  interface Block extends Header {
    readonly transactions: Transaction[];
  }
  class Asset implements Equatable<Asset> {
    public readonly hash: Hash256;
    public readonly type: Integer;
    public readonly amount: Fixed8;
    public readonly available: Fixed8;
    public readonly precision: Integer;
    public readonly owner: PublicKey;
    public readonly admin: Address;
    public readonly issuer: Address;

    constructor(
      type: Integer,
      amount: Fixed8,
      available: Fixed8,
      precision: Integer,
      owner: PublicKey,
      admin: Address,
      issuer: Address,
    );

    public renew(years: Integer): void;
    public equals(other: Asset): boolean;
  }

  // Storage
  type StoragePrimitive =
    Address |
    Hash256 |
    PublicKey |
    Signature |
    Fixed<any> |
    Buffer |
    string;
  type StorageKey =
    StoragePrimitive |
    [StoragePrimitive] |
    [StoragePrimitive, StoragePrimitive] |
    [StoragePrimitive, StoragePrimitive, StoragePrimitive] |
    [StoragePrimitive, StoragePrimitive, StoragePrimitive, StoragePrimitive];
  interface MapStorage<K extends StorageKey, V extends StoragePrimitive> {
    __mapBrand: number;
    delete(key: K): boolean;
    get(key: K): V | undefined;
    has(key: K): boolean;
    set(key: K, value: V): this;
  }
  interface SetStorage<V extends StorageKey> {
    __setBrand: number;
    add(value: V): this;
    delete(value: V): boolean;
    has(value: V): boolean;
  }
  interface ArrayStorage<V extends StoragePrimitive> {
    __arrayBrand: number;
    [n: number]: V;
  }
  type StorageValue =
    StoragePrimitive |
    MapStorage<any, any> |
    SetStorage<any> |
    ArrayStorage<any>;

  // Decorators
  function verify<T>(
    // @ts-ignore
    target: Object, // tslint:disable-line
    // @ts-ignore
    key: string | symbol,
    // @ts-ignore
    descriptor: TypedPropertyDescriptor<T>,
  ): any;

  // Constructors
  function address(value: string): Address;
  function hash256(value: string): Hash256;
  function publicKey(value: string): PublicKey;
  function map<K extends StorageKey, V extends StoragePrimitive>(): MapStorage<K, V>;
  function set<V extends StorageKey>(): SetStorage<V>;
  function array<V extends StoragePrimitive>(): ArrayStorage<V>;

  // Current Message
  function getCurrentTime(): Integer;
  function getCurrentHeight(): Integer;
  function getCurrentValidators(): PublicKey[];
  function getCurrentTransaction(): Transaction;

  // Blockchain
  function notify(event: Event): void;
  function verifySender(addr: Address): void;
  function getHeader(hashOrIdx: Hash256 | Integer): Header;
  function getBlock(hashOrIdx: Hash256 | Integer): Block;
  function getTransaction(hash: Hash256): Transaction;
  function getAsset(hash: Hash256): Asset;
}

export = neo;
