import { HttpError } from '../middleware/errorHandler.js';
import {
  cleanCategoryName,
  categoryNameError,
  categoryTypeError,
} from '../domain/category.js';

/** Create, rename, and delete the user's categories (Create / Edit Category screen). */
export function createCategoryService({ categories }) {
  async function findOwned(userId, id) {
    const category = await categories.findForUser(Number(id), userId);
    if (!category) throw new HttpError(404, 'Category not found');
    return category;
  }

  async function assertNameIsFree(userId, name, exceptId) {
    const existing = await categories.findByName(userId, name);
    if (existing && existing.id !== exceptId) {
      throw new HttpError(409, `You already have a category named "${name}"`);
    }
  }

  return {
    async create(userId, { name, type = 'EXPENSE' }) {
      const cleanName = cleanCategoryName(name);
      const errors = [
        categoryNameError(cleanName),
        categoryTypeError(type),
      ].filter(Boolean);
      if (errors.length) throw new HttpError(400, 'Invalid category', errors);
      await assertNameIsFree(userId, cleanName);
      return categories.create(userId, cleanName, type);
    },

    async rename(userId, id, { name }) {
      const category = await findOwned(userId, id);
      const cleanName = cleanCategoryName(name);
      const error = categoryNameError(cleanName);
      if (error) throw new HttpError(400, 'Invalid category', [error]);
      await assertNameIsFree(userId, cleanName, category.id);
      return categories.rename(category.id, userId, cleanName);
    },

    async remove(userId, id) {
      const category = await findOwned(userId, id);
      if (await categories.transactionCount(category.id, userId) > 0) {
        throw new HttpError(
          409,
          `"${category.name}" has transactions, so it can't be deleted`,
        );
      }
      await categories.remove(category.id, userId);
    },
  };
}
