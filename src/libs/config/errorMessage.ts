// Basic validation error messages
const basicValidationMessage = {
	string: (field: string) => `${field} harus berupa string`,
	number: (field: string) => `${field} harus berupa number`,
	boolean: (field: string) => `${field} harus berupa boolean`,
	email: (field: string) => `${field} harus berupa email yang valid`,
	url: (field: string) => `${field} harus berupa URL yang valid`,
	required: (field: string) => `${field} wajib diisi`,
	minLength: (field: string, min: number) => `${field} minimal ${min} karakter`,
	maxLength: (field: string, max: number) => `${field} maksimal ${max} karakter`,
	min: (field: string, min: number) => `${field} minimal ${min}`,
	max: (field: string, max: number) => `${field} maksimal ${max}`,
	pattern: (field: string) => `${field} format tidak valid`,
	enum: (field: string, values: string[]) => `${field} harus salah satu dari: ${values.join(', ')}`
};

export const ERROR_VALIDATION_MSG = {
	...basicValidationMessage
};
