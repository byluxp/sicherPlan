import type { TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'

function joinClasses(...classes: (string | undefined)[]) {
	return classes.filter(Boolean).join(' ')
}

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
	return (
		<div className="w-full overflow-x-auto">
			<table
				{...props}
				className={joinClasses('w-full min-w-[720px] border-collapse text-left', className)}
			/>
		</div>
	)
}

export function TableHeader({ className, ...props }: TableHTMLAttributes<HTMLTableSectionElement>) {
	return <thead {...props} className={className} />
}

export function TableBody({ className, ...props }: TableHTMLAttributes<HTMLTableSectionElement>) {
	return <tbody {...props} className={className} />
}

export function TableRow({ className, ...props }: TableHTMLAttributes<HTMLTableRowElement>) {
	return <tr {...props} className={joinClasses('border-b border-border last:border-b-0', className)} />
}

export function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
	return (
		<th
			{...props}
			className={joinClasses(
				'bg-surface-muted px-3 py-2.5 text-[11px] font-semibold leading-normal text-text-secondary first:rounded-l-md last:rounded-r-md',
				className,
			)}
		/>
	)
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
	return (
		<td
			{...props}
			className={joinClasses('px-3 py-3.5 text-[13px] leading-[1.45] text-text-primary', className)}
		/>
	)
}
