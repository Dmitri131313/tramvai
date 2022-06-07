import { useMemo } from 'react';
import type { ComponentType, PropsWithChildren } from 'react';
import {
  useDi,
  UniversalErrorBoundary,
  ERROR_BOUNDARY_TOKEN,
  ERROR_BOUNDARY_FALLBACK_COMPONENT_TOKEN,
} from '@tramvai/react';
import { useUrl } from '@tramvai/module-router';
import type { PAGE_SERVICE_TOKEN } from '@tramvai/tokens-router';
import { useStore } from '@tramvai/state';
import { deserializeError, PageErrorStore } from '../shared/pageErrorStore';

export const PageErrorBoundary = (
  props: PropsWithChildren<{
    pageService: typeof PAGE_SERVICE_TOKEN;
  }>
) => {
  const { children, pageService } = props;
  const url = useUrl();
  const serializedError = useStore(PageErrorStore);
  const error = useMemo(() => {
    return serializedError && deserializeError(serializedError);
  }, [serializedError]);
  const errorHandlers = useDi({ token: ERROR_BOUNDARY_TOKEN, optional: true });
  const fallbackFromDi = useDi({ token: ERROR_BOUNDARY_FALLBACK_COMPONENT_TOKEN, optional: true });
  const fallback: ComponentType<any> = pageService.resolveComponentFromConfig('errorBoundary');

  return (
    <UniversalErrorBoundary
      url={url}
      error={error}
      errorHandlers={errorHandlers}
      fallback={fallback}
      fallbackFromDi={fallbackFromDi}
    >
      {children}
    </UniversalErrorBoundary>
  );
};
