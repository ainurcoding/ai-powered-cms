declare namespace Entity {
	interface IUser {
		id?: string // UUID
		name?: string
		username?: string
		email?: string
		password?: string
		role?: string // ADMIN, USER, EDITOR
		is_active?: boolean
		avatar?: string
		bio?: string
		google_id?: string // Google OAuth ID
		created_at?: Date
		updated_at?: Date
	}

	interface ICategory {
		id?: string // UUID
		name?: string
		slug?: string
		description?: string
		parent_id?: string
		created_at?: Date
		updated_at?: Date
		// Computed fields
		parent_name?: string
		post_count?: number
		children?: ICategory[]
	}

	interface ITag {
		id?: string // UUID
		name?: string
		slug?: string
		created_at?: Date
		// Computed fields
		post_count?: number
	}

	interface IPost {
		id?: string // UUID
		title?: string
		slug?: string
		excerpt?: string
		content?: string
		status?: 'draft' | 'published' | 'archived'
		featured_image?: string
		// SEO fields
		meta_title?: string
		meta_description?: string
		meta_keywords?: string
		// Relationships
		author_id?: string
		category_id?: string
		// Statistics
		view_count?: number
		// AI tracking
		is_ai_generated?: boolean
		ai_prompt?: string
		// Timestamps
		published_at?: Date
		created_at?: Date
		updated_at?: Date
		// Populated relationships
		author?: IUser
		category?: ICategory
		tags?: ITag[]
	}

	interface IPostTag {
		post_id?: string
		tag_id?: string
		created_at?: Date
	}

	interface IMedia {
		id?: string // UUID
		file_name?: string
		file_size?: number
		file_type?: string
		mime_type?: string
		url?: string
		secure_url?: string
		thumbnail_url?: string
		public_id?: string
		width?: number
		height?: number
		format?: string
		folder?: string
		alt_text?: string
		caption?: string
		uploaded_by?: string
		created_at?: Date
		updated_at?: Date
		// Populated relationships
		uploader?: IUser
	}

	interface IPaginationMeta {
		page: number
		limit: number
		total: number
		totalPages: number
		hasNextPage: boolean
		hasPrevPage: boolean
	}
}
