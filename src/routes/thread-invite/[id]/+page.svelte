<script lang="ts">
  import { page } from '$app/state';
  import ModalThreadInviteLinkJoin from '$lib/templates/ModalThreadInviteLinkJoin.svelte';
  import Navbar from '$lib/templates/Navbar.svelte';

  const { data } = $props();

  if (!data.isAuthorized) {
    throw new Error('unauthorized');
  }

  const linkId = page.params.id;
</script>

<Navbar />
<ModalThreadInviteLinkJoin {linkId} isOpen={true} />
