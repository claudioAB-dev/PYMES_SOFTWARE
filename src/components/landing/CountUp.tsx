"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
    target: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    className?: string;
}

export function CountUp({
    target,
    duration = 1200,
    prefix = "",
    suffix = "",
    decimals = 0,
    className = "",
}: CountUpProps) {
    const [value, setValue] = useState(0);
    const [started, setStarted] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started) {
                    setStarted(true);
                    observer.unobserve(el);
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [started]);

    useEffect(() => {
        if (!started) return;

        const start = performance.now();

        function step(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out quad
            const eased = 1 - (1 - progress) * (1 - progress);
            setValue(eased * target);

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                setValue(target);
            }
        }

        requestAnimationFrame(step);
    }, [started, target, duration]);

    const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();

    return (
        <span ref={ref} className={className}>
            {prefix}{formatted}{suffix}
        </span>
    );
}
