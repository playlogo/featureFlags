export async function exists(path: string) {
	try {
		await Deno.stat(path);

		return true;
	} catch (err) {
		if (err instanceof Deno.errors.NotFound) {
			return false;
		}

		throw err;
	}
}

export function randomHSLColor() {
	const randomInt = (min: number, max: number) => {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};

	const h = randomInt(0, 360);
	const s = randomInt(42, 98);
	const l = randomInt(40, 90);

	return `hsl(${h},${s}%,${l}%)`;
}

export function hslToHex(hsl: string) {
	const [h, s, l] = hsl.match(/\d+/g)!.map(Number);

	const lPercent = l / 100;
	const a = (s * Math.min(lPercent, 1 - lPercent)) / 100;
	const f = (n: number) => {
		const k = (n + h / 30) % 12;
		const color = lPercent - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
		return Math.round(255 * color)
			.toString(16)
			.padStart(2, "0"); // convert to Hex and prefix "0" if needed
	};
	return `#${f(0)}${f(8)}${f(4)}`;
}
