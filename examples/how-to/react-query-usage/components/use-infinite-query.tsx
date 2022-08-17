import { createInfiniteQuery, useInfiniteQuery } from '@tramvai/react-query';
import { FAKE_API_CLIENT } from '../../fakeApiClient';

interface Response {
  nextPage?: number;
  list: string[];
}

const query = createInfiniteQuery({
  key: 'list',
  fn: async (_, start = 0, { apiClient }) => {
    const { payload } = await apiClient.get<Response>('api/list', {
      query: {
        count: 30,
        start,
      },
    });

    return payload;
  },
  getNextPageParam: (page: Response) => {
    return page.nextPage;
  },
  deps: {
    apiClient: FAKE_API_CLIENT,
  },
  infiniteQueryOptions: {},
});

// eslint-disable-next-line import/no-default-export
export default function Component() {
  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery(query);

  if (isLoading) {
    return <>loading...</>;
  }

  return (
    <div>
      <div>
        {data!.pages.map((page) => {
          return page.list.map((entry) => {
            return <div key={entry}>{entry}</div>;
          });
        })}
      </div>
      {hasNextPage && (
        <button type="button" onClick={() => fetchNextPage()}>
          Load more
        </button>
      )}
    </div>
  );
}
