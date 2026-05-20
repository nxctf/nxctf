"use client"

import { cn } from '@/shared/lib/utils'

interface BrandLogoProps {
    name: string
    className?: string
}

const BrandLogo = ({ name = "", className }: BrandLogoProps) => {
    const isCtfBrand = name.toUpperCase().endsWith("CTF");

    if (isCtfBrand) {
        const prefix = name.substring(0, name.length - 3);
        const suffix = name.substring(name.length - 3);

        return (
            <span className={cn("font-black tracking-tighter", className)}>
                <span className="text-gray-900 dark:text-white transition-colors">
                    {prefix}
                </span>
                <span className="text-blue-600 dark:text-blue-500 drop-shadow-[0_0_6px_rgba(59,130,246,0.18)]">
                    {suffix}
                </span>
            </span>
        );
    }

    return (
        <span className={cn("text-blue-600 dark:text-blue-500 font-black tracking-tighter", className)}>
            {name}
        </span>
    );
};

BrandLogo.displayName = "BrandLogo";
export default BrandLogo;
