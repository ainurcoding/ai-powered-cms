import postgresConnection from '@/libs/config/postgresConnection';
import { TRequestFunction, InvalidParameterException, NotFoundException, ForbiddenException } from '@/libs/core';
import { TCreateTagValidation, TUpdateTagValidation, TListTagsQueryValidation, TTagSuggestionsQueryValidation } from './tags.request';

// Helper function to generate slug from name
const generateSlug = (name: string): string => {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
};

/**
 * GET /tags - List all tags
 */
const listTags: TRequestFunction = async (req) => {
	const query = req.query as unknown as TListTagsQueryValidation;
	
	const page = Number(query.page) || 1;
	const limit = Math.min(Number(query.limit) || 50, 100);
	const offset = (page - 1) * limit;
	const includeCount = query.includeCount === 'true';
	const sortBy = query.sortBy || 'name';

	// Build WHERE conditions
	const conditions: string[] = [];
	const params: any[] = [];
	let paramIndex = 1;

	if (query.search) {
		conditions.push(`t.name ILIKE $${paramIndex}`);
		params.push(`%${query.search}%`);
		paramIndex++;
	}

	const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

	// Get total count
	const countResult = await postgresConnection.queryOne<{ count: string }>(`
		SELECT COUNT(*) as count
		FROM tags t
		${whereClause}
	`, params);

	const total = parseInt(countResult?.count || '0');
	const totalPages = Math.ceil(total / limit);

	// Determine sort column
	const validSortColumns = ['name', 'created_at', 'post_count'];
	const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'name';

	// Always include post_count if sorting by it or if includeCount is true
	const shouldIncludeCount = includeCount || sortColumn === 'post_count';

	// Build query with optional post count
	let selectQuery = `
		SELECT 
			t.id,
			t.name,
			t.slug,
			t.created_at
	`;

	if (shouldIncludeCount) {
		selectQuery += `,
			(SELECT COUNT(*) FROM post_tags pt WHERE pt.tag_id = t.id) as post_count
		`;
	}

	// Build ORDER BY clause
	let orderByClause = 'ORDER BY ';
	if (sortColumn === 'post_count') {
		orderByClause += '(SELECT COUNT(*) FROM post_tags pt WHERE pt.tag_id = t.id) DESC';
	} else {
		orderByClause += `t.${sortColumn} ${sortColumn === 'name' ? 'ASC' : 'DESC'}`;
	}

	selectQuery += `
		FROM tags t
		${whereClause}
		${orderByClause}
		LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
	`;

	const tags = await postgresConnection.query<Entity.ITag>(
		selectQuery,
		[...params, limit, offset]
	);

	const meta: Entity.IPaginationMeta = {
		page,
		limit,
		total,
		totalPages,
		hasNextPage: page < totalPages,
		hasPrevPage: page > 1
	};

	return {
		message: 'Tags retrieved successfully',
		result: tags,
		meta
	};
};

/**
 * GET /tags/suggestions - Autocomplete suggestions
 */
const getTagSuggestions: TRequestFunction = async (req) => {
	const query = req.query as unknown as TTagSuggestionsQueryValidation;
	
	const limit = Math.min(Number(query.limit) || 5, 20);

	// Search tags by name
	const tags = await postgresConnection.query<Entity.ITag>(`
		SELECT 
			id,
			name,
			slug,
			(SELECT COUNT(*) FROM post_tags pt WHERE pt.tag_id = tags.id) as post_count
		FROM tags
		WHERE name ILIKE $1
		ORDER BY 
			CASE WHEN name ILIKE $2 THEN 1 ELSE 2 END,
			(SELECT COUNT(*) FROM post_tags pt WHERE pt.tag_id = tags.id) DESC,
			name ASC
		LIMIT $3
	`, [`%${query.q}%`, `${query.q}%`, limit]);

	return {
		message: 'Tag suggestions retrieved successfully',
		result: tags
	};
};

/**
 * GET /tags/:id - Get single tag
 */
const getTag: TRequestFunction = async (req) => {
	const { id } = req.params;
	const includePostsQuery = req.query.includePosts === 'true';
	const postsLimit = Math.min(Number(req.query.postsLimit) || 5, 20);

	if (!id) {
		throw new InvalidParameterException('Tag ID is required');
	}

	// Get tag with post count
	const tag = await postgresConnection.queryOne<Entity.ITag>(`
		SELECT 
			t.id,
			t.name,
			t.slug,
			t.created_at,
			(SELECT COUNT(*) FROM post_tags pt WHERE pt.tag_id = t.id) as post_count
		FROM tags t
		WHERE t.id = $1
	`, [id]);

	if (!tag) {
		throw new NotFoundException('Tag not found');
	}

	// Optionally include recent posts
	if (includePostsQuery) {
		const posts = await postgresConnection.query<any>(`
			SELECT 
				p.id,
				p.title,
				p.slug,
				p.excerpt,
				p.status,
				p.created_at
			FROM posts p
			INNER JOIN post_tags pt ON p.id = pt.post_id
			WHERE pt.tag_id = $1 AND p.status = 'published'
			ORDER BY p.created_at DESC
			LIMIT $2
		`, [id, postsLimit]);

		(tag as any).recentPosts = posts;
	}

	return {
		message: 'Tag retrieved successfully',
		result: tag
	};
};

/**
 * POST /tags - Create new tag
 */
const createTag: TRequestFunction = async (req) => {
	const data = req.body as TCreateTagValidation;
	const userRole = req.userData?.role;

	// Authorization: Only ADMIN and EDITOR can create tags
	if (userRole !== 'ADMIN' && userRole !== 'EDITOR') {
		throw new ForbiddenException('Only administrators and editors can create tags');
	}

	// Generate slug
	let slug = generateSlug(data.name);

	// Check if tag or slug already exists
	const existingTag = await postgresConnection.queryOne<{ id: string }>(
		'SELECT id FROM tags WHERE name ILIKE $1 OR slug = $2 LIMIT 1',
		[data.name, slug]
	);

	if (existingTag) {
		throw new InvalidParameterException('Tag with this name already exists');
	}

	// Insert tag
	const tag = await postgresConnection.queryOne<Entity.ITag>(`
		INSERT INTO tags (name, slug)
		VALUES ($1, $2)
		RETURNING *
	`, [data.name, slug]);

	return {
		message: 'Tag created successfully',
		result: tag
	};
};

/**
 * PUT /tags/:id - Update tag
 */
const updateTag: TRequestFunction = async (req) => {
	const { id } = req.params;
	const data = req.body as TUpdateTagValidation;
	const userRole = req.userData?.role;

	// Authorization: Only ADMIN and EDITOR can update tags
	if (userRole !== 'ADMIN' && userRole !== 'EDITOR') {
		throw new ForbiddenException('Only administrators and editors can update tags');
	}

	if (!id) {
		throw new InvalidParameterException('Tag ID is required');
	}

	// Check if tag exists
	const existingTag = await postgresConnection.queryOne<Entity.ITag>(
		'SELECT * FROM tags WHERE id = $1 LIMIT 1',
		[id]
	);

	if (!existingTag) {
		throw new NotFoundException('Tag not found');
	}

	// Generate new slug
	const newSlug = generateSlug(data.name);

	// Check if name/slug conflicts with another tag
	const conflictTag = await postgresConnection.queryOne<{ id: string }>(
		'SELECT id FROM tags WHERE (name ILIKE $1 OR slug = $2) AND id != $3 LIMIT 1',
		[data.name, newSlug, id]
	);

	if (conflictTag) {
		throw new InvalidParameterException('Tag with this name already exists');
	}

	// Update tag
	await postgresConnection.query(`
		UPDATE tags
		SET name = $1, slug = $2
		WHERE id = $3
	`, [data.name, newSlug, id]);

	// Get updated tag
	const updatedTag = await postgresConnection.queryOne<Entity.ITag>(
		'SELECT * FROM tags WHERE id = $1',
		[id]
	);

	return {
		message: 'Tag updated successfully',
		result: updatedTag
	};
};

/**
 * DELETE /tags/:id - Delete tag
 */
const deleteTag: TRequestFunction = async (req) => {
	const { id } = req.params;
	const userRole = req.userData?.role;

	// Authorization: Only ADMIN can delete tags
	if (userRole !== 'ADMIN') {
		throw new ForbiddenException('Only administrators can delete tags');
	}

	if (!id) {
		throw new InvalidParameterException('Tag ID is required');
	}

	// Check if tag exists
	const existingTag = await postgresConnection.queryOne<Entity.ITag>(
		'SELECT id FROM tags WHERE id = $1 LIMIT 1',
		[id]
	);

	if (!existingTag) {
		throw new NotFoundException('Tag not found');
	}

	// Delete tag (cascade will handle post_tags)
	await postgresConnection.query('DELETE FROM tags WHERE id = $1', [id]);

	return {
		message: 'Tag deleted successfully',
		result: null
	};
};

export default {
	listTags,
	getTagSuggestions,
	getTag,
	createTag,
	updateTag,
	deleteTag
};

