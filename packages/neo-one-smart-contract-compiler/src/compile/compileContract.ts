import { Node } from 'ts-simple-ast';

import { Context } from '../Context';

import { compile } from './compile';
import * as constants from '../constants';
import { ScriptBuilder } from './sb';
import { CompileResult } from './types';

export interface CompileContractOptions {
  code: string;
  context?: Context | undefined;
}

export const compileContract = ({ code, context }: CompileContractOptions): CompileResult => compile({
  code,
  context,
  handleComplete: (sb: ScriptBuilder, node: Node) => {
    sb.scope.get(sb, node, sb.pushValueOptions({}), constants.MAIN_FUNCTION);
    sb.emitPushInt(node, 0);
    sb.emitOp(node, 'PICKITEM');
    sb.emitCall(node);
  },
});
