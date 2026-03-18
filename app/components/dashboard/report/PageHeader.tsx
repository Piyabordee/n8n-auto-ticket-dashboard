'use client'

interface PageHeaderProps {
  title: string
  subtitle: string
  customTitle?: string
}

export default function PageHeader({ title, subtitle, customTitle }: PageHeaderProps) {
  return (
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-neutral-900 mb-2">{title}</h2>
      <p className="text-lg text-neutral-600">{customTitle || subtitle}</p>
    </div>
  )
}
