import { Node, TypeGuards } from 'ts-simple-ast';

import { Context } from './Context';
import { InternalNEONamespace } from './symbols';

export interface IInternalNEOHelpersExtensionType {
  readonly internalNEO: InternalNEONamespace;
}
export type InternalNEOHelpersExtensionType = Context & IInternalNEOHelpersExtensionType;

export interface InternalNEOHelpers {
  isStoragePut(node: Node): boolean;
}

export type Constructor<T> = new (...args: any[]) => T;
export function InternalNEOHelpers<T extends Constructor<InternalNEOHelpersExtensionType>>(
  Base: T,
): Constructor<InternalNEOHelpers> & T {
  return class extends Base implements InternalNEOHelpers {
    public isStoragePut(node: Node): boolean {
      if (TypeGuards.isCallExpression(node)) {
        const symbol = this.getSymbol(node.getExpression());
        if (symbol != null) {
          return this.internalNEO.putStorage === symbol;
        }
      }

      return false;
    }
  };
}
