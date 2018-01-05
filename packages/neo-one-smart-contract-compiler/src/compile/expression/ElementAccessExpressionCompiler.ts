import { ElementAccessExpression, Node, SyntaxKind, Type, ts } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

import * as typeUtils from '../../typeUtils';

export default class ElementAccessExpressionCompiler extends NodeCompiler<
  ElementAccessExpression
  > {
  public readonly kind: SyntaxKind = SyntaxKind.ElementAccessExpression;

  public visitNode(sb: ScriptBuilder, expr: ElementAccessExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(sb.noSetValueOptions(optionsIn));
    const value = expr.getExpression();
    const valueType = sb.getType(value);
    const prop = expr.getArgumentExpressionOrThrow();
    const propType = sb.getType(prop);

    // [val]
    sb.visit(value, options);
    if (!typeUtils.isOnlyObject(valueType)) {
      // [objectVal]
      sb.emitHelper(value, options, sb.helpers.toObject);
    }

    // [propVal, objectVal]
    sb.visit(prop, options);

    if (optionsIn.setValue) {
      let valueIndex = 2;
      if (optionsIn.pushValue) {
        // [objectVal, propVal]
        sb.emitOp(expr, 'SWAP');
        // [objectVal, propVal, objectVal]
        sb.emitOp(expr, 'TUCK');
        // [propVal, objectVal, propVal, objectVal]
        sb.emitOp(expr, 'OVER');
        valueIndex = 4;
      }

      if (typeUtils.isOnlyString(propType)) {
        // []
        this.setProperty(sb, prop, options, valueIndex);
      } else if (typeUtils.isOnlyNumber(propType)) {
        this.setNumberProperty(sb, prop, options, valueType, valueIndex);
      } else if (typeUtils.isOnlySymbol(propType)) {
        // []
        this.setSymbol(sb, prop, options, valueIndex);
      } else {
        // []
        sb.emitHelper(prop, options, sb.helpers.case(
          [
            {
              condition: () => {
                // [propVal, propVal, objectVal]
                sb.emitOp(prop, 'DUP');
                // [isString, propVal, objectVal]
                sb.emitHelper(prop, options, sb.helpers.isString);
              },
              whenTrue: () => {
                // []
                this.setProperty(sb, prop, options, valueIndex);
              },
            },
            {
              condition: () => {
                // [propVal, propVal, objectVal]
                sb.emitOp(prop, 'DUP');
                // [isNumber, propVal, objectVal]
                sb.emitHelper(prop, options, sb.helpers.isNumber);
              },
              whenTrue: () => {
                // []
                this.setNumberProperty(sb, prop, options, valueType, valueIndex);
              },
            },
          ],
          () => {
            // []
            this.setSymbol(sb, prop, options, valueIndex);
          },
        ));
      }
    }

    if (optionsIn.pushValue || !optionsIn.setValue) {
      if (typeUtils.isOnlyString(propType)) {
        // [val]
        this.getProperty(sb, prop, options);
      } else if (typeUtils.isOnlyNumber(propType)) {
        this.getNumberProperty(sb, prop, options, valueType);
      } else if (typeUtils.isOnlySymbol(propType)) {
        // [val]
        this.getSymbol(sb, prop, options);
      } else {
        // [val]
        sb.emitHelper(prop, options, sb.helpers.case(
          [
            {
              condition: () => {
                // [propVal, propVal, objectVal]
                sb.emitOp(prop, 'DUP');
                // [propVal, objectVal]
                sb.emitHelper(prop, options, sb.helpers.isString);
              },
              whenTrue: () => {
                // [val]
                this.getProperty(sb, prop, options);
              },
            },
            {
              condition: () => {
                // [propVal, propVal, objectVal]
                sb.emitOp(prop, 'DUP');
                // [propVal, objectVal]
                sb.emitHelper(prop, options, sb.helpers.isNumber);
              },
              whenTrue: () => {
                // [val]
                this.getNumberProperty(sb, prop, options, valueType);
              },
            },
          ],
          () => {
            // [val]
            this.getSymbol(sb, prop, options);
          },
        ));
      }
    }

    if (!optionsIn.pushValue && !optionsIn.setValue) {
      sb.emitOp(expr, 'DROP');
    }
  }

  private getProperty(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
  ): void {
    // [propString, objectVal]
    sb.emitHelper(node, options, sb.helpers.getString);
    // [val]
    sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);
  }

  private getNumberProperty(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    valueType: Type<ts.Type> | undefined,
  ): void {
    if (typeUtils.isOnlyArray(valueType)) {
      this.getArrayIndex(sb, node, options);
    } else {
      sb.emitHelper(node, options, sb.helpers.if({
        condition: () => {
          // [isArray, propVal, objectVal]
          this.isArrayInstance(sb, node, options);
        },
        whenTrue: () => {
          this.getArrayIndex(sb, node, options);
        },
        whenFalse: () => {
          // [propString, objectVal]
          sb.emitHelper(node, options, sb.helpers.toString);
          // [propStringVal, objectVal]
          sb.emitHelper(node, options, sb.helpers.createString);
          // []
          this.getProperty(sb, node, options);
        },
      }));
    }
  }

  private getArrayIndex(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
  ): void {
    // [propNumber, objectVal]
    sb.emitHelper(node, options, sb.helpers.getNumber);
    // []
    sb.emitHelper(node, options, sb.helpers.getArrayIndex);
  }

  private getSymbol(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
  ): void {
    // [propString, objectVal]
    sb.emitHelper(node, options, sb.helpers.getSymbol);
    // [val]
    sb.emitHelper(node, options, sb.helpers.getSymbolObjectProperty);
  }

  private setProperty(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    index: number,
  ): void {
    // [propString, objectVal]
    sb.emitHelper(node, options, sb.helpers.getString);
    // [val, propString, objectVal]
    this.pickValue(sb, node, options, index);
    // []
    sb.emitHelper(node, options, sb.helpers.setPropertyObjectProperty);
  }

  private setNumberProperty(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    valueType: Type<ts.Type> | undefined,
    index: number,
  ): void {
    if (typeUtils.isOnlyArray(valueType)) {
      this.setArrayIndex(sb, node, options, index);
    } else {
      sb.emitHelper(node, options, sb.helpers.if({
        condition: () => {
          // [isArray, propVal, objectVal]
          this.isArrayInstance(sb, node, options);
        },
        whenTrue: () => {
          this.setArrayIndex(sb, node, options, index);
        },
        whenFalse: () => {
          // [propString, objectVal]
          sb.emitHelper(node, options, sb.helpers.toString);
          // [propStringVal, objectVal]
          sb.emitHelper(node, options, sb.helpers.createString);
          // []
          this.setProperty(sb, node, options, index);
        },
      }));
    }
  }

  private setArrayIndex(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    index: number,
  ): void {
    // [propNumber, objectVal]
    sb.emitHelper(node, options, sb.helpers.getNumber);
    // [val, propNumber, objectVal]
    this.pickValue(sb, node, options, index);
    // []
    sb.emitHelper(node, options, sb.helpers.setArrayIndex);
  }

  private setSymbol(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    index: number,
  ): void {
    // [propString, objectVal]
    sb.emitHelper(node, options, sb.helpers.getSymbol);
    // [val, propString, objectVal]
    this.pickValue(sb, node, options, index);
    // []
    sb.emitHelper(node, options, sb.helpers.setSymbolObjectProperty);
  }

  private isArrayInstance(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
  ): void {
    // [objectVal, propVal, objectVal]
    sb.emitOp(node, 'OVER');
    // [globalObjectVal, objectVal, propVal, objectVal]
    sb.scope.getGlobal(sb, node, options);
    // ['Array', globalObjectVal, objectVal, propVal, objectVal]
    sb.emitPushString(node, 'Array');
    // [Array, objectVal, propVal, objectVal]
    sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);
    // [isArray, propVal, objectVal]
    sb.emitHelper(node, options, sb.helpers.instanceof);
  }

  private pickValue(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    index: number,
  ): void {
    if (index === 2) {
      sb.emitOp(node, 'ROT');
    } else {
      // [index, ...]
      sb.emitPushInt(node, index);
      // [val, ...]
      sb.emitOp(node, 'ROLL');
    }
  }
}
