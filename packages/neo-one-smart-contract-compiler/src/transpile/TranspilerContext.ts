// tslint:disable ban-types no-bitwise
import { ABIEvent, ABIFunction, ABIParameter, ABIReturn } from '@neo-one/client';
import AST, {
  ClassDeclaration,
  ConstructorDeclaration,
  Decorator,
  FunctionDeclarationStructure,
  Identifier,
  Node,
  SourceFile,
  Symbol,
  Type,
  TypeGuards,
  Signature,
  Statement,
  printNode,
  ParameterDeclaration,
  ts,
} from 'ts-simple-ast';

import { DiagnosticCode } from '../DiagnosticCode';
import { Context } from '../Context';
import { InternalNEOHelpers } from '../InternalNEOHelpers';
import { Transpiler } from './Transpiler';
import { TranspileResult } from './types';

import * as constants from '../constants';
import * as symbols from '../symbols';
import declarationTranspilers from './declaration';
import expressionTranspilers from './expression';
import * as typeUtils from '../typeUtils';
import * as utils from '../utils';
import { visit } from './visit';
import { visitEachChild } from './visitor';

const transpilers = [
  declarationTranspilers,
  expressionTranspilers,
];

export interface Transpilers {
  [kind: number]: Transpiler<any, any>;
}

export interface TranspilerContextOptions {
  readonly ast: AST;
  readonly outputAST: AST;
  readonly clazz: ClassDeclaration;
  readonly neo: symbols.NEONamespace;
  readonly globals: symbols.Globals;
  readonly outputNEO: symbols.InternalNEONamespace;
  readonly outputGlobals: symbols.Globals;
}

export interface TranspilerContextCreateOptions {
  readonly ast: AST;
  readonly clazz: ClassDeclaration;
}

export interface ContractFunction {
  readonly name: string;
  readonly parameterTypeNodes?: ts.TypeNode[] | undefined;
  readonly abi: ABIFunction;
  readonly isVoidReturn?: boolean | undefined;
}

export interface CreateNEOCallOptions {
  readonly method: Symbol;
  readonly args?: ts.Expression[] | undefined;
  readonly typeArguments?: ts.TypeNode[] | undefined;
}

export interface CreateGetStorageOptions {
  readonly prefix: string;
  readonly keys?: ts.Expression | undefined;
  readonly type: ts.TypeNode;
}

export interface CreatePutStorageOptions {
  readonly prefix: string;
  readonly keys?: ts.Expression | undefined;
  readonly value: ts.Expression;
}

export interface CreateDeleteStorageOptions {
  readonly prefix: string;
  readonly keys?: ts.Expression | undefined;
}

export interface AddFunctionOptions {
  readonly name: string;
  readonly statements: Array<Statement | ts.Statement | undefined>;
  readonly parameters?: Array<ParameterDeclaration | ts.ParameterDeclaration | undefined> | undefined;
  readonly returnType: string | undefined;
}

export class TranspilerContext extends InternalNEOHelpers(Context) {
  public static async create({
    ast,
    clazz,
  }: TranspilerContextCreateOptions): Promise<TranspilerContext> {
    const outputAST = new AST({ compilerOptions: ast.getCompilerOptions() });
    const globals = symbols.getGlobals(ast);
    const outputGlobals = symbols.getGlobals(outputAST);
    const [neo, outputNEO] = await Promise.all([
      symbols.getNEONamespace(ast),
      symbols.getInternalNEONamespace(outputAST),
    ]);

    return new TranspilerContext({
      ast,
      clazz,
      neo,
      globals,
      outputAST,
      outputNEO,
      outputGlobals,
    });
  }

  public readonly clazz: ClassDeclaration;
  public readonly neo: symbols.NEONamespace;
  public readonly globals: symbols.Globals;
  public readonly outputNEO: symbols.InternalNEONamespace;
  public readonly internalNEO: symbols.InternalNEONamespace;
  public readonly outputGlobals: symbols.Globals;
  private readonly ast: AST;
  private readonly outputAST: AST;
  private readonly output: SourceFile;
  private readonly transpilers: Transpilers;
  private readonly nameCounts: { [name: string]: number } = {};
  private readonly names: { [fullyQualifiedName: string]: string } = {};
  private readonly constantFunctions: { [name: string]: boolean } = {};
  private readonly events: { [name: string]: ABIEvent } = {};
  private readonly cachedResults: Map<Node, ts.Node | undefined> = new Map();

  private constructor({
    ast,
    clazz,
    neo,
    globals,
    outputAST,
    outputNEO,
    outputGlobals,
  }: TranspilerContextOptions) {
    super();
    this.ast = ast;
    this.clazz = clazz;
    this.neo = neo;
    this.globals = globals;
    this.outputAST = outputAST;
    this.outputNEO = outputNEO;
    this.internalNEO = outputNEO;
    this.outputGlobals = outputGlobals;
    this.output = this.ast.createSourceFile('output.ts');
    this.transpilers = (transpilers as Array<Array<new () => Transpiler<any, any>>>)
      .reduce((acc, kindTranspilers) => acc.concat(kindTranspilers), [] as Array<new () => Transpiler<any, any>>)
      .reduce(
        (acc, KindTranspiler) => {
          const kindTranspiler = new KindTranspiler();
          if (acc[kindTranspiler.kind] != null) {
            throw new Error(
              `Found duplicate transpiler for kind ${kindTranspiler.kind}`,
            );
          }

          acc[kindTranspiler.kind] = kindTranspiler;
          return acc;
        },
        {} as Transpilers,
    );
  }

  public process(): TranspileResult {
    this.output.addImportDeclaration({
      namespaceImport: this.getNameForSymbol(this.outputNEO.symbol),
      moduleSpecifier: '@neo-one/smart-contract-internal',
    });

    const functionSymbols = this.clazz.getType().getProperties()
      .filter((property) => property.hasFlags(ts.SymbolFlags.Method))
      .filter((property) => {
        const decls = property.getDeclarations();
        return (
          decls.length === 1 &&
          (decls[0].getCombinedModifierFlags() & ts.ModifierFlags.Public) !== 0
        );
      });

    let functions = functionSymbols.map(
      (symbol) => this.processContractFunction(symbol),
    ).filter(utils.notNull);
    const getPropertySymbols = this.clazz.getType().getProperties()
      .filter((property) => property.hasFlags(ts.SymbolFlags.Property))
      .filter((property) => {
        const decls = property.getDeclarations();
        return (
          decls.length === 1 &&
          (decls[0].getCombinedModifierFlags() & ts.ModifierFlags.Public) !== 0
        );
      });
    functions = functions.concat(
      getPropertySymbols.map((symbol) => this.processContractGetProperty(symbol))
        .filter(utils.notNull),
    );
    const deploy = this.processContractDeploy();
    const getOwnerSymbol = this.clazz.getType()
      .getProperty(this.neo.smartContract.getOwner.getName());
    if (getOwnerSymbol == null) {
      this.reportError(
        this.clazz,
        'Could not find getOwner function',
        DiagnosticCode.SOMETHING_WENT_WRONG,
      );
    } else {
      this.transpile(getOwnerSymbol.getDeclarations()[0]);

      this.addMain(
        deploy == null ? functions : functions.concat([deploy]),
        this.createIdentifier(getOwnerSymbol.getDeclarations()[0]),
      );
    }

    return {
      ast: this.outputAST,
      sourceFile: this.output,
      abi: {
        deploy: deploy == null ? undefined : deploy.abi,
        functions: functions.map((contractFunction) => contractFunction.abi),
        events: Object.values(this.events),
      },
    };
  }

  public transpile<TSNode extends ts.Node>(node: Node<TSNode>): TSNode | undefined {
    if (this.cachedResults.has(node)) {
      return this.cachedResults.get(node) as any;
    }
    const transpiler = this.transpilers[node.getKind()];

    let result;
    if (transpiler == null) {
      if (TypeGuards.isTypeNode(node)) {
        const type = this.getType(node);
        if (type != null && this.isValidValueType(node, type)) {
          const transpiled = this.transpileType(node, type);
          if (transpiled != null) {
            return this.getTypeNodeFromType(transpiled) as any;
          }
        }
      }

      result = this.visitChildren(node);
    } else {
      result = transpiler.transpile(this, node);
    }

    this.cachedResults.set(node, result);
    return result;
  }

  public visitChildren<TSNode extends ts.Node>(node: Node<TSNode>): TSNode | undefined {
    return visitEachChild(this, node, (childNode) => this.transpile(childNode)) as TSNode;
  }

  public transpileType(node: Node, type: Type | undefined): ts.Type | undefined {
    if (type == null) {
      return undefined;
    }

    if (this.isArrayType(node, type)) {
      const value = this.transpileType(node, type.getTypeArguments()[0]);
      if (value == null) {
        return undefined;
      }
      return this.getTypeFromTypeNode(
        ts.createArrayTypeNode(this.getTypeNodeFromType(value)),
      );
    } else if (this.isBooleanType(node, type)) {
      return type.compilerType;
    } else if (this.isStringType(node, type)) {
      return type.compilerType;
    } else if (this.isFixedType(node, type)) {
      return type.getUnionTypes()[0].compilerType;
    } else if (this.isBufferLikeType(node, type)) {
      return this.getBufferType();
    } else {
      this.reportError(
        node,
        'Invalid value type.',
        DiagnosticCode.INVALID_VALUE_TYPE,
      );
      return undefined;
    }
  }

  public addFunction({
    name,
    parameters,
    statements,
    returnType,
  }: AddFunctionOptions): void {
    this.addFunctionBase({
      name,
      parameters: (parameters || [])
        .filter(utils.notNull)
        .map((param) => param instanceof ParameterDeclaration ? this.transpile(param) : param)
        .filter(utils.notNull)
        .map((param) => ({
          name: this.getText(param.name),
          type: param.type == null ? undefined : this.getText(param.type),
        })),
      bodyText: statements
        .filter(utils.notNull)
        .map((statement) => statement instanceof Node ? this.transpile(statement) : statement)
        .filter(utils.notNull)
        .map((statement) => this.getText(statement))
        .join('\n'),
      returnType,
    });
  }

  public addFunctionBase(structure: FunctionDeclarationStructure): void {
    const func = this.output.addFunction(structure);

    const constant = func.getStatements().every((statement) => {
      let modifiesStorage = false;
      visit(statement, (visited) => {
        if (this.isStoragePut(visited)) {
          modifiesStorage = true;
          return true;
        }

        if (TypeGuards.isCallExpression(visited)) {
          const isConstant = this.findIsConstantFunction(visited.getExpression());
          if (isConstant == null) {
            this.reportError(
              visited,
              'Could not determine if call modifies storage.',
              DiagnosticCode.INVALID_CONTRACT_METHOD,
            );
          } else if (!isConstant) {
            modifiesStorage = true;
            return true;
          }
        }

        return false;
      });
      return !modifiesStorage;
    });

    this.constantFunctions[structure.name] = constant;
  }

  public isConstantFunction(func: string): boolean {
    return !!this.constantFunctions[func];
  }

  public createIdentifier(node: Node): ts.Identifier {
    return ts.createIdentifier(this.getName(node));
  }

  public createIdentifierForSymbol(symbol: Symbol): ts.Identifier {
    return ts.createIdentifier(this.getNameForSymbol(symbol));
  }

  public getName(node: Node): string {
    const symbol = this.getSymbol(node);
    if (symbol == null) {
      throw new Error(`Could not find symbol for Node ${node.getText()}`);
    }

    return this.getNameForSymbol(symbol);
  }

  public getNameForSymbol(symbol: Symbol): string {
    const fullName = symbol.getFullyQualifiedName();
    let name = this.names[fullName];
    if (name == null) {
      let count = this.nameCounts[fullName];
      if (count == null) {
        count = 0;
      }

      name = `${symbol.getName()}_${count}`;
      this.names[fullName] = name;
      this.nameCounts[name] = count + 1;
    }

    return name;
  }

  public getText(node: ts.Node): string {
    return printNode(node);
  }

  public getTypeText(type: ts.Type): string {
    return this.ast.getTypeChecker().compilerObject.typeToString(type);
  }

  public isValidStorageType(node: Node): boolean {
    return (
      this.isStoragePrimitiveType(node) ||
      this.isStorageComplexType(node)
    );
  }

  public isStoragePrimitiveType(node: Node): boolean {
    const type = this.getType(node);
    return (
      this.isBufferLikeType(node, type) ||
      this.isPrimitiveType(node, type)
    );
  }

  public isStorageComplexType(node: Node): boolean {
    const type = this.getType(node);
    return (
      this.isMapStorageType(node, type) ||
      this.isArrayStorageType(node, type) ||
      this.isSetStorageType(node, type)
    );
  }

  public isStorageComplexMutateMethod(node: Identifier): boolean {
    return (
      this.isMapStorageDelete(node) ||
      this.isMapStorageSet(node) ||
      this.isSetStorageDelete(node) ||
      this.isSetStorageAdd(node)
    );
  }

  public isVerifyDecorator(decorator: Decorator): boolean {
    const symbol = this.getSymbol(decorator);
    return symbol != null && symbol.equals(this.neo.verify);
  }

  public isDerivedSmartContract(node: Node | undefined): boolean {
    return this.isDerivedSymbol(node, this.neo.smartContract.symbol);
  }

  public isDerivedEvent(node: Node | undefined): boolean {
    return this.isDerivedSymbol(node, this.neo.event.symbol);
  }

  public isFixedType(node: Node, type: Type | undefined): boolean {
    if (type == null) {
      return false;
    }

    if (!type.isUnionType()) {
      return false;
    }

    const symbol = type.getAliasSymbol();
    return symbol != null && symbol.equals(this.neo.fixed.symbol);
  }

  public isNumberLiteralType(node: Node, type: Type | undefined): boolean {
    if (type == null) {
      return false;
    }

    return (type.getFlags() & ts.TypeFlags.NumberLiteral) !== 0;
  }

  public getFixedDecimals(type: Type): number {
    return (type.getUnionTypes()[1].getIntersectionTypes()[1].compilerType as any).value;
  }

  public isAddressType(node: Node, type: Type | undefined): boolean {
    return this.isType(node, type, this.neo.address.symbol);
  }

  public isContractType(node: Node, type: Type | undefined): boolean {
    return this.isType(node, type, this.neo.contract.symbol);
  }

  public isHash256Type(node: Node, type: Type | undefined): boolean {
    return this.isType(node, type, this.neo.hash256.symbol);
  }

  public isSignatureType(node: Node, type: Type | undefined): boolean {
    return this.isType(node, type, this.neo.signature.symbol);
  }

  public isPublicKeyType(node: Node, type: Type | undefined): boolean {
    return this.isType(node, type, this.neo.publicKey.symbol);
  }

  public isByteArrayType(node: Node, type: Type | undefined): boolean {
    return this.isType(node, type, this.globals.buffer.symbol);
  }

  public isBufferLikeType(node: Node, type: Type | undefined): boolean {
    return (
      this.isAddressType(node, type) ||
      this.isContractType(node, type) ||
      this.isHash256Type(node, type) ||
      this.isSignatureType(node, type) ||
      this.isPublicKeyType(node, type) ||
      this.isByteArrayType(node, type)
    );
  }

  public isBooleanType(node: Node, type: Type | undefined): boolean {
    return type != null && type.isBooleanType();
  }

  public isStringType(node: Node, type: Type | undefined): boolean {
    return typeUtils.isString(type);
  }

  public isPrimitiveType(node: Node, type: Type | undefined): boolean {
    return (
      this.isBooleanType(node, type) ||
      this.isStringType(node, type) ||
      this.isFixedType(node, type)
    );
  }

  public isArrayType(node: Node, type: Type | undefined): boolean {
    return type != null && (
      type.isArrayType() ||
      (type.getObjectFlags() & ts.ObjectFlags.Tuple) !== 0 || (
        // TODO: This seems to resolve issues with creating storage keys and detecting array/tuple types
        type.getTargetType() != null && (
          type.getTargetTypeOrThrow().isArrayType() ||
          (type.getTargetTypeOrThrow().getObjectFlags() & ts.ObjectFlags.Tuple) !== 0
        )
      )
    );
  }

  public isValidValueType(node: Node, type: Type | undefined): boolean {
    return (
      this.isPrimitiveType(node, type) ||
      this.isArrayType(node, type) ||
      this.isBufferLikeType(node, type)
    );
  }

  public isMapStorageType(node: Node, type: Type | undefined): boolean {
    return this.isType(node, type, this.neo.mapStorage.symbol);
  }

  public getMapStorageValueType(node: Node): ts.Type | undefined {
    const type = this.getType(node);
    if (type == null) {
      return undefined;
    }

    if (!this.isMapStorageType(node, type)) {
      return undefined;
    }

    return this.transpileType(node, type.getTypeArguments()[1]);
  }

  public isSetStorageType(node: Node, type: Type | undefined): boolean {
    return this.isType(node, type, this.neo.setStorage.symbol);
  }

  public isArrayStorageType(node: Node, type: Type | undefined): boolean {
    return this.isType(node, type, this.neo.arrayStorage.symbol);
  }

  public isMapStorageDelete(node: Node): boolean {
    return this.isSymbol(node, this.neo.mapStorage.delete);
  }

  public isMapStorageSet(node: Node): boolean {
    return this.isSymbol(node, this.neo.mapStorage.set);
  }

  public isSetStorageDelete(node: Node): boolean {
    return this.isSymbol(node, this.neo.setStorage.delete);
  }

  public isSetStorageAdd(node: Node): boolean {
    return this.isSymbol(node, this.neo.setStorage.add);
  }

  public isMapStorageHas(node: Node): boolean {
    return this.isSymbol(node, this.neo.mapStorage.has);
  }

  public isSetStorageHas(node: Node): boolean {
    return this.isSymbol(node, this.neo.setStorage.has);
  }

  public isMapStorageGet(node: Node): boolean {
    return this.isSymbol(node, this.neo.mapStorage.get);
  }

  public isNEONamespace(node: Node): boolean {
    return this.isSymbol(node, this.neo.symbol);
  }

  public isVerifySender(node: Node): boolean {
    return this.isSymbol(node, this.neo.verifySender);
  }

  public isNotify(node: Node): boolean {
    return this.isSymbol(node, this.neo.notify);
  }

  public isGetCurrentTime(node: Node): boolean {
    return this.isSymbol(node, this.neo.getCurrentTime);
  }

  public isGetCurrentTransaction(node: Node): boolean {
    return this.isSymbol(node, this.neo.getCurrentTransaction);
  }

  public isGetContract(node: Node): boolean {
    return this.isSymbol(node, this.neo.smartContract.getContract);
  }

  public getTypeFromTypeNode(node: ts.TypeNode): ts.Type {
    return this.ast.getTypeChecker().compilerObject.getTypeFromTypeNode(node);
  }

  public getTypeNodeFromType(type: ts.Type): ts.TypeNode {
    return this.ast.getTypeChecker().compilerObject.typeToTypeNode(type);
  }

  public getBooleanType(): ts.Type {
    return (this.ast.getTypeChecker().compilerObject as any).getBooleanType();
  }

  public getVoidType(): ts.Type {
    return (this.ast.getTypeChecker().compilerObject as any).getVoidType();
  }

  public getBufferType(): ts.Type {
    return this.outputGlobals.buffer.symbol.getDeclaredType().compilerType;
  }

  public createNEOPropertyAccess(method: Symbol): ts.Expression {
    return ts.createPropertyAccess(
      this.createIdentifierForSymbol(this.outputNEO.symbol),
      method.getName(),
    );
  }

  public createNEOCall({
    method,
    args = [],
    typeArguments = [],
  }: CreateNEOCallOptions): ts.CallExpression {
    return ts.createCall(
      this.createNEOPropertyAccess(method),
      typeArguments,
      args,
    );
  }

  public createBufferConcat(expr: ts.Expression): ts.Expression {
    return ts.createCall(
      ts.createPropertyAccess(
        // TODO: What happens if the user uses Buffer as a value?
        ts.createIdentifier(this.outputGlobals.buffer.static.symbol.getName()),
        this.outputGlobals.buffer.static.concat.getName(),
      ),
      undefined,
      [expr],
    );
  }

  public createCastBuffer(expr: ts.Expression): ts.Expression {
    return this.createNEOCall({
      method: this.outputNEO.castBuffer,
      args: [expr],
    });
  }

  public createCastBufferArray(expr: ts.Expression): ts.Expression {
    return this.createNEOCall({
      method: this.outputNEO.castBufferArray,
      args: [expr],
    });
  }

  public createCast(expr: ts.Expression, type: ts.TypeNode): ts.Expression {
    return this.createNEOCall({
      method: this.outputNEO.cast,
      args: [expr],
      typeArguments: [type],
    });
  }

  public createGetStorage({
    prefix,
    keys,
    type,
  }: CreateGetStorageOptions): ts.Expression {
    return this.createNEOCall({
      method: this.outputNEO.getStorage,
      args: [
        this.createStorageKey(prefix, keys),
      ],
      typeArguments: [type],
    });
  }

  public createPutStorage({
    prefix,
    keys,
    value,
  }: CreatePutStorageOptions): ts.Expression {
    return this.createNEOCall({
      method: this.outputNEO.putStorage,
      args: [
        this.createStorageKey(prefix, keys),
        value,
      ],
    });
  }

  public createDeleteStorage({
    prefix,
    keys,
  }: CreateDeleteStorageOptions): ts.Expression {
    return this.createNEOCall({
      method: this.outputNEO.deleteStorage,
      args: [this.createStorageKey(prefix, keys)],
    });
  }

  private createStorageKey(prefix: string, keys?: ts.Expression): ts.Expression {
    if (keys == null) {
      return this.createCastBuffer(ts.createLiteral(prefix));
    }

    return this.createBufferConcat(
      this.createCastBufferArray(ts.createCall(
        ts.createPropertyAccess(
          ts.createArrayLiteral([ts.createLiteral(prefix)]),
          this.outputGlobals.array.concat.getName(),
        ),
        undefined,
        [keys],
      )),
    );
  }

  private addMain(functions: ContractFunction[], getOwnerIdentifier: ts.Identifier): void {
    const func = 'func';
    const args = 'args';
    this.addFunctionBase({
      name: constants.MAIN_FUNCTION,
      parameters: [
        {
          name: func,
          type: 'string',
        },
        {
          name: args,
          type: 'Buffer[]',
        },
      ],
      bodyText: this.getMainBodyText(functions, func, args, getOwnerIdentifier),
      returnType: 'Buffer',
    });
  }

  private getMainBodyText(
    functions: ContractFunction[],
    func: string,
    args: string,
    getOwnerIdentifier: ts.Identifier,
  ): string {
    const verification = this.getVerificationText(functions, func, args, getOwnerIdentifier);
    const application = this.getApplicationText(functions, func, args);
    return `${verification}\n${application}\nthrow 'Unknown function';`;
  }

  private getVerificationText(
    functions: ContractFunction[],
    func: string,
    args: string,
    getOwnerIdentifier: ts.Identifier,
  ): string {
    const checkWitness = ts.createIf(
      this.createNEOCall({
        method: this.outputNEO.checkWitness,
        args: [ts.createCall(getOwnerIdentifier, undefined, [])],
      }),
      ts.createBlock([
        ts.createReturn(
          this.createCastBuffer(ts.createLiteral(true)),
        ),
      ]),
    );
    const funcs = functions
      .filter((contractFunction) => contractFunction.abi.verify)
      .map((contractFunction) =>
        this.createMainFunction(contractFunction, func, args, true),
    );

    return this.getText(ts.createIf(
      this.createNEOCall({ method: this.outputNEO.isVerification }),
      ts.createBlock(funcs.concat([checkWitness])),
    ));
  }

  private getApplicationText(
    functions: ContractFunction[],
    func: string,
    args: string,
  ): string {
    const funcs = functions
      .map((contractFunction) =>
        this.createMainFunction(contractFunction, func, args, false),
    );

    return this.getText(ts.createIf(
      this.createNEOCall({ method: this.outputNEO.isApplication }),
      ts.createBlock(funcs),
    ));
  }

  private createMainFunction(
    contractFunction: ContractFunction,
    func: string,
    args: string,
    isVerify: boolean,
  ): ts.Statement {
    const call = ts.createCall(
      ts.createIdentifier(contractFunction.name),
      undefined,
      (contractFunction.parameterTypeNodes || []).map((typeNode, idx) => this.createCast(
        ts.createElementAccess(
          ts.createIdentifier(args),
          idx,
        ),
        typeNode,
      )),
    );
    let statements: ts.Statement[];
    if (isVerify || contractFunction.isVoidReturn) {
      statements = [ts.createStatement(call), ts.createReturn(this.createCastBuffer(ts.createLiteral(true)))];
    } else {
      statements = [ts.createReturn(this.createCastBuffer(call))];
    }

    return ts.createIf(
      ts.createBinary(
        ts.createIdentifier(func),
        ts.SyntaxKind.EqualsEqualsEqualsToken,
        ts.createLiteral(contractFunction.abi.name),
      ),
      ts.createBlock(statements),
    );
  }

  private processContractFunction(symbol: Symbol): ContractFunction | undefined {
    const declarations = symbol.getDeclarations()
      .filter((decl) =>
        TypeGuards.isMethodDeclaration(decl) &&
        decl.isImplementation(),
    );
    if (declarations.length !== 1) {
      this.reportError(
        symbol.getDeclarations()[0],
        'Invalid contract function. Resolved to multiple implementation declarations.',
        DiagnosticCode.INVALID_CONTRACT_METHOD,
      );
      return undefined;
    }
    const declaration = declarations[0];

    this.transpile(declaration);

    const functionType = this.getTypeOfSymbol(symbol, declaration);
    if (functionType == null) {
      return undefined;
    }

    const callSignatures = functionType.getCallSignatures();
    if (callSignatures.length !== 1) {
      this.reportError(
        declaration,
        'Invalid contract function. Resolved to multiple call signatures.',
        DiagnosticCode.INVALID_CONTRACT_METHOD,
      );
      return undefined;
    }
    const callSignature = callSignatures[0];

    const functionName = this.getName(declaration);
    const name = symbol.getName();
    const constant = this.isConstantFunction(functionName);

    if (!TypeGuards.isMethodDeclaration(declaration)) {
      throw new Error('For TypeScript');
    }

    const verify = declaration.getDecorators().some((decorator) => this.isVerifyDecorator(decorator));
    const parameters = callSignature.getParameters().map(
      (param) => this.getABIParameter(param),
    );
    const parameterTypeNodes = this.getContractParameterTypeNodes(callSignature);
    const isVoidReturn = this.isVoidType(declaration, callSignature.getReturnType());
    const returnType = this.getABIReturn(declaration, callSignature.getReturnType());
    if (
      parameters.every((parameter) => parameter != null) &&
      parameterTypeNodes.every((typeNode) => typeNode != null) &&
      returnType != null
    ) {
      const abi = {
        name,
        constant,
        verify,
        parameters: parameters.filter(utils.notNull),
        returnType,
      };
      return {
        name: functionName,
        parameterTypeNodes: parameterTypeNodes.filter(utils.notNull),
        abi,
        isVoidReturn,
      };
    }

    return undefined;
  }

  private processContractGetProperty(symbol: Symbol): ContractFunction | undefined {
    const name = this.getNameForSymbol(symbol);
    const decl = this.assertNotNull(symbol.getDeclarations()[0]);
    const type = this.getTypeOfSymbol(symbol, decl);

    if (type != null) {
      this.addFunction({
        name,
        statements: [ts.createReturn(this.createGetStorage({
          prefix: symbol.getName(),
          type: this.getTypeNodeFromType(this.getBufferType()),
        }))],
        returnType: this.getText(this.getTypeNodeFromType(this.getBufferType())),
      });

      const returnType = this.getABIReturn(decl, type);

      if (returnType != null) {
        return {
          name,
          abi: {
            name: symbol.getName(),
            constant: true,
            returnType,
          },
        };
      }
    }

    return undefined;
  }

  private processContractDeploy(): ContractFunction | undefined {
    const declarations = this.clazz.getType().getProperties().map(
      (property) => {
        const decl = property.getDeclarations()[0];
        if (
          decl == null ||
          property.getDeclarations().length !== 1 ||
          !this.isStoragePrimitiveType(decl) ||
          !TypeGuards.isPropertyDeclaration(decl) ||
          decl.getInitializer() == null
        ) {
          return undefined;
        }

        return decl;
      },
    ).filter(utils.notNull);
    const constructor = this.getResolvedConstructor(this.clazz, this.clazz.getType());
    if (constructor == null && declarations.length === 0) {
      return undefined;
    }

    let statements = declarations.map(
      (decl) => ts.createStatement(this.createPutStorage({
        prefix: decl.getName(),
        value: this.transpile(decl.getInitializerOrThrow()) as ts.Expression,
      })) as ts.Statement,
    );
    let parameters: Array<ParameterDeclaration | undefined> = [];
    let abiParameters: Array<ABIParameter | undefined> = [];
    let parameterTypeNodes: Array<ts.TypeNode | undefined> = [];
    if (constructor != null) {
      statements = statements.concat(constructor.getStatements().map(
        (statement) => this.transpile(statement) as ts.Statement,
      ));
      const type = this.getTypeOfSymbol(this.getSymbol(this.clazz), this.clazz);

      if (type != null) {
        const constructSignatures = type.getConstructSignatures();
        if (constructSignatures.length !== 1) {
          this.reportError(
            this.clazz,
            'Invalid contract constructor. Resolved to multiple call signatures.',
            DiagnosticCode.INVALID_CONTRACT_METHOD,
          );
          return undefined;
        }
        const constructSignature = constructSignatures[0];

        parameters = constructSignature.getParameters().map(
          (symbol) => symbol.getDeclarations()[0] as ParameterDeclaration,
        );
        abiParameters = constructSignature.getParameters().map(
          (param) => this.getABIParameter(param),
        );
        parameterTypeNodes = this.getContractParameterTypeNodes(constructSignature);
      }
    }

    const name = 'deploy';
    if (parameters.every((parameter) => parameter != null)) {
      this.addFunction({
        name,
        parameters,
        statements,
        returnType: this.getText(this.getTypeNodeFromType(this.getVoidType())),
      });
    }

    if (
      parameters.every((parameter) => parameter != null) &&
      parameterTypeNodes.every((typeNode) => typeNode != null)
    ) {
      const abi = {
        name,
        constant: false,
        verify: false,
        parameters: abiParameters.filter(utils.notNull),
        returnType: { type: 'Void' } as ABIReturn,
      };
      return {
        name,
        parameterTypeNodes: parameterTypeNodes.filter(utils.notNull),
        abi,
        isVoidReturn: true,
      };
    }

    return undefined;
  }

  private getContractParameterTypeNodes(signature: Signature): Array<ts.TypeNode | undefined> {
    return signature.getParameters().map((param) => {
      const decl = this.assertNotNull(param.getDeclarations()[0]);
      const type = this.getTypeOfSymbol(param, decl);
      const transpiled = this.transpileType(decl, type);
      if (transpiled != null) {
        return this.getTypeNodeFromType(transpiled);
      }

      return undefined;
    });
  }

  private getABIParameter(
    param: Symbol,
  ): ABIParameter | undefined {
    const name = param.getName();

    const decl = this.assertNotNull(param.getDeclarations()[0]);
    const ret = this.getABIReturn(decl, this.getTypeOfSymbol(param, decl));
    if (ret == null) {
      return undefined;
    }
    return { ...ret, name };
  }

  private getABIReturn(
    node: Node,
    type: Type | undefined,
  ): ABIReturn | undefined {
    if (type == null) {
      return undefined;
    }

    if (this.isArrayType(node, type)) {
      const value = this.getABIReturn(node, type.getTypeArguments()[0]);
      if (value == null) {
        return undefined;
      }
      return { type: 'Array', value };
    } else if (this.isBooleanType(node, type)) {
      return { type: 'Boolean' };
    } else if (this.isStringType(node, type)) {
      return { type: 'String' };
    } else if (this.isNumberLiteralType(node, type)) {
      return { type: 'Integer', decimals: 0 };
    } else if (this.isFixedType(node, type)) {
      const decimals = this.getFixedDecimals(type);
      return { type: 'Integer', decimals };
    } else if (this.isByteArrayType(node, type)) {
      return { type: 'ByteArray' };
    } else if (this.isAddressType(node, type) || this.isContractType(node, type)) {
      return { type: 'Hash160' };
    } else if (this.isHash256Type(node, type)) {
      return { type: 'Hash256' };
    } else if (this.isSignatureType(node, type)) {
      return { type: 'Signature' };
    } else if (this.isPublicKeyType(node, type)) {
      return { type: 'PublicKey' };
    } else if (this.isVoidType(node, type)) {
      return { type: 'Boolean' };
    } else {
      this.reportError(
        node,
        'Invalid contract type.',
        DiagnosticCode.INVALID_CONTRACT_TYPE,
      );
      return undefined;
    }
  }

  private findIsConstantFunction(node: Node): boolean | undefined {
    if (TypeGuards.isConditionalExpression(node)) {
      return (
        this.findIsConstantFunction(node.getWhenTrue()) &&
        this.findIsConstantFunction(node.getWhenFalse())
      );
    }

    const symbol = this.getSymbol(node);
    if (symbol != null) {
      const declaration = this.getAnyDeclaration(node, symbol);
      if (declaration != null) {
        if (TypeGuards.isFunctionDeclaration(declaration)) {
          if (this.isConstantFunction(declaration.getName())) {
            return true;
          }
        }

        if (TypeGuards.isVariableDeclaration(declaration)) {
          const parent = declaration.getParent();
          if (
            parent != null &&
            TypeGuards.isVariableDeclarationList(parent) &&
            parent.getDeclarationType() === VariableDeclarationType.Const
          ) {
            const initializer = declaration.getInitializer();
            if (initializer != null) {
              return this.findIsConstantFunction(initializer);
            }
          }
        }
      }
    }

    return undefined;
  }

  private isType(node: Node, type: Type | undefined, symbol: Symbol): boolean {
    if (type == null) {
      return false;
    }

    const typeSymbol = this.getSymbolForType(node, type);
    return typeSymbol != null && typeSymbol.equals(symbol);
  }

  private isSymbol(node: Node, symbol: Symbol): boolean {
    const nodeSymbol = this.getSymbol(node);
    return nodeSymbol != null && (
      nodeSymbol.equals(symbol) ||
      // TODO: Fix me
      (nodeSymbol.compilerSymbol as any).target === symbol.compilerSymbol
    );
  }

  private isDerivedSymbol(node: Node | undefined, symbol: Symbol): boolean {
    if (node == null) {
      return false;
    }

    const nodeSymbol = this.getSymbol(node);
    if (nodeSymbol == null) {
      return false;
    }

    if (nodeSymbol.equals(symbol)) {
      return true;
    }

    const type = nodeSymbol.getDeclarations()[0];
    return type != null && TypeGuards.isClassDeclaration(type) && type.getBaseTypes().some((baseType) => {
      const baseTypeSymbol = this.getSymbolForType(node, baseType);
      return baseTypeSymbol != null && baseTypeSymbol.getDeclarations().some(
        (decl) => this.isDerivedSymbol(decl, symbol),
      );
    });
  }

  private getResolvedConstructor(node: Node, type: Type): ConstructorDeclaration | undefined {
    const resolvedBaseConstructorType = (type.compilerType as any).resolvedBaseConstructorType;
    if (resolvedBaseConstructorType != null) {
      const signature = resolvedBaseConstructorType.constructSignatures[0];
      if (signature != null && signature.declaration != null) {
        return (node as any).getNodeFromCompilerNode(signature.declaration);
      }
    }

    return undefined;
  }
}
