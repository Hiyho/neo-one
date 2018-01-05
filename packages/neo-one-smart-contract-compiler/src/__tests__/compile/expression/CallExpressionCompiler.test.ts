import { helpers } from '../../../__data__';

describe('CallExpressionCompiler', () => {
  test('call no arguments', async () => {
    await helpers.executeString(`
      const foo = () => 2;
      if (foo() !== 2) {
        throw 'Failure';
      }
    `);
  });

  test('call with arguments', async () => {
    await helpers.executeString(`
      const foo = (x: number) => x;
      if (foo(2) !== 2) {
        throw 'Failure';
      }
    `);
  });

  test('call that throws', async () => {
    await helpers.executeString(`
      const foo = () => {
        throw 'Should Be Caught';
      }

      let failed = false;
      try {
        foo();
      } catch (error) {
        failed = true;
      }

      if (!failed) {
        throw 'Failure';
      }
    `);
  });

  test('property call', async () => {
    await helpers.executeString(`
      const foo = {
        x: 1,
        y(): number {
          return this.x;
        }
      };

      if (foo.y() !== 1) {
        throw 'Failure';
      }
    `);
  });
});
