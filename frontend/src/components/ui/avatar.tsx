import type { HTMLAttributes, ReactNode } from 'react'

export type AvatarSize = 'sm' | 'md' | 'lg'

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
	children: ReactNode
	size?: AvatarSize
}

const sizeClasses: Record<AvatarSize, string> = {
	sm: 'size-8 text-[11px]',
	md: 'size-9 text-xs',
	lg: 'size-12 text-sm',
}

export function Avatar({ children, className = '', size = 'md', ...props }: AvatarProps) {
	return (
		<span
			{...props}
			className={`inline-flex shrink-0 items-center justify-center rounded-full bg-surface-muted font-semibold text-brand-deep ${sizeClasses[size]} ${className}`.trim()}
		>
			{children}
		</span>
	)
}

export default Avatar