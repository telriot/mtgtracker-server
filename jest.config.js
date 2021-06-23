function makeModuleNameMapper(srcPath, tsconfigPath) {
  // Get paths from tsconfig
  const {paths} = require(tsconfigPath).compilerOptions;

  const aliases = {};
  
  // Iterate over paths and convert them into moduleNameMapper format
  Object.keys(paths).forEach((item) => {
      const key = item.replace('/*', '/(.*)');
      const path = paths[item][0].replace('/*', '/$1');
      aliases[key] = srcPath + '/' + path;
  });
  return aliases;
}

const TS_CONFIG_PATH = './tsconfig.json';
const SRC_PATH = '<rootDir>/src';

module.exports = {
  roots: [SRC_PATH],
  testEnvironment: 'node',
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)"
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  moduleNameMapper: makeModuleNameMapper(SRC_PATH, TS_CONFIG_PATH)
}
