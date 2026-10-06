import type { HTMLAttributes, ReactNode } from 'react'

export type BadgeVariant = 'success' | 'warning' | 'danger'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	variant?: BadgeVariant
	icon?: ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
	success: 'bg-surface-success text-brand',
	warning: 'bg-status-warning text-status-warning-text',
	danger: 'bg-status-danger text-status-danger-text',
}

function joinClasses(...classes: (string | undefined)[]) {
	return classes.filter(Boolean).join(' ')
}

export function Badge({
	children,
	className,
	icon,
	variant = 'success',
	...props
}: BadgeProps) {
	return (
		<span
			{...props}
			className={joinClasses(
				'inline-flex items-center gap-1.5 whitespace-nowrap rounded-control px-2.5 py-[7px] text-[12px] font-semibold leading-normal',
				variantClasses[variant],
				className,
			)}
		>
			{icon && (
				<span
					aria-hidden="true"
					className="inline-flex size-[14px] shrink-0 items-center justify-center [&>img]:size-full [&>svg]:size-full"
				>
					{icon}
				</span>
			)}
			{children}
		</span>
	)
}

export default Badge
