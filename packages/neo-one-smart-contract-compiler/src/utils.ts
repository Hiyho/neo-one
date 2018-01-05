// tslint:disable ban-types
import AST, {
  ClassDeclaration,
  SourceFile,
  TypeAliasDeclaration,
  ts,
} from 'ts-simple-ast';

import * as fs from 'fs-extra';
import * as path from 'path';

const findRoot = async (
  dir: string | string[],
  filename: string,
): Promise<string> => {
  let start = dir;

  if (typeof start === 'string') {
    if (start[start.length - 1] !== path.sep) {
      start += path.sep;
    }
    start = start.split(path.sep);
  }
  if (!start.length) {
    throw new Error('tsconfig.json not found in path');
  }

  start.pop();
  const currentDir = start.join(path.sep);
  const file = path.join(currentDir, filename);
  const exists = await fs.pathExists(file);
  if (exists) {
    return file;
  }

  return findRoot(start, filename);
};

export const getAST = async (dir: string): Promise<AST> => {
  const tsConfigFilePath = await findRoot(dir, 'tsconfig.json');
  const res = ts.readConfigFile(tsConfigFilePath, (value) =>
    fs.readFileSync(value, 'utf8'),
  );
  const parseConfigHost = {
    fileExists: fs.existsSync,
    readDirectory: ts.sys.readDirectory,
    readFile: ts.sys.readFile,
    useCaseSensitiveFileNames: true,
  };
  const parsed = ts.parseJsonConfigFileContent(
    res.config,
    parseConfigHost,
    path.dirname(tsConfigFilePath),
  );
  const ast = new AST({ compilerOptions: parsed.options });
  ast.addExistingSourceFiles(path.join(dir, '**', '*.ts'));
  // For some reason this forces AST to resolve references. Do not remove.
  ast.getPreEmitDiagnostics();
  return ast;
};

export function notNull<TValue>(value: TValue | null | undefined): value is TValue {
  return value != null;
}

export const filterSmartContractFiles = async (ast: AST): Promise<SourceFile[]> => {
  const files = await Promise.all(
    ast.getSourceFiles().map(async (file) => {
      const pkgFile = await findRoot(file.getFilePath(), 'package.json');
      const pkg = await fs.readJSON(pkgFile);
      return pkg.name === '@neo-one/smart-contract' ? file : null;
    }),
  );
  return files.filter(notNull);
};

export const findClass = async (
  ast: AST,
  className: string,
): Promise<ClassDeclaration> => {
  const files = await filterSmartContractFiles(ast);
  const classes = files.map((file) =>
    file.getClasses().find((clazz) => clazz.getName() === className),
  );
  const found = classes.filter(notNull)[0];
  if (found == null) {
    throw new Error(`Could not find class ${className}`);
  }
  return found;
};

export const findTypeAlias = async (
  ast: AST,
  typeName: string,
): Promise<TypeAliasDeclaration> => {
  const files = await filterSmartContractFiles(ast);
  const classes = files.map((file) =>
    file.getTypeAliases().find((type) => type.getName() === typeName),
  );
  const found = classes.filter(notNull)[0];
  if (found == null) {
    throw new Error(`Could not find class ${typeName}`);
  }
  return found;
};
