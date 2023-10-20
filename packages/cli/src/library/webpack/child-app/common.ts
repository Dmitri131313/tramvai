import type Config from 'webpack-chain';
import path from 'path';
import { UniversalFederationPlugin } from '@module-federation/node';
import common from '../common/main';

import type { ConfigManager } from '../../../config/configManager';

import ts from '../blocks/ts';
import js from '../blocks/js';
import css from '../blocks/css';
import nodeClient from '../blocks/nodeClient';
import type { UniversalFederationPluginOptions } from '../types/webpack';
import { getSharedModules } from './moduleFederationShared';
import { configToEnv } from '../blocks/configToEnv';
import sourcemaps from '../blocks/sourcemaps';
import type { ChildAppConfigEntry } from '../../../typings/configEntry/child-app';
import { extractCssPluginFactory } from '../blocks/extractCssPlugin';

export default (configManager: ConfigManager<ChildAppConfigEntry>) => (config: Config) => {
  const { name, root, sourceMap, buildType } = configManager;

  const cssLocalIdentName =
    configManager.env === 'production'
      ? `${name}__[minicss]`
      : `${name}__[name]__[local]_[hash:base64:5]`;
  const entry = path.resolve(configManager.rootDir, root);

  // use empty module instead of original one as I haven't figured out how to prevent webpack from initializing entry module on loading
  // it should be initialized only as remote in ModuleFederation and not as standalone module
  config.entry(name).add(path.resolve(__dirname, 'fakeModule.js?fallback'));

  config.batch(nodeClient(configManager));

  config.batch(common(configManager));

  config.batch(configToEnv(configManager));

  config
    .batch(js(configManager))
    .batch(ts(configManager))
    .batch(
      css(configManager, {
        localIdentName: cssLocalIdentName,
      })
    );

  if (sourceMap) {
    config.batch(sourcemaps(configManager));
  }

  config.batch(
    extractCssPluginFactory(configManager, {
      filename: `[name]@${configManager.version}.css`,
      chunkFilename: `[name]@${configManager.version}.css`,
    })
  );

  config.optimization.set('chunkIds', 'named');

  // define split chunks to put all of the css into single entry file
  config.optimization.splitChunks({
    cacheGroups: {
      default: false,
      defaultVendors: false,
      styles: {
        name,
        type: 'css/mini-extract',
        chunks: 'async',
        enforce: true,
      },
    },
  });

  config.plugin('module-federation').use(UniversalFederationPlugin, [
    {
      isServer: buildType === 'server',
      name,
      library:
        configManager.buildType === 'server'
          ? {
              type: 'commonjs2',
            }
          : {
              name: 'window["child-app__" + document.currentScript.src]',
              type: 'assign',
            },
      exposes: {
        // 1) define path as relative to webpack context
        // as ChunkCorrelationPlugin fails to resolve
        // entry otherwise.
        // Way to reproduce: build and compare stats file for child-app with absolute and relative paths
        // -----
        // 2) path.relative should use the posix separator because
        // @module-federation/node library (https://github.com/module-federation/universe/blob/2dd44826954e5136bac08b0d9a0e7e01dbb8b79c/packages/typescript/src/lib/TypescriptCompiler.ts#L110)
        // is splitting path strings with regexp, which only works correctly for posix paths.
        entry: path.posix.relative(config.get('context'), entry),
      },
      shared: getSharedModules(configManager),
    } as UniversalFederationPluginOptions,
  ]);
};
