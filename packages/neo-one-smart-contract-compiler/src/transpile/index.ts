import AST, { ClassDeclaration } from 'ts-simple-ast';

import { TranspilerContext } from './TranspilerContext';
import { TranspileResult } from './types';

export interface TranspileOptions {
  readonly ast: AST;
  readonly clazz: ClassDeclaration;
}

export const transpile = async ({ ast, clazz }: TranspileOptions): Promise<TranspileResult> => {
  const context = await TranspilerContext.create({ ast, clazz });

  return context.process();
};
