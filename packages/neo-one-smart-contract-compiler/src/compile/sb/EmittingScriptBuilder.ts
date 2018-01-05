import { Node } from 'ts-simple-ast';

import { BaseScriptBuilder } from './BaseScriptBuilder';
import { Context } from '../../Context';
import { ResolvedScope } from '../scope';
import { ScriptBuilder } from './ScriptBuilder';

export interface EmittingScriptBuilderOptions {
  context: Context;
  scopes: Map<Node, Map<number, ResolvedScope>>;
}

export class EmittingScriptBuilder extends BaseScriptBuilder<ResolvedScope> implements ScriptBuilder {
  private readonly scopes: Map<Node, Map<number, ResolvedScope>>;

  constructor({
    context,
    scopes,
  }: EmittingScriptBuilderOptions) {
    super(context);
    this.scopes = scopes;
  }

  protected createScope(node: Node, index: number): ResolvedScope {
    return this.assertNotNull(this.assertNotNull(this.scopes.get(node)).get(index));
  }
}
