import AST, { Node } from 'ts-simple-ast';

import { CapturingScriptBuilder, EmittingScriptBuilder, ScriptBuilder } from './sb';
import { Context } from '../Context';
import { CompileResult } from './types';

export interface CompileOptions {
  code: string;
  handleComplete?: (sb: ScriptBuilder, node: Node) => void;
  context?: Context;
}

export const compile = ({
  code,
  handleComplete,
  context = new Context(),
}: CompileOptions): CompileResult => {
  const ast = new AST();
  const node = ast.createSourceFile('code.ts', code);

  const capturingScriptBuilder = new CapturingScriptBuilder(context);
  let onVisit;
  if (handleComplete != null) {
    onVisit = () => handleComplete(capturingScriptBuilder, node);
  }
  capturingScriptBuilder.process(node, onVisit);

  const emittingScriptBuilder = new EmittingScriptBuilder({
    context,
    scopes: capturingScriptBuilder.getScopes(),
  });
  if (handleComplete != null) {
    onVisit = () => handleComplete(emittingScriptBuilder, node);
  }
  emittingScriptBuilder.process(node, onVisit);

  return {
    code: emittingScriptBuilder.getFinalBytecode(),
    diagnostics: context.diagnostics,
  };
};
