import { CloneArrayHelper, ExtendArrayHelper } from './common';
import {
  HandleCompletionHelper,
  CreateCompletionHelper,
  CreateNormalCompletionHelper,
  CreateThrowCompletionHelper,
  GetCompletionErrorHelper,
  GetCompletionValHelper,
  PickCompletionValHelper,
} from './completionRecord';
import { ThrowHelper, ThrowTypeErrorHelper } from './error';
import {
  CallHelper,
  CreateFunctionObjectHelper,
  CreateFunctionObjectBaseHelper,
  CreateFunctionObjectBaseHelperOptions,
  FunctionHelper,
  FunctionHelperOptions,
  ParametersHelper,
  CloneFunctionHelper,
  ArgumentsHelper,
  CloneFunctionObjectHelperOptions,
  CloneFunctionObjectHelper,
  BindFunctionThisHelper,
  BindFunctionObjectThisHelperOptions,
  BindFunctionObjectThisHelper,
  BindFunctionThisHelperOptions,
  InvokeHelperBaseOptions,
  InvokeCallHelper,
  InvokeConstructHelper,
  CreateFunctionHelper,
  CreateFunctionHelperOptions,
} from './function';
import {
  ForLoopHelper,
  ForLoopHelperOptions,
  ProcessStatementsHelper,
  ProcessStatementsHelperOptions,
  IfHelper,
  IfHelperOptions,
  Case,
  CaseHelper,
} from './statement';
import {
  CreateBooleanHelper,
  CreateNullHelper,
  CreateNumberHelper,
  CreateObjectHelper,
  CreateStringHelper,
  CreateSymbolHelper,
  CreateUndefinedHelper,
  IsBooleanHelper,
  IsNullHelper,
  IsNumberHelper,
  IsObjectHelper,
  IsStringHelper,
  IsSymbolHelper,
  IsUndefinedHelper,
  GetBooleanHelper,
  GetNumberHelper,
  GetSymbolHelper,
  GetPropertyObjectHelper,
  GetStringHelper,
  ToBooleanHelper,
  ToNumberHelper,
  ToStringHelper,
  GetSymbolObjectHelper,
  GetSymbolObjectPropertyHelper,
  GetInternalObjectHelper,
  GetInternalObjectPropertyHelper,
  GetPropertyObjectPropertyHelper,
  SetPropertyObjectPropertyHelper,
  ToPrimitiveHelper,
  ToPrimitiveHelperOptions,
  IsSameTypeHelper,
  UnwrapTypeHelper,
  UnwrapValHelper,
  IsNullOrUndefinedHelper,
  GetObjectHelper,
  SetInternalObjectPropertyHelper,
  SetSymbolObjectPropertyHelper,
  ShallowCloneObjectHelper,
  ShallowCloneObjHelper,
  ToObjectHelper,
  InstanceofHelper,
} from './types';
import {
  LessThanHelperOptions,
  LessThanHelper,
  EqualsEqualsEqualsHelperOptions,
  EqualsEqualsEqualsHelper,
  EqualsEqualsEqualsNumberHelper,
  EqualsEqualsEqualsSameTypeHelper,
  EqualsEqualsEqualsUnknownHelper,
  EqualsEqualsHelper,
  EqualsEqualsHelperOptions,
} from './relational';
import {
  GLOBAL_PROPERTIES,
  CreateGlobalObjectHelper,
  AddBooleanObjectHelper,
  AddNumberObjectHelper,
  AddObjectObjectHelper,
  AddStringObjectHelper,
  AddSymbolObjectHelper,
  AddArrayObjectHelper,
} from './global';
import {
  CreateArrayHelper,
  GetDataArrayHelper,
  SetArrayIndexHelper,
  AddDataArrayHelper,
  GetArrayIndexHelper,
} from './array';

export interface Helpers {
  cloneArray: CloneArrayHelper;
  extendArray: ExtendArrayHelper;
  cloneFunction: CloneFunctionHelper;
  cloneFunctionObject: (options: CloneFunctionObjectHelperOptions) => CloneFunctionObjectHelper;
  equalsEqualsEquals: (options: EqualsEqualsEqualsHelperOptions) => EqualsEqualsEqualsHelper;
  equalsEqualsEqualsNumber: EqualsEqualsEqualsNumberHelper;
  equalsEqualsEqualsSameType: EqualsEqualsEqualsSameTypeHelper;
  equalsEqualsEqualsUnknown: EqualsEqualsEqualsUnknownHelper;
  equalsEquals: (options: EqualsEqualsHelperOptions) => EqualsEqualsHelper;
  lessThan: (options: LessThanHelperOptions) => LessThanHelper;
  processStatements: (
    options: ProcessStatementsHelperOptions,
  ) => ProcessStatementsHelper;
  bindFunctionThis: (options: BindFunctionThisHelperOptions) => BindFunctionThisHelper;
  bindFunctionObjectThis: (options: BindFunctionObjectThisHelperOptions) => BindFunctionObjectThisHelper;
  createFunction: (options: CreateFunctionHelperOptions) => CreateFunctionHelper;
  createFunctionObjectBase: (options: CreateFunctionObjectBaseHelperOptions) => CreateFunctionObjectBaseHelper;
  createFunctionObject: CreateFunctionObjectHelper;
  function: (options: FunctionHelperOptions) => FunctionHelper;
  args: ArgumentsHelper;
  parameters: ParametersHelper;
  call: CallHelper;
  invokeCall: (options?: InvokeHelperBaseOptions) => InvokeCallHelper;
  invokeConstruct: (options?: InvokeHelperBaseOptions) => InvokeConstructHelper;
  forLoop: (options: ForLoopHelperOptions) => ForLoopHelper;
  if: (options: IfHelperOptions) => IfHelper;
  case: (cases: Case[], defaultCase: () => void) => CaseHelper;
  createCompletion: CreateCompletionHelper;
  createNormalCompletion: CreateNormalCompletionHelper;
  createThrowCompletion: CreateThrowCompletionHelper;
  getCompletionError: GetCompletionErrorHelper;
  getCompletionVal: GetCompletionValHelper;
  handleCompletion: HandleCompletionHelper;
  pickCompletionVal: PickCompletionValHelper;
  throw: ThrowHelper;
  throwTypeError: ThrowTypeErrorHelper;
  createBoolean: CreateBooleanHelper;
  createNull: CreateNullHelper;
  createNumber: CreateNumberHelper;
  createObject: CreateObjectHelper;
  createString: CreateStringHelper;
  createSymbol: CreateSymbolHelper;
  createUndefined: CreateUndefinedHelper;
  isBoolean: IsBooleanHelper;
  isNull: IsNullHelper;
  isNumber: IsNumberHelper;
  isObject: IsObjectHelper;
  isString: IsStringHelper;
  isSymbol: IsSymbolHelper;
  isUndefined: IsUndefinedHelper;
  isNullOrUndefined: IsNullOrUndefinedHelper;
  isSameType: IsSameTypeHelper;
  getBoolean: GetBooleanHelper;
  getNumber: GetNumberHelper;
  getString: GetStringHelper;
  getSymbol: GetSymbolHelper;
  getObject: GetObjectHelper;
  toBoolean: ToBooleanHelper;
  toString: ToStringHelper;
  toNumber: ToNumberHelper;
  toObject: ToObjectHelper;
  toPrimitive: (options?: ToPrimitiveHelperOptions) => ToPrimitiveHelper;
  getSymbolObject: GetSymbolObjectHelper;
  getSymbolObjectProperty: GetSymbolObjectPropertyHelper;
  setSymbolObjectProperty: SetSymbolObjectPropertyHelper;
  getPropertyObject: GetPropertyObjectHelper;
  getPropertyObjectProperty: GetPropertyObjectPropertyHelper;
  setPropertyObjectProperty: SetPropertyObjectPropertyHelper;
  getInternalObject: GetInternalObjectHelper;
  getInternalObjectProperty: GetInternalObjectPropertyHelper;
  setInternalObjectProperty: SetInternalObjectPropertyHelper;
  shallowCloneObject: ShallowCloneObjectHelper;
  shallowCloneObj: ShallowCloneObjHelper;
  unwrapType: UnwrapTypeHelper;
  unwrapVal: UnwrapValHelper;
  instanceof: InstanceofHelper;

  addDataArray: AddDataArrayHelper;
  createArray: CreateArrayHelper;
  getDataArray: GetDataArrayHelper;
  getArrayIndex: GetArrayIndexHelper;
  setArrayIndex: SetArrayIndexHelper;

  addArrayObject: AddArrayObjectHelper;
  addBooleanObject: AddBooleanObjectHelper;
  addNumberObject: AddNumberObjectHelper;
  addObjectObject: AddObjectObjectHelper;
  addStringObject: AddStringObjectHelper;
  addSymbolObject: AddSymbolObjectHelper;
  createGlobalObject: CreateGlobalObjectHelper;
  globalProperties: Set<string>;
}

export const createHelpers = (): Helpers => ({
  cloneArray: new CloneArrayHelper(),
  extendArray: new ExtendArrayHelper(),
  cloneFunction: new CloneFunctionHelper(),
  cloneFunctionObject: (options: CloneFunctionObjectHelperOptions) => new CloneFunctionObjectHelper(options),
  equalsEqualsEquals: (options: EqualsEqualsEqualsHelperOptions) => new EqualsEqualsEqualsHelper(options),
  equalsEqualsEqualsNumber: new EqualsEqualsEqualsNumberHelper(),
  equalsEqualsEqualsSameType: new EqualsEqualsEqualsSameTypeHelper(),
  equalsEqualsEqualsUnknown: new EqualsEqualsEqualsUnknownHelper(),
  equalsEquals: (options: EqualsEqualsHelperOptions) => new EqualsEqualsHelper(options),
  lessThan: (options) => new LessThanHelper(options),
  processStatements: (options) => new ProcessStatementsHelper(options),
  bindFunctionThis: (options) => new BindFunctionThisHelper(options),
  bindFunctionObjectThis: (options: BindFunctionObjectThisHelperOptions) => new BindFunctionObjectThisHelper(options),
  createFunction: (options: CreateFunctionHelperOptions) => new CreateFunctionHelper(options),
  createFunctionObjectBase: (options) => new CreateFunctionObjectBaseHelper(options),
  createFunctionObject: new CreateFunctionObjectHelper(),
  function: (options) => new FunctionHelper(options),
  args: new ArgumentsHelper(),
  parameters: new ParametersHelper(),
  call: new CallHelper(),
  invokeCall: (options?: InvokeHelperBaseOptions) => new InvokeCallHelper(options),
  invokeConstruct: (options?: InvokeHelperBaseOptions) => new InvokeConstructHelper(options),
  forLoop: (options) => new ForLoopHelper(options),
  if: (options) => new IfHelper(options),
  case: (cases: Case[], defaultCase: () => void) => new CaseHelper(cases, defaultCase),
  createCompletion: new CreateCompletionHelper(),
  createNormalCompletion: new CreateNormalCompletionHelper(),
  createThrowCompletion: new CreateThrowCompletionHelper(),
  getCompletionError: new GetCompletionErrorHelper(),
  getCompletionVal: new GetCompletionValHelper(),
  handleCompletion: new HandleCompletionHelper(),
  pickCompletionVal: new PickCompletionValHelper(),
  throw: new ThrowHelper(),
  throwTypeError: new ThrowTypeErrorHelper(),
  createBoolean: new CreateBooleanHelper(),
  createNull: new CreateNullHelper(),
  createNumber: new CreateNumberHelper(),
  createObject: new CreateObjectHelper(),
  createString: new CreateStringHelper(),
  createSymbol: new CreateSymbolHelper(),
  createUndefined: new CreateUndefinedHelper(),
  isBoolean: new IsBooleanHelper(),
  isNull: new IsNullHelper(),
  isNumber: new IsNumberHelper(),
  isObject: new IsObjectHelper(),
  isString: new IsStringHelper(),
  isSymbol: new IsSymbolHelper(),
  isUndefined: new IsUndefinedHelper(),
  isNullOrUndefined: new IsNullOrUndefinedHelper(),
  isSameType: new IsSameTypeHelper(),
  getBoolean: new GetBooleanHelper(),
  getNumber: new GetNumberHelper(),
  getString: new GetStringHelper(),
  getSymbol: new GetSymbolHelper(),
  getObject: new GetObjectHelper(),
  toBoolean: new ToBooleanHelper(),
  toString: new ToStringHelper(),
  toNumber: new ToNumberHelper(),
  toObject: new ToObjectHelper(),
  toPrimitive: (options) => new ToPrimitiveHelper(options),
  getSymbolObject: new GetSymbolObjectHelper(),
  getSymbolObjectProperty: new GetSymbolObjectPropertyHelper(),
  setSymbolObjectProperty: new SetSymbolObjectPropertyHelper(),
  getPropertyObject: new GetPropertyObjectHelper(),
  getPropertyObjectProperty: new GetPropertyObjectPropertyHelper(),
  setPropertyObjectProperty: new SetPropertyObjectPropertyHelper(),
  getInternalObject: new GetInternalObjectHelper(),
  getInternalObjectProperty: new GetInternalObjectPropertyHelper(),
  setInternalObjectProperty: new SetInternalObjectPropertyHelper(),
  shallowCloneObject: new ShallowCloneObjectHelper(),
  shallowCloneObj: new ShallowCloneObjHelper(),
  unwrapType: new UnwrapTypeHelper(),
  unwrapVal: new UnwrapValHelper(),
  instanceof: new InstanceofHelper(),

  addDataArray: new AddDataArrayHelper(),
  createArray: new CreateArrayHelper(),
  getDataArray: new GetDataArrayHelper(),
  getArrayIndex: new GetArrayIndexHelper(),
  setArrayIndex: new SetArrayIndexHelper(),

  addArrayObject: new AddArrayObjectHelper(),
  addBooleanObject: new AddBooleanObjectHelper(),
  addNumberObject: new AddNumberObjectHelper(),
  addObjectObject: new AddObjectObjectHelper(),
  addStringObject: new AddStringObjectHelper(),
  addSymbolObject: new AddSymbolObjectHelper(),
  createGlobalObject: new CreateGlobalObjectHelper(),
  globalProperties: GLOBAL_PROPERTIES,
});
