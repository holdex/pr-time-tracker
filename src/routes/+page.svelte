<script lang="ts">
    import config from "$lib/config";

    const genAuthLink = () => {
        return (
            config.github.baseUrl +
            "/login/oauth/authorize" +
            `?client_id=${config.github.clientId}`
        );
    };
</script>

<h1>Welcome to SvelteKit</h1>
<p>
    Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation
</p>
<a href={genAuthLink()}>Log in with Github</a>
