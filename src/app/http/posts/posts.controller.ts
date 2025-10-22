import postgresConnection from '@/libs/config/postgresConnection';
import { TRequestFunction, InvalidParameterException, NotFoundException, ForbiddenException } from '@/libs/core';
import { TCreatePostValidation, TUpdatePostValidation, TUpdatePostStatusValidation, TListPostsQueryValidation } from './posts.request';

// Helper function to generate slug from title
const generateSlug = (title: string): string => {
	return title
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
};

// Helper function to generate excerpt from content if not provided
const generateExcerpt = (content: string, maxLength: number = 200): string => {
	// Remove HTML tags
	const plainText = content.replace(/<[^>]*>/g, '');
	// Truncate and add ellipsis
	return plainText.length > maxLength 
		? plainText.substring(0, maxLength).trim() + '...'
		: plainText;
};

// Helper function to get post with relationships
const getPostWithRelations = async (postId: string): Promise<Entity.IPost | null> => {
	const post = await postgresConnection.queryOne<Entity.IPost>(`
		SELECT 
			p.*,
			json_build_object(
				'id', u.id,
				'name', u.name,
				'email', u.email,
				'avatar', u.avatar
			) as author,
			json_build_object(
				'id', c.id,
				'name', c.name,
				'slug', c.slug,
				'description', c.description
			) as category
		FROM posts p
		LEFT JOIN users u ON p.author_id = u.id
		LEFT JOIN categories c ON p.category_id = c.id
		WHERE p.id = $1
	`, [postId]);

	if (!post) return null;

	// Get tags for this post
	const tags = await postgresConnection.query<Entity.ITag>(`
		SELECT t.id, t.name, t.slug
		FROM tags t
		INNER JOIN post_tags pt ON t.id = pt.tag_id
		WHERE pt.post_id = $1
		ORDER BY t.name
	`, [postId]);

	post.tags = tags;

	return post;
};

/**
 * GET /posts - List posts with pagination and filters
 */
const listPosts: TRequestFunction = async (req) => {
	const query = req.query as unknown as TListPostsQueryValidation;
	
	const page = Number(query.page) || 1;
	const limit = Math.min(Number(query.limit) || 10, 100); // Max 100 items per page
	const offset = (page - 1) * limit;
	
	// Build WHERE conditions
	const conditions: string[] = [];
	const params: any[] = [];
	let paramIndex = 1;

	if (query.status) {
		conditions.push(`p.status = $${paramIndex}`);
		params.push(query.status);
		paramIndex++;
	}

	if (query.category) {
		conditions.push(`p.category_id = $${paramIndex}`);
		params.push(query.category);
		paramIndex++;
	}

	if (query.author) {
		conditions.push(`p.author_id = $${paramIndex}`);
		params.push(query.author);
		paramIndex++;
	}

	if (query.search) {
		conditions.push(`(
			p.title ILIKE $${paramIndex} OR 
			p.content ILIKE $${paramIndex} OR 
			p.excerpt ILIKE $${paramIndex}
		)`);
		params.push(`%${query.search}%`);
		paramIndex++;
	}

	if (query.tag) {
		conditions.push(`p.id IN (
			SELECT pt.post_id FROM post_tags pt WHERE pt.tag_id = $${paramIndex}
		)`);
		params.push(query.tag);
		paramIndex++;
	}

	const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

	// Build ORDER BY clause
	const sortBy = query.sortBy || 'created_at';
	const sortOrder = query.sortOrder || 'desc';
	const orderClause = `ORDER BY p.${sortBy} ${sortOrder.toUpperCase()}`;

	// Get total count
	const countResult = await postgresConnection.queryOne<{ count: string }>(`
		SELECT COUNT(*) as count
		FROM posts p
		${whereClause}
	`, params);

	const total = parseInt(countResult?.count || '0');
	const totalPages = Math.ceil(total / limit);

	// Get posts with relationships
	const posts = await postgresConnection.query<Entity.IPost>(`
		SELECT 
			p.id,
			p.title,
			p.slug,
			p.excerpt,
			p.content,
			p.status,
			p.featured_image,
			p.view_count,
			p.published_at,
			p.created_at,
			p.updated_at,
			json_build_object(
				'id', u.id,
				'name', u.name,
				'email', u.email,
				'avatar', u.avatar
			) as author,
			json_build_object(
				'id', c.id,
				'name', c.name,
				'slug', c.slug
			) as category
		FROM posts p
		LEFT JOIN users u ON p.author_id = u.id
		LEFT JOIN categories c ON p.category_id = c.id
		${whereClause}
		${orderClause}
		LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
	`, [...params, limit, offset]);

	// Get tags for each post
	for (const post of posts) {
		const tags = await postgresConnection.query<Entity.ITag>(`
			SELECT t.id, t.name, t.slug
			FROM tags t
			INNER JOIN post_tags pt ON t.id = pt.tag_id
			WHERE pt.post_id = $1
			ORDER BY t.name
		`, [post.id]);
		post.tags = tags;
	}

	const meta: Entity.IPaginationMeta = {
		page,
		limit,
		total,
		totalPages,
		hasNextPage: page < totalPages,
		hasPrevPage: page > 1
	};

	return {
		message: 'Posts retrieved successfully',
		result: posts,
		meta
	};
};

/**
 * GET /posts/:id - Get single post by ID
 */
const getPost: TRequestFunction = async (req) => {
	const { id } = req.params;

	if (!id) {
		throw new InvalidParameterException('Post ID is required');
	}

	const post = await getPostWithRelations(id);

	if (!post) {
		throw new NotFoundException('Post not found');
	}

	// Increment view count
	await postgresConnection.query(
		'UPDATE posts SET view_count = view_count + 1 WHERE id = $1',
		[id]
	);

	return {
		message: 'Post retrieved successfully',
		result: post
	};
};

/**
 * POST /posts - Create new post
 */
const createPost: TRequestFunction = async (req) => {
	const data = req.body as TCreatePostValidation;
	const userId = req.userId; // From auth middleware

	if (!userId) {
		throw new InvalidParameterException('User authentication required');
	}

	// Generate slug from title
	let slug = generateSlug(data.title);
	
	// Check if slug already exists, if yes, append timestamp
	const existingSlug = await postgresConnection.queryOne<{ id: string }>(
		'SELECT id FROM posts WHERE slug = $1 LIMIT 1',
		[slug]
	);
	
	if (existingSlug) {
		slug = `${slug}-${Date.now()}`;
	}

	// Generate excerpt if not provided
	const excerpt = data.excerpt || generateExcerpt(data.content);

	// Insert post
	const post = await postgresConnection.queryOne<Entity.IPost>(`
		INSERT INTO posts (
			title, 
			slug, 
			excerpt, 
			content, 
			status, 
			featured_image,
			meta_title,
			meta_description,
			meta_keywords,
			author_id, 
			category_id
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING *
	`, [
		data.title,
		slug,
		excerpt,
		data.content,
		data.status || 'draft',
		data.featuredImage || null,
		data.metaTitle || data.title,
		data.metaDescription || excerpt,
		data.metaKeywords || null,
		userId,
		data.categoryId || null
	]);

	if (!post || !post.id) {
		throw new Error('Failed to create post');
	}

	// Insert tags if provided
	if (data.tagIds && data.tagIds.length > 0) {
		for (const tagId of data.tagIds) {
			await postgresConnection.query(
				'INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
				[post.id, tagId]
			);
		}
	}

	// Get post with relationships
	const createdPost = await getPostWithRelations(post.id);

	return {
		message: 'Post created successfully',
		result: createdPost
	};
};

/**
 * PUT /posts/:id - Update post
 */
const updatePost: TRequestFunction = async (req) => {
	const { id } = req.params;
	const data = req.body as TUpdatePostValidation;
	const userId = req.userId;
	const userRole = req.userData?.role;

	if (!id) {
		throw new InvalidParameterException('Post ID is required');
	}

	// Check if post exists
	const existingPost = await postgresConnection.queryOne<Entity.IPost>(
		'SELECT * FROM posts WHERE id = $1 LIMIT 1',
		[id]
	);

	if (!existingPost) {
		throw new NotFoundException('Post not found');
	}

	// Authorization check: Only post owner or ADMIN can update
	if (existingPost.author_id !== userId && userRole !== 'ADMIN') {
		throw new ForbiddenException('You do not have permission to update this post');
	}

	// Build update fields dynamically
	const updates: string[] = [];
	const params: any[] = [];
	let paramIndex = 1;

	if (data.title !== undefined) {
		updates.push(`title = $${paramIndex}`);
		params.push(data.title);
		paramIndex++;

		// Update slug if title changed
		const newSlug = generateSlug(data.title);
		updates.push(`slug = $${paramIndex}`);
		params.push(newSlug);
		paramIndex++;
	}

	if (data.content !== undefined) {
		updates.push(`content = $${paramIndex}`);
		params.push(data.content);
		paramIndex++;
	}

	if (data.excerpt !== undefined) {
		updates.push(`excerpt = $${paramIndex}`);
		params.push(data.excerpt);
		paramIndex++;
	}

	if (data.status !== undefined) {
		updates.push(`status = $${paramIndex}`);
		params.push(data.status);
		paramIndex++;
	}

	if (data.featuredImage !== undefined) {
		updates.push(`featured_image = $${paramIndex}`);
		params.push(data.featuredImage);
		paramIndex++;
	}

	if (data.categoryId !== undefined) {
		updates.push(`category_id = $${paramIndex}`);
		params.push(data.categoryId || null);
		paramIndex++;
	}

	if (data.metaTitle !== undefined) {
		updates.push(`meta_title = $${paramIndex}`);
		params.push(data.metaTitle);
		paramIndex++;
	}

	if (data.metaDescription !== undefined) {
		updates.push(`meta_description = $${paramIndex}`);
		params.push(data.metaDescription);
		paramIndex++;
	}

	if (data.metaKeywords !== undefined) {
		updates.push(`meta_keywords = $${paramIndex}`);
		params.push(data.metaKeywords);
		paramIndex++;
	}

	if (updates.length === 0) {
		throw new InvalidParameterException('No fields to update');
	}

	// Update post
	await postgresConnection.query(`
		UPDATE posts
		SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
		WHERE id = $${paramIndex}
	`, [...params, id]);

	// Update tags if provided
	if (data.tagIds !== undefined) {
		// Remove existing tags
		await postgresConnection.query('DELETE FROM post_tags WHERE post_id = $1', [id]);
		
		// Insert new tags
		if (data.tagIds.length > 0) {
			for (const tagId of data.tagIds) {
				await postgresConnection.query(
					'INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
					[id, tagId]
				);
			}
		}
	}

	// Get updated post with relationships
	const updatedPost = await getPostWithRelations(id);

	return {
		message: 'Post updated successfully',
		result: updatedPost
	};
};

/**
 * DELETE /posts/:id - Delete post
 */
const deletePost: TRequestFunction = async (req) => {
	const { id } = req.params;
	const userId = req.userId;
	const userRole = req.userData?.role;

	if (!id) {
		throw new InvalidParameterException('Post ID is required');
	}

	// Check if post exists and get author info
	const existingPost = await postgresConnection.queryOne<Entity.IPost>(
		'SELECT id, author_id FROM posts WHERE id = $1 LIMIT 1',
		[id]
	);

	if (!existingPost) {
		throw new NotFoundException('Post not found');
	}

	// Authorization check: Only post owner or ADMIN can delete
	if (existingPost.author_id !== userId && userRole !== 'ADMIN') {
		throw new ForbiddenException('You do not have permission to delete this post. Only the post author or administrators can delete posts.');
	}

	// Delete post (cascade will handle post_tags)
	await postgresConnection.query('DELETE FROM posts WHERE id = $1', [id]);

	return {
		message: 'Post deleted successfully',
		result: null
	};
};

/**
 * PATCH /posts/:id/status - Update post status only
 */
const updatePostStatus: TRequestFunction = async (req) => {
	const { id } = req.params;
	const { status } = req.body as TUpdatePostStatusValidation;
	const userId = req.userId;
	const userRole = req.userData?.role;

	if (!id) {
		throw new InvalidParameterException('Post ID is required');
	}

	// Check if post exists
	const existingPost = await postgresConnection.queryOne<Entity.IPost>(
		'SELECT id, author_id FROM posts WHERE id = $1 LIMIT 1',
		[id]
	);

	if (!existingPost) {
		throw new NotFoundException('Post not found');
	}

	// Authorization check: Only post owner or ADMIN can update status
	if (existingPost.author_id !== userId && userRole !== 'ADMIN') {
		throw new ForbiddenException('You do not have permission to update this post status');
	}

	// Update status
	await postgresConnection.query(
		'UPDATE posts SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
		[status, id]
	);

	// Get updated post
	const updatedPost = await getPostWithRelations(id);

	return {
		message: `Post status updated to ${status}`,
		result: updatedPost
	};
};

export default {
	listPosts,
	getPost,
	createPost,
	updatePost,
	deletePost,
	updatePostStatus
};

