interface MovieDescriptionProps {
  description: string
}

export default function MovieDescription({ description }: MovieDescriptionProps) {
  return (
    <div className="description">
      <h2>Overview</h2>
      <p>{description}</p>
      <style jsx>{`
        .description {
          width: 100%;
          padding: 1.5rem;
          background: linear-gradient(
            180deg,
            color-mix(in srgb, var(--bg) 98%, white 2%),
            color-mix(in srgb, var(--bg) 99%, white 1%)
          );
          border-radius: var(--radius);
          border: 1px solid color-mix(in srgb, var(--text-primary) 10%, transparent);
          backdrop-filter: blur(8px);
          transition: border-color 0.2s ease, transform 0.15s ease;
        }
        .description:hover {
          border-color: color-mix(in srgb, var(--accent-start) 30%, transparent);
          transform: translateY(-1px);
        }
        .description h2 {
          font-size: 1.5rem;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }
        .description p {
          line-height: 1.6;
          color: var(--muted);
        }
      `}</style>
    </div>
  )
}