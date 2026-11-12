import type { Action } from 'svelte/action';

export interface InViewOptions {
	onchange: (visible: boolean) => void;
	// Fire once, on first entry, then stop observing
	once?: boolean;
	rootMargin?: string;
}

// Reports when an element enters or leaves the viewport
export const inView: Action<Element, InViewOptions> = (
	node,
	{ onchange, once = false, rootMargin }
) => {
	const observer = new IntersectionObserver(
		([entry]) => {
			if (once) {
				if (!entry.isIntersecting) return;
				observer.disconnect();
			}
			onchange(entry.isIntersecting);
		},
		{ rootMargin }
	);
	observer.observe(node);
	return { destroy: () => observer.disconnect() };
};
