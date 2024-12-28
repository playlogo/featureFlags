interface DataStoreData {
	version: number;
	features: {
		[key: string]: {
			enabled: boolean;
			params: {
				[key: string]: any;
			};
		};
	};
}

export interface ServerConfig {
	executables: {
		[key: string]: string;
	};
	port: number;
}
