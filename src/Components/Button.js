
import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
    children,
    onClick,
    variant = 'primary', // primary, secondary, danger, ghost
    size = 'md', // sm, md, lg
    className = '',
    disabled = false,
    loading = false,
    icon: Icon,
    type = 'button',
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg active:scale-95";

    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20 focus:ring-blue-500",
        secondary: "bg-slate-700 hover:bg-slate-600 text-white shadow-lg shadow-slate-900/20 focus:ring-slate-500 border border-white/10",
        danger: "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20 focus:ring-red-500",
        success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 focus:ring-emerald-500",
        ghost: "bg-transparent hover:bg-white/10 text-slate-300 hover:text-white border border-transparent hover:border-white/10",
        outline: "bg-transparent border border-white/20 text-slate-300 hover:text-white hover:bg-white/5 focus:ring-white/20"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs gap-1.5",
        md: "px-4 py-2 text-sm gap-2",
        lg: "px-6 py-3 text-base gap-2.5",
        icon: "p-2 aspect-square"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : Icon ? (
                <Icon className={`w-4 h-4 ${children ? '' : 'mx-auto'}`} />
            ) : null}
            {children}
        </button>
    );
};

export default Button;
