declare namespace Express {
	export interface Request {
		userId?: string // UUID
		userData?: {
			id: string; // UUID
			username: string;
			name: string;
			role: string;
		}
		isGuest?: boolean;
	}
}
