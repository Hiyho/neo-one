// tslint:disable no-string-throw
import * as neo from '@neo-one/smart-contract';

class Transfer<Decimals extends number> extends neo.Event {
  constructor(
    public readonly from: neo.Address,
    public readonly to: neo.Address,
    public readonly amount: neo.Fixed<Decimals>,
  ) {
    super();
  }
}

class Approve<Decimals extends number> extends neo.Event {
  constructor(
    public readonly owner: neo.Address,
    public readonly spender: neo.Address,
    public readonly amount: neo.Fixed<Decimals>,
  ) {
    super();
  }
}

export abstract class Token<
  Decimals extends number
  > extends neo.SmartContract {
  public abstract readonly name: string;
  public abstract readonly decimals: Decimals;
  public abstract readonly symbol: string;
  protected abstract readonly owner: neo.Address;
  private supply: neo.Fixed<Decimals> = 0;
  private readonly balances: neo.MapStorage<neo.Address, neo.Fixed<Decimals>> = neo.map();
  private readonly allowances: neo.MapStorage<
    [neo.Address, neo.Address],
    neo.Fixed<Decimals>
    > = neo.map();

  public transfer(
    from: neo.Address,
    to: neo.Address,
    amount: neo.Fixed<Decimals>,
  ): void {
    neo.verifySender(from);
    this._transfer(from, to, amount);
  }

  public transferFrom(
    from: neo.Address,
    to: neo.Address,
    amount: neo.Fixed<Decimals>,
  ): void {
    const available = this.allowance(from, to);
    if (available < amount) {
      throw 'Insufficient funds approved';
    }

    this._transfer(from, to, amount);
    this._setAllowance(from, to, available - amount);
  }

  public approve(
    owner: neo.Address,
    spender: neo.Address,
    amount: neo.Fixed<Decimals>,
  ): void {
    neo.verifySender(owner);
    const fromValue = this.balanceOf(owner);
    if (fromValue < amount) {
      throw 'Insufficient funds';
    }

    this._setAllowance(owner, spender, this.allowance(owner, spender) + amount);

    neo.notify(new Approve(owner, spender, amount));
  }

  public balanceOf(addr: neo.Address): neo.Fixed<Decimals> {
    return this.balances.get(addr) || 0;
  }

  public allowance(owner: neo.Address, spender: neo.Address): neo.Fixed<Decimals> {
    return this.allowances.get([owner, spender]) || 0;
  }

  public get totalSupply(): neo.Fixed<Decimals> {
    return this.supply;
  }

  protected getOwner(): neo.Address {
    return this.owner;
  }

  protected issue(addr: neo.Address, amount: neo.Fixed<Decimals>): void {
    this.balances.set(addr, this.balanceOf(addr) + amount);
    this.supply += amount;
    neo.notify(new Transfer(this.getContract(), addr, amount));
  }

  private _transfer(
    from: neo.Address,
    to: neo.Address,
    amount: neo.Fixed<Decimals>,
  ): void {
    if (amount <= 0) {
      throw 'Invalid amount';
    }

    const fromValue = this.balanceOf(from);
    if (fromValue < amount) {
      throw 'Insufficient funds';
    }

    this.balances.set(from, fromValue - amount);
    this.balances.set(to, this.balanceOf(to) + amount);

    neo.notify(new Transfer(from, to, amount));
  }

  private _setAllowance(
    from: neo.Address,
    to: neo.Address,
    amount: neo.Fixed<Decimals>,
  ): void {
    this.allowances.set([from, to], amount);
  }
}
