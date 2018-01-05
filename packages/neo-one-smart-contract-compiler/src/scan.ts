import * as utils from './utils';

export interface Contracts {
  [file: string]: string[];
}

export const scan = async (dir: string): Promise<Contracts> => {
  const ast = await utils.getAST(dir);
  const smartContract = await utils.findClass(ast, 'SmartContract');
  return smartContract.getDerivedClasses().reduce(
    (acc, derived) => {
      if (!derived.isAbstract()) {
        const file = derived.getSourceFile().getFilePath();
        if (acc[file] == null) {
          acc[file] = [];
        }
        acc[file].push(derived.getNameOrThrow());
      }

      return acc;
    },
    {} as Contracts,
  );
};
