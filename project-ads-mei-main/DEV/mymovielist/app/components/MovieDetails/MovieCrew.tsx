interface MovieCrewProps {
  director: string
  actors: string[]
}

export default function MovieCrew({ director, actors }: MovieCrewProps) {
  return (
    <div className="crew">
      <p className="director">
        <strong>Director:</strong> {director}
      </p>
      <p className="cast">
        <strong>Cast:</strong> {actors?.join(', ') || 'No cast information available'}
      </p>
      <style jsx>{`
        .crew {
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
        .crew:hover {
          border-color: color-mix(in srgb, var(--accent-start) 30%, transparent);
          transform: translateY(-1px);
        }
        .director, .cast {
          margin: 0.5rem 0;
          color: var(--muted);
        }
        .director strong, .cast strong {
          color: var(--text-primary);
          margin-right: 0.5rem;
        }
      `}</style>
    </div>
  )
}