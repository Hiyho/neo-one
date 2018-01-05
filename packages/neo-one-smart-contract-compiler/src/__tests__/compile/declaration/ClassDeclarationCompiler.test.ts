import { helpers } from '../../../__data__';

describe('ClassDeclarationCompiler', () => {
  test('basic class with initializer', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';
      }

      const f = new Foo();
      if (f.x !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class with constructor', async () => {
    await helpers.executeString(`
      class Foo {
        x: string;

        constructor() {
          this.x = 'bar';
        }
      }

      const f = new Foo();
      if (f.x !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class with constructor arguments', async () => {
    await helpers.executeString(`
      class Foo {
        x: string;

        constructor(x: string) {
          this.x = x;
        }
      }

      const f = new Foo('bar');
      if (f.x !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class with default constructor arguments', async () => {
    await helpers.executeString(`
      class Foo {
        x: string;

        constructor(x: string = 'bar') {
          this.x = x;
        }
      }

      const f = new Foo();
      if (f.x !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  // TODO: Fix undefined
  // test.only('basic class with optional constructor arguments', async () => {
  //   await helpers.executeString(`
  //     class Foo {
  //       x: string | undefined;

  //       constructor(x?: string) {
  //         this.x = x;
  //       }
  //     }

  //     const f = new Foo();
  //     if (f.x !== undefined) {
  //       throw 'Failure';
  //     }
  //   `);
  // });

  test('basic class with method', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';

        bar(): string {
          return this.x;
        }
      }

      const f = new Foo();
      if (f.bar() !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class extended with inherited property', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';
      }

      class Baz extends Foo {
      }

      const f = new Baz();
      if (f.x !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class extended with inherited method', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';

        bar(): string {
          return this.x;
        }
      }

      class Baz extends Foo {
      }

      const f = new Baz();
      if (f.bar() !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('basic class extended with overriden property', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';
      }

      class Baz extends Foo {
        x: string = 'baz';
      }

      const f = new Baz();
      if (f.x !== 'baz') {
        throw 'Failure';
      }
    `);
  });

  test('basic class extended with overriden method', async () => {
    await helpers.executeString(`
      class Foo {
        x: string = 'bar';

        bar(): string {
          return this.x;
        }
      }

      class Baz extends Foo {
        bar(): string {
          return 'baz';
        }
      }

      const f = new Baz();
      if (f.bar() !== 'baz') {
        throw 'Failure';
      }
    `);
  });
});
