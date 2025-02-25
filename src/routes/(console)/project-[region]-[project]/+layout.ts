import { Dependencies } from '$lib/constants';
import { sdk } from '$lib/stores/sdk';
import { error } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { preferences } from '$lib/stores/preferences';
import { failedInvoice } from '$lib/stores/billing';
import { isCloud } from '$lib/system';
import type { Organization } from '$lib/stores/organization';
import { defaultRoles, defaultScopes } from '$lib/constants';
import type { Plan } from '$lib/sdk/billing';
import { loadAvailableRegions } from '$routes/(console)/regions';

export const load: LayoutLoad = async ({ params, depends }) => {
    depends(Dependencies.PROJECT);
    let currentPlan: Plan = null;

    try {
        const project = await sdk.forConsole.projects.get(params.project);
        const [organization, prefs, _] = await Promise.all([
            sdk.forConsole.teams.get(project.teamId) as Promise<Organization>,
            sdk.forConsole.account.getPrefs(),
            loadAvailableRegions(project.teamId)
        ]);
        if (prefs?.organization !== project.teamId) {
            sdk.forConsole.account.updatePrefs({
                ...prefs,
                organization: project.teamId
            });
        }
        preferences.loadTeamPrefs(project.teamId);
        let roles = isCloud ? [] : defaultRoles;
        let scopes = isCloud ? [] : defaultScopes;
        if (isCloud) {
            currentPlan = await sdk.forConsole.billing.getPlan(project.teamId);
            const res = await sdk.forConsole.billing.getRoles(project.teamId);
            roles = res.roles;
            scopes = res.scopes;
            if (scopes.includes('billing.read')) {
                await failedInvoice.load(project.teamId);
            }
        }

        return {
            project,
            organization,
            roles,
            scopes,
            currentPlan
        };
    } catch (e) {
        error(e.code, e.message);
    }
};
