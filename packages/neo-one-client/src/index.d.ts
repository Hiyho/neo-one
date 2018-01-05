export interface SignatureABIReturn {
  readonly type: 'Signature';
}
export interface BooleanABIReturn {
  readonly type: 'Boolean';
}
export interface Hash160ABIReturn {
  readonly type: 'Hash160';
}
export interface Hash256ABIReturn {
  readonly type: 'Hash256';
}
export interface ByteArrayABIReturn {
  readonly type: 'ByteArray';
}
export interface PublicKeyABIReturn {
  readonly type: 'PublicKey';
}
export interface StringABIReturn {
  readonly type: 'String';
}
export interface InteropInterfaceABIReturn {
  readonly type: 'InteropInterface';
}
export interface VoidABIReturn {
  readonly type: 'Void';
}
export interface IntegerABIReturn {
  readonly type: 'Integer';
  readonly decimals: number;
}
export interface ArrayABIReturn {
  readonly type: 'Array';
  readonly value: ABIReturn;
}

export interface SignatureABIParameter {
  readonly name: string;
  readonly type: 'Signature';
}
export interface BooleanABIParameter {
  readonly name: string;
  readonly type: 'Boolean';
}
export interface Hash160ABIParameter {
  readonly name: string;
  readonly type: 'Hash160';
}
export interface Hash256ABIParameter {
  readonly name: string;
  readonly type: 'Hash256';
}
export interface ByteArrayABIParameter {
  readonly name: string;
  readonly type: 'ByteArray';
}
export interface PublicKeyABIParameter {
  readonly name: string;
  readonly type: 'PublicKey';
}
export interface StringABIParameter {
  readonly name: string;
  readonly type: 'String';
}
export interface InteropInterfaceABIParameter {
  readonly name: string;
  readonly type: 'InteropInterface';
}
export interface VoidABIParameter {
  readonly name: string;
  readonly type: 'Void';
}
export interface IntegerABIParameter {
  readonly name: string;
  readonly type: 'Integer';
  readonly decimals: number;
}
export interface ArrayABIParameter {
  readonly name: string;
  readonly type: 'Array';
  readonly value: ABIReturn;
}

export type ABIReturn =
  | SignatureABIReturn
  | BooleanABIReturn
  | Hash160ABIReturn
  | Hash256ABIReturn
  | ByteArrayABIReturn
  | PublicKeyABIReturn
  | StringABIReturn
  | ArrayABIReturn
  | InteropInterfaceABIReturn
  | VoidABIReturn
  | IntegerABIReturn;
export type ABIParameter =
  | SignatureABIParameter
  | BooleanABIParameter
  | Hash160ABIParameter
  | Hash256ABIParameter
  | ByteArrayABIParameter
  | PublicKeyABIParameter
  | StringABIParameter
  | ArrayABIParameter
  | InteropInterfaceABIParameter
  | VoidABIParameter
  | IntegerABIParameter;

export type ArrayABI = ArrayABIParameter | ArrayABIReturn;
export type SignatureABI = SignatureABIParameter | SignatureABIReturn;
export type BooleanABI = BooleanABIParameter | BooleanABIReturn;
export type Hash160ABI = Hash160ABIParameter | Hash160ABIReturn;
export type Hash256ABI = Hash256ABIParameter | Hash256ABIReturn;
export type ByteArrayABI = ByteArrayABIParameter | ByteArrayABIReturn;
export type PublicKeyABI = PublicKeyABIParameter | PublicKeyABIReturn;
export type StringABI = StringABIParameter | StringABIReturn;
export type InteropInterfaceABI = InteropInterfaceABIParameter | InteropInterfaceABIReturn;
export type VoidABI = VoidABIParameter | VoidABIReturn;
export type IntegerABI = IntegerABIParameter | IntegerABIReturn;

export type ABIFunction = {
  name: string,
  constant?: boolean,
  parameters?: Array<ABIParameter>,
  verify?: boolean,
  returnType: ABIReturn,
};
export type ABIEvent = {
  name: string,
  parameters: Array<ABIParameter>,
};
export type ABI = {
  deploy?: ABIFunction,
  functions: Array<ABIFunction>,
  events?: Array<ABIEvent>,
};
