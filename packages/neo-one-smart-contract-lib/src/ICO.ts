// tslint:disable no-string-throw
import * as neo from '@neo-one/smart-contract';

import { Token } from './Token';

class Register extends neo.Event {
  constructor(public readonly addr: neo.Address) {
    super();
  }
}

class Refund extends neo.Event { }

class TokenExchangeRateBase<Decimals extends number> extends neo.Event {
  constructor(public readonly asset: neo.Hash256, public readonly tokens: neo.Fixed<Decimals>) {
    super();
  }
}

class TokenExchangeRate<Decimals extends number> extends TokenExchangeRateBase<
  Decimals
  > { }

class LimitedTokenExchangeRate<
  Decimals extends number
  > extends TokenExchangeRateBase<Decimals> { }

export abstract class ICO<Decimals extends number> extends Token<
  Decimals
  > {
  public abstract readonly startTime: neo.Integer;
  public abstract readonly limitedRoundTime: neo.Integer;
  public abstract readonly icoTime: neo.Integer;
  public abstract readonly icoAmount: neo.Fixed<Decimals>;
  public abstract readonly preICOAmount: neo.Fixed<Decimals>;
  public abstract readonly maxLimitedRound: neo.Fixed<Decimals>;
  private readonly kyc: neo.SetStorage<neo.Address> = neo.set();
  private readonly tokensPerAssetLimitedRound: neo.MapStorage<
    neo.Hash256,
    neo.Fixed<Decimals>
    > = neo.map();
  private readonly tokensPerAsset: neo.MapStorage<neo.Hash256, neo.Fixed<Decimals>> = neo.map();
  private readonly limitedRoundRemaining: neo.MapStorage<
    neo.Address,
    neo.Fixed<Decimals>
    > = neo.map();
  private icoRemaining: neo.Fixed<Decimals> = this.icoAmount;

  constructor(preICOAmount: neo.Fixed<Decimals>) {
    super();
    neo.verifySender(this.owner);
    this.issue(this.owner, preICOAmount);
  }

  @neo.verify
  public mintTokens(): void {
    if (!this.hasStarted()) {
      this.refund();
      throw 'Crowdsale has not started';
    }
    if (this.hasEnded()) {
      this.refund();
      throw 'Crowdsale has ended';
    }

    const { references } = neo.getCurrentTransaction();
    if (references.length === 0) {
      return;
    }

    const sender = references[0].address;
    if (!this.canParticipate(sender)) {
      this.refund();
      throw 'Address has not been whitelised';
    }
    const amount = neo.getCurrentTransaction().outputs
      .filter((output) => output.address.equals(this.getContract()))
      .reduce((acc, output) => {
        const amountPerAsset = this.isLimitedRound()
          ? this.tokensPerAssetLimitedRound.get(output.asset)
          : this.tokensPerAsset.get(output.asset);
        if (amountPerAsset == null) {
          this.refund();
          throw `Asset ${output.asset} is not accepted for the crowdsale`;
        }
        const asset = neo.getAsset(output.asset);
        const normalizedValue = output.value / 10 ** (8 - asset.precision);
        return acc + normalizedValue * amountPerAsset;
      }, 0);

    if (this.isLimitedRound()) {
      const remaining = this.remainingLimitedRound(sender);
      if (amount > remaining) {
        this.refund();
        throw 'Limited round maximum contribution reached.';
      }
      this.limitedRoundRemaining.set(sender, remaining - amount);
    }

    if (amount > this.icoRemaining) {
      this.refund();
      throw 'Amount is greater than remaining ICO tokens';
    }

    this.icoRemaining -= amount;
  }

  public endICO(): void {
    neo.verifySender(this.owner);
    if (this.icoRemaining > 0) {
      if (!this.hasEnded()) {
        throw 'ICO has not ended.';
      }

      this.icoRemaining = 0;
      this.issue(this.owner, this.icoRemaining);
    }
  }

  public register(addresses: neo.Address[]): void {
    neo.verifySender(this.owner);
    addresses.forEach((addr) => {
      if (!this.kyc.has(addr)) {
        this.kyc.add(addr);
        neo.notify(new Register(addr));
      }
    });
  }

  public canParticipate(addr: neo.Address): boolean {
    return this.kyc.has(addr);
  }

  public setExchange(
    asset: neo.Hash256,
    tokens: neo.Fixed<Decimals>,
  ): void {
    neo.verifySender(this.owner);
    if (this.hasStarted()) {
      throw 'Cannot change token amount once crowdsale has started';
    }
    const tokensPerAsset = this.tokensPerAsset;
    tokensPerAsset.set(asset, tokens);
    neo.notify(new TokenExchangeRate(asset, tokens));
  }

  public getExchangeRate(asset: neo.Hash256): neo.Fixed<Decimals> {
    return this.tokensPerAsset.get(asset) || 0;
  }

  public setLimitedRoundExchange(
    asset: neo.Hash256,
    tokens: neo.Fixed<Decimals>,
  ): void {
    neo.verifySender(this.owner);
    if (this.hasStarted()) {
      throw 'Cannot change token amount once crowdsale has started';
    }
    this.tokensPerAssetLimitedRound.set(asset, tokens);
    neo.notify(new LimitedTokenExchangeRate(asset, tokens));
  }

  public getLimitedRoundExchangeRate(asset: neo.Hash256): neo.Fixed<Decimals> {
    return this.tokensPerAssetLimitedRound.get(asset) || 0;
  }

  public remainingLimitedRound(address: neo.Address): neo.Fixed<Decimals> {
    const remaining = this.limitedRoundRemaining.get(address);
    return remaining == null ? this.maxLimitedRound : remaining;
  }

  private hasStarted(): boolean {
    return neo.getCurrentTime() >= this.startTime;
  }

  private hasEnded(): boolean {
    return neo.getCurrentTime() > this.startTime + this.icoTime;
  }

  private isLimitedRound(): boolean {
    return (
      this.hasStarted() &&
      neo.getCurrentTime() < this.startTime + this.limitedRoundTime
    );
  }

  private refund(): void {
    neo.notify(new Refund());
  }
}
