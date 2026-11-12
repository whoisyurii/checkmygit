import type { Action } from 'svelte/action';
import { prefersReducedMotion } from 'svelte/motion';
import { inView } from './in-view';

interface RevealOptions {
	// Distance the element rises from, in px
	y?: number;
	// Stagger, in ms
	delay?: number;
}

// Fades an element up the first time it scrolls into view.
// Anything already on screen at mount is left alone, and so is everything
// when JS is off or reduced motion is requested, so content never stays hidden.
export const reveal: Action<HTMLElement, RevealOptions | undefined> = (node, options) => {
	if (prefersReducedMotion.current) return;
	if (node.getBoundingClientRect().top < innerHeight) return;

	const { y = 14, delay = 0 } = options ?? {};
	node.style.opacity = '0';
	node.style.transform = `translateY(${y}px)`;

	// Hand the element back to its own CSS once the entrance has played
	const settle = (e: TransitionEvent) => {
		if (e.target !== node || e.propertyName !== 'transform') return;
		node.style.transition = '';
		node.removeEventListener('transitionend', settle);
	};

	const observer = inView(node, {
		once: true,
		onchange: () => {
			node.addEventListener('transitionend', settle);
			node.style.transition = `opacity 0.45s ease-out ${delay}ms, transform 0.45s ease-out ${delay}ms`;
			node.style.opacity = '';
			node.style.transform = '';
		}
	});

	return {
		destroy() {
			observer?.destroy?.();
			node.removeEventListener('transitionend', settle);
		}
	};
};
