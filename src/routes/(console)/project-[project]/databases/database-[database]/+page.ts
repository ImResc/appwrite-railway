import { Query } from '@appwrite.io/console';
import { sdk } from '$lib/stores/sdk';
import { getLimit, getPage, getView, pageToOffset, View, getSearch } from '$lib/helpers/load';
import type { PageLoad } from './$types';
import { CARD_LIMIT, Dependencies } from '$lib/constants';

export const load: PageLoad = async ({ params, url, route, depends }) => {
    depends(Dependencies.COLLECTIONS);
    const page = getPage(url);
    const search = getSearch(url);
    const limit = getLimit(url, route, CARD_LIMIT);
    const view = getView(url, route, View.Grid);
    const offset = pageToOffset(page, limit);
    const collections = await sdk.forProject.databases.listCollections(params.database, [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('')
    ], search);

    return {
        offset,
        limit,
        view,
        search,
        collections
    };
};
