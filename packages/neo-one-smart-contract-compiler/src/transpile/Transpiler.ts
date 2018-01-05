import { Node } from 'ts-simple-ast';

import * as ts from 'typescript';

import { TranspilerContext } from './TranspilerContext';

export abstract class Transpiler<TSNode extends ts.Node, T extends Node<TSNode>> {
  public abstract readonly kind: ts.SyntaxKind;
  public abstract transpile(context: TranspilerContext, node: T): TSNode | undefined;
}
