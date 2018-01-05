// tslint:disable ban-types
import { DiagnosticCategory, Node, Symbol, Type, TypeFlags, TypeGuards, ts } from 'ts-simple-ast';

import { CompilerDiagnostic } from './CompilerDiagnostic';
import { DiagnosticCode } from './DiagnosticCode';
import { InternalNEONamespace } from './symbols';

import * as typeUtils from './typeUtils';

export class Context {
  public readonly internalNEO: InternalNEONamespace;
  public readonly diagnostics: ts.Diagnostic[] = [];

  public reportError(node: Node, message: string, code: DiagnosticCode): void {
    this.diagnostics.push(new CompilerDiagnostic(node, message, code, DiagnosticCategory.Error));
  }

  public reportWarning(node: Node, message: string, code: DiagnosticCode): void {
    this.diagnostics.push(new CompilerDiagnostic(node, message, code, DiagnosticCategory.Warning));
  }

  public reportUnsupported(node: Node): void {
    this.reportError(node, 'Unsupported syntax', DiagnosticCode.UNSUPPORTED_SYNTAX);
  }

  public reportExpectedTranspiled(node: Node): void {
    this.reportError(
      node,
      'Expected syntax to be transpiled. This usually indicates something went wrong ' +
      'during the transpilation step.',
      DiagnosticCode.TRANSPILATION_ERROR,
    );
  }

  public reportTypeError(node: Node): void {
    this.reportError(
      node,
      'Could not infer type. Please add an explicit type annotation.',
      DiagnosticCode.UNKNOWN_TYPE,
    );
  }

  public reportTypeWarning(node: Node): void {
    this.reportWarning(
      node,
      'Could not infer type. Deoptimized implementation will be used. Add an explicit type annotation ' +
      'to optimize the output.',
      DiagnosticCode.UNKNOWN_TYPE,
    );
  }

  public getType(node: Node, required: boolean = false): Type | undefined {
    let type = this.getNotAnyType(node.getType());

    if (type == null && TypeGuards.isExpression(node)) {
      type = this.getNotAnyType(node.getContextualType());
    }

    if (type == null) {
      if (required) {
        this.reportTypeError(node);
      } else {
        this.reportTypeWarning(node);
      }
    }

    return type;
  }

  public getTypeOfSymbol(symbol: Symbol | undefined, node: Node): Type | undefined {
    if (symbol == null) {
      return undefined;
    }

    const type = this.getNotAnyType(symbol.getTypeAtLocation(node));
    if (type == null) {
      this.reportTypeError(node);
    }

    return type;
  }

  public getAnyDeclaration(node: Node, symbol: Symbol): Node | undefined {
    const declarations = symbol.getDeclarations();
    if (declarations.length === 0) {
      this.reportError(
        node,
        'Could not find declaration for symbol.',
        DiagnosticCode.UNKNOWN_SYMBOL,
      );
    }

    return declarations[0];
  }

  public getSymbol(node: Node): Symbol | undefined {
    const symbol = node.getSymbol();
    if (symbol == null) {
      this.reportError(
        node,
        'Could not determine source symbol.',
        DiagnosticCode.UNKNOWN_SYMBOL,
      );

      return undefined;
    }

    const aliased = symbol.getAliasedSymbol();
    if (aliased != null) {
      return aliased;
    }

    return symbol;
  }

  public getSymbolOrThrow(node: Node): Symbol {
    const symbol = this.getSymbol(node);
    if (symbol == null) {
      throw new Error(`Could not find symbol for Node ${node.getText()}`);
    }
    return symbol;
  }

  public getSymbolForType(node: Node, type: Type | undefined): Symbol | undefined {
    if (type == null) {
      return undefined;
    }

    const symbol = type.getSymbol();
    if (symbol == null) {
      this.reportError(
        node,
        'Could not determine source symbol.',
        DiagnosticCode.UNKNOWN_SYMBOL,
      );

      return undefined;
    }

    const aliased = symbol.getAliasedSymbol();
    if (aliased != null) {
      return aliased;
    }

    return symbol;
  }

  public checkNumber(node: Node, type: Type | undefined): void {
    if (!typeUtils.isNumber(type)) {
      this.reportError(node, 'Number type expected', DiagnosticCode.EXPECTED_NUMBER);
    }
  }

  public checkString(node: Node, type: Type | undefined): void {
    if (!typeUtils.isString(type)) {
      this.reportError(node, 'String type expected', DiagnosticCode.EXPECTED_STRING);
    }
  }

  public assertUnreachable(value: never): never {
    throw new Error('Should not be reached.');
  }

  public assertNotNull<T>(value: T | undefined | null): T {
    if (value == null) {
      throw new Error('Something went wrong. Unexpected null.');
    }

    return value;
  }

  public isVoidType(node: Node, type: Type | undefined): boolean {
    if (type == null) {
      return false;
    }

    // tslint:disable-next-line
    return (type.getFlags() & TypeFlags.Void) !== 0;
  }

  private getNotAnyType(type: Type | undefined): Type | undefined {
    // tslint:disable-next-line no-bitwise
    if (type == null || (type.getFlags() & TypeFlags.Any) !== 0) {
      return undefined;
    }

    return type;
  }
}
