"use client";

import { useEffect, useRef } from "react";

/**
 * Adds the `revealed` class to a ref element when it enters the viewport.
 * Usage: attach `ref` to a container, give it `scroll-reveal` or
 * `scroll-reveal-stagger` class. Children get `scroll-reveal-item`.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
    options?: IntersectionObserverInit
) {
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add("revealed");
                    observer.unobserve(el);
                }
            },
            { threshold: 0.15, ...options }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [options]);

    return ref;
}
