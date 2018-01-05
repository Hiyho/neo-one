import { Node } from 'ts-simple-ast';

import { Helper } from '../../Helper';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';

// Input: [constructorObjectVal, objectVal]
// Output: [boolean]
export class InstanceofHelper extends Helper<Node> {

  public emit(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
  ): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');
      return;
    }

    // ['prototype', constructorObjectVal, objectVal]
    sb.emitPushString(node, 'prototype');
    // [prototypeVal, objectVal]
    sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);
    // [objectVal, prototypeVal]
    sb.emitOp(node, 'SWAP');

    const getPObj = () => {
      // [objectVal]
      sb.emitOp(node, 'DUP');
      // [pobj]
      sb.emitHelper(node, options, sb.helpers.getPropertyObject);
    };

    const prepareLoop = () => {
      // [pobj, objectVal, prototypeVal]
      getPObj();
      // [pobj, pobj, objectVal, prototypeVal]
      getPObj();
      // [objectVal, pobj, pobj, prototypeVal]
      sb.emitOp(node, 'ROT');
      // [3, objectVal, pobj, pobj, prototypeVal]
      sb.emitPushInt(node, 3);
      // [prototypeVal, objectVal, pobj, pobj, prototypeVal]
      sb.emitOp(node, 'PICK');
    };

    // [prototypeVal, objectVal, pobj, pobj, prototypeVal]
    prepareLoop();

    sb.emitHelper(node, options, sb.helpers.forLoop({
      condition: () => {
        // [samePrototype, pobj, pobj, prototypeVal]
        sb.emitOp(node, 'EQUAL');
        // [samePrototype, samePrototype, pobj, pobj, prototypeVal]
        sb.emitOp(node, 'DUP');
        // [notSamePrototype, samePrototype, pobj, pobj, prototypeVal]
        sb.emitOp(node, 'NOT');
        // [pobj, notSamePrototype, samePrototype, pobj, prototypeVal]
        sb.emitOp(node, 'ROT');
        // ['prototype', pobj, notSamePrototype, samePrototype, pobj, prototypeVal]
        sb.emitPushString(node, 'prototype');
        // [hasPrototypeKey, notSamePrototype, samePrototype, pobj, prototypeVal]
        sb.emitOp(node, 'HASKEY');
        // [hasPrototypeAndNotSame, samePrototype, pobj, prototypeVal]
        sb.emitOp(node, 'AND');
      },
      each: () => {
        // [pobj, prototypeVal]
        sb.emitOp(node, 'DROP');
        // ['prototype', pobj, prototypeVal]
        sb.emitPushString(node, 'prototype');
        // [objectVal, prototypeVal]
        sb.emitOp(node, 'PICKITEM');
        // [prototypeVal, objectVal, pobj, pobj, prototypeVal]
        prepareLoop();
      },
    }));

    // [samePrototype, prototypeVal]
    sb.emitOp(node, 'NIP');
    // [samePrototype]
    sb.emitOp(node, 'NIP');
  }
}
