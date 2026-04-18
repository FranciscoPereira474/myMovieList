interface MovieHeaderProps {
  title: string
  releaseYear: number
  director: string
}

export default function MovieHeader({ title, releaseYear, director }: MovieHeaderProps) {
  return (
    <header className="header">
      <div className="titleRow">
        <h1 className="title">{title}</h1>
        <span className="year">{releaseYear}</span>
      </div>
      <div className="directorRow">
        <span className="directedBy">Directed by</span>
        <span className="directorLink">{director}</span>
      </div>
      <style jsx>{`
        .header {
          margin-bottom: 1.5rem;
        }
        .titleRow {
          display: flex;
          align-items: baseline;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }
        .title {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0;
          color: var(--text-primary);
        }
        .year {
          font-size: 1.75rem;
          color: var(--muted);
          font-weight: 400;
        }
        .directorRow {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
        }
        .directedBy {
          color: var(--muted);
        }
        .directorLink {
          color: var(--muted);
        }
        @media (max-width: 768px) {
          .title {
            font-size: 2rem;
          }
          .year {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </header>
  )
}