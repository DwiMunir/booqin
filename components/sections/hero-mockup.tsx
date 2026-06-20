// Mockup dashboard versi CSS (visual hero kanan sebelumnya). Disimpan agar mudah dipakai lagi:
// ganti <HeroImage/> di hero.tsx dengan <HeroMockup/> untuk kembali ke versi non-gambar.
import { Icon } from '@/components/ui/icons'

export function HeroMockup() {
  return (
    <div className="overflow-hidden rounded-[20px] border border-[rgba(20,33,31,0.08)] bg-white shadow-[0_30px_70px_-28px_rgba(14,77,71,0.42),0_10px_24px_-16px_rgba(14,77,71,0.25)]">
      <div className="flex items-center gap-2 bg-brand px-4 py-[13px]">
        <span className="size-2.5 rounded-full bg-[#2f6e67]" />
        <span className="size-2.5 rounded-full bg-[#2f6e67]" />
        <span className="size-2.5 rounded-full bg-[#2f6e67]" />
        <span className="ml-2 text-[0.78rem] font-semibold tracking-[0.02em] text-[#BFD6D1]">
          Booqin Dashboard — The Rooftop at Maple
        </span>
      </div>
      <div className="flex flex-wrap">
        {/* calendar */}
        <div className="min-w-[180px] flex-1 basis-[200px] border-r border-[rgba(20,33,31,0.07)] bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display font-extrabold text-[#11231F]">June 2026</span>
            <span className="rounded-md bg-teal-tint px-2 py-[3px] text-[0.7rem] font-bold text-teal">
              18 booked
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <CalRow
              day="FRI"
              dayClass="text-teal"
              wrapClass="bg-teal-tint border border-[rgba(21,120,110,0.14)]"
              title="Corporate mixer"
              sub="Jun 13 · 6–10 PM"
              subClass="text-[#7A857F]"
            />
            <CalRow
              day="SAT"
              dayClass="text-amber-dark"
              wrapClass="bg-white border border-dashed border-[rgba(224,148,46,0.5)]"
              title="Hold · wedding"
              sub="Jun 14 · pending confirm"
              subClass="text-amber-dark"
            />
            <CalRow
              day="SUN"
              dayClass="text-[#9AA39F]"
              wrapClass="bg-white border border-[rgba(20,33,31,0.08)]"
              title="Open"
              sub="Jun 15 · available"
              subClass="text-[#7A857F]"
            />
          </div>
        </div>
        {/* chat */}
        <div className="flex min-w-[210px] flex-[1.15] basis-[230px] flex-col gap-2.5 bg-white p-3.5">
          <div className="flex items-center gap-[9px] border-b border-[rgba(20,33,31,0.07)] pb-2.5">
            <span className="flex size-[30px] items-center justify-center rounded-[9px] bg-brand">
              <Icon name="message" className="size-4 text-amber" strokeWidth={1.9} />
            </span>
            <div>
              <div className="text-[0.82rem] font-extrabold text-[#11231F]">AI Assistant</div>
              <div className="flex items-center gap-[5px] text-[0.68rem] font-bold text-teal">
                <span className="animate-booq-pulse size-1.5 rounded-full bg-teal" />
                Online · replying
              </div>
            </div>
          </div>
          <div className="max-w-[88%] self-end rounded-[14px_14px_4px_14px] bg-teal-tint px-3 py-[9px] text-[0.8rem] text-[#16302C]">
            Is the rooftop free Sat Jun 14 for ~80 people?
          </div>
          <div className="max-w-[90%] self-start rounded-[14px_14px_14px_4px] bg-brand px-3 py-[9px] text-[0.8rem] text-[#EAF4F2]">
            Yes — the rooftop is open Jun 14 and seats up to 100. Evening rate is{' '}
            <b className="text-amber-light">$1,800</b>. Want me to hold the date?
          </div>
          <div className="max-w-[92%] self-start rounded-[12px] border border-[rgba(20,33,31,0.09)] bg-card px-3 py-2.5">
            <div className="mb-1 flex items-center gap-[7px] text-[0.7rem] font-extrabold text-teal">
              <Icon name="check" className="size-[13px]" strokeWidth={2} />
              AVAILABILITY CONFIRMED
            </div>
            <div className="text-[0.8rem] font-bold text-[#11231F]">
              Sat, Jun 14 · 6–11 PM · Rooftop
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CalRow({
  day,
  dayClass,
  wrapClass,
  title,
  sub,
  subClass,
}: {
  day: string
  dayClass: string
  wrapClass: string
  title: string
  sub: string
  subClass: string
}) {
  return (
    <div className={`flex items-center gap-[9px] rounded-[9px] px-2.5 py-[9px] ${wrapClass}`}>
      <span className={`w-[26px] text-[0.72rem] font-extrabold ${dayClass}`}>{day}</span>
      <div className="flex-1">
        <div className="text-[0.8rem] font-bold text-[#11231F]">{title}</div>
        <div className={`text-[0.7rem] ${subClass}`}>{sub}</div>
      </div>
    </div>
  )
}
