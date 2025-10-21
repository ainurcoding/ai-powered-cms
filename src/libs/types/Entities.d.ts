declare namespace Entity {
	interface IUser {
		id?: string // UUID
		name?: string
		username?: string
		email?: string
		password?: string
		role?: string // ADMIN, USER, EDITOR
		is_active?: boolean
		created_at?: Date
		updated_at?: Date
	}
}
