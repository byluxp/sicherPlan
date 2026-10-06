import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'disabled'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant
	icon?: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
	primary: 'border-brand bg-brand text-brand-on-primary hover:border-brand-deep hover:bg-brand-deep',
	secondary: 'border-brand bg-surface-muted text-brand hover:bg-surface-success',
	disabled: 'cursor-not-allowed border-border bg-surface-muted text-text-secondary',
}

export function Button({
	children,
	className = '',
	disabled = false,
	icon,
	type = 'button',
	variant = 'primary',
	...props
}: ButtonProps) {
	const isDisabled = disabled || variant === 'disabled'
	const visualVariant = isDisabled ? 'disabled' : variant
	const classes = [
		'inline-flex min-h-[42px] items-center justify-center gap-2 rounded-control border px-4 py-3 font-sans text-[13px] font-semibold leading-normal transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:cursor-not-allowed',
		variantClasses[visualVariant],
		className,
	]
		.filter(Boolean)
		.join(' ')

	return (
		<button {...props} type={type} disabled={isDisabled} className={classes}>
			{icon && (
				<span
					aria-hidden="true"
					className="inline-flex size-[18px] shrink-0 items-center justify-center [&>img]:size-full [&>svg]:size-full"
				>
					{icon}
				</span>
			)}
			{children}
		</button>
	)
}

export default Button
