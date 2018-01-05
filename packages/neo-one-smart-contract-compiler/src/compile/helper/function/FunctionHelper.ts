import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

export interface FunctionHelperOptions {
  body: () => void;
}

// Input: []
// Output: [jumpTarget]
export class FunctionHelper extends Helper {
  private readonly body: () => void;

  constructor({ body }: FunctionHelperOptions) {
    super();
    this.body = body;
  }

  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (options.pushValue) {
      const jump = sb.jumpTable.add(sb, node, () => {
        this.body();
        sb.emitHelper(node, sb.pushValueOptions(options), sb.helpers.createUndefined);
        sb.emitHelper(node, sb.pushValueOptions(options), sb.helpers.createNormalCompletion);
        sb.emitOp(node, 'RET');
      });
      sb.emitPushInt(node, jump);
    }
  }
}