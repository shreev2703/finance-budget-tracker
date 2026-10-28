// Form checks that run before anything is sent to the API.
// The API repeats them, so these only exist to give faster feedback.

/** Create / Edit Category: returns an error message, or null if the form is valid. */
export function validateCategory({ name, budget }) {
  if (name.trim() === "" || !(Number(budget) > 0)) {
    return "Enter a category name and a valid budget limit.";
  }
  return null;
}
