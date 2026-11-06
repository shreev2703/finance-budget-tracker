// Every new account starts with these, so it can log income and expenses right away.
export const DEFAULT_CATEGORIES = [
  ['Part-time Job', 'INCOME'],
  ['Allowance', 'INCOME'],
  ['Groceries', 'EXPENSE'],
  ['Dining Out', 'EXPENSE'],
  ['Transportation', 'EXPENSE'],
  ['Entertainment', 'EXPENSE'],
  ['Textbooks & Supplies', 'EXPENSE'],
];

/** Category domain rules (UML: Category.rename(); US-08 Create / Edit Category screen). */
export const CATEGORY_TYPES = ['INCOME', 'EXPENSE'];
export const MAX_CATEGORY_NAME_LENGTH = 40;

export function cleanCategoryName(name) {
  return typeof name === 'string' ? name.trim() : '';
}

export function categoryNameError(name) {
  if (name === '') return 'name is required';
  if (name.length > MAX_CATEGORY_NAME_LENGTH) {
    return `name must be ${MAX_CATEGORY_NAME_LENGTH} characters or fewer`;
  }
  return null;
}

export function categoryTypeError(type) {
  return CATEGORY_TYPES.includes(type)
    ? null
    : 'type must be INCOME or EXPENSE';
}
