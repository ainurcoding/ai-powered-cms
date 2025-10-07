declare namespace Entity {
	interface IUser {
		id_user?: number
		nama?: string
		username?: string
		password?: string
		level?: string
		aktif?: boolean
		status_login?: string
		hint_password?: string
		ip_address?: string
		created_at?: Date
		updated_at?: Date
	}
}
