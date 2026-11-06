import { money } from '../format.js';

/** US-05: this month's spending per category, largest first, as one-hue horizontal bars. */
export function SpendingChart({ spending }) {
  if (spending.categories.length === 0) {
    return <p className="dashboard-state">No spending yet this month.</p>;
  }

  const largest = spending.categories[0].spentCents;

  return (
    <ul className="spending-chart">
      {spending.categories.map((category) => (
        <li
          key={category.categoryId}
          title={`${category.categoryName}: ${money(category.spentCents)}, ${category.percent}% of spending`}
        >
          <span>{category.categoryName}</span>
          <i>
            <em
              style={{ width: `${(category.spentCents / largest) * 100}%` }}
            />
          </i>
          <b>
            {money(category.spentCents)} <small>{category.percent}%</small>
          </b>
        </li>
      ))}
    </ul>
  );
}
