<script context="module" lang="ts">
    import type { Models } from '@appwrite.io/console';

    import { sdk } from '$lib/stores/sdk';

    export async function submitEmail(
        databaseId: string,
        collectionId: string,
        key: string,
        data: Partial<Models.AttributeEmail>
    ) {
        await sdk.forProject.databases.createEmailAttribute(
            databaseId,
            collectionId,
            key,
            data.required,
            data.default,
            data.array
        );
    }

    export async function updateEmail(
        databaseId: string,
        collectionId: string,
        data: Partial<Models.AttributeEmail>,
        originalKey?: string
    ) {
        await sdk.forProject.databases.updateEmailAttribute(
            databaseId,
            collectionId,
            originalKey,
            data.required,
            data.default,
            data.key !== originalKey ? data.key : undefined
        );
    }
</script>

<script lang="ts">
    import { InputChoice, InputEmail } from '$lib/elements/forms';

    export let editing = false;
    export let data: Partial<Models.AttributeEmail>;

    import { createConservative } from '$lib/helpers/stores';

    let savedDefault = data.default;

    function handleDefaultState(hideDefault: boolean) {
        if (hideDefault) {
            savedDefault = data.default;
            data.default = null;
        } else {
            data.default = savedDefault;
        }
    }

    const {
        stores: { required, array },
        listen
    } = createConservative<Partial<Models.AttributeEmail>>({
        required: false,
        array: false,
        ...data
    });
    $: listen(data);

    $: handleDefaultState($required || $array);
</script>

<InputEmail
    id="default"
    label="Default value"
    placeholder="Enter value"
    bind:value={data.default}
    disabled={data.required || data.array}
    nullable={!data.required && !data.array} />
<InputChoice id="required" label="Required" bind:value={data.required} disabled={data.array}>
    Indicate whether this is a required attribute
</InputChoice>
<InputChoice id="array" label="Array" bind:value={data.array} disabled={data.required || editing}>
    Indicate whether this attribute should act as an array, with the default value set as an empty
    array.
</InputChoice>
