import { createApp } from '@tramvai/core';
import { CommonModule } from '@tramvai/module-common';
import { SpaRouterModule } from '@tramvai/module-router';
import { RenderModule } from '@tramvai/module-render';
import { ServerModule } from '@tramvai/module-server';
import { ErrorInterceptorModule } from '@tramvai/module-error-interceptor';
import { SeoModule } from '@tramvai/module-seo';
import {
  DEFAULT_HEADER_COMPONENT,
  DEFAULT_FOOTER_COMPONENT,
  RENDER_SLOTS,
  ResourceType,
  ResourceSlot,
} from '@tramvai/tokens-render';

import { Header } from './components/features/Header/Header';
import { Footer } from './components/features/Footer/Footer';

createApp({
  name: 'react-18-integration',
  modules: [
    CommonModule,
    SpaRouterModule,
    RenderModule.forRoot({ mode: 'strict' }),
    SeoModule,
    ServerModule,
    ErrorInterceptorModule,
  ],
  providers: [
    {
      provide: DEFAULT_HEADER_COMPONENT,
      useValue: Header,
    },
    {
      provide: DEFAULT_FOOTER_COMPONENT,
      useValue: Footer,
    },
    {
      provide: RENDER_SLOTS,
      multi: true,
      useValue: {
        type: ResourceType.asIs,
        slot: ResourceSlot.HEAD_META,
        payload: '<meta name="viewport" content="width=device-width, initial-scale=1">',
      },
    },
  ],
});
