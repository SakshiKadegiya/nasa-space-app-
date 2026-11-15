export default function SectionHeading({ eyebrow, title, description, right }) {
  return <div className="section-heading"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2>{description && <p>{description}</p>}</div>{right && <div>{right}</div>}</div>;
}