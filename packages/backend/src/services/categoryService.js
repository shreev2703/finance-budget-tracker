import { HttpError } from '../middleware/errorHandler.js';
import {
  cleanCategoryName,
  categoryNameError,
  categoryTypeError,
} from '../domain/category.js';

/** Create, rename, and delete the user's categories (Create / Edit Category screen). */
export function createCategoryService({ categories }) {
  function findOwned(userId, id) {
    const category = categories.findForUser(Number(id), userId);
    if (!category) throw new HttpError(404, 'Category not found');
    return category;
  }

  function assertNameIsFree(userId, name, exceptId) {
    const existing = categories.findByName(userId, name);
    if (existing && existing.id !== exceptId) {
      throw new HttpError(409, `You already have a category named "${name}"`);
    }
  }

  return {
    create(userId, { name, type = 'EXPENSE' }) {
      const cleanName = cleanCategoryName(name);
      const errors = [
        categoryNameError(cleanName),
        categoryTypeError(type),
      ].filter(Boolean);
      if (errors.length) throw new HttpError(400, 'Invalid category', errors);
      assertNameIsFree(userId, cleanName);
      return categories.create(userId, cleanName, type);
    },

    rename(userId, id, { name }) {
      const category = findOwned(userId, id);
      const cleanName = cleanCategoryName(name);
      const error = categoryNameError(cleanName);
      if (error) throw new HttpError(400, 'Invalid category', [error]);
      assertNameIsFree(userId, cleanName, category.id);
      return categories.rename(category.id, userId, cleanName);
    },

    remove(userId, id) {
      const category = findOwned(userId, id);
      if (categories.transactionCount(category.id, userId) > 0) {
        throw new HttpError(
          409,
          `"${category.name}" has transactions, so it can't be deleted`,
        );
      }
      categories.remove(category.id, userId);
    },
  };
}
