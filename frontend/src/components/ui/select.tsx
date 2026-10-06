import { ChevronDown } from 'lucide-react'
import type { SelectHTMLAttributes } from 'react'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
	containerClassName?: string
}

export function Select({
	className = '',
	containerClassName = '',
	disabled = false,
	...props
}: SelectProps) {
	return (
		<div
			className={`relative flex h-12 w-full items-center rounded-control border border-border bg-surface-input transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 ${disabled ? 'cursor-not-allowed bg-surface-muted' : ''} ${containerClassName}`.trim()}
		>
			<select
				{...props}
				disabled={disabled}
				className={`h-full w-full appearance-none rounded-control bg-transparent px-3.5 pr-10 text-sm text-text-primary outline-none disabled:cursor-not-allowed disabled:text-text-secondary ${className}`.trim()}
			/>
			<ChevronDown
				aria-hidden="true"
				className="pointer-events-none absolute right-3.5 size-[18px] text-brand"
			/>
		</div>
	)
}

export default Select