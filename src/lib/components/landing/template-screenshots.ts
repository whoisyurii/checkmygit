import type { TemplateType } from '$lib/types/portfolio';
import githubDark from '$lib/assets/templates/github-dark.webp';
import githubLight from '$lib/assets/templates/github-light.webp';
import bentoDark from '$lib/assets/templates/bento-dark.webp';
import bentoLight from '$lib/assets/templates/bento-light.webp';
import minimalDark from '$lib/assets/templates/minimal-dark.webp';
import minimalLight from '$lib/assets/templates/minimal-light.webp';

// Captures per template; adding a template without one is a type error here.
export const TEMPLATE_SCREENSHOTS: Record<TemplateType, { dark: string; light: string }> = {
	github: { dark: githubDark, light: githubLight },
	bento: { dark: bentoDark, light: bentoLight },
	minimal: { dark: minimalDark, light: minimalLight }
};
