import Reveal from './Reveal'

interface SectionHeadProps {
  index: string
  title: string
  note?: string
}

export default function SectionHead({ index, title, note }: SectionHeadProps) {
  return (
    <Reveal>
      <div className="section__head">
        <span className="section__index">{index}</span>
        <h2 className="section__title">{title}</h2>
        {note && <span className="section__note">{note}</span>}
      </div>
    </Reveal>
  )
}
