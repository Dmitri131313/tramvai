import type { DI_TOKEN, COMMAND_LINE_RUNNER_TOKEN } from '@tramvai/core';
import type { NavigationHook } from '@tinkoff/router';

export const runCommandsSpa = ({
  commandLineRunner,
  di,
}: {
  di: typeof DI_TOKEN;
  commandLineRunner: typeof COMMAND_LINE_RUNNER_TOKEN;
}): NavigationHook => {
  return async () => {
    await commandLineRunner.run('client', 'spa', [], di);
  };
};

export const runCommandsAfterSpa = ({
  commandLineRunner,
  di,
}: {
  di: typeof DI_TOKEN;
  commandLineRunner: typeof COMMAND_LINE_RUNNER_TOKEN;
}): NavigationHook => {
  return async () => {
    await commandLineRunner.run('client', 'afterSpa', [], di);
  };
};
