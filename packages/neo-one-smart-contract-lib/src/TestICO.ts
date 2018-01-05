import * as neo from '@neo-one/smart-contract';

import { ICO } from './ICO';

export class TestICO extends ICO<8> {
  public readonly name: string = 'Test';
  public readonly decimals: 8 = 8;
  public readonly symbol: string = 'TTT';
  public readonly startTime: neo.Integer = 1234;
  public readonly limitedRoundTime: neo.Integer = 1234;
  public readonly icoTime: neo.Integer = 1234;
  public readonly icoAmount: neo.Fixed<8> = 1000000000000;
  public readonly preICOAmount: neo.Fixed<8> = 1000000000000;
  public readonly maxLimitedRound: neo.Fixed<8> = 100000000;
  protected readonly owner: neo.Address = neo.address('ABC');
}
