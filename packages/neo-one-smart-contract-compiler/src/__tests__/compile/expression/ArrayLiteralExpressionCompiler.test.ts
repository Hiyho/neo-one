import { helpers } from '../../../__data__';

describe('ArrayLiteralExpressionCompiler', () => {
  test('[1, foo(), y]', async () => {
    await helpers.executeString(`
      const foo = () => 2;
      const y = 3;
      const x = [1, foo(), 3];

      if (x[0] !== 1) {
        throw 'Failure';
      }

      if (x[1] !== 2) {
        throw 'Failure';
      }

      if (x[2] !== 3) {
        throw 'Failure';
      }
    `);
  });
});
