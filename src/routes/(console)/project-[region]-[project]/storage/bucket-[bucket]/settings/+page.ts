import type { PageLoad } from './$types';
import { sdk } from '$lib/stores/sdk';

export const load: PageLoad = async ({ parent }) => {
    const { organization } = await parent();
    const currentPlan = await sdk.forConsole.billing.getPlan(organization.$id);
    return {
        currentPlan
    };
};
