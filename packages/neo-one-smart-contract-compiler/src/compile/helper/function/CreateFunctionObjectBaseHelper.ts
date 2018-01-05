import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { FuncProperty } from './InternalFunctionProperties';

export interface CreateFunctionObjectBaseHelperOptions {
  property: FuncProperty;
  body: () => void;
}

// Input: []
// Output: [objectVal]
export class CreateFunctionObjectBaseHelper extends Helper<Node> {
  private property: FuncProperty;
  private body: () => void;

  constructor({ property, body }: CreateFunctionObjectBaseHelperOptions) {
    super();
    this.property = property;
    this.body = body;
  }

  public emit(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
  ): void {
    if (options.pushValue) {
      // [objectVal]
      sb.emitHelper(node, options, sb.helpers.createObject);
      // [objectVal, objectVal]
      sb.emitOp(node, 'DUP');
      // ['call', objectVal, objectVal]
      sb.emitPushString(node, this.property);

      /* create function */
      // [farr, 'call', objectVal, objectVal]
      sb.emitHelper(node, options, sb.helpers.createFunction({ body: this.body }));
      // [objectVal]
      sb.emitHelper(node, options, sb.helpers.setInternalObjectProperty);
    }
  }
}
