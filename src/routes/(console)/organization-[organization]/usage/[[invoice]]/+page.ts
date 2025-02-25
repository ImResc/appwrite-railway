import { sdk } from '$lib/stores/sdk';
import { Query, type Models } from '@appwrite.io/console';
import type { PageLoad } from './$types';
import { type Organization } from '$lib/stores/organization';
import type { Invoice } from '$lib/sdk/billing';

export const load: PageLoad = async ({ params, parent }) => {
    const { invoice } = params;
    const parentData = await parent();
    const org = parentData.organization as Organization;

    /**
     * Temporary fix during migration to billing system
     */
    if (org.billingCurrentInvoiceDate === null || org.billingNextInvoiceDate === null) {
        return {
            organizationUsage: {
                bandwidth: null,
                users: null,
                usersTotal: null,
                storageTotal: null,
                filesStorageTotal: null,
                buildsStorageTotal: null,
                deploymentsStorageTotal: null,
                backupsStorageTotal: null,
                executions: null,
                executionsTotal: null,
                projects: null,
                executionsMBSecondsTotal: null,
                buildsMBSecondsTotal: null,
                authPhoneTotal: null,
                authPhoneEstimate: null
            }
        };
    }

    let startDate: string = org.billingCurrentInvoiceDate;
    let endDate: string = org.billingNextInvoiceDate;
    let currentInvoice: Invoice = undefined;

    if (invoice) {
        currentInvoice = await sdk.forConsole.billing.getInvoice(org.$id, invoice);
        startDate = currentInvoice.from;
        endDate = currentInvoice.to;
    }
    const [invoices, usage, organizationMembers, plan] = await Promise.all([
        sdk.forConsole.billing.listInvoices(org.$id, [Query.orderDesc('from')]),
        sdk.forConsole.billing.listUsage(params.organization, startDate, endDate),
        sdk.forConsole.teams.listMemberships(params.organization),
        sdk.forConsole.billing.getPlan(org.$id)
    ]);

    const projectNames: { [key: string]: Models.Project } = {};
    if (usage?.projects?.length > 0) {
        // in batches of 100 (the max number of values in a query)
        const requests = [];
        const chunk = 100;
        for (let i = 0; i < usage.projects.length; i += chunk) {
            const queries = [
                Query.limit(chunk),
                Query.equal(
                    '$id',
                    usage.projects.slice(i, i + chunk).map((p) => p.projectId)
                )
            ];
            requests.push(sdk.forConsole.projects.list(queries));
        }

        const responses = await Promise.all(requests);
        for (const response of responses) {
            for (const project of response.projects) {
                projectNames[project.$id] = project;
            }
        }
    }

    const usersUsageToDate = usage.users.filter((user) => new Date(user.date) < new Date());

    return {
        organizationUsage: usage,
        projectNames,
        invoices,
        currentInvoice,
        organizationMembers,
        plan,
        usersUsageToDate
    };
};
