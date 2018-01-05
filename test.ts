import * as utils from './packages/neo-one-smart-contract-compiler/src/utils';
import { transpile } from './packages/neo-one-smart-contract-compiler/src/transpile';

export const getSourceFile = async (file: string) => {
  const ast = await utils.getAST('/Users/dicarlo/projects/neo-one/packages/neo-one-smart-contract-lib/src');
  return {
    ast,
    sf: ast.getSourceFileOrThrow(`/Users/dicarlo/projects/neo-one/packages/neo-one-smart-contract-lib/src/${file}`),
  };
};

export const run = async () => {
  const ast = await utils.getAST('/Users/dicarlo/projects/neo-one/packages/neo-one-smart-contract-lib/src');
  const sf = ast.getSourceFileOrThrow(
    '/Users/dicarlo/projects/neo-one/packages/neo-one-smart-contract-lib/src/TestICO.ts',
  );
  const clazz = sf.getClassOrThrow('TestICO');
  return transpile({ ast, clazz });
};

run().then((res) => {
  console.log(res.sourceFile.getText());
}).catch((error) => {
  console.error(error);
})
