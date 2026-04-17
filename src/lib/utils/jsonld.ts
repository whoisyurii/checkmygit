// Serialize a JSON-LD object for safe inline injection inside <svelte:head>.
// Escapes `<` to prevent premature </script> closure or HTML injection.
export function jsonLd(obj: unknown): string {
	const json = JSON.stringify(obj).replace(/</g, '\\u003c');
	return `<script type="application/ld+json">${json}</script>`;
}
