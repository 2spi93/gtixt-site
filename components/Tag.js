export default function Tag({ tone, children }) {
  return (
    <span className={`tag tag-${tone}`}>
      {children}
    </span>
  );
}