import postgresConnection from '@/libs/config/postgresConnection';
import { TRequestFunction, InvalidParameterException, NotFoundException, ForbiddenException } from '@/libs/core';
import { TCreateCategoryValidation, TUpdateCategoryValidation, TListCategoriesQueryValidation } from './categories.request';

// Helper function to generate slug from name
const generateSlug = (name: string): string => {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
};

// Helper function to build category tree (hierarchical structure)
const buildCategoryTree = (categories: Entity.ICategory[]): Entity.ICategory[] => {
	const categoryMap = new Map<string, Entity.ICategory>();
	const rootCategories: Entity.ICategory[] = [];

	// First pass: create map of all categories
	categories.forEach(category => {
		categoryMap.set(category.id!, { ...category, children: [] });
	});

	// Second pass: build tree structure
	categories.forEach(category => {
		const cat = categoryMap.get(category.id!);
		if (cat) {
			if (category.parent_id) {
				const parent = categoryMap.get(category.parent_id);
				if (parent) {
					if (!parent.children) parent.children = [];
					parent.children.push(cat);
				} else {
					rootCategories.push(cat);
				}
			} else {
				rootCategories.push(cat);
			}
		}
	});

	return rootCategories;
};

/**
 * GET /categories - List all categories with hierarchy
 */
const listCategories: TRequestFunction = async (req) => {
	const query = req.query as unknown as TListCategoriesQueryValidation;
	
	const page = Number(query.page) || 1;
	const limit = Math.min(Number(query.limit) || 50, 100);
	const offset = (page - 1) * limit;
	const includeCount = query.includeCount === 'true';

	// Build WHERE conditions
	const conditions: string[] = [];
	const params: any[] = [];
	let paramIndex = 1;

	if (query.parent) {
		if (query.parent === 'null') {
			conditions.push('c.parent_id IS NULL');
		} else {
			conditions.push(`c.parent_id = $${paramIndex}`);
			params.push(query.parent);
			paramIndex++;
		}
	}

	const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

	// Get total count
	const countResult = await postgresConnection.queryOne<{ count: string }>(`
		SELECT COUNT(*) as count
		FROM categories c
		${whereClause}
	`, params);

	const total = parseInt(countResult?.count || '0');
	const totalPages = Math.ceil(total / limit);

	// Build query with optional post count
	let selectQuery = `
		SELECT 
			c.id,
			c.name,
			c.slug,
			c.description,
			c.parent_id,
			c.created_at,
			c.updated_at
	`;

	if (includeCount) {
		selectQuery += `,
			(SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id) as post_count
		`;
	}

	selectQuery += `
		FROM categories c
		${whereClause}
		ORDER BY c.name ASC
		LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
	`;

	const categories = await postgresConnection.query<Entity.ICategory>(
		selectQuery,
		[...params, limit, offset]
	);

	// Build tree structure if not filtering by parent
	let result: Entity.ICategory[];
	if (!query.parent) {
		result = buildCategoryTree(categories);
	} else {
		result = categories;
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
		message: 'Categories retrieved successfully',
		result,
		meta
	};
};

/**
 * GET /categories/:id - Get single category
 */
const getCategory: TRequestFunction = async (req) => {
	const { id } = req.params;
	const includePostsQuery = req.query.includePosts === 'true';
	const postsLimit = Math.min(Number(req.query.postsLimit) || 5, 20);

	if (!id) {
		throw new InvalidParameterException('Category ID is required');
	}

	// Get category with post count
	const category = await postgresConnection.queryOne<Entity.ICategory>(`
		SELECT 
			c.id,
			c.name,
			c.slug,
			c.description,
			c.parent_id,
			c.created_at,
			c.updated_at,
			(SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id) as post_count
		FROM categories c
		WHERE c.id = $1
	`, [id]);

	if (!category) {
		throw new NotFoundException('Category not found');
	}

	// Get parent info if exists
	if (category.parent_id) {
		const parent = await postgresConnection.queryOne<Entity.ICategory>(`
			SELECT id, name, slug
			FROM categories
			WHERE id = $1
		`, [category.parent_id]);
		
		if (parent) {
			category.parent_name = parent.name;
		}
	}

	// Get children categories
	const children = await postgresConnection.query<Entity.ICategory>(`
		SELECT 
			id,
			name,
			slug,
			description,
			(SELECT COUNT(*) FROM posts p WHERE p.category_id = categories.id) as post_count
		FROM categories
		WHERE parent_id = $1
		ORDER BY name ASC
	`, [id]);

	if (children.length > 0) {
		category.children = children;
	}

	// Optionally include recent posts
	if (includePostsQuery) {
		const posts = await postgresConnection.query<any>(`
			SELECT 
				id,
				title,
				slug,
				excerpt,
				status,
				created_at
			FROM posts
			WHERE category_id = $1 AND status = 'published'
			ORDER BY created_at DESC
			LIMIT $2
		`, [id, postsLimit]);

		(category as any).recentPosts = posts;
	}

	return {
		message: 'Category retrieved successfully',
		result: category
	};
};

/**
 * POST /categories - Create new category
 */
const createCategory: TRequestFunction = async (req) => {
	const data = req.body as TCreateCategoryValidation;
	const userRole = req.userData?.role;

	// Authorization: Only ADMIN can create categories
	if (userRole !== 'ADMIN') {
		throw new ForbiddenException('Only administrators can create categories');
	}

	// Generate slug
	let slug = generateSlug(data.name);

	// Check if slug already exists
	const existingSlug = await postgresConnection.queryOne<{ id: string }>(
		'SELECT id FROM categories WHERE slug = $1 LIMIT 1',
		[slug]
	);

	if (existingSlug) {
		slug = `${slug}-${Date.now()}`;
	}

	// Validate parent category if provided
	if (data.parentId) {
		const parentExists = await postgresConnection.queryOne<{ id: string }>(
			'SELECT id FROM categories WHERE id = $1 LIMIT 1',
			[data.parentId]
		);

		if (!parentExists) {
			throw new InvalidParameterException('Parent category does not exist');
		}
	}

	// Insert category
	const category = await postgresConnection.queryOne<Entity.ICategory>(`
		INSERT INTO categories (name, slug, description, parent_id)
		VALUES ($1, $2, $3, $4)
		RETURNING *
	`, [
		data.name,
		slug,
		data.description || null,
		data.parentId || null
	]);

	return {
		message: 'Category created successfully',
		result: category
	};
};

/**
 * PUT /categories/:id - Update category
 */
const updateCategory: TRequestFunction = async (req) => {
	const { id } = req.params;
	const data = req.body as TUpdateCategoryValidation;
	const userRole = req.userData?.role;

	// Authorization: Only ADMIN can update categories
	if (userRole !== 'ADMIN') {
		throw new ForbiddenException('Only administrators can update categories');
	}

	if (!id) {
		throw new InvalidParameterException('Category ID is required');
	}

	// Check if category exists
	const existingCategory = await postgresConnection.queryOne<Entity.ICategory>(
		'SELECT * FROM categories WHERE id = $1 LIMIT 1',
		[id]
	);

	if (!existingCategory) {
		throw new NotFoundException('Category not found');
	}

	// Validate parent category if changing
	if (data.parentId !== undefined) {
		if (data.parentId) {
			// Cannot set parent to self
			if (data.parentId === id) {
				throw new InvalidParameterException('Category cannot be its own parent');
			}

			// Check parent exists
			const parentExists = await postgresConnection.queryOne<{ id: string }>(
				'SELECT id FROM categories WHERE id = $1 LIMIT 1',
				[data.parentId]
			);

			if (!parentExists) {
				throw new InvalidParameterException('Parent category does not exist');
			}

			// Prevent circular references (parent cannot be a child of this category)
			const isChild = await postgresConnection.queryOne<{ id: string }>(
				'SELECT id FROM categories WHERE id = $1 AND parent_id = $2 LIMIT 1',
				[data.parentId, id]
			);

			if (isChild) {
				throw new InvalidParameterException('Cannot create circular category reference');
			}
		}
	}

	// Build update fields
	const updates: string[] = [];
	const params: any[] = [];
	let paramIndex = 1;

	if (data.name !== undefined) {
		updates.push(`name = $${paramIndex}`);
		params.push(data.name);
		paramIndex++;

		// Update slug if name changed
		const newSlug = generateSlug(data.name);
		updates.push(`slug = $${paramIndex}`);
		params.push(newSlug);
		paramIndex++;
	}

	if (data.description !== undefined) {
		updates.push(`description = $${paramIndex}`);
		params.push(data.description || null);
		paramIndex++;
	}

	if (data.parentId !== undefined) {
		updates.push(`parent_id = $${paramIndex}`);
		params.push(data.parentId || null);
		paramIndex++;
	}

	if (updates.length === 0) {
		throw new InvalidParameterException('No fields to update');
	}

	updates.push('updated_at = CURRENT_TIMESTAMP');

	// Update category
	await postgresConnection.query(`
		UPDATE categories
		SET ${updates.join(', ')}
		WHERE id = $${paramIndex}
	`, [...params, id]);

	// Get updated category
	const updatedCategory = await postgresConnection.queryOne<Entity.ICategory>(
		'SELECT * FROM categories WHERE id = $1',
		[id]
	);

	return {
		message: 'Category updated successfully',
		result: updatedCategory
	};
};

/**
 * DELETE /categories/:id - Delete category
 */
const deleteCategory: TRequestFunction = async (req) => {
	const { id } = req.params;
	const userRole = req.userData?.role;

	// Authorization: Only ADMIN can delete categories
	if (userRole !== 'ADMIN') {
		throw new ForbiddenException('Only administrators can delete categories');
	}

	if (!id) {
		throw new InvalidParameterException('Category ID is required');
	}

	// Check if category exists
	const existingCategory = await postgresConnection.queryOne<Entity.ICategory>(
		'SELECT id FROM categories WHERE id = $1 LIMIT 1',
		[id]
	);

	if (!existingCategory) {
		throw new NotFoundException('Category not found');
	}

	// Check if category has posts
	const postCount = await postgresConnection.queryOne<{ count: string }>(
		'SELECT COUNT(*) as count FROM posts WHERE category_id = $1',
		[id]
	);

	if (parseInt(postCount?.count || '0') > 0) {
		throw new InvalidParameterException('Cannot delete category that has posts. Please reassign or delete posts first.');
	}

	// Check if category has children
	const childCount = await postgresConnection.queryOne<{ count: string }>(
		'SELECT COUNT(*) as count FROM categories WHERE parent_id = $1',
		[id]
	);

	if (parseInt(childCount?.count || '0') > 0) {
		throw new InvalidParameterException('Cannot delete category that has subcategories. Please reassign or delete subcategories first.');
	}

	// Delete category
	await postgresConnection.query('DELETE FROM categories WHERE id = $1', [id]);

	return {
		message: 'Category deleted successfully',
		result: null
	};
};

export default {
	listCategories,
	getCategory,
	createCategory,
	updateCategory,
	deleteCategory
};

