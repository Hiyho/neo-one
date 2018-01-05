import * as neo from '@neo-one/smart-contract';

import { Token } from './Token';

export class TestToken extends Token<4> {
  public readonly name: string = 'Test';
  public readonly decimals: 4 = 4;
  public readonly symbol: string = 'TTT';
  protected readonly owner: neo.Address = neo.address('ABC');
}
