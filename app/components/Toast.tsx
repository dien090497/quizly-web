type Props = { message: string; onDismiss: () => void };

export default function Toast({ message, onDismiss }: Props) {
  if (!message) return null;
  return (
    <div className="toast" role="status">
      {message}
      <button onClick={onDismiss}>×</button>
    </div>
  );
}
