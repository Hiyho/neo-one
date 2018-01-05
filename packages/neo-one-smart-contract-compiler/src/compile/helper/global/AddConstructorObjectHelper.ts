import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

// Input: [objectPrototypeVal, globalObjectVal]
// Output: [objectPrototypeVal, globalObjectVal]
export abstract class AddConstructorObjectHelper extends Helper<Node> {
  protected abstract name: string;

  public emit(
    sb: ScriptBuilder,
    node: Node,
    optionsIn: VisitOptions,
  ): void {
    const options = sb.pushValueOptions(optionsIn);
    // [globalObjectVal, objectPrototypeVal]
    sb.emitOp(node, 'SWAP');
    // [globalObjectVal, objectPrototypeVal, globalObjectVal]
    sb.emitOp(node, 'TUCK');
    // [objectPrototypeVal, globalObjectVal, objectPrototypeVal, globalObjectVal]
    sb.emitOp(node, 'OVER');

    /* create constructor prototype */
    // [prototypeVal, objectPrototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.createObject);
    // [prototypeVal, objectPrototypeVal, prototypeVal, globalObjectVal]
    sb.emitOp(node, 'TUCK');
    // ['prototype', prototypeVal, objectPrototypeVal, prototypeVal, globalObjectVal]
    sb.emitPushString(node, 'prototype');
    // [objectPrototypeVal, 'prototype', prototypeVal, prototypeVal, globalObjectVal]
    sb.emitOp(node, 'ROT');
    // [prototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.setPropertyObjectProperty);
    // [prototypeVal, globalObjectVal]
    this.addPrototypeProperties(sb, node, options);

    /* create object */
    // [objectVal, prototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.createObject);
    // [objectVal, prototypeVal, objectVal, globalObjectVal]
    sb.emitOp(node, 'TUCK');
    // [prototypeVal, objectVal, prototypeVal, objectVal, globalObjectVal]
    sb.emitOp(node, 'OVER');
    // ['prototype', prototypeVal, objectVal, prototypeVal, objectVal, globalObjectVal]
    sb.emitPushString(node, 'prototype');
    // [prototypeVal, 'prototype', objectVal, prototypeVal, objectVal, globalObjectVal]
    sb.emitOp(node, 'SWAP');
    // [prototypeVal, objectVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.setPropertyObjectProperty);
    // [objectVal, prototypeVal, objectVal, globalObjectVal]
    sb.emitOp(node, 'OVER');
    // ['constructor', objectVal, prototypeVal, objectVal, globalObjectVal]
    sb.emitPushString(node, 'constructor');
    // [objectVal, 'constructor', prototypeVal, objectVal, globalObjectVal]
    sb.emitOp(node, 'SWAP');
    // [objectVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.setPropertyObjectProperty);
    // [objectVal, globalObjectVal]
    this.addConstructorProperties(sb, node, options);
    // [name, objectVal, globalObjectVal]
    sb.emitPushString(node, this.name);
    // [objectVal, name, globalObjectVal]
    sb.emitOp(node, 'SWAP');
    // [objectPrototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.setPropertyObjectProperty);
  }

  protected addPrototypeProperties(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    // do nothing
  }

  protected addConstructorProperties(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    // do nothing
  }

  protected setInstancePrototype(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    // [globalObjectVal, objectVal]
    sb.scope.getGlobal(sb, node, options);
    // [name, globalObjectVal, objectVal]
    sb.emitPushString(node, this.name);
    // [constructorObjectVal, objectVal]
    sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);
    // ['prototype', constructorObjectVal, objectVal]
    sb.emitPushString(node, 'prototype');
    // ['prototype', constructorObjectVal, 'prototype', objectVal]
    sb.emitOp(node, 'TUCK');
    // [prototypeObjectVal, 'prototype', objectVal]
    sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);
    // []
    sb.emitHelper(node, options, sb.helpers.setPropertyObjectProperty);
  }
}
