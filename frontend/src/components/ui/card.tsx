import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement>

function joinClasses(...classes: (string | undefined)[]) {
	return classes.filter(Boolean).join(' ')
}

export function Card({ className, ...props }: CardProps) {
	return (
		<section
			{...props}
			className={joinClasses(
				'flex flex-col gap-6 rounded-card border border-border bg-surface-card p-6',
				className,
			)}
		/>
	)
}

export function CardHeader({ className, ...props }: CardProps) {
	return (
		<header
			{...props}
			className={joinClasses('flex flex-col gap-[5px]', className)}
		/>
	)
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h2
			{...props}
			className={joinClasses('text-[19px] font-normal leading-normal text-text-primary', className)}
		/>
	)
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
	return (
		<p
			{...props}
			className={joinClasses('text-[13px] leading-[1.5] text-text-secondary', className)}
		/>
	)
}

export function CardContent({ className, ...props }: CardProps) {
	return <div {...props} className={joinClasses('w-full', className)} />
}

export function CardFooter({ className, ...props }: CardProps) {
	return (
		<footer
			{...props}
			className={joinClasses('flex items-center gap-3', className)}
		/>
	)
}

export default Card
