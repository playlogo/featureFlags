interface FeatureConfig {
	type: "process";
	executable: "";
	websocket: boolean;
	args: string[];
	expose: {
		inline: {
			name: string;
			param: string;
			type: "array" | "string" | "number";
			description: string;
			default: any;
			specific?: string;
		}[];
	};
	report: {
		name: "forbiddenConnections";
		type: "string";
		description: string;
	}[];
}
