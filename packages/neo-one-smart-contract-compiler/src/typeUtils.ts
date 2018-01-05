import { Type, TypeFlags, ts } from 'ts-simple-ast';

export const hasUnionType = (type: Type<ts.Type>, isType: (type: Type<ts.Type>) => boolean): boolean =>
  type.isUnionType() && type.getUnionTypes().some(isType);

export const hasIntersectionType = (type: Type<ts.Type>, isType: (type: Type<ts.Type>) => boolean): boolean =>
  type.isIntersectionType() && type.getIntersectionTypes().some(isType);

export const hasType = (type: Type<ts.Type>, isType: (type: Type<ts.Type>) => boolean): boolean =>
  isType(type) ||
  hasUnionType(type, isType) ||
  hasIntersectionType(type, isType);

export const isOnly = (type?: Type<ts.Type>): boolean =>
  type != null &&
  !type.isNullable() &&
  !type.isUnionType() &&
  !type.isIntersectionType();

export const isUndefined = (type?: Type<ts.Type>): boolean =>
  type != null && type.isUndefinedType();

export const isOnlyUndefined = (type?: Type<ts.Type>): boolean =>
  isUndefined(type) &&
  isOnly(type);

export const hasUndefined = (type: Type<ts.Type>): boolean => hasType(type, isUndefined);

export const isNull = (type?: Type<ts.Type>): boolean =>
  type != null && (type.isNullType() || type.isNullable());

export const isOnlyNull = (type?: Type<ts.Type>): boolean =>
  isNull(type) &&
  isOnly(type);

export const hasNull = (type: Type<ts.Type>): boolean => hasType(type, isNull) || type.isNullable();

export const isNumber = (type?: Type<ts.Type>): boolean =>
  type != null && (type.isNumberType() || type.isNumberLiteralType());

export const isOnlyNumber = (type?: Type<ts.Type>): boolean =>
  isNumber(type) &&
  isOnly(type);

export const hasNumber = (type: Type<ts.Type>): boolean => hasType(type, isNumber);

export const isString = (type?: Type<ts.Type>): boolean =>
  type != null && (type.isStringType() || type.isStringLiteralType());

export const isOnlyString = (type?: Type<ts.Type>): boolean =>
  isString(type) &&
  isOnly(type);

export const hasString = (type: Type<ts.Type>): boolean => hasType(type, isString);

export const isBoolean = (type?: Type<ts.Type>): boolean =>
  type != null && (type.isBooleanType() || type.isBooleanLiteralType());

export const isOnlyBoolean = (type?: Type<ts.Type>): boolean =>
  isBoolean(type) &&
  isOnly(type);

export const hasBoolean = (type: Type<ts.Type>): boolean => hasType(type, isBoolean);

const hasTypeFlag = (type: Type<ts.Type>, flag: TypeFlags): boolean =>
  (type.compilerType.flags & flag) === flag;

export const isSymbol = (type?: Type<ts.Type>): boolean =>
  type != null &&
  (hasTypeFlag(type, TypeFlags.ESSymbol) || hasTypeFlag(type, TypeFlags.ESSymbolLike));

export const isOnlySymbol = (type?: Type<ts.Type>): boolean =>
  isSymbol(type) &&
  isOnly(type);

export const hasSymbol = (type: Type<ts.Type>): boolean => hasType(type, isSymbol);

export const isPrimitive = (type?: Type<ts.Type>): boolean =>
  isUndefined(type) ||
  isNull(type) ||
  isString(type) ||
  isNumber(type) ||
  isBoolean(type) ||
  isSymbol(type);

export const isOnlyPrimitive = (type?: Type<ts.Type>): boolean =>
  isPrimitive(type) &&
  isOnly(type);

export const hasPrimitive = (type: Type<ts.Type>): boolean => hasType(type, isPrimitive);

export const isOnlyObject = (type?: Type<ts.Type>): boolean =>
  isOnly(type) &&
  !isPrimitive(type);

export const isArray = (type?: Type<ts.Type>): boolean =>
  type != null &&
  type.isArrayType();

export const isOnlyArray = (type?: Type<ts.Type>): boolean =>
  isOnly(type) &&
  isArray(type);

export const isSame = (type0?: Type<ts.Type>, type1?: Type<ts.Type>): boolean =>
  type0 != null &&
  type1 != null &&
  type0 === type1;
