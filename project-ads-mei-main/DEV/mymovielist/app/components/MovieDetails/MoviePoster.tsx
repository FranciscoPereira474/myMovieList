interface MoviePosterProps {
  posterUrl: string | null
  title: string
}

export default function MoviePoster({ posterUrl, title }: MoviePosterProps) {
  return (
    <div className="posterSection">
      <img 
        src={posterUrl || '/default-movie-poster.jpg'} 
        alt={`${title} poster`}
        className="poster"
      />
      <style jsx>{`
        .posterSection {
          position: sticky;
          top: 2rem;
        }
        .poster {
          width: 100%;
          height: auto;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        @media (max-width: 768px) {
          .posterSection {
            position: relative;
            top: 0;
            max-width: 300px;
            margin: 0 auto;
          }
        }
      `}</style>
    </div>
  )
}