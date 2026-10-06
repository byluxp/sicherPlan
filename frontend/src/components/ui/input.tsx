import type { InputHTMLAttributes, ReactNode } from 'react'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
	className?: string
	containerClassName?: string
	startAdornment?: ReactNode
	endAdornment?: ReactNode
	error?: boolean
}

function joinClasses(...classes: (string | false | undefined)[]) {
	return classes.filter(Boolean).join(' ')
}

export function Input({
	className,
	containerClassName,
	disabled = false,
	endAdornment,
	error = false,
	startAdornment,
	...props
}: InputProps) {
	return (
		<div
			className={joinClasses(
				'flex h-12 w-full items-center gap-3.5 rounded-control border border-border bg-surface-input px-3.5 transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20',
				error && 'border-status-danger-text focus-within:border-status-danger-text focus-within:ring-status-danger-text/20',
				disabled && 'cursor-not-allowed bg-surface-muted',
				containerClassName,
			)}
		>
			{startAdornment && (
				<span
					aria-hidden="true"
					className="inline-flex size-[18px] shrink-0 items-center justify-center [&>img]:size-full [&>svg]:size-full"
				>
					{startAdornment}
				</span>
			)}
			<input
				{...props}
				disabled={disabled}
				aria-invalid={error || props['aria-invalid']}
				className={joinClasses(
					'min-w-0 flex-1 border-0 bg-transparent p-0 text-[14px] leading-[1.45] text-text-primary outline-none placeholder:text-text-secondary/70 disabled:cursor-not-allowed',
					className,
				)}
			/>
			{endAdornment && (
				<span
					aria-hidden="true"
					className="inline-flex size-[18px] shrink-0 items-center justify-center [&>img]:size-full [&>svg]:size-full"
				>
					{endAdornment}
				</span>
			)}
		</div>
	)
}

export default Input
