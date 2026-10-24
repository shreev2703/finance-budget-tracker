export function FormErrors({ errors }) {
  if (errors.length === 0) return null;
  return (
    <ul className="form-error" role="alert">
      {errors.map((message) => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  );
}
