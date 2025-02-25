import { derived, writable } from 'svelte/store';
import { page } from '$app/stores';
import { type Models, Query } from '@appwrite.io/console';
import { sdk } from '$lib/stores/sdk';
import { headerAlert } from '$lib/stores/headerAlert';
import BackupDatabase from '$lib/components/backupDatabaseAlert.svelte';
import { shouldShowNotification } from '$lib/helpers/notifications';

export const database = derived(page, ($page) => $page.data?.database as Models.Database);

export const backupsBannerId = 'banner:databaseBackups';

export const showPolicyAlert = writable<boolean>(false);

export async function checkForDatabaseBackupPolicies(
    region: string,
    projectId: string,
    database: Models.Database
) {
    // fast path: return if user dismissed the banner
    if (!shouldShowNotification(backupsBannerId)) return;

    let total = 0;

    try {
        const policies = await sdk
            .forProject(region, projectId)
            .backups.listPolicies([Query.limit(1), Query.equal('resourceId', database.$id)]);

        total = policies.total;
    } catch (e) {
        // ignore, backups not allowed on free plan error.
    }

    showPolicyAlert.set(total <= 0);

    if (!total) {
        headerAlert.add({
            id: backupsBannerId,
            component: BackupDatabase,
            show: true,
            importance: 1
        });
    }
}
