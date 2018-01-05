import { helpers } from '../../../__data__';

describe('ForStatementCompiler', () => {
  test('simple', async () => {
    await helpers.executeString(`
let result = 0;
for (let i = 0; i < 5; i++) {
  const x = 2;
  result += x;
}

if (result !== 10) {
  throw 'Failure';
}
    `);
  });

  test('continue', async () => {
    await helpers.executeString(`
let result = 0;
let otherResult = 0;
for (let i = 0; i < 5; i++) {
  const x = 2;
  if (i % 2 === 0) {
    const x = 3;
    otherResult += x;
    continue;
  }
  result += x;
}

let result1 = 0;
let otherResult1 = 0;
for (let i = 0; i < 5; i++) {
  const x = 2;
  const y = x;
  if (i % 2 === 0) {
    const x = 3;
    const y = x;
    otherResult1 += y;
    continue;
  }
  result1 += y;
}

if (result1 !== 4) {
  throw 'Failure';
}

if (otherResult1 !== 9) {
  throw 'Failure';
}
    `);
  });
});
