<script lang="ts">
	import Dropdown from '$lib/components/ui/Dropdown.svelte';
	import { TEMPLATES, type TemplateType } from '$lib/types/portfolio';

	interface Props {
		template?: TemplateType;
		onTemplateChange?: (template: TemplateType) => void;
	}

	let { template = 'github', onTemplateChange }: Props = $props();

	const templateOptions = TEMPLATES.map(({ id, ...rest }) => ({ value: id, ...rest }));

	function handleTemplateChange(value: string) {
		onTemplateChange?.(value as TemplateType);
	}
</script>

<Dropdown options={templateOptions} value={template} onchange={handleTemplateChange} />
