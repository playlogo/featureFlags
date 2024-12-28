export interface FeatureConfig {
	type: string;
	executable: string;
	websocket: boolean;
	args: string[];
	expose: {
		inline: {
			name: string;
			param: string;
			type: "string" | "number" | "boolean" | "array";
			description: string;
			default: string | number | any[];
			specific?: string;
		}[];
	};
	report?: {
		name: string;
		type: string;
		descriptions: string;
	}[];
}

export interface Feature {
	name: string;
	enabled: boolean;
	params: {
		name: string;
		type: "array" | "string" | "boolean" | "number";
		value: any;
		description: string;
		default?: any;
	}[];
	executable: string;
	args: string[];
	websocket: boolean;
}
