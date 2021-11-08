import path from 'path';
import type Config from 'webpack-chain';
import readDir from 'fs-readdir-recursive';
import type { ConfigManager } from '../../../config/configManager';
import type { ApplicationConfigEntry } from '../../../typings/configEntry/application';

const filesToPages = ({
  configManager,
  pagesRootDirectory,
  config,
}: {
  configManager: ConfigManager<ApplicationConfigEntry>;
  pagesRootDirectory: string;
  config: Config;
}) => {
  const pagesDir = path.resolve(configManager.rootDir, configManager.root, pagesRootDirectory);

  const pagesFiles = readDir(pagesDir);
  const fsPages = [];

  for (const file of pagesFiles) {
    const extname = path.extname(file);
    const name = file.replace(new RegExp(`\\${extname}$`), '').replace(/\\/g, '/');

    if (config.resolve.extensions.has(extname)) {
      const pageComponentName = `@/${pagesRootDirectory}/${name}`;
      const pageComponentPath = path.resolve(pagesDir, name).replace(/\\/g, '\\\\');
      const pageComponentChunkName = pageComponentName.replace(/\//g, '_');

      // @example '@/pages/MainPage': lazy(() => import(/* webpackChunkName: "@_pages_MainPage" */ '/tramvai-app/src/pages/MainPage'))
      fsPages.push(
        `'${pageComponentName}': lazy(() => import(/* webpackChunkName: "${pageComponentChunkName}" */ '${pageComponentPath}'))`
      );
    }
  }

  return fsPages;
};

export const pagesResolve = (configManager: ConfigManager<ApplicationConfigEntry>) => (
  config: Config
) => {
  const { fileSystemPages } = configManager.build.configurations.experiments;

  const staticFsPages = filesToPages({
    config,
    configManager,
    pagesRootDirectory: fileSystemPages.staticPagesDir,
  });
  const externalFsPages = filesToPages({
    config,
    configManager,
    pagesRootDirectory: fileSystemPages.externalPagesDir,
  });

  config.module
    .rule('external-pages')
    // [\\/]cli вместо @tramvai[\\/]cli, т.к. после слияния репозиториев tramvai и tramvai-cli,
    // webpack резолвит симлинк с фактическим путем до packages/cli
    // @todo: найти более надежный вариант, т.к. есть шанс, что будет импортироваться одноименный модуль
    .test(/[\\/]cli[\\/]lib[\\/]external[\\/]pages.js$/)
    .use('replace')
    .loader(path.resolve(__dirname, '../loaders/replaceContent'))
    .options({
      code: `import { lazy } from '@tramvai/react';

export default {
  staticPages: {
    ${staticFsPages.join(',\n')}
  },
  externalPages: {
    ${externalFsPages.join(',\n')}
  },
}`,
    })
    .end()
    // babel-loader is required to process this file
    .enforce('pre');
};
