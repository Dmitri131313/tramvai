import React from 'react';
import { Module, provide } from '@tramvai/core';
import { Provider } from '@tramvai/state';
import { CONTEXT_TOKEN, INITIAL_APP_STATE_TOKEN } from '@tramvai/tokens-common';
import { EXTEND_RENDER } from '@tramvai/tokens-render';
import { providers } from './serverProviders';
import { stateProviders } from './state';
import { commandProviders } from './command';
import { actionsProviders } from './actions';

@Module({
  providers: [
    ...providers,
    ...stateProviders,
    ...commandProviders,
    ...actionsProviders,
    provide({
      provide: EXTEND_RENDER,
      multi: true,
      useFactory: ({ context, initialState }) => {
        return (render) => {
          return (
            <Provider context={context} serverState={initialState?.stores}>
              {render}
            </Provider>
          );
        };
      },
      deps: {
        context: CONTEXT_TOKEN,
        initialState: { token: INITIAL_APP_STATE_TOKEN, optional: true },
      },
    }),
  ],
})
export class CommonChildAppModule {}
