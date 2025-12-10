import React from "react";

type SliderFieldProps = {
	label: string;
	value: number;
	onChange: (val: number) => void;
	helpText?: string;
};

export default function SliderField({
	label,
	value,
	onChange,
	helpText,
}: SliderFieldProps) {
	return (
		<label className="block space-y-2">
			<div className="flex items-center justify-between text-sm text-[var(--ns-color-card-foreground)]">
				<span className="font-semibold">{label}</span>
				<span className="text-xs text-[var(--ns-color-muted)]">
					{value}/5
				</span>
			</div>
			<input
				type="range"
				min={1}
				max={5}
				step={1}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full accent-ns-gold"
				aria-label={`${label} rating ${value} of 5`}
			/>
			{helpText ? (
				<p className="text-xs text-[var(--ns-color-muted)]">{helpText}</p>
			) : null}
		</label>
	);
}
